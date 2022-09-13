// Libraries
import express from "express";

// Database connection
import { getDatabase } from "../database/connection";

const searchRoute = express.Router();

// Name of MongoDB collection storing Samples
const SAMPLES_COLLECTION = "samples";

// Route: Search for a specific string in the colleciton of samples
searchRoute.route("/search/:query").get(async (request: any, response: any) => {
  const database = getDatabase();

  // Configure database query
  const query = { $text: { $search: request.params.query } };
  const sort = { score: { $meta: "textScore" } };

  database
    .collection(SAMPLES_COLLECTION)
    .find(query)
    .sort(sort)
    .toArray((error, content) => {
      if (error) throw error;
      response.json(content);
    });
});

export default searchRoute;