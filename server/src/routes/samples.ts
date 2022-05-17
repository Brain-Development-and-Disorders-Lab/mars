import express from "express";

// Import types from the client
import { SampleStruct } from "../../../client/types";
 
// 'samplesRoute' is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const samplesRoute = express.Router();
 
// This will help us connect to the database
import connection from "../lib/connection";
 
// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;
 
 
// This section will help you get a list of all the records.
samplesRoute.route("/samples").get(function (req: any, res: any) {
  let _connect = connection.getDatabase();
  _connect
    .collection("samples")
    .find({})
    .toArray(function (err: any, result: any) {
      if (err) throw err;
      res.json(result);
    });
});
 
// This section will help you get a single record by id
samplesRoute.route("/samples/:id").get(function (req: { params: { id: any; }; }, res: { json: (arg0: any) => void; }) {
  let _connect = connection.getDatabase();
  let query = { _id: ObjectId( req.params.id )};
  _connect.collection("samples")
    .findOne(query, function (err: any, result: any) {
      if (err) {
        throw err;
      }

      res.json(result);
    });
});
 
// This section will help you create a new record.
samplesRoute.route("/samples/add").post(function (req: { body: SampleStruct; }, response: { json: (arg0: any) => void; }) {
  let _connect = connection.getDatabase();
  let data = {
    name: req.body.name,
    created: req.body.created,
    owner: req.body.owner,
    projects: req.body.projects,
    origin: req.body.origin,
    storage: req.body.storage,
    assocations: req.body.associations,
    parameters: req.body.parameters,
  };

  _connect.collection("samples").insertOne(data, function (err: any, res: any) {
    if (err) throw err;
    response.json(res);
  });
});
 
// This section will help you update a record by id.
// recordRoutes.route("/update/:id").post(function (req, response) {
//  let db_connect = dbo.getDb(); 
//  let myquery = { _id: ObjectId( req.params.id )}; 
//  let newvalues = {   
//    $set: {     
//      name: req.body.name,    
//      position: req.body.position,     
//      level: req.body.level,   
//    }, 
//   }
// });
 
// This section will help you delete a record
samplesRoute.route("/:id").delete((req: { params: { id: any; }; }, response: { json: (arg0: any) => void; }) => {
  let _connect = connection.getDatabase();
  let query = { _id: ObjectId( req.params.id )};
  _connect.collection("samples").deleteOne(query, function (err: any, obj: any) {
    if (err) {
      throw err;
    }
    console.log("1 sample deleted");

    response.json(obj);
  });
});
 
export default samplesRoute;
