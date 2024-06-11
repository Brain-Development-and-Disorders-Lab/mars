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
   * @param {string} id the Attribute identifier
   * @returns {Promise<Boolean>}
   */
  static exists = (id: string): Promise<boolean> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ATTRIBUTES)
        .findOne({ _id: id }, (_error: any, result: any) => {
          if (_.isNull(result)) {
            consola.warn(`Attribute "${id.toString()}" does not exist`);
            resolve(false);
          }

          consola.debug(`Attribute "${id.toString()}" exists`);
          resolve(true);
        });
    });
  };

  /**
   * Create a new Attribute
   * @param {any} attribute all data associated with the new Attribute
   * @returns {Promise<AttributeModel>}
   */
  static create = (attribute: any): Promise<AttributeModel> => {
    return new Promise((resolve, _reject) => {
      // Generate a new identifier and join with Attribute data
      attribute["_id"] = getIdentifier("attribute");

      // Push data to database
      getDatabase()
        .collection(ATTRIBUTES)
        .insertOne(attribute, (error: any, _result: any) => {
          if (error) {
            consola.error("Error creating new Attribute:", error);
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
                _id: attribute._id,
                name: attribute.name,
              },
            }),
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            consola.debug("Created new Attribute:", attribute.name);
            resolve(attribute as AttributeModel);
          });
        });
    });
  };

  /**
   * Update an existing Attribute
   * @param {AttributeModel} updatedAttribute Object containing updated data for Attribute
   * @returns {Promise<AttributeModel>}
   */
  static update = (
    updatedAttribute: AttributeModel,
  ): Promise<AttributeModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ATTRIBUTES)
        .findOne({ _id: updatedAttribute._id }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error retrieving Attribute "${updatedAttribute._id}":`,
              error,
            );
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
                _id: updatedAttribute._id,
                name: updatedAttribute.name,
              },
            }),
          );

          getDatabase()
            .collection(ATTRIBUTES)
            .updateOne(
              { _id: updatedAttribute._id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error updating Attribute "${updatedAttribute._id}":`,
                    error,
                  );
                  throw error;
                }

                // Resolve all operations then resolve overall Promise
                Promise.all(operations).then((_result) => {
                  consola.debug("Updated Attribute:", updatedAttribute.name);

                  // Resolve the Promise
                  resolve(updatedAttribute);
                });
              },
            );
        });
    });
  };

  /**
   * Restore an Attribute that previously existed
   * @param {any} attribute Object containing data for the restored Attribute
   * @returns {Promise<AttributeModel>}
   */
  static restore = (attribute: any): Promise<AttributeModel> => {
    return new Promise((resolve, _reject) => {
      // Push data to database
      getDatabase()
        .collection(ATTRIBUTES)
        .insertOne(attribute, (error: any, _result: any) => {
          if (error) {
            consola.error(`Error restoring Attribute ${attribute._id}:`, error);
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
                _id: attribute._id,
                name: attribute.name,
              },
            }),
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            consola.debug("Restored Attribute:", attribute.name);
            resolve(attribute as AttributeModel);
          });
        });
    });
  };

  /**
   * Get a single Attribute
   * @param {string} id Attribute identifier
   * @returns {Promise<AttributeModel>}
   */
  static getOne = (id: string): Promise<AttributeModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ATTRIBUTES)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            consola.error(`Error retrieving Attribute "${id}":`, error);
            throw error;
          }

          consola.debug("Retrieved Attribute:", id.toString());
          resolve(result as AttributeModel);
        });
    });
  };

  /**
   * Get the collection of all Attributes
   * @returns {Promise<AttributeModel[]>}
   */
  static getAll = (): Promise<AttributeModel[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ATTRIBUTES)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            consola.error(`Error retrieving all Attributes:`, error);
            throw error;
          }
          consola.debug("Retrieved all Attributes");
          resolve(result as AttributeModel[]);
        });
    });
  };

  /**
   * Delete an Attribute from the system
   * @param id Attribute identifier to delete
   * @returns {Promise<AttributeModel>}
   */
  static delete = (id: string): Promise<AttributeModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ATTRIBUTES)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            consola.error(`Error retrieving Attribute "${id}":`, error);
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
                _id: attribute._id,
                name: attribute.name,
              },
            }),
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            // Delete the Attribute
            getDatabase()
              .collection(ATTRIBUTES)
              .deleteOne({ _id: id }, (error: any, _content: any) => {
                if (error) {
                  consola.error(`Error deleting Attribute "${id}":`, error);
                  throw error;
                }

                consola.debug("Deleted Attribute:", id.toString());
                resolve(result);
              });
          });
        });
    });
  };
}
