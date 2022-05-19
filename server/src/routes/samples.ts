import express from "express";
import { ObjectId } from "mongodb";

// Import types from the client to enforce structure
import { SampleModel, SampleStruct } from "../../../client/types";

// Utility functions
import { getDatabase } from "../lib/connection";

const samplesRoute = express.Router();

// Constants
const SAMPLES_COLLECTION = "samples";

samplesRoute.route("/samples").get((req: any, res: any) => {
  const database = getDatabase();
  database
    .collection(SAMPLES_COLLECTION)
    .find({})
    .toArray((error: any, result: any) => {
      if (error) {
        throw error;
      }
      res.json(result);
    });
});

samplesRoute.route("/samples/:id").get((req: any, res: any) => {
  const database = getDatabase();
  const query = { _id: new ObjectId(req.params.id) };

  database
    .collection(SAMPLES_COLLECTION)
    .findOne(query, (error: any, result: any) => {
      if (error) {
        throw error;
      }
      res.json(result);
    });
});

// This section will help you create a new record.
samplesRoute
  .route("/samples/add")
  .post((req: { body: SampleStruct }, response: any) => {
    const database = getDatabase();
    let data = {
      name: req.body.name,
      created: req.body.created,
      owner: req.body.owner,
      project: req.body.project,
      description: req.body.description,
      projects: req.body.projects,
      associations: {
        origin: req.body.associations.origin,
        products: req.body.associations.products,
      },
      parameters: req.body.parameters,
    };

    // Insert the new sample
    database
      .collection(SAMPLES_COLLECTION)
      .insertOne(data, (error: any, res: any) => {
        if (error) {
          throw error;
        }
        response.json(res);
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
          if (error) {
            throw error;
          }

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
            .updateOne(originQuery, updatedValues, (error: any, res: any) => {
              if (error) {
                throw error;
              }
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
            if (error) {
              throw error;
            }
  
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
              .updateOne(productQuery, updatedValues, (error: any, res: any) => {
                if (error) {
                  throw error;
                }
              });
          });
      });
    }
  });

// This section will help you delete a record
samplesRoute
  .route("/:id")
  .delete((req: { params: { id: any } }, response: any) => {
    const database = getDatabase();

    let query = { _id: new ObjectId(req.params.id) };
    database
      .collection(SAMPLES_COLLECTION)
      .deleteOne(query, function (error: any, obj: any) {
        if (error) {
          throw error;
        }
        console.log("1 sample deleted");

        response.json(obj);
      });
  });

export default samplesRoute;
