// Libraries
import express from "express";
import consola from "consola";
import { ObjectId } from "mongodb";

// Import types from the client to enforce structure
import { CollectionModel, EntityModel, EntityStruct } from "../../../client/types";

// Utility functions
import { getDatabase } from "../database/connection";

const EntitiesRoute = express.Router();

// Constants
const ENTITIES_COLLECTION = "entities";
const COLLECTIONS_COLLECTION = "collections";

// Route: View all Entities
EntitiesRoute.route("/entities").get((request: any, response: any) => {
  const database = getDatabase();

  consola.debug("View all Entities:", "/entities");

  database
    .collection(ENTITIES_COLLECTION)
    .find({})
    .toArray((error: any, result: any) => {
      if (error) throw error;
      response.json(result);
    });
});

// Route: View specific Entity
EntitiesRoute.route("/entities/:id").get((request: any, response: any) => {
  const database = getDatabase();
  const query = { _id: new ObjectId(request.params.id) };

  consola.debug("View Entity:", "/entities/" + request.params.id);

  database
    .collection(ENTITIES_COLLECTION)
    .findOne(query, (error: any, result: any) => {
      if (error) throw error;
      response.json(result);
    });
});

// Route: Create a new Entity, expects EntityStruct data
EntitiesRoute
  .route("/entities/add")
  .post((request: { body: EntityStruct }, response: any) => {
    const database = getDatabase();
    let data = {
      name: request.body.name,
      created: request.body.created,
      owner: request.body.owner,
      collection: request.body.collection,
      description: request.body.description,
      collections: request.body.collections,
      associations: {
        origin: request.body.associations.origin,
        products: request.body.associations.products,
      },
      attributes: request.body.attributes,
    };

    // Insert the new Entity
    database
      .collection(ENTITIES_COLLECTION)
      .insertOne(data, (error: any, content: any) => {
        if (error) throw error;
        response.json(content);
      });

    // Retrieve the ID of the inserted Entity
    const insertedId = (data as EntityStruct & { _id: string })._id;

    consola.debug("Create new Entity:", "/entities/add", "\"" + data.name + "\"");

    // We need to apply the associations that have been specified
    if (data.associations.origin.id !== "") {
      // Get the origin record's products list
      const originQuery = { _id: new ObjectId(data.associations.origin.id) };

      database
        .collection(ENTITIES_COLLECTION)
        .findOne(originQuery, (error: any, result: any) => {
          if (error) throw error;

          // Update product record of the origin to include this Entity as a product
          // Create an updated set of values
          const updatedValues = {
            $set: {
              associations: {
                origin: {
                  name: result.associations.origin.name,
                  id: result.associations.origin.id,
                },
                products: [
                  ...result.associations.products,
                  {
                    name: data.name,
                    id: insertedId,
                  },
                ],
              },
            },
          };

          // Apply the updated structure to the target Entity
          database
            .collection(ENTITIES_COLLECTION)
            .updateOne(originQuery, updatedValues, (error: any, response: any) => {
              if (error) throw error;
            });
        });
    } else if (data.associations.products.length > 0) {
      // Iterate over each product, setting their origin to the current Entity being added
      data.associations.products.forEach((product) => {
        const productQuery = { _id: new ObjectId(product.id) };
        let productEntity: EntityModel;

        database
          .collection(ENTITIES_COLLECTION)
          .findOne(productQuery, (error: any, result: any) => {
            if (error) throw error;
            productEntity = result;

            // Update origin record of the product to include this Entity as a origin
            const updatedValues = {
              $set: {
                associations: {
                  origin: {
                    name: data.name,
                    id: insertedId,
                  },
                  products: productEntity.associations.products,
                },
              },
            };
  
            database
              .collection(ENTITIES_COLLECTION)
              .updateOne(productQuery, updatedValues, (error: any, response: any) => {
                if (error) throw error;
              });
          });
      });
    }

    // We need to apply the collections that have been specified
    if (data.collection.name !== "") {
      consola.info("Collection specified, applying...");
      const collectionQuery = { _id: new ObjectId(data.collection.id) };
      let collection: CollectionModel;

      database
        .collection(COLLECTIONS_COLLECTION)
        .findOne(collectionQuery, (error: any, result: any) => {
          if (error) throw error;
          collection = result;

          // Update the collection to include the Entity as an association
          const updatedValues = {
            $set: {
              associations: {
                entities: [
                  ...collection.associations.entities,
                  insertedId,
                ]
              },
            },
          };

          database
            .collection(COLLECTIONS_COLLECTION)
            .updateOne(collectionQuery, updatedValues, (error: any, response: any) => {
              if (error) throw error;
              consola.success("Added Entity to collection:", data.collection.name);
          });
        });
    }

    if (data.collections.length > 0) {
      consola.info("Additional Collections specified, applying...");
      data.collections.map((collection) => {
        const collectionQuery = { _id: new ObjectId(collection.id) };
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
                    ...collectionResult.associations.entities,
                    insertedId,
                  ]
                },
              },
            };

            database
              .collection(COLLECTIONS_COLLECTION)
              .updateOne(collectionQuery, updatedValues, (error: any, response: any) => {
                if (error) throw error;
                consola.success("Added Entity to collection:", collection.name);
            });
          });
      });
    }
  });

// Route: Remove an Entity
EntitiesRoute
  .route("/:id")
  .delete((request: { params: { id: any } }, response: any) => {
    const database = getDatabase();
    let query = { _id: new ObjectId(request.params.id) };

    consola.debug("Remove an Entity:", "/entities");

    database
      .collection(ENTITIES_COLLECTION)
      .deleteOne(query, (error: any, content: any) => {
        if (error) throw error;
        consola.success("1 Entity deleted");
        response.json(content);
      });
  });

export default EntitiesRoute;