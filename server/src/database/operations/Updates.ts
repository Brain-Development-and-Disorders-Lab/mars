// MongoDB
import { ObjectId } from "mongodb";

import consola from "consola";

// Utility functions
import { getDatabase } from "../connection";

// Constants
const UPDATES_COLLECTION = "entities";

/**
 * Add an Entity to a collection of "product" associations
 * @param {string} id the Entity of interest
 * @param {{ type: "modified" | "added" | "removed", info: string }} update an Entity to add as a "product" association
 */
export const registerUpdate = (id: string, update: { type: "modified" | "added" | "removed", info: string }) => {
  consola.info("Update:", id, update.type, update.info);
  // getDatabase()
  //   .collection(UPDATES_COLLECTION)
  //   .findOne(originQuery, (error: any, result: any) => {
  //     if (error) throw error;

  //     // Update product record of the origin to include this Entity as a product
  //     // Create an updated set of values
  //     const updatedValues = {
  //       $set: {
  //         associations: {
  //           origin: {
  //             name: result.associations.origin.name,
  //             id: result.associations.origin.id,
  //           },
  //           products: [
  //             ...result.associations.products,
  //             {
  //               name: product.name,
  //               id: product.id,
  //             },
  //           ],
  //         },
  //       },
  //     };

  //     // Apply the updated structure to the target Entity
  //     getDatabase()
  //       .collection(UPDATES_COLLECTION)
  //       .updateOne(
  //         originQuery,
  //         updatedValues,
  //         (error: any, response: any) => {
  //           if (error) throw error;
  //         }
  //       );
  //   });
};