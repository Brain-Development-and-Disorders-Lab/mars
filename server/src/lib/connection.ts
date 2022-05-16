import { Callback, MongoClient } from "mongodb";

// Get the connection string from the environment variables
const CONNECTION_STRING = process.env.CONNECTION_STRING as string;

const client: MongoClient = new MongoClient(CONNECTION_STRING, {});
let _db: any;

export default {
  connectToServer: (callback: any) => {
    client.connect((err: any, database: any): Callback<MongoClient> => {
      // Verify we got a good database
      if (database) {
        _db = database.db("flow");
        console.log("Successfully connected to MongoDB."); 
      }
      return callback(err);
    });
  },

  getDatabase: () => {
    return _db;
  },
};
