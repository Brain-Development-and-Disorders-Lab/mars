import express from "express";

// 'attributesRoute' is an instance of the express router.
// The router will be added as a middleware and will take control of requests starting with path /record.
const attributesRoute = express.Router();

// This will help us connect to the database
import { getDatabase } from "../lib/database/connection";

// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

// This section will help you get a list of all the records.
attributesRoute.route("/attributes").get(function (req: any, res: any) {
  let _connect = getDatabase();
  _connect
    .collection("attributes")
    .find({})
    .toArray(function (err: any, result: any) {
      if (err) throw err;
      res.json(result);
    });
});

// This section will help you get a single record by id
attributesRoute
  .route("/attributes/:id")
  .get(function (
    req: { params: { id: any } },
    res: { json: (arg0: any) => void }
  ) {
    let _connect = getDatabase();
    let query = { _id: ObjectId(req.params.id) };
    _connect
      .collection("attributes")
      .findOne(query, function (err: any, result: any) {
        if (err) {
          throw err;
        }

        res.json(result);
      });
  });

// This section will help you delete a record
attributesRoute
  .route("/:id")
  .delete(
    (req: { params: { id: any } }, response: { json: (arg0: any) => void }) => {
      let _connect = getDatabase();
      let query = { _id: ObjectId(req.params.id) };
      _connect
        .collection("attributes")
        .deleteOne(query, function (err: any, obj: any) {
          if (err) {
            throw err;
          }
          console.log("1 attribute deleted");

          response.json(obj);
        });
    }
  );

export default attributesRoute;
