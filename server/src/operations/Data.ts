import { Activity } from "./Activity";
import { Attributes } from "./Attributes";
import { Projects } from "./Projects";
import { Entities } from "./Entities";
import {
  ActivityModel,
  AttributeModel,
  ProjectModel,
  EntityImport,
  EntityModel,
  IEntity,
  IValue,
  Item,
} from "@types";

// Utility functions and libraries
import _ from "lodash";
import { consola } from "consola";
import dayjs from "dayjs";
import fs from "fs";
import { FindCursor, GridFSBucketReadStream, ObjectId } from "mongodb";
import tmp from "tmp";
import XLSX from "xlsx";

// Database operations
import { getAttachments } from "../database/connection";

export class Data {
  /**
   * Generate a complete system backup in JSON format
   * @returns {Promise<string>}
   */
  static backup = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      Promise.all([
        Activity.getAll(),
        Attributes.getAll(),
        Projects.getAll(),
        Entities.getAll(),
      ]).then(
        (
          data: [
            ActivityModel[],
            AttributeModel[],
            ProjectModel[],
            EntityModel[],
          ],
        ) => {
          // Create a temporary file, passing the filename as a response
          tmp.file((error, path: string, _fd: number) => {
            if (error) {
              consola.error(
                "Error while creating temporary file for backup:",
                error,
              );
              reject("Error creating temporary file");
              throw error;
            }

            fs.writeFileSync(
              path,
              JSON.stringify({
                timestamp: dayjs(Date.now()).toJSON(),
                activity: data[0],
                attributes: data[1],
                projects: data[2],
                entities: data[3],
              }),
            );
            consola.debug("Generated system backup");
            resolve(path);
          });
        },
      );
    });
  };

  /**
   * Import JSON data
   * @param {any} importData Data to import
   * @returns {Promise<{ status: boolean; message: string; data?: any }>}
   */
  static importJSON = async (
    importData: any,
  ): Promise<{ status: boolean; message: string; data?: any }> => {
    try {
      // Validate importData here (if necessary)
      // ...
      // Iterate through the importData and update the database
      for (const item of importData.entities) {
        // Assuming 'Entities' is your Mongoose model and item._id is the identifier
        // const entityId = item._id;
        // delete item._id; // Remove the ID from the item if you don't want to replace it

        // Update or insert the item in the database
        // You can use 'updateOne', 'findByIdAndUpdate', or similar methods based on your exact requirements
        await Entities.upsert(
          item, // Option to insert a new document if the entity does not exist
        );
      }

      // If everything goes well, send a success response
      return {
        status: true,
        message: "JSON data successfully imported.",
        data: null, // or include any relevant data here
      };
    } catch (error) {
      // Handle any errors that occur during the process
      consola.error("Error importing JSON data:", error);
      return {
        status: false,
        message: "Failed to import JSON data.",
        data: null, // or include error details here
      };
    }
  };

  /**
   * Import file by MIME type
   * @param {any} files Object containing file data
   * @param {string} type MIME type of the file being uploaded
   * @returns {Promise<{ status: boolean; message: string; data?: any }>}
   */
  static import = (
    files: any,
    type: "text/csv" | "application/json",
  ): Promise<{ status: boolean; message: string; data?: any }> => {
    return new Promise((resolve, reject) => {
      if (files.file) {
        const receivedFile = files.file;
        const receivedFileData = receivedFile.data as Buffer;
        consola.debug("Received file:", receivedFile.name);

        const entityOperations = [] as Promise<EntityModel>[];
        const projectsOperations = [] as Promise<ProjectModel>[];
        const attributeOperations = [] as Promise<AttributeModel>[];

        // Utility function to import Entities
        const importEntities = (parsedFileData: any) => {
          // Import Entities
          if (parsedFileData["entities"]) {
            // Run differently if a backup file
            const importedEntities = parsedFileData[
              "entities"
            ] as EntityModel[];
            for (let entity of importedEntities) {
              Entities.exists(entity._id).then((exists) => {
                if (exists) {
                  entityOperations.push(Entities.update(entity));
                } else {
                  entityOperations.push(Entities.restore(entity));
                }
              });
            }
          } else {
            consola.warn("Not implemented, cannot import individual Entities");
            reject({
              message:
                "Not implemented, only backup JSON files can be imported",
            });
          }
        };

        // Utility function to import Projects
        const importProjects = (parsedFileData: any) => {
          // Import Projects
          if (!_.isUndefined(parsedFileData["projects"])) {
            const importedProjects = parsedFileData[
              "projects"
            ] as ProjectModel[];
            for (let project of importedProjects) {
              Projects.exists(project._id).then((exists) => {
                if (exists) {
                  projectsOperations.push(Projects.update(project));
                } else {
                  projectsOperations.push(Projects.restore(project));
                }
              });
            }
          }
        };

        // Utility function to import Attributes
        const importAttribute = (parsedFileData: any) => {
          // Import Attributes
          if (!_.isUndefined(parsedFileData["attributes"])) {
            const importedAttributes = parsedFileData[
              "attributes"
            ] as AttributeModel[];
            for (let attribute of importedAttributes) {
              Attributes.exists(attribute._id).then((exists) => {
                if (exists) {
                  attributeOperations.push(Attributes.update(attribute));
                } else {
                  attributeOperations.push(Attributes.restore(attribute));
                }
              });
            }
          }
        };

        // Handle import depending on file format
        if (_.isEqual(type, "application/json")) {
          // JSON format
          consola.debug("Importing JSON file:", files.file.name);
          const parsedFileData = JSON.parse(receivedFileData.toString("utf-8"));
          importEntities(parsedFileData);
          importProjects(parsedFileData);
          importAttribute(parsedFileData);

          // Execute all import operations
          Promise.all([
            Promise.all(entityOperations),
            Promise.all(projectsOperations),
            Promise.all(attributeOperations),
          ])
            .then(
              (results: [EntityModel[], ProjectModel[], AttributeModel[]]) => {
                consola.debug("Imported", results[0].length, "Entities");
                consola.debug("Imported", results[1].length, "Projects");
                consola.debug("Imported", results[2].length, "Attributes");
                consola.debug("Imported file:", receivedFile.name);
                resolve({
                  status: true,
                  message: "Successfuly imported JSON file",
                });
              },
            )
            .catch((error) => {
              consola.error("Error importing JSON file:", error);
              reject({ message: "Error importing JSON file" });
            });
        } else if (_.isEqual(type, "text/csv")) {
          // CSV format
          consola.debug("Importing CSV file:", files.file.name);
          const csvData = XLSX.read(receivedFileData, { cellDates: true });
          if (csvData.SheetNames.length > 0) {
            const primarySheet = csvData.Sheets[csvData.SheetNames[0]];
            const parsedSheet = XLSX.utils.sheet_to_json(primarySheet, {
              defval: "",
            });
            consola.debug("Parsed CSV file:", files.file.name);
            resolve({
              status: true,
              message: "Parsed CSV file successfully",
              data: parsedSheet,
            });
          } else {
            consola.warn("No data contained in CSV file");
            reject({ message: "No sheets in spreadsheet" });
          }
        }

        // Note: The following code is for importing a "backup"-style JSON file that
        // contains a specific set of fields. Removed since we don't use this
        // functionality on the frontend if this is a user-facing application.

        // Parse the JSON data
        // let parsedFileData;
        // try {
        //   parsedFileData = JSON.parse(receivedFileData.toString("utf-8"));
        //   consola.success("Parsed backup JSON file");
        // } catch (error) {
        //   consola.error("Error parsing backup JSON file");
        //   reject({
        //     message: "Error importing file, could not parse JSON content",
        //   });
        //   return;
        // }

        // // Utility function to check if a file contains fields
        // const checkFields = (parsedFileData: any, fields: string[]) => {
        //   for (let field of fields) {
        //     if (_.isUndefined(parsedFileData[field])) {
        //       return false;
        //     }
        //   }
        //   return true;
        // };

        // // Check parsed data
        // if (_.isUndefined(parsedFileData)) {
        //   reject({ message: "Error importing backup JSON file" });
        //   return;
        // }

        // if (_.isEqual(type, "application/json")) {
        //   // Check that the backup file contains all required fields
        //   if (
        //     checkFields(parsedFileData, [
        //       "timestamp",
        //       "entities",
        //       "projects",
        //       "attributes",
        //       "activity",
        //     ])
        //   ) {
        //     consola.info("Importing backup JSON file");
        //   } else {
        //     consola.error("Missing fields in backup JSON file");
        //     reject({ message: "Invalid backup JSON file, check contents" });
        //     return;
        //   }
        // }

        // // Import each part by checking if it exists, updating if so, otherwise creating
        // consola.start("Importing backup JSON file contents");

        // importEntities(parsedFileData);
        // importProjects(parsedFileData);
        // importAttribute(parsedFileData);

        // // Execute all import operations
        // Promise.all([
        //   Promise.all(entityOperations),
        //   Promise.all(projectsOperations),
        //   Promise.all(attributeOperations),
        // ])
        //   .then(
        //     (results: [EntityModel[], ProjectModel[], AttributeModel[]]) => {
        //       consola.success("Imported", results[0].length, "Entities");
        //       consola.success("Imported", results[1].length, "Projects");
        //       consola.success("Imported", results[2].length, "Attributes");
        //       consola.success("Imported file:", receivedFile.name);
        //       resolve({
        //         status: true,
        //         message: "Successfuly imported backup JSON file",
        //       });
        //     }
        //   )
        //   .catch((_error) => {
        //     consola.error("Error importing backup JSON file");
        //     reject({ message: "Error importing backup JSON file" });
        //   });
      } else {
        consola.error("Error importing file");
        reject({ message: "Error importing file" });
      }
    });
  };

  /**
   * Asynchronously maps spreadsheet data to Entities based on specified Entity fields.
   * @param {EntityImport} entityFields The import configuration specifying Entity fields.
   * @param {any[]} spreadsheetData An array of data rows from a spreadsheet to map to Entities.
   * @returns {Promise<EntityModel[]>} Resolves with an array of created Entity models.
   * @throws {Error} Throws an error if there are issues during the mapping or creation process.
   */
  static mapData = (
    entityFields: EntityImport,
    spreadsheetData: any[],
  ): Promise<EntityModel[]> => {
    return new Promise((resolve, reject) => {
      // Extract Entities
      const entities = [] as IEntity[];

      spreadsheetData.map((row) => {
        const attributes = [] as AttributeModel[];
        // Extract Attributes
        entityFields.attributes.map((attribute) => {
          attributes.push({
            _id: attribute._id,
            name: attribute.name,
            description: attribute.description,
            values: attribute.values.map((value: IValue<any>) => {
              // Clean the data for specific types
              let valueData = row[value.data];
              if (_.isEqual(value.type, "date")) {
                // "date" type
                valueData = dayjs(row[value.data]).format("YYYY-MM-DD");
              }
              if (_.isEqual(value.type, "select")) {
                // "select" type
                valueData = {
                  selected: row[value.data],
                  options: [row[value.data]],
                };
              }
              return {
                identifier: value.identifier,
                name: value.name,
                type: value.type,
                data: valueData,
              };
            }),
          });
        });

        entities.push({
          deleted: false,
          locked: false,
          name: row[entityFields.name],
          owner: entityFields.owner,
          created: dayjs(Date.now()).toISOString(),
          description: row[entityFields.description],
          projects: [],
          associations: {
            origins: [], // Clear Origins list
            products: [], // Clear Products list
          },
          attributes: attributes,
          attachments: [],
          history: [],
        });
      });

      Promise.all(
        entities.map((entity) => {
          // Create all Entities
          return Entities.create(entity);
        }),
      )
        .then((entities: EntityModel[]) => {
          // Additional operations
          const operations = [] as Promise<any>[];

          // Add all Entities to the Project (if specified)
          if (!_.isEqual(entityFields.projects, "")) {
            operations.push(
              Projects.addEntities(
                entityFields.projects,
                entities.map((entity) => entity._id),
              ),
            );

            // Add Project to each Entity
            entities.map((entity) => {
              operations.push(
                Entities.addProject(entity._id, entityFields.projects),
              );
            });
          }

          const minimalEntities = entities.map((entity) => {
            return { _id: entity._id, name: entity.name };
          });

          // Add Products to Entities (if Origins specified)
          if (!_.isEmpty(entityFields.origins)) {
            // Add all Products to each Origin
            entityFields.origins.map((origin: Item) => {
              operations.push(Entities.addProducts(origin, minimalEntities));
            });

            // Add all Origins to each Product
            minimalEntities.map((entity) => {
              operations.push(
                Entities.addOrigins(entity, entityFields.origins),
              );
            });
          }

          // Add Origins to Entities (if Products specified)
          if (!_.isEmpty(entityFields.products)) {
            // Add all Origins to each Product
            entityFields.products.map((product: Item) => {
              operations.push(Entities.addOrigins(product, minimalEntities));
            });

            // Add all Products to each Origin
            minimalEntities.map((entity) => {
              operations.push(
                Entities.addProducts(entity, entityFields.products),
              );
            });
          }

          Promise.all(operations).then((_result) => {
            resolve(entities);
          });
        })
        .catch((error) => {
          consola.error("Error while mapping imported data:", error);
          reject(error);
        });
    });
  };

  /**
   * Wrapper function to add an attachment to an Entity
   * @param files Attachment data
   * @param target Target Entity to add attachment
   * @returns {Promise<{ status: boolean; message: string; data?: any }>}
   */
  static upload = (
    files: any,
    target: string,
  ): Promise<{ status: boolean; message: string; data?: any }> => {
    return Entities.upload(files, target);
  };

  /**
   * Download a file stored in MongoDB
   * @param id Identifier of file to download
   * @returns {Promise<{ status: boolean; stream: GridFSBucketReadStream }>}
   */
  static download = (
    id: string,
  ): Promise<{ status: boolean; stream: GridFSBucketReadStream }> => {
    return new Promise((resolve, _reject) => {
      // Access bucket and create open stream to write to storage
      const bucket = getAttachments();

      // Create stream from buffer
      const downloadStream = bucket.openDownloadStream(new ObjectId(id));

      consola.debug("Retrieved file:", id.toString());
      resolve({ status: true, stream: downloadStream });
    });
  };

  /**
   * Retrieve information about a specific file stored in MongoDB
   * @param id File identifier
   * @returns {Promise<{ status: boolean; data: any[] }>}
   */
  static getFileInformation = (
    id: string,
  ): Promise<{ status: boolean; data: any[] }> => {
    return new Promise((resolve, _reject) => {
      // Access bucket and create open stream to write to storage
      const bucket = getAttachments();

      // Locate the file
      const result: FindCursor = bucket.find({ _id: new ObjectId(id) });

      result.toArray().then((file) => {
        consola.debug("Retrieved information for file:", id.toString());
        resolve({ status: true, data: file });
      });
    });
  };
}
