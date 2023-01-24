// Libraries
import express from "express";
import consola from "consola";

// Database connection
import { getDatabase } from "../database/connection";

// Custom types
import { AttributeStruct } from "@types";
import { registerUpdate } from "../operations/Updates";

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
  (request: { params: { id: any } }, response: { json: (content: any) => void }) => {
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
    let data = {
      name: request.body.name,
      description: request.body.description,
      parameters: request.body.parameters,
    };

    // Insert the new Attribute
    getDatabase()
      .collection(ATTRIBUTES_COLLECTION)
      .insertOne(data, (error: any, content: any) => {
        if (error) throw error;
        response.json(content);
      });

    // Retrieve the ID of the inserted Entity
    const insertedId = (data as AttributeStruct & { _id: string })._id;
    registerUpdate({
      targets: {
        primary: {
          type: "attributes",
          id: insertedId,
          name: data.name,
        },
      },
      operation: {
        timestamp: new Date(Date.now()),
        type: "add",
      }
    });

    consola.debug("Create new Attribute:", "/attributes/create", '"' + data.name + '"');
  }
);

// Route: Remove an Attribute
AttributesRoute.route("/attributes/:id").delete(
  (request: { params: { id: any } }, response: { json: (content: any) => void }) => {
    let query = { _id: ObjectId(request.params.id) };

    getDatabase()
      .collection("attributes")
      .deleteOne(query, (error: any, content: any) => {
        if (error) throw error;
        consola.success("1 attribute deleted");
        response.json(content);
      });

    // To Do: Remove references to Attribute.
  }
);

export default AttributesRoute;
