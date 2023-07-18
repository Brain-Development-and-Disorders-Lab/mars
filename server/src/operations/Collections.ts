// Utility functions
import { getDatabase, getIdentifier } from "../database/connection";
import { Entities } from "./Entities";
import { Activity } from "./Activity";

// Custom types
import { CollectionModel, ICollection } from "@types";

// Utility libraries
import _ from "lodash";
import consola from "consola";
import dayjs from "dayjs";
import fs from "fs";
import Papa from "papaparse";
import tmp from "tmp";

const COLLECTIONS = "collections";

export class Collections {
  /**
   * Check if a Collection exists in the system
   * @param id the Collection identifier
   * @return {boolean}
   */
  static exists = (id: string): Promise<boolean> => {
    consola.start("Checking if Collection (id):", id.toString(), "exists");
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: id }, (_error: any, result: any) => {
          if (_.isNull(result)) {
            consola.warn("Collection (id):", id.toString(), "does not exist");
            resolve(false);
          }

          consola.success("Collection (id):", id.toString(), "exists");
          resolve(true);
        });
    });
  };

  /**
   * Create a new Collection
   * @param {any} collection all data associated with the new Collection
   * @return {Promise<CollectionModel>}
   */
  static create = (collection: any): Promise<CollectionModel> => {
    consola.start("Creating new Collection:", collection.name);

    // Allocate a new identifier and join with Collection data
    collection["_id"] = getIdentifier("collection");

    // Push data to database
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .insertOne(collection, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Database operations to perform
          const operations: Promise<any>[] = [];

          // Add any Entities to the Collection
          for (const entity of (collection as ICollection).entities) {
            operations.push(Collections.addEntity(result.insertedId, entity));
          }

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "create",
              details: "Created new Collection",
              target: {
                type: "collections",
                id: collection._id,
                name: collection.name,
              },
            })
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            consola.success(
              "Created new Collection:",
              collection._id,
              collection.name
            );
            resolve(collection as CollectionModel);
          });
        });
    });
  };

  static update = (
    updatedCollection: CollectionModel
  ): Promise<CollectionModel> => {
    consola.start("Updating Collection:", updatedCollection.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: updatedCollection._id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Database operations to perform
          const operations: Promise<any>[] = [];

          // Cast and store current state of the Collection
          const currentCollection = result as CollectionModel;

          // Entities
          const entitiesToKeep = currentCollection.entities.filter((entity) =>
            updatedCollection.entities.includes(entity)
          );
          const entitiesToAdd = updatedCollection.entities.filter(
            (entity) => !currentCollection.entities.includes(entity)
          );
          entitiesToAdd.map((entity: string) => {
            operations.push(
              Entities.addCollection(entity, currentCollection._id)
            );
          });
          const entitiesToRemove = currentCollection.entities.filter(
            (entity) => !entitiesToKeep.includes(entity)
          );
          entitiesToRemove.map((entity: string) => {
            operations.push(
              Entities.removeCollection(entity, currentCollection._id)
            );
          });

          // Collections
          const collectionsToKeep = currentCollection.collections.filter(
            (collection) => updatedCollection.collections.includes(collection)
          );
          const collectionsToAdd = updatedCollection.collections.filter(
            (collection) => !currentCollection.collections.includes(collection)
          );

          const updates = {
            $set: {
              description: updatedCollection.description,
              collections: [...collectionsToKeep, ...collectionsToAdd],
              entities: [...entitiesToKeep, ...entitiesToAdd],
              history: [
                {
                  timestamp: dayjs(Date.now()).toISOString(),
                  name: currentCollection.name,
                  created: currentCollection.created,
                  owner: currentCollection.owner,
                  description: currentCollection.description,
                  entities: currentCollection.entities,
                },
                ...currentCollection.history,
              ],
            },
          };

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "update",
              details: "Updated Collection",
              target: {
                type: "collections",
                id: updatedCollection._id,
                name: updatedCollection.name,
              },
            })
          );

          getDatabase()
            .collection(COLLECTIONS)
            .updateOne(
              { _id: updatedCollection._id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve all operations then resolve overall Promise
                Promise.all(operations).then((_result) => {
                  consola.success(
                    "Updated Collection:",
                    updatedCollection.name
                  );

                  // Resolve the Promise
                  resolve(updatedCollection);
                });
              }
            );
        });
    });
  };

  /**
   * Create a new Collection
   * @param {any} collection all data associated with the new Collection
   * @return {Promise<CollectionModel>}
   */
  static restore = (collection: any): Promise<CollectionModel> => {
    consola.start("Restoring Collection:", collection.name);
    // Push data to database
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .insertOne(collection, (error: any, _result: any) => {
          if (error) {
            throw error;
          }

          // Database operations to perform
          const operations: Promise<any>[] = [];

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "create",
              details: "Created new Collection",
              target: {
                type: "collections",
                id: collection._id,
                name: collection.name,
              },
            })
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            consola.success(
              "Restored Collection:",
              collection._id,
              collection.name
            );
            resolve(collection as CollectionModel);
          });
        });
    });
  };

  static addEntity = (collection: string, entity: string): Promise<string> => {
    consola.start(
      "Adding Entity",
      entity.toString(),
      "to Collection",
      collection.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: collection }, (error: any, result: any) => {
          if (error) {
            throw error;
          }
          consola.info("Collection:", result);

          // Update the collection to include the Entity
          const updatedValues = {
            $set: {
              entities: _.concat(result.entities, entity),
            },
          };

          getDatabase()
            .collection(COLLECTIONS)
            .updateOne(
              { _id: collection },
              updatedValues,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }
                consola.success(
                  "Added Entity",
                  entity.toString(),
                  "to Collection",
                  result.name
                );

                // Resolve the Promise
                resolve(result._id);
              }
            );
        });
    });
  };

  static addEntities = (
    collection: string,
    entities: string[]
  ): Promise<string> => {
    consola.start(
      "Adding",
      entities.length,
      "Entities to Collection",
      collection.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: collection }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection to include the Entity
          const updatedValues = {
            $set: {
              entities: _.uniq(_.concat(result.entities, entities)),
            },
          };

          getDatabase()
            .collection(COLLECTIONS)
            .updateOne(
              { _id: collection },
              updatedValues,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }
                consola.start(
                  "Added",
                  entities.length,
                  "Entities to Collection",
                  collection.toString()
                );

                // Resolve the Promise
                resolve(result._id);
              }
            );
        });
    });
  };

  static removeEntity = (
    collection: string,
    entity: string
  ): Promise<string> => {
    consola.start(
      "Removing Entity",
      entity.toString(),
      "from Collection",
      collection.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: collection }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection to remove the Entity
          const updatedValues = {
            $set: {
              entities: (result as CollectionModel).entities.filter(
                (content) => !_.isEqual(content.toString(), entity.toString())
              ),
            },
          };

          getDatabase()
            .collection(COLLECTIONS)
            .updateOne(
              { _id: collection },
              updatedValues,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }
                consola.success(
                  "Removed Entity",
                  entity.toString(),
                  "from Collection",
                  collection.toString()
                );

                // Resolve the Promise
                resolve(collection);
              }
            );
        });
    });
  };

  static getAll = (): Promise<CollectionModel[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            throw error;
          }
          consola.success("Retrieved all Collections");
          resolve(result as CollectionModel[]);
        });
    });
  };

  /**
   * Get a single Collection
   * @return {Promise<CollectionModel>}
   */
  static getOne = (id: string): Promise<CollectionModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          consola.success("Retrieved Collection (id):", id.toString());
          resolve(result as CollectionModel);
        });
    });
  };

  /**
   * Collate and generate a data string containing all data pertaining to
   * a Collection
   * @param {{ id: string, fields: string[] }} collectionExportData the export data of the Collection
   * @return {Promise<string>}
   */
  static getData = (collectionExportData: {
    id: string;
    fields: string[];
    format: "json" | "csv" | "txt";
  }): Promise<string> => {
    consola.start(
      "Generating data for Collection (id):",
      collectionExportData.id.toString()
    );
    return new Promise((resolve, reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne(
          { _id: collectionExportData.id },
          (error: any, result: any) => {
            if (error) {
              reject(error);
              throw error;
            }

            const collection = result as CollectionModel;

            if (_.isEqual(collectionExportData.format, "csv")) {
              const headers = ["ID", "Name"];
              const row: Promise<string>[] = [
                Promise.resolve(collection._id),
                Promise.resolve(collection.name),
              ];

              // Iterate over fields and generate a CSV export file
              collectionExportData.fields.map((field) => {
                if (_.isEqual(field, "created")) {
                  // "created" data field
                  headers.push("Created");
                  row.push(
                    Promise.resolve(
                      dayjs(collection.created).format("DD MMM YYYY").toString()
                    )
                  );
                } else if (_.isEqual(field, "owner")) {
                  // "owner" data field
                  headers.push("Owner");
                  row.push(Promise.resolve(collection.owner));
                } else if (_.isEqual(field, "description")) {
                  // "description" data field
                  headers.push("Description");
                  row.push(Promise.resolve(collection.description));
                } else if (_.startsWith(field, "collection_")) {
                  // "collection" data fields
                  row.push(
                    Collections.getOne(_.split(field, "_")[1]).then(
                      (collection) => {
                        headers.push(`Collection (${collection.name})`);
                        return collection.name;
                      }
                    )
                  );
                } else if (_.startsWith(field, "entity_")) {
                  // "entity" data fields
                  row.push(
                    Entities.getOne(_.split(field, "_")[1]).then((entity) => {
                      headers.push(`Entity (${entity.name})`);
                      return entity.name;
                    })
                  );
                }
              });

              // Collate and format data as a CSV string
              Promise.all(row).then((rowData) => {
                const collated = [headers, rowData];
                const formattedOutput = Papa.unparse(collated);

                // Create a temporary file, passing the filename as a response
                tmp.file((error, path: string, _fd: number) => {
                  if (error) {
                    reject(error);
                    throw error;
                  }

                  fs.writeFileSync(path, formattedOutput);
                  consola.success(
                    "Generated CSV data for  Collection (id):",
                    collectionExportData.id.toString()
                  );
                  resolve(path);
                });
              });
            } else if (_.isEqual(collectionExportData.format, "json")) {
              // JSON export
              const tempStructure = {
                _id: collection._id,
                name: collection.name,
                created: "",
                owner: "",
                description: "",
                collections: [],
                entities: [],
              } as { [key: string]: any };
              const exportOperations = [] as Promise<string>[];

              collectionExportData.fields.map((field) => {
                if (_.isEqual(field, "created")) {
                  // "created" data field
                  tempStructure["created"] = dayjs(collection.created)
                    .format("DD MMM YYYY")
                    .toString();
                } else if (_.isEqual(field, "owner")) {
                  // "owner" data field
                  tempStructure["owner"] = collection.owner;
                } else if (_.isEqual(field, "description")) {
                  // "description" data field
                  tempStructure["description"] = collection.description;
                } else if (_.startsWith(field, "collection")) {
                  // "collection" data fields
                  tempStructure["collections"] = [];
                  exportOperations.push(
                    Collections.getOne(_.split(field, "_")[1]).then(
                      (collection) => {
                        tempStructure["collections"].push(collection.name);
                        return collection.name;
                      }
                    )
                  );
                } else if (_.startsWith(field, "entity_")) {
                  // "entity" data fields
                  exportOperations.push(
                    Entities.getOne(_.split(field, "_")[1]).then((entity) => {
                      tempStructure["entities"].push(entity.name);
                      return entity.name;
                    })
                  );
                }
              });

              // Run all export operations
              Promise.all(exportOperations).then((_values) => {
                // Create a temporary file, passing the filename as a response
                tmp.file((error, path: string, _fd: number) => {
                  if (error) {
                    reject(error);
                    throw error;
                  }

                  fs.writeFileSync(
                    path,
                    JSON.stringify(tempStructure, null, "  ")
                  );
                  consola.success(
                    "Generated JSON data for Collection (id):",
                    collectionExportData.id.toString()
                  );
                  resolve(path);
                });
              });
            } else {
              // Text export
              const exportOperations = [] as Promise<string>[];

              // Structures to collate data
              const textDetails = [
                `ID: ${collection._id}`,
                `Name: ${collection.name}`,
              ];
              const textCollections = [] as string[];
              const textEntities = [] as string[];

              collectionExportData.fields.map((field) => {
                if (_.isEqual(field, "created")) {
                  // "created" data field
                  textDetails.push(
                    `Created: ${dayjs(collection.created)
                      .format("DD MMM YYYY")
                      .toString()}`
                  );
                } else if (_.isEqual(field, "owner")) {
                  // "owner" data field
                  textDetails.push(`Owner: ${collection.owner}`);
                } else if (_.isEqual(field, "description")) {
                  // "description" data field
                  textDetails.push(`Description: ${collection.description}`);
                } else if (_.startsWith(field, "collection_")) {
                  // "collection" data fields
                  exportOperations.push(
                    Collections.getOne(_.split(field, "_")[1]).then(
                      (collection) => {
                        textCollections.push(collection.name);
                        return collection.name;
                      }
                    )
                  );
                } else if (_.startsWith(field, "entity_")) {
                  // "entity" data fields
                  exportOperations.push(
                    Entities.getOne(_.split(field, "_")[1]).then((entity) => {
                      textEntities.push(entity.name);
                      return entity.name;
                    })
                  );
                }
              });

              // Run all export operations
              Promise.all(exportOperations).then((_values) => {
                // Create a temporary file, passing the filename as a response
                tmp.file((error, path: string, _fd: number) => {
                  if (error) {
                    reject(error);
                    throw error;
                  }

                  if (textCollections.length > 0) {
                    textDetails.push(
                      `Collections: ${textCollections.join(", ")}`
                    );
                  }
                  if (textEntities.length > 0) {
                    textDetails.push(`Entities: ${textEntities.join(", ")}`);
                  }

                  fs.writeFileSync(path, textDetails.join("\n"));
                  consola.success(
                    "Generated text data for  Entity (id):",
                    collectionExportData.id.toString()
                  );
                  resolve(path);
                });
              });
            }
          }
        );
    });
  };

  static delete = (id: string): Promise<CollectionModel> => {
    consola.start("Deleting Collection (id):", id.toString());
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }
          // Store the Collection data
          const collection: CollectionModel = result;

          const operations: Promise<any>[] = [];

          // Remove the Entities from the Collection
          collection.entities.map((entity) => {
            operations.push(Entities.removeCollection(entity, collection._id));
          });

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "delete",
              details: "Deleted Collection",
              target: {
                type: "collections",
                id: collection._id,
                name: collection.name,
              },
            })
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            // Delete the Collection
            getDatabase()
              .collection(COLLECTIONS)
              .deleteOne({ _id: id }, (error: any, _content: any) => {
                if (error) {
                  throw error;
                }

                consola.success("Deleted Collection (id):", id.toString());
                resolve(result);
              });
          });
        });
    });
  };
}
