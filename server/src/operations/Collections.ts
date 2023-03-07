// MongoDB
import { ObjectId } from "mongodb";

// Utility functions
import { getDatabase } from "../database/connection";
import { Entities } from "./Entities";
import { Updates } from "./Updates";

// Custom types
import { CollectionModel, CollectionStruct } from "@types";

// Utility libraries
import _ from "underscore";
import consola from "consola";

const COLLECTIONS = "collections";

export class Collections {
  /**
   * Create a new Collection
   * @param {any} collection all data associated with the new Collection
   * @return {Promise<CollectionModel>}
   */
  static create = (collection: any): Promise<CollectionModel> => {
    consola.info("Creating new Collection:", collection.name);
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
          for (const entity of (collection as CollectionStruct).entities) {
            operations.push(Collections.addEntity(result.insertedId, entity));
          }

          // Add Update operation
          operations.push(
            Updates.create({
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
            collection["_id"] = result.insertedId;
            consola.success("Created new Collection:", collection.name);
            resolve(collection as CollectionModel);
          });
        });
    });
  };

  static update = (
    updatedCollection: CollectionModel
  ): Promise<CollectionModel> => {
    consola.info("Updating Collection:", updatedCollection.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne(
          { _id: new ObjectId(updatedCollection._id) },
          (error: any, result: any) => {
            if (error) {
              throw error;
            }

            // Database operations to perform
            const operations: Promise<any>[] = [];

            // Cast and store current state of the Collection
            const currentCollection = result as CollectionModel;

            // Collections
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

            const updates = {
              $set: {
                entities: [...entitiesToKeep, ...entitiesToAdd],
              },
            };

            // Add Update operation
            operations.push(
              Updates.create({
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
                { _id: new ObjectId(updatedCollection._id) },
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
          }
        );
    });
  };

  static addEntity = (collection: string, entity: string): Promise<string> => {
    consola.info(
      "Adding Entity",
      entity.toString(),
      "to Collection",
      collection.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne(
          { _id: new ObjectId(collection) },
          (error: any, result: any) => {
            if (error) {
              throw error;
            }

            // Update the collection to include the Entity
            const updatedValues = {
              $set: {
                entities: [...result.entities, entity],
              },
            };

            getDatabase()
              .collection(COLLECTIONS)
              .updateOne(
                { _id: new ObjectId(collection) },
                updatedValues,
                (error: any, _response: any) => {
                  if (error) {
                    throw error;
                  }
                  consola.success(
                    "Added Entity",
                    entity.toString(),
                    "to Collection",
                    collection.toString()
                  );

                  // Resolve the Promise
                  resolve(collection);
                }
              );
          }
        );
    });
  };

  static removeEntity = (
    collection: string,
    entity: string
  ): Promise<string> => {
    consola.info(
      "Removing Entity",
      entity.toString(),
      "from Collection",
      collection.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne(
          { _id: new ObjectId(collection) },
          (error: any, result: any) => {
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
                { _id: new ObjectId(collection) },
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
          }
        );
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
        .findOne({ _id: new ObjectId(id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          consola.success("Retrieved Collection (id):", id.toString());
          resolve(result as CollectionModel);
        });
    });
  };

  static delete = (id: string): Promise<CollectionModel> => {
    consola.info("Deleting Collection (id):", id.toString());
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: new ObjectId(id) }, (error: any, result: any) => {
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
            Updates.create({
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
              .deleteOne(
                { _id: new ObjectId(id) },
                (error: any, _content: any) => {
                  if (error) {
                    throw error;
                  }

                  consola.success("Deleted Collection (id):", id.toString());
                  resolve(result);
                }
              );
          });
      });
    });
  };
}
