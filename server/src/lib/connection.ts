import { Callback, Db, MongoClient } from "mongodb";

// Get the connection string from the environment variables
const CONNECTION_STRING = process.env.CONNECTION_STRING as string;

const client: MongoClient = new MongoClient(CONNECTION_STRING, {});
let database: Db;

export const run = (callback: any) => {
  client.connect((error: any, result: any): Callback<MongoClient> => {
    if (result) {
      database = result.db("flow");
      console.log("Successfully connected to MongoDB.");
    }
    return callback(error);
  });
};

export const getDatabase = (): Db => {
  return database;
};
