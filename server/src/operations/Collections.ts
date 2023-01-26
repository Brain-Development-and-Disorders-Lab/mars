// MongoDB
import { ObjectId } from "mongodb";

// Utility functions
import { getDatabase } from "../database/connection";
import { registerUpdate } from "./Updates";

// Custom types
import { CollectionModel } from "@types";

// Consola
import consola from "consola";
import _ from "underscore";

const COLLECTIONS_COLLECTION = "collections";

export class Collections {
  static addEntity = (collection: string, entity: string): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS_COLLECTION)
        .findOne({ _id: new ObjectId(collection) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection to include the Entity
          const updatedValues = {
            $set: {
              entities: [
                ...result.entities,
                entity,
              ],
            },
          };
    
          getDatabase()
            .collection(COLLECTIONS_COLLECTION)
            .updateOne({ _id: new ObjectId(collection) }, updatedValues, (error: any, response: any) => {
              if (error) {
                throw error;
              }

              registerUpdate({
                targets: {
                  primary: {
                    type: "collections",
                    id: collection,
                    name: result.name,
                  },
                },
                operation: {
                  timestamp: new Date(Date.now()),
                  type: "modify",
                  details: "add Entity"
                }
              });

              // Resolve the Promise
              resolve(collection);
            });
        });
    });
  };

  static removeEntity = (collection: string, entity: string): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS_COLLECTION)
        .findOne({ _id: new ObjectId(collection) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection to remove the Entity
          const updatedValues = {
            $set: {
              entities: (result as CollectionModel).entities.filter(content => !_.isEqual(entity, content)),
            },
          };
    
          getDatabase()
            .collection(COLLECTIONS_COLLECTION)
            .updateOne({ _id: new ObjectId(collection) }, updatedValues, (error: any, response: any) => {
              if (error) {
                throw error;
              }

              registerUpdate({
                targets: {
                  primary: {
                    type: "collections",
                    id: collection,
                    name: (result as CollectionModel).name,
                  },
                },
                operation: {
                  timestamp: new Date(Date.now()),
                  type: "modify",
                  details: "remove Entity"
                }
              });

              // Resolve the Promise
              resolve(collection);
            });
        });
    });
  };
};



