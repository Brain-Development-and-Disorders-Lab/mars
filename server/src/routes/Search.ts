// Libraries
import express from "express";

// Database connection
import { Search } from "src/operations/Search";

const SearchRoute = express.Router();

// Route: Search for a specific string in the colleciton of Entities
SearchRoute.route("/search").post(async (request: any, response: any) => {
  Search.get(request.body).then((results) => {
    response.json(results);
  });
});

export default SearchRoute;
