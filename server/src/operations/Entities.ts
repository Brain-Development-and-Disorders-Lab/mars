// Utility libraries
import _ from "underscore";
import consola from "consola";

// Utility functions
import { getDatabase, getIdentifier } from "../database/connection";
import { Updates } from "./Updates";

// Custom types
import { EntityModel } from "@types";
import { Collections } from "./Collections";

// Constants
const ENTITIES_COLLECTION = "entities";

export class Entities {
  /**
   * Create a new Entity
   * @param {any} entity all data associated with the new Entity
   * @return {Promise<EntityModel>}
   */
  static create = (entity: any): Promise<EntityModel> => {
    consola.info("Creating new Entity:", entity.name);

    // Allocate a new identifier and join with Entity data
    entity["_id"] = getIdentifier("entity");

    // Push data to database
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .insertOne(entity, (error: any, _result: any) => {
          if (error) {
            throw error;
          }

          // Database operations to perform outside of creating a new Entity
          const operations: Promise<any>[] = [];

          if (entity.associations.origins.length > 0) {
            // If this Entity has an origin, add this Entity as a product of that origin Entity
            entity.associations.origins.forEach(
              (origin: { name: string; id: string }) => {
                operations.push(
                  Entities.addProduct(origin, {
                    name: entity.name,
                    id: entity._id,
                  })
                );
              }
            );
          }

          if (entity.associations.products.length > 0) {
            // If this Entity has products, set this Entity as the origin of each product Entity-
            entity.associations.products.forEach(
              (product: { name: string; id: string }) => {
                operations.push(
                  Entities.addOrigin(product, {
                    name: entity.name,
                    id: entity._id,
                  })
                );
              }
            );
          }

          if (entity.collections.length > 0) {
            // If this Entity has been added to Collections, add the Entity to each Collection
            entity.collections.map((collection: string) => {
              operations.push(Collections.addEntity(collection, entity._id));
            });
          }

          // Add Update operation
          operations.push(
            Updates.create({
              timestamp: new Date(Date.now()),
              type: "create",
              details: "Created new Entity",
              target: {
                type: "entities",
                id: entity._id,
                name: entity.name,
              },
            })
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            consola.success("Created Entity:", entity._id, entity.name);
            resolve(entity);
          });
        });
    });
  };

  /**
   * Update an Entity, comparing a new version with the existing version
   * @param {EntityModel} updatedEntity updated Entity
   * @return {Promise<EntityModel>}
   */
  static update = (updatedEntity: EntityModel): Promise<EntityModel> => {
    consola.info("Updating Entity:", updatedEntity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne(
          { _id: updatedEntity._id },
          (error: any, result: any) => {
            if (error) {
              throw error;
            }
            // Cast and store current state of the Entity
            const currentEntity = result as EntityModel;

            // List of operations to perform the update
            const operations = [];

            // Collections
            const collectionsToKeep = currentEntity.collections.filter(
              (collection) => updatedEntity.collections.includes(collection)
            );

            const collectionsToAdd = updatedEntity.collections.filter(
              (collection) => !collectionsToKeep.includes(collection)
            );
            if (collectionsToAdd.length > 0) {
              operations.push(
                collectionsToAdd.map((collection: string) => {
                  Collections.addEntity(collection, updatedEntity._id);
                })
              );
            }

            const collectionsToRemove = currentEntity.collections.filter(
              (collection) => !collectionsToKeep.includes(collection)
            );
            if (collectionsToRemove.length > 0) {
              operations.push(
                collectionsToRemove.map((collection: string) => {
                  Collections.removeEntity(collection, updatedEntity._id);
                })
              );
            }

            // Products
            const productsToKeep = currentEntity.associations.products
              .map((product) => product.id)
              .filter((product) =>
                updatedEntity.associations.products
                  .map((product) => product.id)
                  .includes(product)
              );
            const productsToAdd = updatedEntity.associations.products.filter(
              (product) => !productsToKeep.includes(product.id)
            );
            if (productsToAdd.length > 0) {
              operations.push(
                productsToAdd.map((product: { id: string; name: string }) => {
                  Entities.addOrigin(product, {
                    name: updatedEntity.name,
                    id: updatedEntity._id,
                  });
                  Entities.addProduct(
                    { name: updatedEntity.name, id: updatedEntity._id },
                    product
                  );
                })
              );
            }
            const productsToRemove = currentEntity.associations.products.filter(
              (product) => !productsToKeep.includes(product.id)
            );
            if (productsToRemove.length > 0) {
              operations.push(
                productsToRemove.map(
                  (product: { id: string; name: string }) => {
                    Entities.removeOrigin(product, {
                      name: updatedEntity.name,
                      id: updatedEntity._id,
                    });
                    Entities.removeProduct(
                      { name: updatedEntity.name, id: updatedEntity._id },
                      product
                    );
                  }
                )
              );
            }

            // Origins
            const originsToKeep = currentEntity.associations.origins
              .map((origin) => origin.id)
              .filter((origin) =>
                updatedEntity.associations.origins
                  .map((origin) => origin.id)
                  .includes(origin)
              );
            const originsToAdd = updatedEntity.associations.origins.filter(
              (origin) => !originsToKeep.includes(origin.id)
            );
            if (originsToAdd.length > 0) {
              operations.push(
                originsToAdd.map((origin: { id: string; name: string }) => {
                  Entities.addOrigin(
                    { name: updatedEntity.name, id: updatedEntity._id },
                    origin
                  );
                  Entities.addProduct(origin, {
                    name: updatedEntity.name,
                    id: updatedEntity._id,
                  });
                })
              );
            }
            const originsToRemove = currentEntity.associations.origins.filter(
              (origin) => !originsToKeep.includes(origin.id)
            );
            if (originsToRemove.length > 0) {
              operations.push(
                originsToRemove.map((origin: { id: string; name: string }) => {
                  Entities.removeOrigin(
                    { name: updatedEntity.name, id: updatedEntity._id },
                    origin
                  );
                  Entities.removeProduct(origin, {
                    name: updatedEntity.name,
                    id: updatedEntity._id,
                  });
                })
              );
            }

            // Add Update operation
            operations.push(
              Updates.create({
                timestamp: new Date(Date.now()),
                type: "update",
                details: "Updated Entity",
                target: {
                  type: "entities",
                  id: currentEntity._id,
                  name: currentEntity.name,
                },
              })
            );

            // Resolve all operations then resolve overall Promise
            Promise.all(operations).then((_result) => {
              const updates = {
                $set: {
                  description: updatedEntity.description,
                  collections: [...collectionsToKeep, ...collectionsToAdd],
                  associations: {
                    origins: [
                      ...currentEntity.associations.origins.filter((origin) =>
                        originsToKeep.includes(origin.id)
                      ),
                      ...originsToAdd,
                    ],
                    products: [
                      ...currentEntity.associations.products.filter((product) =>
                        productsToKeep.includes(product.id)
                      ),
                      ...productsToAdd,
                    ],
                  },
                },
              };

              getDatabase()
                .collection(ENTITIES_COLLECTION)
                .updateOne(
                  { _id: updatedEntity._id },
                  updates,
                  (error: any, _response: any) => {
                    if (error) {
                      throw error;
                    }

                    // Resolve the Promise
                    consola.success("Updated Entity:", updatedEntity.name);
                    resolve(updatedEntity);
                  }
                );
            });
          }
        );
    });
  };

  /**
   * Add another Entity to a collection of "product" associations
   * @param {{ name: string, id: string }} entity the Entity of interest
   * @param {{ name: string, id: string }} product an Entity to add as a "product" association
   * @return {Promise<{ name: string, id: string }>}
   */
  static addProduct = (
    entity: { name: string; id: string },
    product: { name: string; id: string }
  ): Promise<{ name: string; id: string }> => {
    consola.info("Adding Product", product.name, "to Entity", entity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne(
          { _id: entity.id },
          (error: any, result: any) => {
            if (error) {
              throw error;
            }

            // Update the collection of Products associated with the Entity to include this extra product
            const updates = {
              $set: {
                associations: {
                  origins: result.associations.origins,
                  products: [...result.associations.products, product],
                },
              },
            };

            getDatabase()
              .collection(ENTITIES_COLLECTION)
              .updateOne(
                { _id: entity.id },
                updates,
                (error: any, _response: any) => {
                  if (error) {
                    throw error;
                  }

                  // Resolve the Promise
                  consola.success(
                    "Added Product",
                    product.name,
                    "to Entity",
                    entity.name
                  );
                  resolve(entity);
                }
              );
          }
        );
    });
  };

  static removeProduct = (
    entity: { name: string; id: string },
    product: { name: string; id: string }
  ): Promise<{ name: string; id: string }> => {
    consola.info("Removing Product", product.name, "from Entity", entity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne(
          { _id: entity.id },
          (error: any, result: any) => {
            if (error) {
              throw error;
            }

            // Update the collection of Products associated with the Entity to remove this Product
            const updates = {
              $set: {
                associations: {
                  origins: (result as EntityModel).associations.origins,
                  products: (
                    result as EntityModel
                  ).associations.products.filter(
                    (content) =>
                      !_.isEqual(product.id, content.id)
                  ),
                },
              },
            };

            getDatabase()
              .collection(ENTITIES_COLLECTION)
              .updateOne(
                { _id: entity.id },
                updates,
                (error: any, _response: any) => {
                  if (error) {
                    throw error;
                  }

                  // Resolve the Promise
                  consola.info(
                    "Removed Product",
                    product.name,
                    "from Entity",
                    entity.name
                  );
                  resolve(entity);
                }
              );
          }
        );
    });
  };

  static addCollection = (
    entity: string,
    collection: string
  ): Promise<string> => {
    consola.info(
      "Adding Entity (id):",
      entity.toString(),
      "to Collection (id):",
      collection.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Collections associated with the Entity to include this extra Collection
          const updates = {
            $set: {
              collections: [...(result as EntityModel).collections, collection],
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Added Entity (id):",
                  entity.toString(),
                  "to Collection (id):",
                  collection.toString()
                );
                resolve(entity);
              }
            );
        });
    });
  };

  static removeCollection = (
    entity: string,
    collection: string
  ): Promise<string> => {
    consola.info(
      "Removing Entity (id):",
      entity.toString(),
      "from Collection (id):",
      collection.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Collections associated with the Entity to remove this Collection
          const updates = {
            $set: {
              collections: [
                ...(result as EntityModel).collections.filter(
                  (content) =>
                    !_.isEqual(content, collection)
                ),
              ],
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Removed Entity (id):",
                  entity.toString(),
                  "from Collection (id):",
                  collection.toString()
                );
                resolve(entity);
              }
            );
        });
    });
  };

  /**
   * Specify an Entity acting as an Origin
   * @param {{ name: string, id: string }} entity the Entity of interest
   * @param {{ name: string, id: string }} origin an Entity to add as an "origin" association
   * @return {Promise<{ name: string, id: string }>}
   */
  static addOrigin = (
    entity: { name: string; id: string },
    origin: { name: string; id: string }
  ): Promise<{ name: string; id: string }> => {
    consola.info("Adding Origin", origin.name, "to Entity", entity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne(
          { _id: entity.id },
          (error: any, result: any) => {
            if (error) {
              throw error;
            }

            // Add the Origin to this Entity
            const updates = {
              $set: {
                associations: {
                  origins: [
                    ...result.associations.origins,
                    {
                      name: origin.name,
                      id: origin.id,
                    },
                  ],
                  products: result.associations.products,
                },
              },
            };

            getDatabase()
              .collection(ENTITIES_COLLECTION)
              .updateOne(
                { _id: entity.id },
                updates,
                (error: any, _response: any) => {
                  if (error) {
                    throw error;
                  }

                  // Resolve the Promise
                  consola.success(
                    "Added Origin",
                    origin.name,
                    "to Entity",
                    entity.name
                  );
                  resolve(entity);
                }
              );
          }
        );
    });
  };

  static removeOrigin = (
    entity: { name: string; id: string },
    origin: { name: string; id: string }
  ): Promise<{ name: string; id: string }> => {
    consola.info("Removing Origin", origin.name, "from Entity", entity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne(
          { _id: entity.id },
          (error: any, result: any) => {
            if (error) {
              throw error;
            }

            // Update the collection of Origins associated with the Entity to remove this Origin
            const updates = {
              $set: {
                associations: {
                  origins: (result as EntityModel).associations.origins.filter(
                    (content) =>
                      !_.isEqual(origin.id, content.id)
                  ),
                  products: (result as EntityModel).associations.products,
                },
              },
            };

            getDatabase()
              .collection(ENTITIES_COLLECTION)
              .updateOne(
                { _id: entity.id },
                updates,
                (error: any, _response: any) => {
                  if (error) {
                    throw error;
                  }

                  // Resolve the Promise
                  consola.success(
                    "Removed Origin",
                    origin.name,
                    "from Entity",
                    entity.name
                  );
                  resolve(entity);
                }
              );
          }
        );
    });
  };

  /**
   * Update the description of an Entity
   * @param entity the Entity of interest
   * @param description an updated description
   * @return {Promise<{ name: string, id: string }>}
   */
  static setDescription = (
    entity: { name: string; id: string },
    description: string
  ): Promise<{ name: string; id: string }> => {
    consola.info(
      "Setting description of Entity",
      entity.name,
      "to",
      description
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne(
          { _id: entity.id },
          (error: any, _result: any) => {
            if (error) {
              throw error;
            }

            // Update the description of this Entity
            const updates = {
              $set: {
                description: description,
              },
            };

            getDatabase()
              .collection(ENTITIES_COLLECTION)
              .updateOne(
                { _id: entity.id },
                updates,
                (error: any, _response: any) => {
                  if (error) {
                    throw error;
                  }

                  // Resolve the Promise
                  consola.success(
                    "Set description of Entity",
                    entity.name,
                    "to",
                    description
                  );
                  resolve(entity);
                }
              );
          }
        );
    });
  };

  /**
   * Retrieve all Entities
   * @return {Promise<EntityModel[]>}
   */
  static getAll = (): Promise<EntityModel[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            throw error;
          }

          consola.success("Retrieved all Entities");
          resolve(result as EntityModel[]);
        });
    });
  };

  /**
   * Get a single Entity
   * @return {Promise<EntityModel>}
   */
  static getOne = (id: string): Promise<EntityModel> => {
    consola.info("Retrieving Entity (id):", id.toString());
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          consola.success("Retrieved Entity (id):", id.toString());
          resolve(result as EntityModel);
        });
    });
  };

  static delete = (id: string): Promise<EntityModel> => {
    consola.info("Deleting Entity (id):", id.toString());
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }
          // Store the Entity data
          const entity: EntityModel = result;

          const operations: Promise<any>[] = [];

          // Remove the Entity from all Collections
          entity.collections.map((collection) => {
            operations.push(Collections.removeEntity(collection, entity._id));
          });

          // Remove the Entity as a Product of the listed Origins
          entity.associations.origins.map((origin) => {
            operations.push(
              Entities.removeProduct(origin, {
                id: entity._id,
                name: entity.name,
              })
            );
          });

          // Remove the Entity as a Origin of the listed Products
          entity.associations.products.map((product) => {
            operations.push(
              Entities.removeOrigin(product, {
                id: entity._id,
                name: entity.name,
              })
            );
          });

          // Add Update operation
          operations.push(
            Updates.create({
              timestamp: new Date(Date.now()),
              type: "delete",
              details: "Deleted Entity",
              target: {
                type: "entities",
                id: entity._id,
                name: entity.name,
              },
            })
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            // Delete the Entity
            getDatabase()
              .collection(ENTITIES_COLLECTION)
              .deleteOne(
                { _id: id },
                (error: any, _content: any) => {
                  if (error) {
                    throw error;
                  }

                  consola.success("Deleted Entity (id):", id.toString());
                  resolve(entity);
                }
              );
          });
        });
    });
  };
}
