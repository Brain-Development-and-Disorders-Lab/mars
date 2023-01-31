// MongoDB
import { ObjectId } from "mongodb";

// Utility libraries
import consola from "consola";
import _ from "underscore";

// Utility functions
import { getDatabase } from "../database/connection";

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
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .insertOne(entity, (error: any, content: any) => {
          if (error) {
            throw error;
          }
          // Add the ID to the Entity
          entity["_id"] = content.insertedId;
        });

        if (entity.associations.origin.id) {
          // If this Entity has an origin, add this Entity as a product of that origin Entity
          Entities.addProduct(entity.associations.origin, {
            name: entity.name,
            id: entity._id,
          });
        } else if (entity.associations.products.length > 0) {
          // If this Entity has products, set this Entity as the origin of each product Entity-
          entity.associations.products.forEach((product: { name: string, id: string }) => {
            Entities.setOrigin(product, {
              name: entity.name,
              id: entity._id,
            });
          });
        }
        if (entity.collections.length > 0) {
          // If this Entity has been added to Collections, add the Entity to each Collection
          entity.collections.map((collection: string) => {
            Collections.addEntity(collection, entity._id);
          });
        }

        // Finally, resolve the Promise
        resolve(entity);
    });
  };

  /**
   * Update an Entity, comparing a new version with the existing version
   * @param {EntityModel} updatedEntity updated Entity
   * @return {Promise<EntityModel>}
   */
  static update = (updatedEntity: EntityModel): Promise<EntityModel> => {
    // Get current state of the Entity
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(updatedEntity._id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }
          // Cast and store current state of the Entity
          const currentEntity = result as EntityModel;

          // Collections
          const collectionsToKeep = currentEntity.collections.filter(collection => updatedEntity.collections.includes(collection));
          const collectionsToAdd = updatedEntity.collections.filter(collection => !collectionsToKeep.includes(collection));
          collectionsToAdd.map((collection: string) => {
            Collections.addEntity(collection, updatedEntity._id);
          });
          const collectionsToRemove = currentEntity.collections.filter(collection => !collectionsToKeep.includes(collection));
          collectionsToRemove.map((collection: string) => {
            Collections.removeEntity(collection, updatedEntity._id);
          });

          // Products
          const productsToKeep = currentEntity.associations.products.map(product => product.id).filter(product => updatedEntity.associations.products.map(product => product.id).includes(product));
          const productsToAdd = updatedEntity.associations.products.filter(product => !productsToKeep.includes(product.id));
          productsToAdd.map((product: {id: string, name: string}) => {
            Entities.addProduct({ name: updatedEntity.name, id: updatedEntity._id }, product);
          });
          const productsToRemove = currentEntity.associations.products.filter(product => !productsToKeep.includes(product.id));
          productsToRemove.map((product: {id: string, name: string}) => {
            Entities.removeProduct({ name: updatedEntity.name, id: updatedEntity._id }, product);
          });

          const updates = {
            $set: {
              description: updatedEntity.description,
              collections: [...collectionsToKeep, ...collectionsToAdd],
              associations: {
                origin: updatedEntity.associations.origin,
                products: [...currentEntity.associations.products.filter(product => productsToKeep.includes(product.id)), ...productsToAdd],
              },
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne({ _id: new ObjectId(updatedEntity._id) }, updates, (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                resolve(updatedEntity);
              }
            );
        });
    });
  };

  /**
   * Add another Entity to a collection of "product" associations
   * @param {{ name: string, id: string }} entity the Entity of interest
   * @param {{ name: string, id: string }} product an Entity to add as a "product" association
   * @return {Promise<{ name: string, id: string }>}
   */
  static addProduct = (entity: { name: string, id: string }, product: { name: string, id: string }): Promise<{ name: string, id: string }> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(entity.id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Products associated with the Entity to include this extra product
          // We aren't updating the Origin of the Product
          const updates = {
            $set: {
              associations: {
                origin:  result.associations.origin,
                products: [
                  ...result.associations.products,
                  product,
                ],
              },
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne({ _id: new ObjectId(entity.id) }, updates, (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                resolve(entity);
              }
            );
        });
    });
  };

  static removeProduct = (entity: { name: string, id: string }, product: { name: string, id: string }): Promise<{ name: string, id: string }> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(entity.id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Products associated with the Entity to remove this Product
          const updates = {
            $set: {
              associations: {
                origin:  (result as EntityModel).associations.origin,
                products: (result as EntityModel).associations.products.filter(content => !_.isEqual(product.id, content.id)),
              },
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne({ _id: new ObjectId(entity.id) }, updates, (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                resolve(entity);
              }
            );
        });
    });
  };

  static addCollection = (entity: string, collection: string): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(entity) }, (error: any, result: any) => {
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
            .updateOne({ _id: new ObjectId(entity) }, updates, (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                resolve(entity);
              }
            );
        });
    });
  };

  static removeCollection = (entity: string, collection: string): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(entity) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Collections associated with the Entity to remove this Collection
          const updates = {
            $set: {
              collections: [...(result as EntityModel).collections.filter(content => !_.isEqual(new ObjectId(content), new ObjectId(collection)))],
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne({ _id: new ObjectId(entity) }, updates, (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
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
  static setOrigin = (entity: { name: string, id: string }, origin: { name: string, id: string }): Promise<{ name: string, id: string }> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(entity.id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the Origin of this Entity
          const updates = {
            $set: {
              associations: {
                origin: {
                  name: origin.name,
                  id: origin.id,
                },
                products: result.associations.products,
              },
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne({ _id: new ObjectId(entity.id) }, updates, (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                resolve(entity);
              }
            );
        });
    });
  };

  /**
   * Update the description of an Entity
   * @param entity the Entity of interest
   * @param description an updated description
   * @return {Promise<{ name: string, id: string }>}
   */
  static setDescription = (entity: { name: string, id: string }, description: string): Promise<{ name: string, id: string }> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(entity.id) }, (error: any, result: any) => {
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
            .updateOne({ _id: new ObjectId(entity.id) }, updates, (error: any, response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                resolve(entity);
              }
            );
        });
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
          resolve(result as EntityModel[]);
        });
    });
  };

  /**
   * Get a single Entity
   * @return {Promise<EntityModel>}
   */
  static getOne = (id: string): Promise<EntityModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          };
          resolve(result as EntityModel);
        });
    });
  };

  static delete = (id: string): Promise<EntityModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Remove the Entity from all Collections
          Promise.all((result as EntityModel).collections.map((collection) => {
            Collections.removeEntity(collection, (result as EntityModel)._id);
          })).then((_result) => {
            // Remove the Entity as a product of the listed Origin
          }).then((_result) => {
            // Delete the Entity
            getDatabase()
              .collection(ENTITIES_COLLECTION)
              .deleteOne({ _id: new ObjectId(id) }, (error: any, _content: any) => {
                if (error) {
                  throw error;
                }

                resolve(result);
            });
        });
      });
    });
  };
};
