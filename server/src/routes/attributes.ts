// Libraries
import express from "express";
import consola from "consola";

// Database connection
import { getDatabase } from "../database/connection";
import { AttributeStruct } from "../../../client/types";

// Constants
const ATTRIBUTES_COLLECTION = "attributes";

const AttributesRoute = express.Router();

// Convert the id from a string to a MongoDB ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

// Route: View all attributes
AttributesRoute.route("/attributes").get((request: any, response: any) => {
  let connection = getDatabase();
  connection
    .collection("attributes")
    .find({})
    .toArray((error: any, result: any) => {
      if (error) throw error;
      response.json(result);
    });
});

// Route: View a specific attribute
AttributesRoute.route("/attributes/:id").get(
  (
    request: { params: { id: any } },
    response: { json: (content: any) => void }
  ) => {
    // Connect to the database and assemble a query
    let connection = getDatabase();
    let query = { _id: ObjectId(request.params.id) };

    connection
      .collection("attributes")
      .findOne(query, (error: any, result: any) => {
        if (error) throw error;
        consola.success("Retrieved attribute with ID:", request.params.id);
        response.json(result);
      });
  }
);

// Route: Create a new Attribute, expects AttributeStruct data
AttributesRoute.route("/attributes/create").post(
  (request: { body: AttributeStruct }, response: any) => {
    const database = getDatabase();
    let data = {
      name: request.body.name,
      description: request.body.description,
      type: request.body.type,
      parameters: request.body.parameters,
    };

    // Insert the new Attribute
    database
      .collection(ATTRIBUTES_COLLECTION)
      .insertOne(data, (error: any, content: any) => {
        if (error) throw error;
        response.json(content);
      });

    // Retrieve the ID of the inserted Entity
    const insertedId = (data as AttributeStruct & { _id: string })._id;

    consola.debug("Create new Attribute:", "/attributes/create", '"' + data.name + '"');

    // We need to apply the collections that have been specified
    // if (data.entities.length > 0) {
    //   consola.info("Additional Entities specified, applying...");
    //   data.entities.map((entity) => {
    //     consola.debug("Linking Collection with Entity:", entity);
    //     const entityQuery = { _id: new ObjectId(entity) };
    //     let entityResult: EntityModel;

    //     database
    //       .collection(ENTITIES_COLLECTION)
    //       .findOne(entityQuery, (error: any, result: any) => {
    //         if (error) throw error;
    //         entityResult = result;

    //         // Update the collection to include the Entity as an association
    //         const updatedValues = {
    //           $set: {
    //             collections: [
    //               ...entityResult.collections,
    //               {
    //                 name: data.name,
    //                 id: insertedId,
    //               },
    //             ],
    //           },
    //         };

    //         database
    //           .collection(ENTITIES_COLLECTION)
    //           .updateOne(
    //             entityQuery,
    //             updatedValues,
    //             (error: any, response: any) => {
    //               if (error) throw error;
    //               consola.success("Added Collection to Entity:", entityResult.name);
    //             }
    //           );
    //       });
    //   });
    // }
  }
);

// Route: Remove an attribute
AttributesRoute.route("/:id").delete(
  (
    req: { params: { id: any } },
    response: { json: (content: any) => void }
  ) => {
    let connection = getDatabase();
    let query = { _id: ObjectId(req.params.id) };
    connection
      .collection("attributes")
      .deleteOne(query, (error: any, content: any) => {
        if (error) throw error;
        consola.success("1 attribute deleted");
        response.json(content);
      });
  }
);

export default AttributesRoute;
