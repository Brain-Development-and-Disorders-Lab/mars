// Libraries
import { Db, MongoClient } from "mongodb";
import consola from "consola";
import _ from "underscore";

// Get the connection string from the environment variables
const CONNECTION_STRING = process.env.CONNECTION_STRING as string;
if (_.isUndefined(CONNECTION_STRING)) {
  consola.error(
    "Connection string is not defined, see README.md for instructions to specify environment variables prior to starting server"
  );
  throw new Error("Connection string is not defined");
}

// Setup the MongoDB client and database
const client: MongoClient = new MongoClient(CONNECTION_STRING, {});
let database: Db;

/**
 * Connect to the database
 */
export const connect = (): Promise<Db> => {
  return new Promise((resolve, _reject) => {
    client.connect().then((result) => {
      consola.success("Successfully connected to MongoDB.");

      database = result.db("metadata");
      resolve(database);
    });
  });
};

/**
 * Disconnect from the database
 */
export const disconnect = (): Promise<void> => {
  return client.close();
};

/**
 * Get the MongoDB database object
 * @return {Db}
 */
export const getDatabase = (): Db => {
  return database;
};
