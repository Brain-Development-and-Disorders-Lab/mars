import { Activity } from "./Activity";
import { Attributes } from "./Attributes";
import { Collections } from "./Collections";
import { Entities } from "./Entities";
import { ActivityModel, AttributeModel, CollectionModel, EntityModel } from "@types";

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
      ]).then((data: [ActivityModel[], AttributeModel[], CollectionModel[], EntityModel[]]) => {
        // Create a temporary file, passing the filename as a response
        tmp.file((error, path: string, _fd: number) => {
          if (error) {
            reject(error);
            throw error;
          }

          fs.writeFileSync(path, JSON.stringify({
            timestamp: dayjs(Date.now()).toJSON(),
            activity: data[0],
            attributes: data[1],
            collections: data[2],
            entities: data[3],
          }));
          consola.success("Generated server backup");
          resolve(path);
        });
      });
    });
  };

  static import = (files: any): Promise<{ status: boolean, message: string }> => {
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

        // Check for valid information
        if (_.isUndefined(parsedFileData)) {
          reject({ message: "Error importing file" });
          return;
        }
        if (_.isUndefined(parsedFileData["timestamp"])) {
          reject({ message: "Error importing file, invalid timestamp" });
          return;
        }
        if (_.isUndefined(parsedFileData["entities"])) {
          reject({ message: "Error importing file, missing 'entities'" });
          return;
        }
        if (_.isUndefined(parsedFileData["collections"])) {
          reject({ message: "Error importing file, missing 'collections'" });
          return;
        }
        if (_.isUndefined(parsedFileData["attributes"])) {
          reject({ message: "Error importing file, missing 'attributes'" });
          return;
        }
        if (_.isUndefined(parsedFileData["activity"])) {
          reject({ message: "Error importing file, missing 'activity'" });
          return;
        }
        consola.success("File contents complete");

        // Import each part by checking if it exists, updating if so, otherwise creating
        consola.start("Importing file contents");

        // Import Entities
        consola.start("Importing Entities");
        const entityOperations = [];
        if (parsedFileData["entities"]) {
          const importedEntities = parsedFileData["entities"] as EntityModel[];
          for (let entity of importedEntities) {
            entityOperations.push(Entities.update(entity));
          }
        }

        // Import Collections
        consola.start("Importing Entities");
        const collectionOperations = [];
        if (parsedFileData["collections"]) {
          const importedCollections = parsedFileData["collections"] as CollectionModel[];
          for (let collection of importedCollections) {
            collectionOperations.push(Collections.update(collection));
          }
        }

        // Import Attributes
        consola.start("Importing Attributes");
        const attributeOperations = [];
        if (parsedFileData["attributes"]) {
          const importedAttributes = parsedFileData["attributes"] as AttributeModel[];
          for (let attribute of importedAttributes) {
            attributeOperations.push(Attributes.update(attribute));
          }
        }

        // Execute the import operations
        Promise.all([
          Promise.all(entityOperations),
          Promise.all(attributeOperations),
          Promise.all(collectionOperations),
        ]).then((results: [EntityModel[], AttributeModel[], CollectionModel[]]) => {
          consola.success("Imported", results[0].length, "Entities");
          consola.success("Imported", results[1].length, "Attributes");
          consola.success("Imported", results[2].length, "Collections");
          consola.success("Imported file:", receivedFile.name);
          resolve({ status: true, message: "Successfuly imported JSON file" });
        }).catch((_error) => {
          consola.error("Error importing file");
          reject({ message: "Error importing file" });
        });
      } else {
        consola.error("Error importing file");
        reject({ message: "Error importing file" });
      }
    });
  };
};
