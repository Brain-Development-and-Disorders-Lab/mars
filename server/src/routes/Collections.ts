// Libraries
import express from "express";
import consola from "consola";
import { ObjectId } from "mongodb";
import _ from "underscore";

// Database connection
import { getDatabase } from "../database/connection";
import { CollectionModel, CollectionStruct, EntityModel } from "../../../client/types";

const CollectionsRoute = express.Router();

// Constants
const ENTITIES_COLLECTION = "entities";
const COLLECTIONS_COLLECTION = "collections";

// Route: View all Collections
CollectionsRoute.route("/collections").get((request: any, response: any) => {
  let connection = getDatabase();
  connection
    .collection(COLLECTIONS_COLLECTION)
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
      .collection(COLLECTIONS_COLLECTION)
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
      .collection(COLLECTIONS_COLLECTION)
      .insertOne(data, (error: any, content: any) => {
        if (error) throw error;
        response.json(content);
      });

    // Retrieve the ID of the inserted Entity
    const insertedId = (data as CollectionStruct & { _id: string })._id;

    consola.debug("Create new Collection:", "/collections/create", '"' + data.name + '"');

    // We need to apply the collections that have been specified
    if (data.entities.length > 0) {
      consola.info("Additional Entities specified, applying...");
      data.entities.map((entity) => {
        consola.debug("Linking Collection with Entity:", entity);
        const entityQuery = { _id: new ObjectId(entity) };
        let entityResult: EntityModel;

        database
          .collection(ENTITIES_COLLECTION)
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
              .collection(ENTITIES_COLLECTION)
              .updateOne(
                entityQuery,
                updatedValues,
                (error: any, response: any) => {
                  if (error) throw error;
                  consola.success("Added Collection to Entity:", entityResult.name);
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
CollectionsRoute.route("/collections/add").post((request: { body: { entity: string, collection: string } }, response: any) => {
  add({
    entityId: request.body.entity,
    collectionId: request.body.collection,
  }, response);
});

/**
 * Route: Remove an Entity from a Collection, expects Entity and Collection ID data.
 */
CollectionsRoute.route("/collections/remove").post((request: { body: { entity: string, collection: string } }, response: any) => {
  remove({
    entityId: request.body.entity,
    collectionId: request.body.collection,
  }, response);
});

/**
 * Add an Entity to a Collection
 * @param data ID of Entity and ID of Collection
 * @param response Object to return to the client
 */
export const add = (data: { entityId: string, collectionId: string }, response: any) => {
  consola.info("Adding Entity to Collection:", "/collections/add", "Entity:", '"' + data.entityId + '"', "Collection:", '"' + data.collectionId + '"');

  // Get the Collection
  const database = getDatabase();
  const collectionQuery = { _id: new ObjectId(data.collectionId) };
  let collectionResult: CollectionModel;

  database
    .collection(COLLECTIONS_COLLECTION)
    .findOne(collectionQuery, (error: any, result: any) => {
      if (error) throw error;
      collectionResult = result;

      // Check if the Entity exists in the Collection already
      let entityExists = false;
      for (let collectionEntity of collectionResult.entities) {
        if (_.isEqual((new ObjectId(collectionEntity)).toString(), data.entityId)) {
          consola.warn("Collection", collectionResult.name, "already contains Entity", data.entityId);
          entityExists = true;
        }
      }

      if (!entityExists) {
        // Add the Entity to the collection
        const updatedValues = {
          $set: {
            entities: [
              ...collectionResult.entities,
              new ObjectId(data.entityId),
            ],
          },
        };

        database
          .collection(COLLECTIONS_COLLECTION)
          .updateOne(
            collectionQuery,
            updatedValues,
            (error: any, response: any) => {
              if (error) throw error;
              consola.success("Added Entity to Collection:", "/collections/add", "Entity:", '"' + data.entityId + '"', "Collection:", '"' + data.collectionId + '"');
            }
          );
      }
    });

  // Get the Entity
  const entityQuery = { _id: new ObjectId(data.entityId) };
  let entityResult: EntityModel;

  database
    .collection(ENTITIES_COLLECTION)
    .findOne(entityQuery, (error: any, result: any) => {
      if (error) throw error;
      entityResult = result;

      // Check if the Entity exists in the Collection already
      let entityExists = false;
      for (let collection of entityResult.collections) {
        if (_.isEqual((new ObjectId(collection.id)).toString(), data.collectionId)) {
          consola.warn("Entity", entityResult.name, "already is present in Collection", data.collectionId);
          entityExists = true;
        }
      }

      if (!entityExists) {
        // Add the Entity to the collection
        const updatedValues = {
          $set: {
            collections: [
              ...entityResult.collections,
              {
                name: collectionResult.name,
                id: new ObjectId(data.collectionId),
              }
            ],
          },
        };

        database
          .collection(ENTITIES_COLLECTION)
          .updateOne(
            entityQuery,
            updatedValues,
            (error: any, response: any) => {
              if (error) throw error;
              consola.success("Added Collection to Entity:", "/collections/add", "Entity:", '"' + data.entityId + '"', "Collection:", '"' + data.collectionId + '"');
            }
          );
      }
    });

  // Respond
  response.json({
    id: data.collectionId,
    status: "success"
  });
};

/**
 * Remove an Entity from a Collection
 * @param data ID of Entity and ID of Collection
 * @param response Object to return to the client
 */
export const remove = (data: { entityId: string, collectionId: string }, response: any) => {
  consola.info("Removing Entity from Collection:", "/collections/remove", "Entity:", '"' + data.entityId + '"', "Collection:", '"' + data.collectionId + '"');

  // Get the Collection
  const database = getDatabase();
  const collectionQuery = { _id: new ObjectId(data.collectionId) };
  let collectionResult: CollectionModel;

  database
    .collection(COLLECTIONS_COLLECTION)
    .findOne(collectionQuery, (error: any, result: any) => {
      if (error) throw error;
      collectionResult = result;

      // Check if the Entity exists in the Collection already
      let entityExists = false;
      for (let collectionEntity of collectionResult.entities) {
        if (_.isEqual((new ObjectId(collectionEntity)).toString(), data.entityId)) {
          entityExists = true;
        }
      }

      if (entityExists) {
        const reducedEntityCollection = collectionResult.entities.filter((entity) => {
          return !_.isEqual((new ObjectId(entity)).toString(), data.entityId)
        });

        // Add the Entity to the collection
        const updatedValues = {
          $set: {
            associations: {
              entities: [
                ...reducedEntityCollection,
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
              consola.success("Removed Entity from Collection:", "/collections/remove", "Entity:", '"' + data.entityId + '"', "Collection:", '"' + data.collectionId + '"');
            }
          );
      } else {
        consola.warn("Collection", collectionResult.name, "does not contain Entity", data.entityId);
      }
    });
  
  // Get the Entity
  const entityQuery = { _id: new ObjectId(data.entityId) };
  let entityResult: EntityModel;

  database
    .collection(ENTITIES_COLLECTION)
    .findOne(entityQuery, (error: any, result: any) => {
      if (error) throw error;
      entityResult = result;

      // Check if the Entity exists in the Collection already
      let entityExists = false;
      for (let collections of entityResult.collections) {
        if (_.isEqual((new ObjectId(collections.id)).toString(), data.collectionId)) {
          entityExists = true;
        }
      }

      if (entityExists) {
        const reducedEntityCollection = entityResult.collections.filter((collection) => {
          return !_.isEqual((new ObjectId(collection.id)).toString(), data.collectionId)
        });

        // Add the Entity to the collection
        const updatedValues = {
          $set: {
            collections: [
              ...reducedEntityCollection,
            ],
          },
        };

        database
          .collection(ENTITIES_COLLECTION)
          .updateOne(
            entityQuery,
            updatedValues,
            (error: any, response: any) => {
              if (error) throw error;
              consola.success("Removed Collection from Entity:", "/collections/remove", "Entity:", '"' + data.entityId + '"', "Collection:", '"' + data.collectionId + '"');
            }
          );
      } else {
        consola.warn("Entity", data.entityId, "is not present in Collection", collectionResult.name);
      }
    });

  // Respond
  response.json({
    id: data.collectionId,
    status: "success"
  });
};

// Route: Remove a Collection
CollectionsRoute.route("/:id").delete(
  (
    request: { params: { id: any } },
    response: { json: (content: any) => void }
  ) => {
    let connection = getDatabase();
    let query = { _id: new ObjectId(request.params.id) };
    connection
      .collection(COLLECTIONS_COLLECTION)
      .deleteOne(query, (error: any, content: any) => {
        if (error) throw error;
        consola.success("1 collection deleted");
        response.json(content);
      });
  }
);

export default CollectionsRoute;
