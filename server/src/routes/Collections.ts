// Libraries
import express from "express";
import consola from "consola";
import { ObjectId } from "mongodb";
import _ from "underscore";

// Database connection
import { getDatabase } from "../database/connection";
import { CollectionModel, CollectionStruct, EntityModel } from "@types";

// Operations
import { registerUpdate } from "../operations/Updates";
import { Collections } from "../operations/Collections";

const CollectionsRoute = express.Router();

// Constants
const ENTITIES = "entities";
const COLLECTIONS = "collections";

// Route: View all Collections
CollectionsRoute.route("/collections").get((request: any, response: any) => {
  let connection = getDatabase();
  connection
    .collection(COLLECTIONS)
    .find({})
    .toArray((error: any, result: any) => {
      if (error) throw error;
      response.json(result);
    });
});

// Route: View a specific Collection
CollectionsRoute.route("/collections/:id").get(
  (request: any, response: any) => {
    const database = getDatabase();
    const query = { _id: new ObjectId(request.params.id) };

    database
      .collection(COLLECTIONS)
      .findOne(query, (error: any, result: any) => {
        if (error) throw error;
        response.json(result);
      });
  }
);

// Route: Create a new Collection, expects CollectionStruct data
CollectionsRoute.route("/collections/create").post(
  (request: { body: CollectionStruct }, response: any) => {
    const database = getDatabase();
    let data = {
      name: request.body.name,
      created: request.body.created,
      owner: request.body.owner,
      description: request.body.description,
      entities: request.body.entities,
    };

    // Insert the new Collection
    database
      .collection(COLLECTIONS)
      .insertOne(data, (error: any, content: any) => {
        if (error) throw error;
        response.json(content);
      });

    // Retrieve the ID of the inserted Entity
    const insertedId = (data as CollectionStruct & { _id: string })._id;

    consola.debug("Create new Collection:", "/collections/create", '"' + data.name + '"');
    registerUpdate({
      targets: {
        primary: {
          type: "collections",
          id: insertedId,
          name: data.name,
        },
      },
      operation: {
        timestamp: new Date(Date.now()),
        type: "add",
      }
    });

    // We need to apply the collections that have been specified
    if (data.entities.length > 0) {
      consola.info("Additional Entities specified, applying...");
      data.entities.map((entity) => {
        consola.debug("Linking Collection with Entity:", entity);
        const entityQuery = { _id: new ObjectId(entity) };
        let entityResult: EntityModel;

        database
          .collection(ENTITIES)
          .findOne(entityQuery, (error: any, result: any) => {
            if (error) throw error;
            entityResult = result;

            // Update the collection to include the Entity as an association
            const updatedValues = {
              $set: {
                collections: [
                  ...entityResult.collections,
                  {
                    name: data.name,
                    id: insertedId,
                  },
                ],
              },
            };

            database
              .collection(ENTITIES)
              .updateOne(
                entityQuery,
                updatedValues,
                (error: any, response: any) => {
                  if (error) throw error;
                  consola.success("Added Collection to Entity:", entityResult.name);
                  registerUpdate({
                    targets: {
                      primary: {
                        type: "collections",
                        id: insertedId,
                        name: data.name,
                      },
                      secondary: {
                        type: "entities",
                        id: entity,
                        name: result.name,
                      },
                    },
                    operation: {
                      timestamp: new Date(Date.now()),
                      type: "modify",
                    }
                  });
                }
              );
          });
      });
    }
  }
);

/**
 * Route: Add an Entity to a Collection, expects Entity and Collection ID data.
 */
CollectionsRoute.route("/collections/add").post((request: { body: { entities: string[], collection: string } }, response: any) => {
  // Add all Entities to Collection
  add({
    entityId: request.body.entities,
    collectionId: request.body.collection,
  }, response);
});

// Route: Update a Collection
CollectionsRoute.route("/collections/update").post((request: { body: CollectionModel }, response: any) => {
  Collections.modify(request.body).then((updatedCollection: CollectionModel) => {
    // Respond
    response.json({
      id: updatedCollection._id,
      name: updatedCollection.name,
      status: "success"
    });
  });
});

