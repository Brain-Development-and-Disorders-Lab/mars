// MongoDB
import { ObjectId } from "mongodb";

// Utility functions
import { getDatabase } from "../connection";
import { registerUpdate } from "./Updates";

// Custom types
import { EntityModel } from "../../../types";

// Constants
const ENTITIES_COLLECTION = "entities";

/**
 * Add an Entity to a collection of "product" associations
 * @param {string} entity the Entity of interest
 * @param {{ name: string, id: string }} product an Entity to add as a "product" association
 */
export const addProduct = (entity: string, product: { name: string, id: string }) => {
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
export const setOrigin = (entity: { name: string, id: string }, origin: { name: string, id: string }) => {
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
}