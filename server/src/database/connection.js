// Libraries
import { MongoClient } from "mongodb";
import consola from "consola";
// Get the connection string from the environment variables
const CONNECTION_STRING = process.env.CONNECTION_STRING;
// Setup the MongoDB client and database
const client = new MongoClient(CONNECTION_STRING, {});
let database;
/**
 * Connect to the database
 */
export const connect = () => {
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
export const disconnect = () => {
    return client.close();
};
/**
 * Get the MongoDB database object
 * @return {Db}
 */
export const getDatabase = () => {
    return database;
};
