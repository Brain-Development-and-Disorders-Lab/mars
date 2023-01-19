// MongoDB
import { ObjectId } from "mongodb";

// Utility functions
import { getDatabase } from "../connection";
import { registerUpdate } from "./Updates";

// Utility libraries
import consola from "consola";

// Custom types
import { EntityModel, EntityStruct } from "../../../types";
import { Collections } from "./Collections";

// Constants
const ENTITIES_COLLECTION = "entities";


export class Entities {
  /**
   * Retrieve all Entities
   */
  static getAll = (): Promise<EntityStruct[]> => {
    return new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
      const query = { _id: new ObjectId(id) };
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne(query, (error: any, result: any) => {
          if (error) {
            throw error;
          };
          resolve(result as EntityStruct);
        });
    });
  };

  /**
   * Add a new Entity to the collection of Entities
   * @param entity
   * @return {Promise<EntityModel>}
   */
  static addOne = (entity: any): Promise<EntityModel> => {
    return new Promise((resolve, reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .insertOne(entity, (error: any, content: any) => {
          if (error) {
            throw error;
          }

          // Add the ID to the Entity
          entity["_id"] = content.insertedId;
        });

        // We need to apply the associations that have been specified
        if (entity.associations.origin.id) {
          Entities.addProduct(entity.associations.origin.id, {
            name: entity.name,
            id: entity._id,
          });
        } else if (entity.associations.products.length > 0) {
          // Iterate over each product, setting their origin to the current Entity being added
          entity.associations.products.forEach((product: { name: string, id: string }) => {
            Entities.setOrigin(product, {
              name: entity.name,
              id: entity._id,
            });
          });
        }
    
        // We need to apply the collections that have been specified
        if (entity.collections.length > 0) {
          consola.info("Collections specified, adding new Entity to each...");
          entity.collections.map((collection: string) => {
            Collections.addEntity(collection, entity._id);
          });
        }

        resolve(entity);
    });
  };

  /**
   * Add an Entity to a collection of "product" associations
   * @param {string} entity the Entity of interest
   * @param {{ name: string, id: string }} product an Entity to add as a "product" association
   */
  static addProduct = (entity: string, product: { name: string, id: string }) => {
    // Get the origin record's products list
    const originQuery = { _id: new ObjectId(entity) };
    getDatabase()
      .collection(ENTITIES_COLLECTION)
      .findOne(originQuery, (error: any, result: any) => {
        if (error) throw error;

        // Update product record of the origin to include this Entity as a product
        // Create an updated set of values
        const updatedValues = {
          $set: {
            associations: {
              origin: {
                name: result.associations.origin.name,
                id: result.associations.origin.id,
              },
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

        // Apply the updated structure to the target Entity
        getDatabase()
          .collection(ENTITIES_COLLECTION)
          .updateOne(
            originQuery,
            updatedValues,
            (error: any, response: any) => {
              if (error) throw error;
              registerUpdate({
                targets: {
                  primary: {
                    type: "entities",
                    id: entity,
                    name: result.name,
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
            }
          );
      });
  };

  /**
   * Specify an Entity acting as an Origin
   * @param {{ name: string, id: string }} entity the Entity of interest
   * @param {{ name: string, id: string }} origin an Entity to add as an "origin" association
   */
  static setOrigin = (entity: { name: string, id: string }, origin: { name: string, id: string }) => {
    let productEntity: EntityModel;
    const productQuery = { _id: new ObjectId(entity.id) };
    getDatabase()
      .collection(ENTITIES_COLLECTION)
      .findOne(productQuery, (error: any, result: any) => {
        if (error) throw error;
        productEntity = result;

        // Update origin record of the product to include this Entity as a origin
        const updatedValues = {
          $set: {
            associations: {
              origin: {
                name: origin.name,
                id: origin.id,
              },
              products: productEntity.associations.products,
            },
          },
        };

        getDatabase()
          .collection(ENTITIES_COLLECTION)
          .updateOne(
            productQuery,
            updatedValues,
            (error: any, response: any) => {
              if (error) throw error;
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
            }
          );
      });
  };
};
