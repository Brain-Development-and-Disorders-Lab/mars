// MongoDB
import { ObjectId } from "mongodb";

// Utility functions
import { getDatabase } from "../connection";

// Custom types
import { CollectionModel } from "../../../types";

// Consola
import consola from "consola";

const COLLECTIONS_COLLECTION = "collections";

export const addEntity = (collection: string, entity: string) => {
  const database = getDatabase();

  const collectionQuery = { _id: new ObjectId(collection) };
    let collectionResult: CollectionModel;

    database
      .collection(COLLECTIONS_COLLECTION)
      .findOne(collectionQuery, (error: any, result: any) => {
        if (error) throw error;
        collectionResult = result;

        // Update the collection to include the Entity as an association
        const updatedValues = {
          $set: {
            associations: {
              entities: [
                ...collectionResult.entities,
                entity,
              ],
            },
          },
        };

        database
          .collection(COLLECTIONS_COLLECTION)
          .updateOne(
            collectionQuery,
            updatedValues,
            (error: any, response: any) => {
              if (error) throw error;
              consola.success("Added Entity to collection:", collection);
            }
          );
      });
};

const removeEntity = (entity: string) => {

};