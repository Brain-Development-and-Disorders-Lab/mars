// Existing and custom types
import { EntityModel, ProjectModel, UserModel } from "@types";

// Operations
import { Entities } from "./Entities";
import { Projects } from "./Projects";

// Utility libraries
import _ from "lodash";
import consola from "consola";

// Database
import { getDatabase } from "../database/connection";

const USERS = "users";

export class Users {
  /**
   * Check if a user exists in the database.
   * @param {string} orcid The ORCiD of the user to check.
   * @returns {Promise<UserModel | null>} The user if found, or null if not.
   */
  static async exists(orcid: string): Promise<UserModel | null> {
    try {
      const database = getDatabase();
      const result = await database.collection(USERS).findOne({ _id: orcid });
      if (result) {
        consola.debug("User exists:", orcid);
        return result as unknown as UserModel;
      } else {
        consola.warn("User does not exist:", orcid);
        return null;
      }
    } catch (error) {
      consola.error("Error checking user existence:", error);
      throw error;
    }
  }

  /**
   * Create a new user in the database.
   * @param {UserModel} userData The user data to create.
   * @returns {Promise<UserModel>} The created user.
   */
  static async create(userData: UserModel): Promise<UserModel> {
    try {
      const database = getDatabase();
      const result = await database
        .collection(USERS)
        .insertOne(userData as any);
      if (result) {
        consola.debug("User created successfully:", userData._id);
        return userData;
      } else {
        consola.error("User creation not acknowledged by database");
        throw new Error("User creation not acknowledged by database");
      }
    } catch (error) {
      consola.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Update an existing user in the database.
   * @param {string} orcid The ORCiD of the user to update.
   * @param {Partial<UserModel>} updateData The data to update.
   * @returns {Promise<UserModel>} The updated user.
   */
  static async update(
    orcid: string,
    updateData: Partial<UserModel>,
  ): Promise<{ status: "success" | "error"; user?: UserModel }> {
    try {
      const database = getDatabase();
      const result = await database.collection(USERS).findOneAndUpdate(
        { _id: orcid },
        { $set: updateData },
        { returnDocument: "after" }, // This option may vary depending on the MongoDB driver version
      );

      if (result.ok && result.value) {
        consola.debug("User updated successfully:", orcid);
        return { status: "success", user: result.value as any };
      } else {
        consola.error("User update failed or user not found:", orcid);
        throw new Error(`User update failed or user not found: ${orcid}`);
      }
    } catch (error) {
      consola.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Validate the ORCiD permissions of the user
   * @param {string} orcid the ORCiD to validate
   * @returns {Promise<{ status: "success" | "error", user?: UserModel }>}
   */
  static get = (
    orcid: string,
  ): Promise<{ status: "success" | "error"; user?: UserModel }> => {
    // Retrieve a token
    return new Promise((resolve, reject) => {
      getDatabase()
        .collection(USERS)
        .findOne({ _id: orcid }, (_error: any, result: any) => {
          if (_.isNull(result)) {
            consola.warn("User does not exist with ORCiD:", orcid.toString());
            reject({ status: "error" });
          }

          consola.debug("User exists with ORCiD:", orcid.toString());
          resolve({ status: "success", user: result });
        });
    });
  };

  /**
   * Validate the permissions of an ORCiD to access a specific resource
   * @param orcid ORCiD identifier of a user
   * @param resourceId Identifier of an Entity, Project, or Attribute
   * @param resourceType The type of the resource (Entity, Project, Attribute)
   * @returns {Promise<boolean>}
   */
  static validate = (
    orcid: string,
    resourceId: string,
    resourceType: "entity" | "project" | "attribute",
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      this.get(orcid)
        .then(({ status }) => {
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
                  resolve(
                    _.isEqual(project.owner, orcid) ||
                      _.includes(project.shared, orcid),
                  );
                });
                break;
              }
            }
          } else {
            consola.warn(
              `Invalid permissions for ORCiD "${orcid}" to access:`,
              resourceId,
            );
            reject("Invalid permissions");
          }
        })
        .catch((error) => {
          consola.warn(`Invalid permissions for ORCiD "${orcid}":`, error);
          reject("Invalid permissions");
        });
    });
  };
}