/**
 * Route: Remove an Entity from a Collection, expects Entity and Collection ID data.
 */
CollectionsRoute.route("/collections/remove").post((request: { body: { entity: string, collection: string } }, response: any) => {
  Collections.removeEntity(request.body.collection, request.body.entity).then((collection) => {
    response.json({
      id: collection,
      name: collection,
      status: "success",
    });
  });
});

/**
 * Add an Entity to a Collection
 * @param data ID of Entity and ID of Collection
 * @param response Object to return to the client
 */
export const add = (data: { entityId: string[], collectionId: string }, response: any) => {
  let status = "success";
  const database = getDatabase();
  const collectionQuery = { _id: new ObjectId(data.collectionId) };
  let collectionResult: CollectionModel;

  consola.info("Adding Entity to Collection:", "/collections/add", "Entity:", '"' + data.entityId + '"', "Collection:", '"' + data.collectionId + '"');

  for (let entity of data.entityId) {
    // Add Entity to Collection
    database
      .collection(COLLECTIONS)
      .findOne(collectionQuery, (error: any, result: any) => {
        if (error) throw error;
        collectionResult = result;

        // Check if an Entity exists in the Collection already
        let entityExists = false;
        for (let collectionEntity of collectionResult.entities) {
          if (_.isEqual((new ObjectId(collectionEntity)).toString(), entity)) {
            consola.warn("Collection", collectionResult.name, "already contains Entity", entity);
            status = "existed";
            entityExists = true;
          }
        }

        if (!entityExists) {
          // Add the Entity to the collection
          const updatedValues = {
            $set: {
              entities: [
                // Existing Entities
                ...collectionResult.entities,
                // New Entity
                (new ObjectId(entity)),
              ],
            },
          };

          database
            .collection(COLLECTIONS)
            .updateOne(
              collectionQuery,
              updatedValues,
              (error: any, response: any) => {
                if (error) {
                  throw error;
                }

                registerUpdate({
                  targets: {
                    primary: {
                      type: "collections",
                      id: data.collectionId,
                      name: result.name,
                    },
                  },
                  operation: {
                    timestamp: new Date(Date.now()),
                    type: "modify",
                  }
                });
              }
            );
        }
      });

    // Add Collection to list of Collections on Entity
    const entityQuery = { _id: new ObjectId(entity) };
    let entityResult: EntityModel;

    database
      .collection(ENTITIES)
      .findOne(entityQuery, (error: any, result: any) => {
        if (error) throw error;
        entityResult = result;

        // Check if the Entity exists in the Collection already
        let entityExists = false;
        for (let collection of entityResult.collections) {
          if (_.isEqual((new ObjectId(collection)).toString(), data.collectionId)) {
            consola.warn("Entity", entityResult.name, "is already in Collection", data.collectionId);
            status = "existed";
            entityExists = true;
          }
        }

        if (!entityExists) {
          // Add the Entity to the collection
          const updatedValues = {
            $set: {
              collections: [
                ...entityResult.collections,
                new ObjectId(data.collectionId),
              ],
            },
          };

          database
            .collection(ENTITIES)
            .updateOne(entityQuery, updatedValues, (error: any, response: any) => {
              if (error) {
                throw error;
              }
            });
        }

        // Respond
        response.json({
          id: data.collectionId,
          status: status,
        });
      });
  }
};

// Route: Remove a Collection
CollectionsRoute.route("/collections/:id").delete((request: { params: { id: any } }, response: { json: (content: any) => void }) => {
    getDatabase()
      .collection(COLLECTIONS)
      .deleteOne({ _id: new ObjectId(request.params.id) }, (error: any, content: any) => {
        if (error) {
          throw error;
        }
        response.json(content);
      });
  }

  // To Do: Remove references to Collection.
);

export default CollectionsRoute;
