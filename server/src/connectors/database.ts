// Libraries
import { Db, GridFSBucket, MongoClient } from "mongodb";
import consola from "consola";
import _ from "lodash";

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
 */
export const connectPrimary = (): Promise<Db> => {
  return new Promise((resolve, _reject) => {
    client.connect().then((result) => {
      database = result.db("metadata");
      consola.success("Connected to metadata database");

      storage = result.db("storage");
      consola.success("Connected to storage database");

      consola.start('Accessing "attachments" storage bucket');
      attachments = new GridFSBucket(storage, { bucketName: "attachments" });
      consola.success('Created "attachments" storage bucket');

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
      system = result.db("system");
      consola.success("Connected to MongoDB system database");
      resolve(system);
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
 * Get the MongoDB database for storage
 * @return {Db}
 */
export const getStorage = (): Db => {
  return storage;
};

/**
 * Get the MongoDB storage buckets for attachments
 * @return {GridFSBucket}
 */
export const getAttachments = (): GridFSBucket => {
  return attachments;
};
