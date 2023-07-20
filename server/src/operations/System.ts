import { Activity } from "./Activity";
import { Attributes } from "./Attributes";
import { Collections } from "./Collections";
import { Entities } from "./Entities";
import {
  ActivityModel,
  AttributeModel,
  CollectionModel,
  DeviceModel,
  EntityImport,
  EntityModel,
  IEntity,
  IValue,
} from "@types";

// Utility functions and libraries
import _ from "lodash";
import { consola } from "consola";
import dayjs from "dayjs";
import fs from "fs";
import tmp from "tmp";
import XLSX from "xlsx";

// Database operations
import { getSystem } from "src/database/connection";

// Constants
const DEVICES_COLLECTION = "devices";

export class System {
  static backup = (): Promise<string> => {
    consola.start("Starting system backup");
    return new Promise((resolve, reject) => {
      Promise.all([
        Activity.getAll(),
        Attributes.getAll(),
        Collections.getAll(),
        Entities.getAll(),
      ]).then(
        (
          data: [
            ActivityModel[],
            AttributeModel[],
            CollectionModel[],
            EntityModel[]
          ]
        ) => {
          // Create a temporary file, passing the filename as a response
          tmp.file((error, path: string, _fd: number) => {
            if (error) {
              reject(error);
              throw error;
            }

            fs.writeFileSync(
              path,
              JSON.stringify({
                timestamp: dayjs(Date.now()).toJSON(),
                activity: data[0],
                attributes: data[1],
                collections: data[2],
                entities: data[3],
              })
            );
            consola.success("Generated system backup");
            resolve(path);
          });
        }
      );
    });
  };

  static import = (
    files: any,
    type: "backup" | "spreadsheet"
  ): Promise<{ status: boolean; message: string; data?: any }> => {
    return new Promise((resolve, reject) => {
      if (files.file) {
        const receivedFile = files.file;
        const receivedFileData = receivedFile.data as Buffer;
        consola.start("Received file:", receivedFile.name);

        const entityOperations = [] as Promise<EntityModel>[];
        const collectionOperations = [] as Promise<CollectionModel>[];
        const attributeOperations = [] as Promise<AttributeModel>[];

        // Utility function to import Entities
        const importEntities = (parsedFileData: any) => {
          // Import Entities
          consola.start("Importing Entities");
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

        // Utility function to import Collections
        const importCollections = (parsedFileData: any) => {
          // Import Collections
          consola.start("Importing Entities");
          if (!_.isUndefined(parsedFileData["collections"])) {
            const importedCollections = parsedFileData[
              "collections"
            ] as CollectionModel[];
            for (let collection of importedCollections) {
              Collections.exists(collection._id).then((exists) => {
                if (exists) {
                  collectionOperations.push(Collections.update(collection));
                } else {
                  collectionOperations.push(Collections.restore(collection));
                }
              });
            }
          }
        };

        // Utility function to import Attributes
        const importAttribute = (parsedFileData: any) => {
          // Import Attributes
          consola.start("Importing Attributes");
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

        // Handle a backup file in JSON format
        if (_.isEqual(type, "backup")) {
          // Parse the JSON data
          let parsedFileData;
          try {
            parsedFileData = JSON.parse(receivedFileData.toString("utf-8"));
            consola.success("Parsed backup JSON file");
          } catch (error) {
            consola.error("Error parsing backup JSON file");
            reject({
              message: "Error importing file, could not parse JSON content",
            });
            return;
          }

          // Utility function to check if a file contains fields
          const checkFields = (parsedFileData: any, fields: string[]) => {
            for (let field of fields) {
              if (_.isUndefined(parsedFileData[field])) {
                return false;
              }
            }
            return true;
          };

          // Check parsed data
          if (_.isUndefined(parsedFileData)) {
            reject({ message: "Error importing backup JSON file" });
            return;
          }

          if (_.isEqual(type, "backup")) {
            // Check that the backup file contains all required fields
            if (
              checkFields(parsedFileData, [
                "timestamp",
                "entities",
                "collections",
                "attributes",
                "activity",
              ])
            ) {
              consola.info("Importing backup JSON file");
            } else {
              consola.error("Missing fields in backup JSON file");
              reject({ message: "Invalid backup JSON file, check contents" });
              return;
            }
          }

          // Import each part by checking if it exists, updating if so, otherwise creating
          consola.start("Importing backup JSON file contents");

          importEntities(parsedFileData);
          importCollections(parsedFileData);
          importAttribute(parsedFileData);

          // Execute all import operations
          Promise.all([
            Promise.all(entityOperations),
            Promise.all(collectionOperations),
            Promise.all(attributeOperations),
          ])
            .then(
              (
                results: [EntityModel[], CollectionModel[], AttributeModel[]]
              ) => {
                consola.success("Imported", results[0].length, "Entities");
                consola.success("Imported", results[1].length, "Collections");
                consola.success("Imported", results[2].length, "Attributes");
                consola.success("Imported file:", receivedFile.name);
                resolve({
                  status: true,
                  message: "Successfuly imported backup JSON file",
                });
              }
            )
            .catch((_error) => {
              consola.error("Error importing backup JSON file");
              reject({ message: "Error importing backup JSON file" });
            });
        } else if (_.isEqual(type, "spreadsheet")) {
          const spreadsheet = XLSX.read(receivedFileData);
          if (spreadsheet.SheetNames.length > 0) {
            const primarySheet = spreadsheet.Sheets[spreadsheet.SheetNames[0]];
            const parsedSheet = XLSX.utils.sheet_to_json(primarySheet, {
              defval: "",
            });
            resolve({
              status: true,
              message: "Parsed spreadsheet successfully",
              data: parsedSheet,
            });
          } else {
            reject({ message: "No sheets in spreadsheet" });
          }
        }
      } else {
        consola.error("Error importing file");
        reject({ message: "Error importing file" });
      }
    });
  };

  static mapData = (
    entityFields: EntityImport,
    spreadsheetData: any[]
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
              return {
                identifier: value.identifier,
                name: value.name,
                type: value.type,
                data: row[value.data],
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
          collections: [],
          associations: {
            origins: [],
            products: [],
          },
          attributes: attributes,
          history: [],
        });
      });

