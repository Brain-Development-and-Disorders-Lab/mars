// Libraries
import express from "express";
import consola from "consola";
import { ObjectId } from "mongodb";

// Database connection
import { getDatabase } from "../database/connection";
import { CollectionStruct, EntityModel } from "../../../client/types";

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
      associations: {
        entities: request.body.associations.entities,
      },
      attributes: request.body.attributes,
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
    if (data.associations.entities.length > 0) {
      consola.info("Additional Entities specified, applying...");
      data.associations.entities.map((entity) => {
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

// Route: Add an Entity to a Collection, expects Entity and Collection ID data.
CollectionsRoute.route("/collections/add").post();

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
