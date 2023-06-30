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

// Setup the MongoDB client and databases
const client: MongoClient = new MongoClient(CONNECTION_STRING, {});
let database: Db;
let system: Db;

/**
 * Connect to the primary database storing metadata
 */
export const connectPrimary = (): Promise<Db> => {
  return new Promise((resolve, _reject) => {
    client.connect().then((result) => {
      database = result.db("metadata");
      consola.success("Connected to MongoDB metadata database");
      resolve(database);
    });
  });
};

/**
 * Connect to the system database storing system data
 */
export const connectSystem = (): Promise<Db> => {
  return new Promise((resolve, _reject) => {
    client.connect().then((result) => {
      database = result.db("system");
      consola.success("Connected to MongoDB system database");
      resolve(database);
    });
  });
};

/**
 * Disconnect from MongoDB instance
 */
export const disconnect = (): Promise<void> => {
  return client.close();
};

/**
 * Get the MongoDB primary database object
 * @return {Db}
 */
export const getDatabase = (): Db => {
  return database;
};

/**
 * Get the MongoDB system database object
 * @return {Db}
 */
export const getSystem = (): Db => {
  return system;
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