      Promise.all(
        entities.map((entity) => {
          // Create all Entities
          return Entities.create(entity);
        })
      )
        .then((entities: EntityModel[]) => {
          // Additional operations
          const operations = [] as Promise<any>[];

          // Add all Entities to the Collection (if specified)
          if (!_.isEqual(entityFields.collections, "")) {
            operations.push(
              Collections.addEntities(
                entityFields.collections,
                entities.map((entity) => entity._id)
              )
            );

            // Add Collection to each Entity
            entities.map((entity) => {
              operations.push(
                Entities.addCollection(entity._id, entityFields.collections)
              );
            });
          }

          const minimalEntities = entities.map((entity) => {
            return { id: entity._id, name: entity.name };
          });

          // Add Products to Entities (if Origins specified)
          if (!_.isEmpty(entityFields.origins)) {
            // Add all Products to each Origin
            entityFields.origins.map((origin: { id: string; name: string }) => {
              operations.push(Entities.addProducts(origin, minimalEntities));
            });

            // Add all Origins to each Product
            minimalEntities.map((entity) => {
              operations.push(
                Entities.addOrigins(entity, entityFields.origins)
              );
            });
          }

          // Add Origins to Entities (if Products specified)
          if (!_.isEmpty(entityFields.products)) {
            // Add all Origins to each Product
            entityFields.products.map(
              (product: { id: string; name: string }) => {
                operations.push(Entities.addOrigins(product, minimalEntities));
              }
            );

            // Add all Products to each Origin
            minimalEntities.map((entity) => {
              operations.push(
                Entities.addProducts(entity, entityFields.products)
              );
            });
          }

          Promise.all(operations).then((_result) => {
            resolve(entities);
          });
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  };

  static upload = (files: any, target: string): Promise<{ status: boolean; message: string; data?: any }> => {
    return Entities.upload(files, target);
  };

  static getDevice = (id: string): Promise<DeviceModel> => {
    consola.start("Retrieving Device (id):", id.toString());
    return new Promise((resolve, reject) => {
      getSystem()
        .collection(DEVICES_COLLECTION)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            reject(error);
            throw error;
          }

          consola.success("Retrieved Device (id):", id.toString());
          resolve(result as DeviceModel);
        });
    });
  };

  static getDevices = (): Promise<DeviceModel[]> => {
    consola.start("Retrieving Devices");
    return new Promise((resolve, reject) => {
      getSystem()
        .collection(DEVICES_COLLECTION)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            reject(error);
            throw error;
          }

          consola.success("Retrieved", result.length, "Devices");
          resolve(result as DeviceModel[]);
        });
    });
  };
}
