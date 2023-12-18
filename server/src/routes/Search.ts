// Libraries
import express from "express";

// Operations
import { Search } from "src/operations/Search";

// Utility functions and libraries
import { authenticate } from "src/util";

const SearchRoute = express.Router();

// Route: Execute a query across the colleciton of Entities
SearchRoute.route("/search/query").post(
  authenticate,
  async (request: any, response: any) => {
    Search.getQuery(request.body).then((results) => {
      response.json(results);
    });
  }
);

// Route: Execute a built query across the colleciton of Entities
SearchRoute.route("/search/query_built").post(
  authenticate,
  async (request: any, response: any) => {
    Search.getBuiltQuery(request.body).then((results) => {
      response.json(results);
    });
  }
);

// Route: Search for a specific string in the colleciton of Entities
SearchRoute.route("/search").post(
  authenticate,
  async (request: any, response: any) => {
    Search.get(request.body).then((results) => {
      response.json(results);
    });
  }
);

export default SearchRoute;
