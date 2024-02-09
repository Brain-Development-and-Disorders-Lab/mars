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
   * Check if a user exists in the database.
   * @param {string} orcid The ORCiD of the user to check.
   * @return {Promise<UserModel | null>} The user if found, or null if not.
   */
  static async exists(orcid: string): Promise<UserModel | null> {
    consola.start("Checking existence of user:", orcid);

    try {
      const database = getDatabase();
      const result = await database.collection(USERS).findOne({ _id: orcid });
      if (result) {
        consola.success("User exists:", orcid);
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
 * @return {Promise<UserModel>} The created user.
 */
  static async create(userData: UserModel): Promise<UserModel> {
    consola.start("Creating user:", userData?.name);

    try {
      const database = getDatabase();
      const result = await database.collection(USERS).insertOne(userData as any);
      if (result) {
        consola.success("User created successfully:", userData._id);
        return userData;
      } else {
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
   * @return {Promise<UserModel>} The updated user.
   */
  static async update(orcid: string, updateData: Partial<UserModel>): Promise<{ status: "success" | "error"; user?: UserModel }> {
    consola.start("Updating user:", orcid);

    try {
      const database = getDatabase();
      const result = await database.collection(USERS).findOneAndUpdate(
        { _id: orcid },
        { $set: updateData },
        { returnDocument: "after" } // This option may vary depending on the MongoDB driver version
      );

      if (result.ok && result.value) {
        consola.success("User updated successfully:", orcid);
        return { status: "success", user: result.value as any };
      } else {
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
   * @return {Promise<{ status: "success" | "error", user?: UserModel }>}
   */
  static get = (
    orcid: string
  ): Promise<{ status: "success" | "error"; user?: UserModel }> => {
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

  static validate = (
    orcid: string,
    resourceId: string,
    resourceType: "entity" | "project" | "attribute"
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
                    _.includes(project.shared, orcid)
                  );
                });
                break;
              }
            }
          } else {
            reject("Invalid permissions");
          }
        })
        .catch((_error) => {
          reject("Invalid permissions");
        });
    });
  };
}
