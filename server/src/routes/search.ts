import express, { response } from "express";
import { ObjectId } from "mongodb";

// Utility functions
import { getDatabase } from "../lib/connection";

const searchRoute = express.Router();

const SAMPLES_COLLECTION = "samples";

searchRoute.route("/search/:query").get(async(req: any, res: any) => {
  const database = getDatabase();
  const query = { $text: { $search: req.params.query } };
  const sort = { score: { $meta: "textScore" } };

  database
    .collection(SAMPLES_COLLECTION)
    .find(query)
    .sort(sort)
    .toArray(function(error, docs) {
      if (error) {
        throw error;
      }
      res.json(docs);
    });
});

export default searchRoute;
