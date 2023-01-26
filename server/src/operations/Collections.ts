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

const COLLECTIONS = "collections";

export class Collections {
  static addEntity = (collection: string, entity: string): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
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
            .collection(COLLECTIONS)
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
        .collection(COLLECTIONS)
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
            .collection(COLLECTIONS)
            .updateOne({ _id: new ObjectId(collection) }, updatedValues, (error: any, _response: any) => {
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

  static modify = (updatedCollection: CollectionModel): Promise<CollectionModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: new ObjectId(updatedCollection._id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }
          // Cast and store current state of the Entity
          const currentCollection = result as CollectionModel;

          // Create set of variables to store current or updated state values
          let updatedEntities = currentCollection.entities;

          // Collections
          const entitiesToKeep = currentCollection.entities.filter(entity => updatedCollection.entities.includes(entity));

          const entitiesToAdd = updatedCollection.entities.filter(entity => !currentCollection.entities.includes(entity));
          entitiesToAdd.map((entity: string) => {
            Collections.addEntity(currentCollection._id, entity);
          });

          const entitiesToRemove = currentCollection.entities.filter(entity => !entitiesToKeep.includes(entity));
          entitiesToRemove.map((entity: string) => {
            Collections.removeEntity(currentCollection._id, entity);
          });

          updatedEntities = [...entitiesToKeep, ...entitiesToAdd];

          const updates = {
            $set: {
              entities: updatedEntities,
            },
          };

          getDatabase()
            .collection(COLLECTIONS)
            .updateOne({ _id: new ObjectId(updatedCollection._id) }, updates, (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                registerUpdate({
                  targets: {
                    primary: {
                      type: "collections",
                      id: updatedCollection._id,
                      name: updatedCollection.name,
                    },
                  },
                  operation: {
                    timestamp: new Date(Date.now()),
                    type: "modify",
                    details: "modify Collection"
                  }
                });

                // Resolve the Promise
                resolve(updatedCollection);
              }
            );
        });
    });
  };
};



