// MongoDB
import { ObjectId } from "mongodb";

// Utility functions
import { getDatabase } from "../database/connection";
import { Entities } from "./Entities";

// Custom types
import { CollectionModel, CollectionStruct } from "@types";

// Utility libraries
import consola from "consola";
import _ from "underscore";

const COLLECTIONS = "collections";

export class Collections {
  /**
   * Create a new Collection
   * @param {any} collection all data associated with the new Collection
   * @return {Promise<CollectionModel>}
   */
    static create = (collection: any): Promise<CollectionModel> => {
      return new Promise((resolve, _reject) => {
        getDatabase()
          .collection(COLLECTIONS)
          .insertOne(collection, (error: any, result: any) => {
            if (error) {
              throw error;
            }

            // Add any Entities to the Collection
            for (const entity of (collection as CollectionStruct).entities) {
              Collections.addEntity(result.insertedId, entity);
            }

            resolve(result as CollectionModel);
          });
      });
    };

  static update = (updatedCollection: CollectionModel): Promise<CollectionModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: new ObjectId(updatedCollection._id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Cast and store current state of the Collection
          const currentCollection = result as CollectionModel;

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

          const updates = {
            $set: {
              entities: [...entitiesToKeep, ...entitiesToAdd],
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
              entities: (result as CollectionModel).entities.filter(content => !_.isEqual(content, entity.toString())),
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

  static getAll = (): Promise<CollectionModel[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            throw error;
          }
          resolve(result as CollectionModel[]);
        });
    });
  };

  /**
   * Get a single Collection
   * @return {Promise<CollectionModel>}
   */
  static getOne = (id: string): Promise<CollectionModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: new ObjectId(id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          };
          resolve(result as CollectionModel);
        });
    });
  };

  static delete = (id: string): Promise<CollectionModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(COLLECTIONS)
        .findOne({ _id: new ObjectId(id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Remove the Entities from the Collection
          Promise.all((result as CollectionModel).entities.map((entity) => {
            Entities.removeCollection(entity, (result as CollectionModel)._id);
          })).then((_result) => {
            // Remove the Entity as a product of the listed Origin
          }).then((_result) => {
            // Delete the Entity
            getDatabase()
              .collection(COLLECTIONS)
              .deleteOne({ _id: new ObjectId(id) }, (error: any, _content: any) => {
                if (error) {
                  throw error;
                }

                resolve(result);
            });
        });
      });
    });
  };
};



