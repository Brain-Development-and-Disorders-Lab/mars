// Libraries
import express from "express";

// Database connection
import { Search } from "src/operations/Search";

const SearchRoute = express.Router();

// Route: Execute a query across the colleciton of Entities
SearchRoute.route("/search/query").post(async (request: any, response: any) => {
  Search.getQuery(request.body).then((results) => {
    response.json(results);
  });
});

// Route: Search for a specific string in the colleciton of Entities
SearchRoute.route("/search").post(async (request: any, response: any) => {
  Search.get(request.body).then((results) => {
    response.json(results);
  });
});

export default SearchRoute;
