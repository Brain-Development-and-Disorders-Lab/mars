// Libraries
import { Callback, Db, MongoClient } from "mongodb";
import consola from "consola";

// Get the connection string from the environment variables
const CONNECTION_STRING = process.env.CONNECTION_STRING as string;

// Setup the MongoDB client and database
const client: MongoClient = new MongoClient(CONNECTION_STRING, {});
let database: Db;

/**
 * Connect to the database
 * @param callback callback function
 */
export const connect = (callback: any) => {
  client.connect((error: any, result: any): Callback<MongoClient> => {
    if (result) {
      database = result.db("flow");
      consola.success("Successfully connected to MongoDB.");
    }

    return callback(error);
  });
};

/**
 * Get the MongoDB database object
 * @return {Db}
 */
export const getDatabase = (): Db => {
  return database;
};
