import { Activity } from "./Activity";
import { Attributes } from "./Attributes";
import { Collections } from "./Collections";
import { Entities } from "./Entities";
import { ActivityModel, AttributeModel, CollectionModel, EntityModel } from "@types";

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

  static import = (files: any): Promise<boolean> => {
    consola.start("Received file for import");
    return new Promise((resolve, reject) => {
      if (files.file) {
        const receivedFile = files.file;
        consola.info("Received file:", receivedFile.name);

        // Copy file to local directory
        receivedFile.mv(`${__dirname}/${receivedFile.name}`).err;

        const receivedFileData = receivedFile.data as Buffer;

        let parsedFileData;
        try {
          parsedFileData = JSON.parse(receivedFileData.toString("utf-8"));
          consola.success("Parsed JSON file");
          consola.info("Version:", parsedFileData["timestamp"]);
          consola.info("Entities:", parsedFileData["entities"].length);
          consola.info("Collections:", parsedFileData["collections"].length);
          consola.info("Attributes:", parsedFileData["attributes"].length);
          consola.info("Activity:", parsedFileData["activity"].length, "entries");
        } catch (error) {
          consola.error("Error parsing JSON file");
          reject(false);
        }

        // Import each part by checking if it exists, updating if so, otherwise creating
        consola.start("Importing file contents");

        // Import Entities
        consola.start("Importing Entities");
        const importedEntities = parsedFileData["entities"] as EntityModel[];
        const entityOperations = [];
        for (let entity of importedEntities) {
          entityOperations.push(Entities.update(entity));
        }

        // Import Collections
        consola.start("Importing Entities");
        const importedCollections = parsedFileData["collections"] as CollectionModel[];
        const collectionOperations = [];
        for (let collection of importedCollections) {
          collectionOperations.push(Collections.update(collection));
        }

        // Import Attributes
        consola.start("Importing Attributes");
        const importedAttributes = parsedFileData["attributes"] as AttributeModel[];
        const attributeOperations = [];
        for (let attribute of importedAttributes) {
          attributeOperations.push(Attributes.update(attribute));
        }

        Promise.all([
          Promise.all(entityOperations),
          Promise.all(attributeOperations),
          Promise.all(collectionOperations),
        ]).then((results: [EntityModel[], AttributeModel[], CollectionModel[]]) => {
          consola.success("Imported", results[0].length, "Entities");
          consola.success("Imported", results[1].length, "Attributes");
          consola.success("Imported", results[2].length, "Collections");
          consola.success("Imported file:", receivedFile.name);
          resolve(true);
        }).catch((_error) => {
          consola.error("Error importing file");
          reject(false);
        });
      } else {
        consola.error("Error importing file");
        reject(false);
      }
    });
  };
};
