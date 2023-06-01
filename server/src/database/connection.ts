// Libraries
import { Db, MongoClient } from "mongodb";
import consola from "consola";
import _ from "lodash";
import { nanoid } from "nanoid";

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
      consola.success("Connected to MongoDB");
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

/**
 * Generate safe pseudo-random identifiers for allocation when creating
 * new items for storage in the MongoDB database, in place of default
 * identifier
 * @param type identifier to be assigned an Entity, Attribute, or Collection
 * @return {string}
 */
export const getIdentifier = (
  type: "entity" | "attribute" | "collection"
): string => {
  return `${type.slice(0, 1)}${nanoid(7)}`;
};
