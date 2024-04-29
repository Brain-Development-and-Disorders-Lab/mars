// Libraries
import { Db, GridFSBucket, MongoClient } from "mongodb";
import consola from "consola";
import _ from "lodash";
import { nanoid } from "nanoid";

// Get the connection string from the environment variables
const CONNECTION_STRING = process.env.CONNECTION_STRING as string;
if (_.isUndefined(CONNECTION_STRING)) {
  consola.error(
    "Connection string is not defined, see README.md for instructions to specify environment variables prior to starting server",
  );
  throw new Error("Connection string is not defined");
}

// Setup the MongoDB client and databases
const client: MongoClient = new MongoClient(CONNECTION_STRING, {});
let database: Db;
let storage: Db;
let system: Db;
let attachments: GridFSBucket;

/**
 * Connect to the primary database storing metadata
 * @returns {Promise<Db>}
 */
export const connectPrimary = (): Promise<Db> => {
  return new Promise((resolve, _reject) => {
    client.connect().then((result) => {
      database = result.db("metadata");
      consola.success("Connected to database:", "metadata");
      storage = result.db("storage");
      consola.success("Connected to database:", "storage");
      attachments = new GridFSBucket(storage, { bucketName: "attachments" });
      consola.success("Connected to database:", "attachments");
      resolve(database);
    });
  });
};

/**
 * Connect to the system database storing system data
 * @returns {Promise<Db>}
 */
export const connectSystem = (): Promise<Db> => {
  return new Promise((resolve, _reject) => {
    client.connect().then((result) => {
      system = result.db("system");
      consola.success("Connected to database:", "system");
      resolve(system);
    });
  });
};

/**
 * Disconnect from MongoDB instance
 * @returns {Promise<void>}
 */
export const disconnect = (): Promise<void> => {
  return client.close();
};

/**
 * Get the MongoDB primary database object
 * @returns {Db}
 */
export const getDatabase = (): Db => {
  return database;
};

/**
 * Get the MongoDB system database object
 * @returns {Db}
 */
export const getSystem = (): Db => {
  return system;
};

/**
 * Get the MongoDB database for storage
 * @returns {Db}
 */
export const getStorage = (): Db => {
  return storage;
};

/**
 * Get the MongoDB storage buckets for attachments
 * @returns {GridFSBucket}
 */
export const getAttachments = (): GridFSBucket => {
  return attachments;
};

/**
 * Generate safe pseudo-random identifiers for allocation when creating
 * new items for storage in the MongoDB database, in place of default
 * identifier
 * @param type identifier to be assigned an Entity, Attribute, or Project
 * @returns {string}
 */
export const getIdentifier = (
  type: "entity" | "attribute" | "project",
): string => {
  return `${type.slice(0, 1)}${nanoid(7)}`;
};
