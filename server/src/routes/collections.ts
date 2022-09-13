// Libraries
import express from "express";
import consola from "consola";

// Database connection
import { getDatabase } from "../database/connection";

const collectionsRoute = express.Router();

// Convert the id from a string to a MongoDB ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

// Route: View all collections
collectionsRoute.route("/collections").get((request: any, response: any) => {
  let connection = getDatabase();
  connection
    .collection("collections")
    .find({})
    .toArray((error: any, result: any) => {
      if (error) throw error;
      response.json(result);
    });
});

// Route: View a specific collection
collectionsRoute
  .route("/collections/:id")
  .get((
    request: { params: { id: any } },
    response: { json: (content: any) => void }
  ) => {
    let connection = getDatabase();
    let query = { _id: ObjectId(request.params.id) };
    connection
      .collection("collections")
      .findOne(query, (error: any, result: any) => {
        if (error) throw error;
        response.json(result);
      });
  });

// Route: Remove a collection
collectionsRoute
  .route("/:id")
  .delete(
    (request: { params: { id: any } }, response: { json: (content: any) => void }) => {
      let connection = getDatabase();
      let query = { _id: ObjectId(request.params.id) };
      connection
        .collection("collections")
        .deleteOne(query, (error: any, content: any) => {
          if (error) throw error;
          consola.success("1 collection deleted");
          response.json(content);
        });
    }
  );

export default collectionsRoute;