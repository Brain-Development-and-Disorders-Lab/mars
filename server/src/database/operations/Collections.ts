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

export class Collections {
  static addEntity = (collection: string, entity: string) => {
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
                    type: "collections",
                    id: collection,
                    name: collectionResult.name,
                  },
                },
                operation: {
                  timestamp: new Date(Date.now()),
                  type: "modify",
                  details: "add Entity"
                }
              });
            }
          );
      });
  
  };

  static removeEntity = (entity: string) => {};
};



