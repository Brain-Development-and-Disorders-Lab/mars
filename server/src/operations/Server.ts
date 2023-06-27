import { Activity } from "./Activity";
import { Attributes } from "./Attributes";
import { Collections } from "./Collections";
import { Entities } from "./Entities";
import { ActivityModel, AttributeModel, CollectionModel, EntityModel } from "@types";

import { consola } from "consola";
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
};
