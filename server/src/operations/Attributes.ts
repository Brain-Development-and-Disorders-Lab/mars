// Utility functions
import { getDatabase } from "../connectors/database";
import { Activity } from "./Activity";
import { getIdentifier } from "src/util";

// Utility libraries
import _ from "lodash";
import consola from "consola";

// Custom types
import { AttributeModel } from "@types";

// Constants
const ATTRIBUTES = "attributes";

export class Attributes {
  /**
   * Check if an Attribute exists in the system
   * @param id the Attribute identifier
   * @return {boolean}
   */
  static exists = (id: string): Promise<boolean> => {
    consola.start("Checking if Attribute (id):", id.toString(), "exists");
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ATTRIBUTES)
        .findOne({ _id: id }, (_error: any, result: any) => {
          if (_.isNull(result)) {
            consola.warn("Attribute (id):", id.toString(), "does not exist");
            resolve(false);
          }

          consola.success("Attribute (id):", id.toString(), "exists");
          resolve(true);
        });
    });
  };

  /**
   * Create a new Attribute
   * @param {any} attribute all data associated with the new Attribute
   * @return {Promise<AttributeModel>}
   */
  static create = (attribute: any): Promise<AttributeModel> => {
    consola.start("Creating new Attribute:", attribute.name);
    return new Promise((resolve, _reject) => {
      // Allocate a new identifier and join with Attribute data
      attribute["_id"] = getIdentifier("attribute");

      // Push data to database
      getDatabase()
        .collection(ATTRIBUTES)
        .insertOne(attribute, (error: any, _result: any) => {
          if (error) {
            throw error;
          }

          // Database operations to perform
          const operations: Promise<any>[] = [];

          // Add Update operation
          operations.push(
            Activity.create({
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
            consola.success(
              "Created new Attribute:",
              attribute._id,
              attribute.name
            );
            resolve(attribute as AttributeModel);
          });
        });
    });
  };

  static update = (
    updatedAttribute: AttributeModel
  ): Promise<AttributeModel> => {
    consola.start("Updating Attribute:", updatedAttribute.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ATTRIBUTES)
        .findOne({ _id: updatedAttribute._id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Database operations to perform
          const operations: Promise<any>[] = [];

          // Cast and store current state of the Collection
          result as AttributeModel;

          const updates = {
            $set: {
              description: updatedAttribute.description,
              values: updatedAttribute.values,
            },
          };

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "update",
              details: "Updated Attribute",
              target: {
                type: "attributes",
                id: updatedAttribute._id,
                name: updatedAttribute.name,
              },
            })
          );

          getDatabase()
            .collection(ATTRIBUTES)
            .updateOne(
              { _id: updatedAttribute._id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve all operations then resolve overall Promise
                Promise.all(operations).then((_result) => {
                  consola.success("Updated Attribute:", updatedAttribute.name);

                  // Resolve the Promise
                  resolve(updatedAttribute);
                });
              }
            );
        });
    });
  };

  /**
   * Create a new Attribute
   * @param {any} attribute all data associated with the new Attribute
   * @return {Promise<AttributeModel>}
   */
  static restore = (attribute: any): Promise<AttributeModel> => {
    consola.start("Restoring Attribute:", attribute.name);
    return new Promise((resolve, _reject) => {
      // Push data to database
      getDatabase()
        .collection(ATTRIBUTES)
        .insertOne(attribute, (error: any, _result: any) => {
          if (error) {
            throw error;
          }

          // Database operations to perform
          const operations: Promise<any>[] = [];

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "create",
              details: "Restored Attribute",
              target: {
                type: "attributes",
                id: attribute._id,
                name: attribute.name,
              },
            })
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            consola.success(
              "Restored Attribute:",
              attribute._id,
              attribute.name
            );
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
        .findOne({ _id: id }, (error: any, result: any) => {
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
    consola.start("Deleting Attribute (id):", id.toString());
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ATTRIBUTES)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }
          // Store the Attribute data
          const attribute: AttributeModel = result;

          const operations: Promise<any>[] = [];

          // Add Update operation
          operations.push(
            Activity.create({
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
              .deleteOne({ _id: id }, (error: any, _content: any) => {
                if (error) {
                  throw error;
                }

                consola.success("Deleted Attribute (id):", id.toString());
                resolve(result);
              });
          });
        });
    });
  };
}
