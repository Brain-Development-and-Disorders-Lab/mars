// MongoDB
import { ObjectId } from "mongodb";

// Utility functions
import { getDatabase } from "../connection";
import { registerUpdate } from "./Updates";

// Utility libraries
import consola from "consola";

// Custom types
import { EntityModel, EntityStruct } from "@types";
import { Collections } from "./Collections";

// Constants
const ENTITIES_COLLECTION = "entities";

export class Entities {
  /**
   * Insert a new Entity to the collection of Entities
   * @param entity
   * @return {Promise<EntityModel>}
   */
  static insert = (entity: any): Promise<EntityModel> => {
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
   * Retrieve all Entities
   */
  static getAll = (): Promise<EntityStruct[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            throw error;
          }
          resolve(result as EntityStruct[]);
        });
    });
  };

  /**
   * Get a single Entity
   */
  static getOne = (id: string): Promise<EntityStruct> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          };
          resolve(result as EntityStruct);
        });
    });
  };

  /**
   * Add another Entity to a collection of "product" associations
   * @param {{ name: string, id: string }} entity the Entity of interest
   * @param {{ name: string, id: string }} product an Entity to add as a "product" association
   */
  static addProduct = (entity: { name: string, id: string }, product: { name: string, id: string }): Promise<{ name: string, id: string }> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(entity.id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          const updates = {
            $set: {
              associations: {
                origin:  result.associations.origin,
                products: [
                  ...result.associations.products,
                  {
                    name: product.name,
                    id: product.id,
                  },
                ],
              },
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne({ _id: new ObjectId(entity.id) }, updates, (error: any, response: any) => {
                if (error) {
                  throw error;
                }
                registerUpdate({
                  targets: {
                    primary: {
                      type: "entities",
                      id: entity.id,
                      name: entity.name,
                    },
                    secondary: {
                      type: "entities",
                      id: product.id,
                      name: product.name,
                    },
                  },
                  operation: {
                    timestamp: new Date(Date.now()),
                    type: "modify",
                    details: "add Product"
                  }
                });

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
   */
  static setOrigin = (entity: { name: string, id: string }, origin: { name: string, id: string }): Promise<{ name: string, id: string }> => {
    return new Promise((resolve, reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: new ObjectId(entity.id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

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
            .updateOne({ _id: new ObjectId(entity.id) }, updates, (error: any, response: any) => {
                if (error) {
                  throw error;
                }

                registerUpdate({
                  targets: {
                    primary: {
                      type: "entities",
                      id: entity.id,
                      name: "",
                    },
                    secondary: {
                      type: "entities",
                      id: origin.id,
                      name: "",
                    },
                  },
                  operation: {
                    timestamp: new Date(Date.now()),
                    type: "modify",
                    details: "add Origin"
                  }
                });

                // Resolve the Promise
                resolve(entity);
              }
            );
        });
    });

  };


};
