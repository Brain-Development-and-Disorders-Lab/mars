// Utility imports
import _, { reject } from "lodash";
import consola from "consola";
import { Document, WithId } from "mongodb";
import {
  getAttachments,
  getDatabase,
  getIdentifier,
} from "../database/connection";
import { Activity } from "./Activity";
import { Projects } from "./Projects";

// File generation
import fs from "fs";
import { Readable } from "stream";
import Papa from "papaparse";
import tmp from "tmp";
import dayjs from "dayjs";

// Custom types
import {
  AttributeModel,
  EntityModel,
  IValue,
  Item,
  ProjectModel,
} from "@types";

// Constants
const ENTITIES = "entities";

/**
 * Class defining the set of operations to apply for Entities
 */
export class Entities {
  /**
   * Check if an Entity exists in the system
   * @param {string} id the Entity identifier
   * @returns {boolean}
   */
  static exists = (id: string): Promise<boolean> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: id }, (_error: any, result: any) => {
          if (_.isNull(result)) {
            consola.warn(`Entity "${id.toString()}" does not exist`);
            resolve(false);
          }

          consola.debug(`Entity "${id.toString()}" exists`);
          resolve(true);
        });
    });
  };

  /**
   * Find an Entity by its name
   * @param {string} name the name of the Entity to find
   * @returns {Promise<EntityModel | null>}
   */
  static findEntityByName = (name: string): Promise<EntityModel | null> => {
    return new Promise((resolve, reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ name: name, deleted: false }, (error: any, result: any) => {
          if (error) {
            consola.error("Error occurred while searching for Entity:", name);
            reject(error);
          } else if (result) {
            consola.debug("Found Entity with name:", name);
            resolve(result as EntityModel);
          } else {
            consola.warn("No Entity found with name:", name);
            resolve(null);
          }
        });
    });
  };

  /**
   * Find an Entity by search term for typeahead
   * @param userId User identifier, used to filter by ownership status
   * @param searchText Raw search query
   * @param limit Number of results to return (default 5)
   * @returns {Promise<WithId<Document>[]>}
   */
  static async searchByTerm(
    userId: string,
    searchText: string,
    limit: number = 5,
  ): Promise<WithId<Document>[]> {
    let searchRegex;
    try {
      searchRegex = new RegExp(searchText, "i");
    } catch (error) {
      consola.error("Invalid regex for search:", error);

      // Fallback to plain text search if regex fails to compile
      searchText = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special regex characters
      searchRegex = new RegExp(searchText, "i"); // Safe regex with escaped characters
    }

    // Construct search query
    const query = {
      $or: [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { "attributes.values.data": { $regex: searchRegex } }, // Assuming searchable content within attributes
      ],
      $and: [
        { deleted: false },
        { $or: [{ owner: userId }, { collaborators: userId }] }, // Ensure user is owner or collaborator
      ],
    };

    // Limit the fields returned for efficiency
    const options = {
      limit: limit,
      projection: { name: 1, description: 1 },
    };

    try {
      const entities = await getDatabase()
        .collection(ENTITIES)
        .find(query, options)
        .toArray();
      return entities;
    } catch (error) {
      consola.error("Error searching Entities:", error);
      throw error;
    }
  }

  /**
   * Find an Entity by name
   * @param {string} name the name of the Entity
   * @returns {Promise<EntityModel | null>}
   */
  static entityByNameExist = (name: string): Promise<EntityModel | null> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ name: name, deleted: false }, (error: any, result: any) => {
          if (error) {
            consola.error(`Error finding Entity with name "${name}":`, error);
            resolve(null);
          } else if (result) {
            consola.debug("Entity found with name:", name);
            resolve(result as EntityModel);
          } else {
            consola.debug("No Entity found with name:", name);
            resolve(null);
          }
        });
    });
  };

  /**
   * Create a new Entity
   * @param {any} entity all data associated with the new Entity
   * @returns {Promise<EntityModel>}
   */
  static create = (entity: any): Promise<EntityModel> => {
    if (!entity?._id) {
      // Generate a new identifier and join with Entity data
      entity["_id"] = getIdentifier("entity");
    }
    entity["timestamp"] = new Date().toISOString();

    // Push data to database
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .insertOne(entity as any, async (error: any, _result: any) => {
          if (error) {
            consola.error("Error inserting new Entity:", error);
            throw error;
          }

          // Database operations to perform outside of creating a new Entity
          const operations: Promise<any>[] = [];

          if (entity?.associations?.origins?.length > 0) {
            // If this Entity has an origin, add this Entity as a product of that origin Entity
            for (const origin of entity.associations.origins) {
              if (!origin._id) {
                // If the origin Entity does not have an ID, create it
                const originEntity = await Entities.findEntityByName(
                  origin?.name,
                );
                if (originEntity?._id) {
                  origin._id = originEntity?._id;
                }
              }
              operations.push(
                Entities.addProduct(origin, {
                  name: entity?.name,
                  _id: entity?._id,
                }),
              );
            }
          }

          if (entity?.associations?.products?.length > 0) {
            // If this Entity has products, set this Entity as the origin of each product Entity-
            for (const product of entity.associations.products) {
              if (!product._id) {
                // If the origin Entity does not have an ID, create it
                const productEntity = await Entities.findEntityByName(
                  product?.name,
                );
                if (productEntity?._id) {
                  product._id = productEntity?._id;
                }
              }
              operations.push(
                Entities.addOrigin(product, {
                  name: entity?.name,
                  _id: entity?._id,
                }),
              );
            }
          }

          if (entity.projects?.length > 0) {
            // If this Entity has been added to Projects, add the Entity to each Project
            entity.projects.forEach((project: string) => {
              operations.push(Projects.addEntity(project, entity?._id));
            });
          }

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "create",
              details: "Created new Entity",
              target: {
                type: "entities",
                _id: entity?._id,
                name: entity?.name,
              },
            }),
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations)
            .then((_result) => {
              consola.debug("Created Entity:", entity?.name);
              resolve(entity);
            })
            .catch((error) => {
              consola.error(`Error creating Entity ${entity?._id}:`, error);
              reject(`Error creating Entity ${entity?._id}`);
            });
        });
    });
  };

  /**
   * Update an Entity or create if new, comparing a new version with the existing version
   * @param {EntityModel} entityData updated Entity
   * @returns {Promise<EntityModel>}
   */
  static upsert = async (entityData: EntityModel): Promise<EntityModel> => {
    try {
      // Check if the Entity exists by a unique identifier (e.g., _id or name)
      let existingEntity = await getDatabase()
        .collection(ENTITIES)
        .findOne({
          $or: [
            { _id: entityData?._id }, // Check by _id
            // { name: entityData?.name } // Check by name
          ],
        });

      if (existingEntity) {
        // If the Entity exists, update it
        return await Entities.update({ ...existingEntity, ...entityData });
      } else {
        // If the Entity does not exist, create a new one
        existingEntity = await getDatabase()
          .collection(ENTITIES)
          .findOne({
            $or: [
              { name: entityData?.name }, // Check by name
            ],
          });

        if (existingEntity) {
          // If the Entity exists, update it
          entityData._id = existingEntity._id as any;
          return await Entities.update({ ...existingEntity, ...entityData });
        }

        return await Entities.create(entityData);
      }
    } catch (error) {
      consola.error(`Error in upserting Entity "${entityData?._id}":`, error);
      throw error; // Rethrow the error to be handled by the caller
    }
  };

  /**
   * Update an Entity, comparing a new version with the existing version
   * @param {EntityModel} updatedEntity updated Entity
   * @returns {Promise<EntityModel>}
   */
  static update = (updatedEntity: EntityModel): Promise<EntityModel> => {
    if (!updatedEntity?._id) {
      consola.warn("Entity ID is required to update an Entity");
    }
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: updatedEntity?._id }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error finding Entity "${updatedEntity?._id}":`,
              error,
            );
            throw error;
          }
          if (!result) {
            consola.error("Entity not found:", updatedEntity?._id);
            throw new Error("Entity not found");
          }
          // Cast and store current state of the Entity
          const currentEntity = result as EntityModel;

          // List of operations to perform the update
          const operations = [];

          // Projects
          const projectsToKeep = currentEntity?.projects?.filter((project) =>
            updatedEntity?.projects?.includes(project),
          );
          const projectsToAdd = updatedEntity?.projects?.filter(
            (project) => !projectsToKeep?.includes(project),
          );
          if (projectsToAdd?.length > 0) {
            operations.push(
              projectsToAdd?.map((project: string) => {
                Projects.addEntity(project, updatedEntity?._id);
              }),
            );
          }
          const projectsToRemove = currentEntity?.projects?.filter(
            (project) => !projectsToKeep?.includes(project),
          );
          if (projectsToRemove?.length > 0) {
            operations.push(
              projectsToRemove?.map((project: string) => {
                Projects.removeEntity(project, updatedEntity?._id);
              }),
            );
          }

          // Products
          const productsToKeep = currentEntity?.associations?.products
            ?.map((product) => product._id)
            ?.filter((product) =>
              updatedEntity?.associations?.products
                ?.map((product) => product._id)
                .includes(product),
            );
          const productsToAdd = updatedEntity?.associations?.products?.filter(
            (product) => !productsToKeep?.includes(product._id),
          );
          if (productsToAdd && productsToAdd?.length > 0) {
            operations.push(
              productsToAdd?.map((product: Item) => {
                Entities.addOrigin(product, {
                  name: updatedEntity?.name,
                  _id: updatedEntity?._id,
                });
                Entities.addProduct(
                  { name: updatedEntity?.name, _id: updatedEntity?._id },
                  product,
                );
              }),
            );
          }
          const productsToRemove =
            currentEntity?.associations?.products?.filter(
              (product) => !productsToKeep?.includes(product._id),
            );
          if (productsToRemove?.length > 0) {
            operations.push(
              productsToRemove?.map((product: Item) => {
                Entities.removeOrigin(product, {
                  name: updatedEntity?.name,
                  _id: updatedEntity?._id,
                });
                Entities.removeProduct(
                  { name: updatedEntity?.name, _id: updatedEntity?._id },
                  product,
                );
              }),
            );
          }

          // Origins
          const originsToKeep = currentEntity?.associations?.origins
            ?.map((origin) => origin._id)
            ?.filter((origin) =>
              updatedEntity?.associations?.origins
                ?.map((origin) => origin._id)
                .includes(origin),
            );
          const originsToAdd = updatedEntity?.associations?.origins?.filter(
            (origin) => !originsToKeep?.includes(origin._id),
          );
          if (originsToAdd && originsToAdd?.length > 0) {
            operations.push(
              originsToAdd?.map((origin: Item) => {
                Entities.addOrigin(
                  { name: updatedEntity?.name, _id: updatedEntity?._id },
                  origin,
                );
                Entities.addProduct(origin, {
                  name: updatedEntity?.name,
                  _id: updatedEntity?._id,
                });
              }),
            );
          }
          const originsToRemove = currentEntity?.associations?.origins?.filter(
            (origin) => !originsToKeep?.includes(origin._id),
          );
          if (originsToRemove?.length > 0) {
            operations.push(
              originsToRemove?.map((origin: Item) => {
                Entities.removeOrigin(
                  { name: updatedEntity?.name, _id: updatedEntity?._id },
                  origin,
                );
                Entities.removeProduct(origin, {
                  name: updatedEntity?.name,
                  _id: updatedEntity?._id,
                });
              }),
            );
          }

          // Attributes
          const attributesToKeep = currentEntity?.attributes
            ?.map((attribute) => attribute?._id)
            ?.filter((attribute) =>
              updatedEntity?.attributes
                ?.map((attribute) => attribute?._id)
                .includes(attribute),
            );
          operations.push(
            attributesToKeep?.map((attribute: string) => {
              const updatedAttribute = updatedEntity?.attributes?.filter(
                (updatedAttribute) =>
                  _.isEqual(attribute, updatedAttribute?._id),
              )[0];
              Entities.updateAttribute(updatedEntity?._id, updatedAttribute);
            }),
          );
          const attributesToAdd = updatedEntity?.attributes?.filter(
            (attribute) => !attributesToKeep?.includes(attribute?._id),
          );
          if (attributesToAdd?.length > 0) {
            operations.push(
              attributesToAdd?.map((attribute: AttributeModel) => {
                Entities.addAttribute(updatedEntity?._id, attribute);
              }),
            );
          }
          const attributesToRemove = currentEntity?.attributes.filter(
            (attribute) => !attributesToKeep?.includes(attribute?._id),
          );
          if (attributesToRemove?.length > 0) {
            operations.push(
              attributesToRemove?.map((attribute) => {
                Entities.removeAttribute(updatedEntity?._id, attribute?._id);
              }),
            );
          }

          // Attachments
          const attachmentsToKeep = currentEntity?.attachments
            ?.map((attachment) => attachment._id)
            .filter((attachment) =>
              updatedEntity?.attachments
                .map((attachment) => attachment._id)
                .includes(attachment),
            );
          const attachmentsToRemove = currentEntity?.attachments.filter(
            (attachment) => !attachmentsToKeep?.includes(attachment._id),
          );
          if (attachmentsToRemove?.length > 0) {
            operations.push(
              attachmentsToRemove?.map((attachment) => {
                Entities.removeAttachment(updatedEntity?._id, attachment);
              }),
            );
          }

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "update",
              details: "Updated Entity",
              target: {
                type: "entities",
                _id: currentEntity?._id,
                name: currentEntity?.name,
              },
            }),
          );

          // Ensure the list of projects is unique
          const uniqueProjects = [
            ...new Set([...(projectsToKeep || []), ...(projectsToAdd || [])]),
          ];

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            const updates = {
              $set: {
                deleted: updatedEntity.deleted,
                description: updatedEntity.description,
                name: updatedEntity?.name,
                projects: uniqueProjects,
                associations: {
                  origins: [
                    ...(currentEntity?.associations?.origins?.filter((origin) =>
                      originsToKeep?.includes(origin._id),
                    ) || []),
                    ...(originsToAdd || []),
                  ],
                  products: [
                    ...(currentEntity?.associations?.products?.filter(
                      (product) => productsToKeep?.includes(product._id),
                    ) || []),
                    ...(productsToAdd || []),
                  ],
                },
                history: [
                  {
                    timestamp: dayjs(Date.now()).toISOString(),
                    deleted: currentEntity?.deleted,
                    owner: currentEntity?.owner,
                    description: currentEntity?.description,
                    projects: currentEntity?.projects,
                    associations: {
                      origins: currentEntity?.associations?.origins,
                      products: currentEntity?.associations?.products,
                    },
                    attributes: currentEntity?.attributes,
                  },
                  ...(currentEntity.history || []),
                ],
              },
            };

            getDatabase()
              .collection(ENTITIES)
              .updateOne(
                { _id: updatedEntity?._id },
                updates,
                (error: any, _response: any) => {
                  if (error) {
                    consola.debug(
                      `Error updating Entity "${updatedEntity?._id}":`,
                      error,
                    );
                    throw error;
                  }

                  // Resolve the Promise
                  consola.debug("Updated Entity:", updatedEntity?.name);
                  resolve(updatedEntity);
                },
              );
          });
        });
    });
  };

  /**
   * Restore a version of an Entity
   * @param {EntityModel} entity the Entity data to restore
   * @returns {Promise<EntityModel>}
   */
  static restore = (entity: EntityModel): Promise<EntityModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .insertOne(entity as any, (error: any, _result: any) => {
          if (error) {
            consola.error(`Error restoring Entity "${entity?._id}":`, error);
            throw error;
          }

          // Database operations to perform outside of creating a new Entity
          const operations: Promise<any>[] = [];

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "create",
              details: "Restored Entity",
              target: {
                type: "entities",
                _id: entity?._id,
                name: entity?.name,
              },
            }),
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations)
            .then((_result) => {
              consola.debug("Restored Entity:", entity?._id, entity?.name);
              resolve(entity);
            })
            .catch((_error) => {
              consola.error(`Error restoring Entity "${entity?._id}":`, error);
              reject("Error restoring Entity");
            });
        });
    });
  };

  /**
   * Add a Project to an Entity
   * @param {string} entity Target Entity identifier
   * @param {string} project Project identifier to add
   * @returns {Promise<string>}
   */
  static addProject = (entity: string, project: string): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity}" to add Project: ${error}`,
            );
            throw error;
          }

          // Update the collection of Projects associated with the Entity to include this extra Project
          const updates = {
            $set: {
              projects: [...(result?.projects || []), project],
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Entity "${entity}" to add Project: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Added Entity (id):",
                  entity.toString(),
                  "to Project (id):",
                  project.toString(),
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Remove a Project from an Entity
   * @param {string} entity Target Entity identifier
   * @param {string} project Project identifier to remove
   * @returns {Promise<string>}
   */
  static removeProject = (entity: string, project: string): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity}" to remove Project: ${error}`,
            );
            throw error;
          }

          // Update the collection of Projects associated with the Entity to remove this Project
          const updates = {
            $set: {
              projects: [
                ...(result as EntityModel).projects?.filter(
                  (content) => !_.isEqual(content, project),
                ),
              ],
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Entity "${entity}" to remove Project: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Removed Entity (id):",
                  entity.toString(),
                  "from Project (id):",
                  project.toString(),
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Add another Entity to a collection of "product" associations
   * @param {Item} entity Target Entity name and identifier
   * @param {Item} product Entity name and identifier to add as a "product"-type association
   * @returns {Promise<Item>}
   */
  static addProduct = (entity: Item, product: Item): Promise<Item> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity._id }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity._id}" to add Product: ${error}`,
            );
            throw error;
          }
          let updatedProducts: Item[] = result?.associations?.products ?? [];
          const existingProductIndex = updatedProducts.findIndex(
            (o: Item) => o?.name === product?.name,
          );

          if (existingProductIndex > -1) {
            // Update existing origin if new ID is provided
            if (product._id) {
              updatedProducts[existingProductIndex]._id = product._id;
            }
          } else {
            // Add new origin
            updatedProducts = [
              ...updatedProducts,
              { name: product?.name, _id: product._id },
            ];
          }

          // Update the collection of Products associated with the Entity to include this extra product
          const updates = {
            $set: {
              associations: {
                origins: result?.associations?.origins,
                products: updatedProducts,
              },
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity._id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Entity "${entity._id}" to add Product: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Added Product",
                  product?.name,
                  "to Entity",
                  entity?.name,
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Add another Entities as a collection of "product"-type associations
   * @param {Item} entity Target Entity name and identifier
   * @param {Item[]} products Entity names and identifiers to add as a "product"-type association
   * @returns {Promise<Item[]>}
   */
  static addProducts = (entity: Item, products: Item[]): Promise<Item> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity._id }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity._id}" to add Products: ${error}`,
            );
            throw error;
          }

          // Update the collection of Products associated with the Entity to include this extra product
          const updates = {
            $set: {
              associations: {
                origins: result.associations.origins,
                products: _.uniq(
                  _.concat(result.associations.products, products),
                ),
              },
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity._id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Entity "${entity._id}" to add Products: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Added",
                  products?.length,
                  "Products to Entity",
                  entity?.name,
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Remove Entity as a "product"-type association
   * @param {Item} entity Target Entity name and identifier
   * @param {Item} product Entity name and identifier to remove as a "product"-type association
   * @returns {Promise<Item[]>}
   */
  static removeProduct = (entity: Item, product: Item): Promise<Item> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity._id }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity._id}" to remove Product: ${error}`,
            );
            throw error;
          } else if (_.isNull(result)) {
            consola.warn(
              `Entity "${entity._id}" does not exist to remove Product: ${error}`,
            );
            resolve(entity);
          }

          // Update the collection of Products associated with the Entity to remove this Product
          const updates = {
            $set: {
              associations: {
                origins: (result as EntityModel).associations?.origins,
                products: (
                  result as EntityModel
                ).associations?.products?.filter(
                  (content) => !_.isEqual(product._id, content._id),
                ),
              },
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity._id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Entity "${entity._id}" to remove Product: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Removed Product",
                  product?.name,
                  "from Entity",
                  entity?.name,
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Specify an Entity acting as an Origin
   * @param {Item} entity Target Entity name and identifier
   * @param {Item} origin Entity name and identifier to add as an "origin"-type association
   * @returns {Promise<Item>}
   */
  static addOrigin = (entity: Item, origin: Item): Promise<Item> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity._id }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity._id}" to add Origin: ${error}`,
            );
            throw error;
          }

          let updatedOrigins: Item[] = result?.associations?.origins ?? [];
          const existingOriginIndex = updatedOrigins.findIndex(
            (o: Item) => o?.name === origin?.name,
          );

          if (existingOriginIndex > -1) {
            // Update existing origin if new ID is provided
            if (origin._id) {
              updatedOrigins[existingOriginIndex]._id = origin._id;
            }
          } else {
            // Add new origin
            updatedOrigins = [
              ...updatedOrigins,
              { name: origin?.name, _id: origin._id },
            ];
          }

          // Add the Origin to this Entity
          const updates = {
            $set: {
              associations: {
                origins: updatedOrigins,
                products: result?.associations.products,
              },
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity._id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Entity "${entity._id}" to add Origin: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Added Origin",
                  origin?.name,
                  "to Entity",
                  entity?.name,
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Specify a collection of Entities acting as Origins
   * @param {Item} entity Target Entity name and identifier
   * @param {Item[]} origins Entities to add as "origin"-type associations
   * @returns {Promise<Item[]>}
   */
  static addOrigins = (entity: Item, origins: Item[]): Promise<Item> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity._id }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity._id}" to add Origins: ${error}`,
            );
            throw error;
          }

          // Add the Origins to this Entity
          const updates = {
            $set: {
              associations: {
                origins: _.uniq(_.concat(result.associations.origins, origins)),
                products: result.associations.products,
              },
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity._id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Entity "${entity._id}" to add Origins: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Added",
                  origins?.length,
                  "Origins to Entity",
                  entity?.name,
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Asynchronously removes an Origin from an Entity's associations.
   * @param {Object} entity The entity from which the origin is being removed.
   * @param {string} entity.name The name of the entity.
   * @param {string} entity._id The ID of the entity.
   * @param {Object} origin The origin being removed.
   * @param {string} origin.name The name of the origin.
   * @param {string} origin._id The ID of the origin.
   * @returns {Promise<Item>} Resolves with the updated entity after removing the origin.
   * @throws {Error} Throws an error if there are issues with the database operation.
   */
  static removeOrigin = (entity: Item, origin: Item): Promise<Item> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity._id }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity._id}" to remove Origin: ${error}`,
            );
            throw error;
          }

          // Update the collection of Origins associated with the Entity to remove this Origin
          const updates = {
            $set: {
              associations: {
                origins: (result as EntityModel).associations?.origins?.filter(
                  (content) => !_.isEqual(origin._id, content._id),
                ),
                products: (result as EntityModel).associations?.products,
              },
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity._id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Entity "${entity._id}" to remove Origin: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Removed Origin",
                  origin?.name,
                  "from Entity",
                  entity?.name,
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Asynchronously adds an Attribute to the specified Entity.
   * @param {string} entity The ID of the Entity to which the Attribute is being added.
   * @param {AttributeModel} attribute The Attribute object being added to the Entity.
   * @param {string} attribute.name The name of the Attribute.
   * @param {*} attribute Any additional properties associated with the Attribute.
   * @returns {Promise<string>} Resolves with the ID of the Entity after adding the Attribute.
   * @throws {Error} Throws an error if there are issues with the database operation.
   */
  static addAttribute = (
    entity: string,
    attribute: AttributeModel,
  ): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity}" to add Attribute: ${error}`,
            );
            throw error;
          }

          // Update the collection of Attributes associated with the Entity to remove this Attribute
          const updates = {
            $set: {
              attributes: [...(result?.attributes || []), attribute],
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Entity "${entity}" to add Attribute: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Added Attribute:",
                  attribute?.name.toString(),
                  "to Entity (id):",
                  entity.toString(),
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Asynchronously removes an Attribute from the specified Entity.
   * @param {string} entity The ID of the Entity from which the Attribute is being removed.
   * @param {string} attribute The ID of the Attribute to be removed from the Entity.
   * @returns {Promise<string>} Resolves with the ID of the Entity after removing the Attribute.
   * @throws {Error} Throws an error if there are issues with the database operation.
   */
  static removeAttribute = (
    entity: string,
    attribute: string,
  ): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity}" to remove Attribute: ${error}`,
            );
            throw error;
          }

          // Update the collection of Attributes associated with the Entity to remove this Attribute
          const updates = {
            $set: {
              attributes: [
                ...(result as EntityModel)?.attributes?.filter(
                  (content) => !_.isEqual(content?._id, attribute),
                ),
              ],
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Entity "${entity}" to remove Attribute: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Removed Attribute (id):",
                  attribute.toString(),
                  "from Entity (id):",
                  entity.toString(),
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Asynchronously updates an Attribute of the specified Entity.
   * @param {string} entity The ID of the Entity whose Attribute is being updated.
   * @param {AttributeModel} updatedAttribute The updated Attribute object.
   * @returns {Promise<string>} Resolves with the ID of the Entity after updating the Attribute.
   * @throws {Error} Throws an error if there are issues with the database operation.
   */
  static updateAttribute = (
    entity: string,
    updatedAttribute: AttributeModel,
  ): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity}" to update Attribute: ${error}`,
            );
            throw error;
          }

          (result as EntityModel)?.attributes.forEach((attribute) => {
            if (_.isEqual(updatedAttribute?._id, attribute?._id)) {
              attribute.name = updatedAttribute?.name;
              attribute.description = updatedAttribute.description;
              attribute.values = updatedAttribute.values;
            }
          });

          // Update the collection of Attributes associated with the Entity to remove this Attribute
          const updates = {
            $set: {
              attributes: [...(result as EntityModel)?.attributes],
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error retrieving Entity "${entity}" to update Attribute: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Updated Attribute (id):",
                  updatedAttribute?._id.toString(),
                  "from Entity (id):",
                  entity.toString(),
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Update the description of an Entity
   * @param entity the Entity of interest
   * @param description an updated description
   * @returns {Promise<Item>}
   */
  static setDescription = (
    entity: Item,
    description: string,
  ): Promise<Item> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entity._id }, (error: any, _result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entity}" to update description: ${error}`,
            );
            throw error;
          }

          // Update the description of this Entity
          const updates = {
            $set: {
              description: description,
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne(
              { _id: entity._id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Entity "${entity}" to update description: ${error}`,
                  );
                  throw error;
                }

                // Resolve the Promise
                consola.debug(
                  "Set description of Entity",
                  entity?.name,
                  "to",
                  description,
                );
                resolve(entity);
              },
            );
        });
    });
  };

  /**
   * Asynchronously adds an attachment to the specified Entity.
   * @param {string} id The ID of the Entity to which the attachment is being added.
   * @param {Item} attachment The attachment object to be added.
   * @returns {Promise<Item>} Resolves with the added attachment object.
   * @throws {Error} Throws an error if there are issues with the database operation.
   */
  static addAttachment = (_id: string, attachment: Item): Promise<Item> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: _id }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${_id}" to add Attachment: ${error}`,
            );
            throw error;
          }

          // Add the Origin to this Entity
          const updates = {
            $set: {
              attachments: [
                ...result?.attachments,
                {
                  _id: attachment._id,
                  name: attachment?.name,
                },
              ],
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne({ _id: _id }, updates, (error: any, _response: any) => {
              if (error) {
                consola.error(
                  `Error updating Entity "${_id}" to add Attachment: ${error}`,
                );
                throw error;
              }

              // Resolve the Promise
              consola.debug(
                "Added Attachment",
                attachment?.name,
                "to Entity (id):",
                _id,
              );
              resolve(attachment);
            });
        });
    });
  };

  /**
   * Asynchronously removes an attachment from the Entity entity.
   * @param {string} id The ID of the Entity from which the attachment is being removed.
   * @param {Item} attachment The attachment object to be removed.
   * @returns {Promise<Item>} Resolves with the removed attachment object.
   * @throws {Error} Throws an error if there are issues with the database operation.
   */
  static removeAttachment = (_id: string, attachment: Item): Promise<Item> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: _id }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${_id}" to remove Attachment: ${error}`,
            );
            throw error;
          }

          // Add the Origin to this Entity
          const updates = {
            $set: {
              attachments: [
                ...(result as EntityModel)?.attachments?.filter(
                  (existing) => !_.isEqual(existing._id, attachment._id),
                ),
              ],
            },
          };

          getDatabase()
            .collection(ENTITIES)
            .updateOne({ _id: _id }, updates, (error: any, _response: any) => {
              if (error) {
                consola.error(
                  `Error updating Entity "${_id}" to remove Attachment: ${error}`,
                );
                throw error;
              }

              // Resolve the Promise
              consola.debug(
                "Removed Attachment",
                attachment?.name,
                "from Entity (id):",
                _id,
              );
              resolve(attachment);
            });
        });
    });
  };

  /**
   * Update the lock state of an Entity
   * @param {{ entity: Item; lockState: boolean; }} entityLockData the Entity of interest and a flag if the Entity is "locked", or editable
   * @returns {Promise<Item>}
   */
  static setLock = (entityLockData: {
    entity: Item;
    lockState: boolean;
  }): Promise<Item> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne(
          { _id: entityLockData.entity._id },
          (error: any, _result: any) => {
            if (error) {
              throw error;
            }

            // Update the lock state of this Entity
            // Note: This feature is temporarily disabled
            entityLockData.lockState = false;
            consola.warn("Edit locking temporarily disabled");

            const updates = {
              $set: {
                locked: entityLockData.lockState,
              },
            };

            getDatabase()
              .collection(ENTITIES)
              .updateOne(
                { _id: entityLockData.entity._id },
                updates,
                (error: any, _response: any) => {
                  if (error) {
                    throw error;
                  }

                  // Update automatic unlock operation after 30 seconds
                  if (entityLockData.lockState === true) {
                    setTimeout(() => {
                      this.setLock({
                        entity: entityLockData.entity,
                        lockState: false,
                      });
                    }, 30000);
                  }

                  // Resolve the Promise
                  consola.debug(
                    "Set lock state of Entity",
                    entityLockData.entity?.name,
                    "to",
                    entityLockData.lockState ? "locked" : "unlocked",
                  );
                  resolve(entityLockData.entity);
                },
              );
          },
        );
    });
  };

  /**
   * Retrieve all Entities
   * @returns {Promise<EntityModel[]>}
   */
  static getAll = (): Promise<EntityModel[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .find({
          deleted: false,
        })
        .toArray((error: any, result: any) => {
          if (error) {
            consola.error("Error retrieving all Entities:", error);
            throw error;
          }

          consola.debug("Retrieved all Entities");
          resolve(result as EntityModel[]);
        });
    });
  };

  /**
   * Get a single Entity
   * @param {string} id the Entity identifier
   * @returns {Promise<EntityModel>}
   */
  static getOne = (id: string): Promise<EntityModel> => {
    return new Promise((resolve, reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            consola.error(`Error retrieving Entity "${id}": ${error}`);
            reject(error);
            throw error;
          }

          consola.debug("Retrieved Entity (id):", id.toString());
          resolve(result as EntityModel);
        });
    });
  };

  /**
   * Asynchronously retrieves data for exporting from the specified Entity.
   * @param {string} entityId - The ID of the Entity from which data is being exported.
   * @param {{ fields: string[]; format: "json" | "csv" | "txt"; }} exportInfo - Information about the data export.
   * @returns {Promise<string>} Resolves with the path to the exported data file.
   * @throws {Error} Throws an error if there are issues with the database operation or export process.
   */
  static getData = (
    entityId: string,
    exportInfo: {
      fields: string[];
      format: "json" | "csv" | "txt";
    },
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: entityId }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Entity "${entityId}" for export:`,
              error,
            );
            reject(error);
            throw error;
          }

          const entity = result as EntityModel;

          if (_.isEqual(exportInfo.format, "csv")) {
            const headers = ["ID", "Name"];
            const row: Promise<string>[] = [
              Promise.resolve(entity?._id),
              Promise.resolve(entity?.name),
            ];

            // Iterate over fields and generate a CSV export file
            exportInfo.fields?.map((field) => {
              if (_.isEqual(field, "created")) {
                // "created" data field
                headers.push("Created");
                row.push(
                  Promise.resolve(
                    dayjs(entity.created).format("DD MMM YYYY").toString(),
                  ),
                );
              } else if (_.isEqual(field, "owner")) {
                // "owner" data field
                headers.push("Owner");
                row.push(Promise.resolve(entity.owner));
              } else if (_.isEqual(field, "description")) {
                // "description" data field
                headers.push("Description");
                row.push(Promise.resolve(entity.description));
              } else if (_.startsWith(field, "origin_")) {
                // "origins" data field
                row.push(
                  Entities.getOne(field.slice(7)).then((entity) => {
                    headers.push(`Origin (${entity?.name})`);
                    return entity?.name;
                  }),
                );
              } else if (_.startsWith(field, "product_")) {
                // "products" data field
                row.push(
                  Entities.getOne(field.slice(8)).then((entity) => {
                    headers.push(`Product (${entity?.name})`);
                    return entity?.name;
                  }),
                );
              } else if (_.startsWith(field, "attribute_")) {
                // "attributes" data field
                const attributeId = field.slice(10);
                entity?.attributes?.map((attribute) => {
                  if (_.isEqual(attribute?._id, attributeId)) {
                    for (let value of attribute.values) {
                      headers.push(`${value?.name} (${attribute?.name})`);
                      row.push(Promise.resolve(`${value.data}`));
                    }
                  }
                });
              }
            });

            // Collate and format data as a CSV string
            Promise.all(row).then((rowData) => {
              const collated = [headers, rowData];
              const formattedOutput = Papa.unparse(collated);

              // Create a temporary file, passing the filename as a response
              tmp.file((error, path: string, _fd: number) => {
                if (error) {
                  consola.error(
                    "Error creating temporary file while exporting:",
                    error,
                  );
                  reject(error);
                  throw error;
                }

                fs.writeFileSync(path, formattedOutput);
                consola.debug(
                  "Generated CSV data for Entity (id):",
                  entityId.toString(),
                );
                resolve(path);
              });
            });
          } else if (_.isEqual(exportInfo.format, "json")) {
            // JSON export
            const tempStructure = {
              _id: entity?._id,
              name: entity?.name,
              created: "",
              owner: "",
              description: "",
              associations: {},
              projects: [],
              attributes: [],
            } as { [key: string]: any };
            const exportOperations = [] as Promise<string>[];

            exportInfo.fields?.map((field: string) => {
              if (_.isEqual(field, "created")) {
                // "created" data field
                tempStructure["created"] = dayjs(entity.created)
                  .format("DD MMM YYYY")
                  .toString();
              } else if (_.isEqual(field, "owner")) {
                // "owner" data field
                tempStructure["owner"] = entity.owner;
              } else if (_.isEqual(field, "description")) {
                // "description" data field
                tempStructure["description"] = entity.description;
              } else if (_.startsWith(field, "project_")) {
                // "projects" data field
                tempStructure["projects"] = [];
                exportOperations.push(
                  Projects.getOne(field.slice(8)).then((project) => {
                    tempStructure["projects"].push(project?.name);
                    return project?.name;
                  }),
                );
              } else if (_.startsWith(field, "origin_")) {
                // "origins" data field
                tempStructure.associations["origins"] = [];
                exportOperations.push(
                  Entities.getOne(field.slice(7)).then((entity) => {
                    tempStructure.associations["origins"].push(entity?.name);
                    return entity?.name;
                  }),
                );
              } else if (_.startsWith(field, "product_")) {
                // "products" data field
                tempStructure.associations["products"] = [];
                exportOperations.push(
                  Entities.getOne(field.slice(8)).then((entity) => {
                    tempStructure.associations["products"].push(entity?.name);
                    return entity?.name;
                  }),
                );
              } else if (_.startsWith(field, "attribute_")) {
                // "attributes" data field
                tempStructure["attributes"] = [];
                const attributeId = field.slice(10);
                entity?.attributes?.map((attribute) => {
                  if (_.isEqual(attribute?._id, attributeId)) {
                    // Add the Attribute to the exported set
                    tempStructure["attributes"].push(attribute);
                  }
                });
              }
            });

            // Run all export operations
            Promise.all(exportOperations).then((_values) => {
              // Create a temporary file, passing the filename as a response
              tmp.file((error, path: string, _fd: number) => {
                if (error) {
                  consola.error(
                    "Error creating temporary file while exporting:",
                    error,
                  );
                  reject(error);
                  throw error;
                }

                fs.writeFileSync(
                  path,
                  JSON.stringify(tempStructure, null, "  "),
                );
                consola.debug(
                  "Generated JSON data for Entity (id):",
                  entityId.toString(),
                );
                resolve(path);
              });
            });
          } else {
            // Text export
            const exportOperations = [] as Promise<string>[];

            // Structures to collate data
            const textDetails = [`ID: ${entity?._id}`, `Name: ${entity?.name}`];
            const textOrigins = [] as string[];
            const textProducts = [] as string[];
            const textAttributes = [] as string[];

            exportInfo.fields?.map((field: string) => {
              if (_.isEqual(field, "created")) {
                // "created" data field
                textDetails.push(
                  `Created: ${dayjs(entity.created)
                    .format("DD MMM YYYY")
                    .toString()}`,
                );
              } else if (_.isEqual(field, "owner")) {
                // "owner" data field
                textDetails.push(`Owner: ${entity.owner}`);
              } else if (_.isEqual(field, "description")) {
                // "description" data field
                textDetails.push(`Description: ${entity.description}`);
              } else if (_.startsWith(field, "origin_")) {
                // "origins" data field
                exportOperations.push(
                  Entities.getOne(field.slice(7)).then((entity) => {
                    textOrigins.push(entity?.name);
                    return entity?.name;
                  }),
                );
              } else if (_.startsWith(field, "product_")) {
                // "products" data field
                exportOperations.push(
                  Entities.getOne(field.slice(8)).then((entity) => {
                    textProducts.push(entity?.name);
                    return entity?.name;
                  }),
                );
              } else if (_.startsWith(field, "attribute_")) {
                // "attributes" data field
                const attributeId = field.slice(10);
                entity?.attributes?.map((attribute) => {
                  if (_.isEqual(attribute?._id, attributeId)) {
                    // Extract all values
                    const attributeValues = [];
                    for (let value of attribute.values) {
                      attributeValues.push(`    ${value?.name}: ${value.data}`);
                    }

                    // Add the Attribute to the exported set
                    textAttributes.push(
                      `  ${attribute?.name}:\n${attributeValues.join("\n")}`,
                    );
                  }
                });
              }
            });

            // Run all export operations
            Promise.all(exportOperations).then((_values) => {
              // Create a temporary file, passing the filename as a response
              tmp.file((error, path: string, _fd: number) => {
                if (error) {
                  consola.error(
                    "Error creating temporary file while exporting:",
                    error,
                  );
                  reject(error);
                  throw error;
                }

                if (textOrigins?.length > 0) {
                  textDetails.push(`Origins: ${textOrigins.join(", ")}`);
                }
                if (textProducts?.length > 0) {
                  textDetails.push(`Products: ${textProducts.join(", ")}`);
                }
                if (textAttributes?.length > 0) {
                  textDetails.push(`Attributes:`);
                  textDetails.push(...textAttributes);
                }

                fs.writeFileSync(path, textDetails.join("\n"));
                consola.debug(
                  "Generated text data for Entity (id):",
                  entityId.toString(),
                );
                resolve(path);
              });
            });
          }
        });
    });
  };

  /**
   * Generate a JSON representation of multiple Entities
   * @param entityIds Collection of Entity identifiers to retrieve
   * @returns {Promise<string>}
   */
  static async getDataMultipleJSON(entityIds: string[]): Promise<string> {
    try {
      const entities = await Entities.getDataMultipleRaw(entityIds);

      // Remove 'history' property from each entity
      let modifiedEntities = {
        entities: entities?.map((entity) => {
          const plainEntity = JSON.parse(JSON.stringify(entity)); // Converts MongoDB types to plain objects
          delete plainEntity.history;

          return plainEntity;
        }),
      };

      consola.debug("Generated JSON string for", entities.length, "Entities");
      return JSON.stringify(modifiedEntities, null, 4);
    } catch (error) {
      consola.error(
        "Error generating JSON string for multiple Entities:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get the collection of complete Entity records for a set of identifiers
   * @param entityIds Collection of Entity identifiers to retrieve
   * @returns {Promise<WithId<Document>[]>}
   */
  static async getDataMultipleRaw(
    entityIds: string[],
  ): Promise<WithId<Document>[]> {
    try {
      const entities = await getDatabase()
        .collection(ENTITIES)
        .find({ _id: { $in: entityIds } })
        .toArray();

      consola.debug("Collated", entities.length, "Entities");
      return entities;
    } catch (error) {
      consola.error("Error retrieving Entities");
      throw error;
    }
  }

  /**
   * Generate a CSV-formatted file containing data for multiple Entities
   * @param entities Collection of Entity identifiers to retrieve
   * @returns {Promise<string>} Path to temporary CSV file
   */
  static getDataMultiple = (entities: string[]): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      // Get the data for each Entity and store
      const entityData: any = await Entities.getDataMultipleRaw(entities);

      Promise.all(entityData).then((entities: EntityModel[]) => {
        // Find any common Attributes and append to headers
        const commonAttributes = _.uniqBy(
          _.flatten(entities?.map((entity) => entity?.attributes)),
          (attribute) => attribute?.name,
        );

        // Once all Entity data has been retrieved, iterate and add to rows
        const entityRowData = entities?.map((entity: EntityModel) => {
          return new Promise<{ [header: string]: string }>(
            (resolve, _reject) => {
              // Setup base data structure (later to be transformed into row)
              const exportEntityRow: { [header: string]: string } = {
                ID: entity?._id,
                Name: entity?.name,
                Owner: entity.owner,
                Created: entity.created,
                Description: entity?.description,
                Projects: "",
                Products: "",
                Origins: "",
              };

              // Get Projects
              const entityProjects: Promise<ProjectModel>[] = [];
              entity.projects?.map((projectId: string) => {
                entityProjects.push(Projects.getOne(projectId));
              });
              Promise.all(entityProjects)
                .then((projects: ProjectModel[]) => {
                  // Collate Projects
                  const formattedProjects = projects?.map(
                    (project: ProjectModel) => {
                      return project?.name;
                    },
                  );
                  if (formattedProjects?.length > 0) {
                    exportEntityRow.Projects = formattedProjects.join(" ");
                  }
                })
                .then(() => {
                  // Collate Products and Origins
                  const formattedProducts = entity?.associations?.products?.map(
                    (product) => {
                      return product?.name;
                    },
                  );
                  if (formattedProducts?.length > 0) {
                    exportEntityRow.Products = formattedProducts.join(" ");
                  }

                  const formattedOrigins = entity?.associations?.origins?.map(
                    (origin) => {
                      return origin?.name;
                    },
                  );
                  if (formattedOrigins?.length > 0) {
                    exportEntityRow.Origins = formattedOrigins.join(" ");
                  }
                })
                .then(() => {
                  // Add Attributes (if existing)
                  entity?.attributes?.map((attribute: AttributeModel) => {
                    // If current Attribute is a common Attribute, add the information
                    if (
                      _.includes(
                        commonAttributes?.map(
                          (commonAttribute) => commonAttribute?.name,
                        ),
                        attribute?.name,
                      )
                    ) {
                      attribute.values?.map((value: IValue<any>) => {
                        if (_.isEqual(value.type, "select")) {
                          exportEntityRow[
                            `${attribute?.name} (${value?.name})`
                          ] = value.data.selected;
                        } else {
                          exportEntityRow[
                            `${attribute?.name} (${value?.name})`
                          ] = value.data;
                        }
                      });
                    }
                  });
                })
                .finally(() => {
                  // Add row to the existing set of rows
                  resolve(exportEntityRow);
                });
            },
          );
        });

        Promise.all(entityRowData).then(
          (generatedRows: { [header: string]: string }[]) => {
            // Create set of rows
            const rows = [];

            // Create a header row
            const leadingRow = Object.keys(generatedRows[0]);
            rows.push(leadingRow);

            // Add all rows by extracting values
            generatedRows?.map((generatedRow: { [header: string]: string }) => {
              rows.push(Object.values(generatedRow));
            });

            // Format the output by unparsing the rows
            const formattedOutput = Papa.unparse(rows);

            // Create a temporary file, passing the filename as a response
            tmp.file((error, path: string, _fd: number) => {
              if (error) {
                consola.error(
                  "Error creating temporary file while exporting:",
                  error,
                );
                reject(error);
                throw error;
              }

              fs.writeFileSync(path, formattedOutput);
              consola.debug("Generated data for", entities?.length, "Entities");
              resolve(path);
            });
          },
        );
      });
    });
  };

  /**
   * Handle uploading and assigning an attachment to an Entity
   * @param {any} files image to be attached to the Entity
   * @param {string} target Entity identifier to receive the image
   * @returns {Promise<{ status: boolean; message: string; data?: any }>}
   */
  static upload = (
    files: any,
    target: string,
  ): Promise<{ status: boolean; message: string; data?: any }> => {
    return new Promise((resolve, reject) => {
      if (files.file) {
        const receivedFile = files.file;
        const receivedFileData = receivedFile.data as Buffer;

        // Access bucket and create open stream to write to storage
        const bucket = getAttachments();

        // Create stream from buffer
        const streamedFile = Readable.from(receivedFileData);
        const uploadStream = bucket.openUploadStream(receivedFile?.name, {
          metadata: { type: receivedFile.mimetype },
        });
        streamedFile
          .pipe(uploadStream)
          .on("error", (error: Error) => {
            consola.error("Error uploading file:", error);
            reject("Error occurred uploading file");
          })
          .on("finish", () => {
            // Once the upload is finished, register attachment with Entity
            Entities.addAttachment(target, {
              _id: uploadStream.id.toString(),
              name: receivedFile?.name,
            });
            consola.debug("Uploaded file:", receivedFile?.name);
            resolve({ status: true, message: "Uploaded file" });
          });
      }
    });
  };

  /**
   * Delete an Entity by identifier
   * @param id Entity identifier to delete
   * @returns {Promise<EntityModel>}
   */
  static delete = (id: string): Promise<EntityModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            consola.error(`Error retrieving Entity "${id}" to delete:`, error);
            throw error;
          }
          // Store the Entity data
          const entity: EntityModel = result;

          const operations: Promise<any>[] = [];

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "delete",
              details: "Deleted Entity",
              target: {
                type: "entities",
                _id: entity?._id,
                name: entity?.name,
              },
            }),
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            // Set the deleted flag
            const updates = {
              $set: {
                deleted: true,
              },
            };

            getDatabase()
              .collection(ENTITIES)
              .updateOne(
                { _id: entity?._id },
                updates,
                (error: any, _response: any) => {
                  if (error) {
                    consola.error(
                      `Error deleting Entity "${entity?._id}":`,
                      error,
                    );
                    throw error;
                  }

                  // Resolve the Promise
                  consola.debug("Deleted Entity:", entity?.name);
                  resolve(entity);
                },
              );
          });
        });
    });
  };

  /**
   * Search Entities using a regex expression, returning list of owned Entities
   * @param userId User identifier, used to filter by Entity ownership
   * @param searchText Raw search query
   * @returns {Promise<WithId<Document>[]>}
   */
  static searchByText = async (
    userId: string,
    searchText: string,
  ): Promise<WithId<Document>[]> => {
    const searchRegex = new RegExp(searchText, "i"); // Case-insensitive regex search
    const entities = await getDatabase()
      .collection("entities")
      .find({
        $or: [
          { name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { "attributes.name": { $regex: searchRegex } },
          { "attributes.description": { $regex: searchRegex } },
          { "attributes.values.name": { $regex: searchRegex } },
          { "attributes.values.data": { $regex: searchRegex } },
        ],
        // Additional query to ensure entity is not soft-deleted etc, if applicable
      })
      .toArray();

    const filteredEntities = [];

    for (let entity of entities) {
      let isOwnerOrProjectOwner = entity.owner === userId;
      if (isOwnerOrProjectOwner) {
        filteredEntities.push(entity);
        continue;
      }

      let isProjectOwned = false;
      for (let projectId of entity.projects || []) {
        const project = await Projects.getOne(projectId);
        if (project && project.owner === userId) {
          isProjectOwned = true;
          break; // Exit the loop early if ownership is confirmed
        }
      }

      // If the user is a project owner, include the entity
      if (isProjectOwned) {
        filteredEntities.push(entity);
      }
    }

    // Further filter entities based on user's permission here if needed
    // For simplicity, this step is omitted but you should implement it based on your app's logic

    consola.debug(
      `Searched and filtered yielding ${filteredEntities.length} Entities`,
    );
    return filteredEntities;
  };
}
