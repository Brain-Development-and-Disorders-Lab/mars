// Libraries
import express from "express";
import consola from "consola";
import { ObjectId } from "mongodb";

// Import types from the client to enforce structure
import { CollectionModel, SampleModel, SampleStruct } from "../../../client/types";

// Utility functions
import { getDatabase } from "../database/connection";

const samplesRoute = express.Router();

// Constants
const SAMPLES_COLLECTION = "samples";
const COLLECTIONS_COLLECTION = "collections";

// Route: View all samples
samplesRoute.route("/samples").get((request: any, response: any) => {
  const database = getDatabase();
  database
    .collection(SAMPLES_COLLECTION)
    .find({})
    .toArray((error: any, result: any) => {
      if (error) throw error;
      response.json(result);
    });
});

// Route: View specific sample
samplesRoute.route("/samples/:id").get((request: any, response: any) => {
  const database = getDatabase();
  const query = { _id: new ObjectId(request.params.id) };

  database
    .collection(SAMPLES_COLLECTION)
    .findOne(query, (error: any, result: any) => {
      if (error) throw error;
      response.json(result);
    });
});

// Route: Create a new sample, expects data
samplesRoute
  .route("/samples/add")
  .post((request: { body: SampleStruct }, response: any) => {
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

    // Insert the new sample
    database
      .collection(SAMPLES_COLLECTION)
      .insertOne(data, (error: any, content: any) => {
        if (error) throw error;
        response.json(content);
      });

    // Retrieve the ID of the inserted sample
    const insertedId = (data as SampleStruct & { _id: string })._id;

    // We need to apply the associations that have been specified
    if (data.associations.origin.name !== "") {
      // Get the origin record's products list
      const originQuery = { _id: new ObjectId(data.associations.origin.id) };

      let origin: SampleModel;
      database
        .collection(SAMPLES_COLLECTION)
        .findOne(originQuery, (error: any, result: any) => {
          if (error) throw error;
          origin = result;

          // Update product record of the origin to include this sample as a product
          const updatedValues = {
            $set: {
              associations: {
                origin: {
                  name: origin.associations.origin.name,
                  id: origin.associations.origin.id,
                },
                products: [
                  ...origin.associations.products,
                  {
                    name: data.name,
                    id: insertedId,
                  },
                ],
              },
            },
          };

          database
            .collection(SAMPLES_COLLECTION)
            .updateOne(originQuery, updatedValues, (error: any, response: any) => {
              if (error) throw error;
            });
        });
    } else if (data.associations.products.length > 0) {
      // Iterate over each product, setting their origin to the current sample being added
      data.associations.products.forEach((product) => {
        const productQuery = { _id: new ObjectId(product.id) };
        let productSample: SampleModel;

        database
          .collection(SAMPLES_COLLECTION)
          .findOne(productQuery, (error: any, result: any) => {
            if (error) throw error;
            productSample = result;

            // Update origin record of the product to include this sample as a origin
            const updatedValues = {
              $set: {
                associations: {
                  origin: {
                    name: data.name,
                    id: insertedId,
                  },
                  products: productSample.associations.products,
                },
              },
            };
  
            database
              .collection(SAMPLES_COLLECTION)
              .updateOne(productQuery, updatedValues, (error: any, response: any) => {
                if (error) throw error;
              });
          });
      });
    }

    // We need to apply the collections that have been specified
    if (data.collection && data.collection.name !== "") {
      consola.info("Collection specified, applying...");
      const collectionQuery = { _id: new ObjectId(data.collection.id) };
      let collection: CollectionModel;

      database
        .collection(COLLECTIONS_COLLECTION)
        .findOne(collectionQuery, (error: any, result: any) => {
          if (error) throw error;
          collection = result;

          // Update the collection to include the sample as an association
          const updatedValues = {
            $set: {
              associations: {
                samples: [
                  ...collection.associations.samples,
                  insertedId,
                ]
              },
            },
          };

          database
            .collection(COLLECTIONS_COLLECTION)
            .updateOne(collectionQuery, updatedValues, (error: any, response: any) => {
              if (error) throw error;
              consola.success("Added Sample to collection:", data.collection.name);
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

            // Update the collection to include the sample as an association
            const updatedValues = {
              $set: {
                associations: {
                  samples: [
                    ...collectionResult.associations.samples,
                    insertedId,
                  ]
                },
              },
            };

            database
              .collection(COLLECTIONS_COLLECTION)
              .updateOne(collectionQuery, updatedValues, (error: any, response: any) => {
                if (error) throw error;
                consola.success("Added Sample to collection:", collection.name);
            });
          });
      });
    }
  });

// Route: Remove a sample
samplesRoute
  .route("/:id")
  .delete((request: { params: { id: any } }, response: any) => {
    const database = getDatabase();
    let query = { _id: new ObjectId(request.params.id) };

    database
      .collection(SAMPLES_COLLECTION)
      .deleteOne(query, (error: any, content: any) => {
        if (error) throw error;
        consola.success("1 sample deleted");
        response.json(content);
      });
  });

export default samplesRoute;