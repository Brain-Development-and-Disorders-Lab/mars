import express from "express";
 
// 'parametersRoute' is an instance of the express router.
// The router will be added as a middleware and will take control of requests starting with path /record.
const parametersRoute = express.Router();
 
// This will help us connect to the database
import connection from "../lib/connection";
 
// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;
 
 
// This section will help you get a list of all the records.
parametersRoute.route("/parameters").get(function (req: any, res: any) {
  let _connect = connection.getDatabase();
  _connect
    .collection("parameters")
    .find({})
    .toArray(function (err: any, result: any) {
      if (err) throw err;
      res.json(result);
    });
});
 
// This section will help you get a single record by id
parametersRoute.route("/parameters/:id").get(function (req: { params: { id: any; }; }, res: { json: (arg0: any) => void; }) {
  let _connect = connection.getDatabase();
  let query = { _id: ObjectId( req.params.id )};
  _connect.collection("parameters")
    .findOne(query, function (err: any, result: any) {
      if (err) {
        throw err;
      }

      res.json(result);
    });
});
 
// This section will help you create a new record.
// sampleRoutes.route("/sample/add").post(function (req: { body: { name: any; position: any; level: any; }; }, response: { json: (arg0: any) => void; }) {
//  let db_connect = dbo.getDb();
//  let myobj = {
//    name: req.body.name,
//    position: req.body.position,
//    level: req.body.level,
//  };
//  db_connect.collection("records").insertOne(myobj, function (err, res) {
//    if (err) throw err;
//    response.json(res);
//  });
// });
 
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
parametersRoute.route("/:id").delete((req: { params: { id: any; }; }, response: { json: (arg0: any) => void; }) => {
  let _connect = connection.getDatabase();
  let query = { _id: ObjectId( req.params.id )};
  _connect.collection("parameters").deleteOne(query, function (err: any, obj: any) {
    if (err) {
      throw err;
    }
    console.log("1 parameter deleted");

    response.json(obj);
  });
});
 
export default parametersRoute;