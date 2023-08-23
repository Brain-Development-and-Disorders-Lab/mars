// Existing and custom types
import { EntityModel, ProjectModel, UserModel } from "@types";

// Operations
import { Entities } from "./Entities";
import { Projects } from "./Projects";

// Utility libraries
import _ from "lodash";
import consola from "consola";

// Database
import { getDatabase } from "src/database/connection";

const USERS = "users";

export class Users {
  /**
   * Validate the ORCiD permissions of the user
   * @param {string} orcid the ORCiD to validate
   * @return {Promise<{ status: "success" | "error", user?: UserModel }>}
   */
  static get = (orcid: string): Promise<{ status: "success" | "error", user?: UserModel }> => {
    consola.start("Finding user", orcid);

    // Retrieve a token
    return new Promise((resolve, reject) => {
      getDatabase()
        .collection(USERS)
        .findOne({ _id: orcid }, (_error: any, result: any) => {
          if (_.isNull(result)) {
            consola.warn("User (ORCiD):", orcid.toString(), "does not exist");
            reject({ status: "error" });
          }

          consola.success("User (ORCiD):", orcid.toString(), "exists");
          resolve({ status: "success", user: result });
        });
    });
  };

  static validate = (orcid: string, resourceId: string, resourceType: "entity" | "project" | "attribute"): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      this.get(orcid).then(({ status }) => {
        if (_.isEqual(status, "success")) {
          switch (resourceType) {
            case "entity": {
              Entities.getOne(resourceId).then((entity: EntityModel) => {
                resolve(_.isEqual(entity.owner, orcid));
              });
              break;
            }
            case "project": {
              Projects.getOne(resourceId).then((project: ProjectModel) => {
                resolve(_.isEqual(project.owner, orcid) || _.includes(project.shared, orcid));
              });
              break;
            }
          }
        } else {
          reject("Invalid permissions");
        }
      }).catch((_error) => {
        reject("Invalid permissions");
      });
    });
  };
}
