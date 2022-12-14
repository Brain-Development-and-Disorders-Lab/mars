// MongoDB
import { ObjectId } from "mongodb";

// Utility functions
import { getDatabase } from "../connection";
import { registerUpdate } from "./Updates";

// Custom types
import { CollectionModel } from "../../../types";

// Consola
import consola from "consola";

const COLLECTIONS_COLLECTION = "collections";

export const addEntity = (collection: string, entity: string) => {
  const collectionQuery = { _id: new ObjectId(collection) };
  let collectionResult: CollectionModel;

  getDatabase()
    .collection(COLLECTIONS_COLLECTION)
    .findOne(collectionQuery, (error: any, result: any) => {
      if (error) throw error;
      collectionResult = result;

      // Update the collection to include the Entity as an association
      const updatedValues = {
        $set: {
          entities: [
            ...collectionResult.entities,
            entity,
          ],
        },
      };

      getDatabase()
        .collection(COLLECTIONS_COLLECTION)
        .updateOne(
          collectionQuery,
          updatedValues,
          (error: any, response: any) => {
            if (error) throw error;
            consola.success("Added Entity to collection:", collection);
            registerUpdate({
              targets: {
                primary: {
                  id: collection,
                  type: "collections",
                },
                secondary: {
                  id: entity,
                  type: "entities",
                },
              },
              operation: {
                timestamp: new Date(Date.now()),
                type: "add",
                details: "add Entity"
              }
            });
          }
        );
    });

};

const removeEntity = (entity: string) => {

};