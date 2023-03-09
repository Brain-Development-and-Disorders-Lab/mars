// MongoDB
import { ObjectId } from "mongodb";

// Utility functions
import { getDatabase } from "../database/connection";
import { Updates } from "./Updates";

// Utility libraries
import _ from "underscore";
import consola from "consola";

// Custom types
import { AttributeModel } from "@types";

// Constants
const ATTRIBUTES = "attributes";

export class Attributes {
  /**
   * Create a new Attribute
   * @param {any} attribute all data associated with the new Attribute
   * @return {Promise<AttributeModel>}
   */
    static create = (attribute: any): Promise<AttributeModel> => {
      consola.info("Creating new Attribute:", attribute.name);
      return new Promise((resolve, _reject) => {
        getDatabase()
          .collection(ATTRIBUTES)
          .insertOne(attribute, (error: any, result: any) => {
            if (error) {
              throw error;
            }

            // Database operations to perform
            const operations: Promise<any>[] = [];

            // Add Update operation
            operations.push(
              Updates.create({
                timestamp: new Date(Date.now()),
                type: "create",
                details: "Created new Attribute",
                target: {
                  type: "attributes",
                  id: attribute._id,
                  name: attribute.name,
                },
              })
            );

            // Resolve all operations then resolve overall Promise
            Promise.all(operations).then((_result) => {
              attribute["_id"] = result.insertedId;
              consola.success("Created new Attribute:", attribute.name);
              resolve(attribute as AttributeModel);
            });
          });
      });
    };

  /**
   * Get a single Attribute
   * @return {Promise<AttributeModel>}
   */
  static getOne = (id: string): Promise<AttributeModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ATTRIBUTES)
        .findOne({ _id: new ObjectId(id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          consola.success("Retrieved Attribute (id):", id.toString());
          resolve(result as AttributeModel);
        });
    });
  };

  static getAll = (): Promise<AttributeModel[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ATTRIBUTES)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            throw error;
          }
          consola.success("Retrieved all Attributes");
          resolve(result as AttributeModel[]);
        });
    });
  };

  static delete = (id: string): Promise<AttributeModel> => {
    consola.info("Deleting Attribute (id):", id.toString());
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ATTRIBUTES)
        .findOne({ _id: new ObjectId(id) }, (error: any, result: any) => {
          if (error) {
            throw error;
          }
          // Store the Attribute data
          const attribute: AttributeModel = result;

          const operations: Promise<any>[] = [];

          // Add Update operation
          operations.push(
            Updates.create({
              timestamp: new Date(Date.now()),
              type: "delete",
              details: "Deleted Attribute",
              target: {
                type: "attributes",
                id: attribute._id,
                name: attribute.name,
              },
            })
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            // Delete the Attribute
            getDatabase()
              .collection(ATTRIBUTES)
              .deleteOne(
                { _id: new ObjectId(id) },
                (error: any, _content: any) => {
                  if (error) {
                    throw error;
                  }

                  consola.success("Deleted Attribute (id):", id.toString());
                  resolve(result);
                }
              );
          });
      });
    });
  };
};
