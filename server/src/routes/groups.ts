import express from "express";

// 'groupsRoute' is an instance of the express router.
// The router will be added as a middleware and will take control of requests starting with path /record.
const groupsRoute = express.Router();

// This will help us connect to the database
import { getDatabase } from "../lib/connection";

// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

// This section will help you get a list of all the records.
groupsRoute.route("/groups").get(function (req: any, res: any) {
  let _connect = getDatabase();
  _connect
    .collection("groups")
    .find({})
    .toArray(function (err: any, result: any) {
      if (err) throw err;
      res.json(result);
    });
});

// This section will help you get a single record by id
groupsRoute
  .route("/groups/:id")
  .get(function (
    req: { params: { id: any } },
    res: { json: (arg0: any) => void }
  ) {
    let _connect = getDatabase();
    let query = { _id: ObjectId(req.params.id) };
    _connect
      .collection("groups")
      .findOne(query, function (err: any, result: any) {
        if (err) {
          throw err;
        }

        res.json(result);
      });
  });

// This section will help you delete a record
groupsRoute
  .route("/:id")
  .delete(
    (req: { params: { id: any } }, response: { json: (arg0: any) => void }) => {
      let _connect = getDatabase();
      let query = { _id: ObjectId(req.params.id) };
      _connect
        .collection("groups")
        .deleteOne(query, function (err: any, obj: any) {
          if (err) {
            throw err;
          }
          console.log("1 group deleted");

          response.json(obj);
        });
    }
  );

export default groupsRoute;
