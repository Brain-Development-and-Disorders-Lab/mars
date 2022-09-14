// Libraries
import express from "express";
import consola from "consola";

// Database connection
import { getDatabase } from "../database/connection";

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
