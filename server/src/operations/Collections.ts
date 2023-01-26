// MongoDB
import { ObjectId } from "mongodb";

// Utility functions
import { getDatabase } from "../database/connection";
import { Entities } from "./Entities";

// Custom types
import { CollectionModel } from "@types";

// Utility libraries
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

          // Cast and store current state of the Collection
          const currentCollection = result as CollectionModel;

          // Create set of variables to store current or updated state values
          let updatedEntities = currentCollection.entities;

          // Collections
          const entitiesToKeep = currentCollection.entities.filter(entity => updatedCollection.entities.includes(entity));

          const entitiesToAdd = updatedCollection.entities.filter(entity => !currentCollection.entities.includes(entity));
          entitiesToAdd.map((entity: string) => {
            Entities.addCollection(entity, currentCollection._id);
          });

          const entitiesToRemove = currentCollection.entities.filter(entity => !entitiesToKeep.includes(entity));
          entitiesToRemove.map((entity: string) => {
            Entities.removeCollection(entity, currentCollection._id);
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

                // Resolve the Promise
                resolve(updatedCollection);
              }
            );
        });
    });
  };
};



