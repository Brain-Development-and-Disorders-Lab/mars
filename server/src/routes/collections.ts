// Libraries
import express from "express";
import consola from "consola";
import { ObjectId } from "mongodb";

// Database connection
import { getDatabase } from "../database/connection";

const collectionsRoute = express.Router();

// Constants
const COLLECTIONS_COLLECTION = "collections";

// Route: View all collections
collectionsRoute.route("/collections").get((request: any, response: any) => {
  let connection = getDatabase();
  connection
    .collection(COLLECTIONS_COLLECTION)
    .find({})
    .toArray((error: any, result: any) => {
      if (error) throw error;
      response.json(result);
    });
});

// Route: View a specific collection
collectionsRoute.route("/collections/:id").get((request: any, response: any) => {
  const database = getDatabase();
  const query = { _id: new ObjectId(request.params.id) };

  database
    .collection(COLLECTIONS_COLLECTION)
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
      let query = { _id: new ObjectId(request.params.id) };
      connection
        .collection(COLLECTIONS_COLLECTION)
        .deleteOne(query, (error: any, content: any) => {
          if (error) throw error;
          consola.success("1 collection deleted");
          response.json(content);
      });
});

export default collectionsRoute;