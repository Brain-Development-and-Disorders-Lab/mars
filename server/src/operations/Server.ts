import { Activity } from "./Activity";
import { Attributes } from "./Attributes";
import { Collections } from "./Collections";
import { Entities } from "./Entities";
import {
  ActivityModel,
  AttributeModel,
  CollectionModel,
  EntityModel,
} from "@types";

// Utility functions and libraries
import _ from "lodash";
import { consola } from "consola";
import dayjs from "dayjs";
import fs from "fs";
import tmp from "tmp";

export class Server {
  static backup = (): Promise<string> => {
    consola.start("Starting server backup");
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
            consola.success("Generated server backup");
            resolve(path);
          });
        }
      );
    });
  };

  static import = (
    files: any
  ): Promise<{ status: boolean; message: string }> => {
    consola.start("Received file for import");
    return new Promise((resolve, reject) => {
      if (files.file) {
        const receivedFile = files.file;
        const receivedFileData = receivedFile.data as Buffer;
        consola.info("Received file:", receivedFile.name);

        // Parse the JSON data
        let parsedFileData;
        try {
          parsedFileData = JSON.parse(receivedFileData.toString("utf-8"));
          consola.success("Parsed JSON file");
        } catch (error) {
          consola.error("Error parsing JSON file");
          reject({ message: "Error importing file, could not parse JSON" });
          return;
        }

        // Attempt to determine the file type from the contents
        let fileType = "unknown" as "unknown" | "backup" | "entity" | "collection" | "attribute";

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
          reject({ message: "Error importing file" });
          return;
        }

        if (checkFields(parsedFileData, ["timestamp", "entities", "collections", "attributes", "activity"])) {
          // "backup" file type
          fileType = "backup";
          consola.info("Importing backup file");
        } else if (checkFields(parsedFileData, ["name", "owner", "description", "associations", "collections", "attributes"])) {
          // "entity" file type
          fileType = "entity";
          consola.info("Importing Entity file");
        } else if (checkFields(parsedFileData, ["name", "description", "owner", "created", "entities", "history"])) {
          // "collection" file type
          fileType = "collection";
          consola.info("Importing Collection file");
        } else if (checkFields(parsedFileData, ["name", "description", "values"])) {
          // "attribute" file type
          fileType = "attribute";
          consola.info("Importing Attribute file");
        } else {
          reject({ message: "Unknown file type, check contents" });
          return;
        }

        consola.success("File contents complete");

        // Import each part by checking if it exists, updating if so, otherwise creating
        consola.start("Importing file contents");

        const entityOperations = [] as Promise<EntityModel>[];
        const collectionOperations = [] as Promise<CollectionModel>[];
        const attributeOperations = [] as Promise<AttributeModel>[];

        // Utility function to import Entities
        const importEntities = (parsedFileData: any) => {
          // Import Entities
          consola.start("Importing Entities");
          if (parsedFileData["entities"]) {
            // Run differently if a backup file
            const importedEntities = parsedFileData["entities"] as EntityModel[];
            for (let entity of importedEntities) {
              entityOperations.push(Entities.update(entity));
            }
          } else {
            consola.warn("Not implemented, cannot import individual Entities");
            reject({ message: "Not implemented, only backups can be imported" });
          }
        }

        // Utility function to import Collections
        const importCollections = (parsedFileData: any) => {
          // Import Collections
          consola.start("Importing Entities");
          if (parsedFileData["collections"]) {
            const importedCollections = parsedFileData[
              "collections"
            ] as CollectionModel[];
            for (let collection of importedCollections) {
              collectionOperations.push(Collections.update(collection));
            }
          }
        }

        // Utility function to import Attributes
        const importAttribute = (parsedFileData: any) => {
          // Import Attributes
          consola.start("Importing Attributes");
          if (parsedFileData["attributes"]) {
            const importedAttributes = parsedFileData[
              "attributes"
            ] as AttributeModel[];
            for (let attribute of importedAttributes) {
              attributeOperations.push(Attributes.update(attribute));
            }
          }
        }

        // Run utility functions depending on the type of file
        if (_.isEqual(fileType, "entity")) {
          importEntities(parsedFileData);
        } else if (_.isEqual(fileType, "collection")) {
          importCollections(parsedFileData);
        } else if (_.isEqual(fileType, "attribute")) {
          importAttribute(parsedFileData);
        } else if (_.isEqual(fileType, "backup")) {
          importEntities(parsedFileData);
          importCollections(parsedFileData);
          importAttribute(parsedFileData);
        }

        // Execute all import operations
        Promise.all([
          Promise.all(entityOperations),
          Promise.all(attributeOperations),
          Promise.all(collectionOperations),
        ])
          .then(
            (results: [EntityModel[], AttributeModel[], CollectionModel[]]) => {
              consola.success("Imported", results[0].length, "Entities");
              consola.success("Imported", results[1].length, "Attributes");
              consola.success("Imported", results[2].length, "Collections");
              consola.success("Imported file:", receivedFile.name);
              resolve({
                status: true,
                message: "Successfuly imported JSON file",
              });
            }
          )
          .catch((_error) => {
            consola.error("Error importing file");
            reject({ message: "Error importing file" });
          });
      } else {
        consola.error("Error importing file");
        reject({ message: "Error importing file" });
      }
    });
  };
}
