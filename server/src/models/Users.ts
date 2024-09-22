// Custom types
import { ResponseMessage, UserModel } from "@types";

import _ from "lodash";
import { getDatabase } from "../connectors/database";
import dayjs from "dayjs";

// Models
import { Entities } from "./Entities";
import { Projects } from "./Projects";
import { Workspaces } from "./Workspaces";

// Collection name
const USERS_COLLECTION = "users";

export class Users {
  /**
   * Get all User entries from the Users collection
   * @returns Collection of all User entries
   */
  static all = async (): Promise<UserModel[]> => {
    return await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .find()
      .toArray();
  };

  static getOne = async (orcid: string): Promise<UserModel | null> => {
    return await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .findOne({ _id: orcid });
  };

  static exists = async (orcid: string): Promise<boolean> => {
    const result = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .findOne({ _id: orcid });

    return !_.isNull(result);
  };

  /**
   * Get the collection of Workspaces the User has access to
   * @param orcid User ORCiD
   * @return {Promise<string[]>}
   */
  static getWorkspaces = async (orcid: string): Promise<string[]> => {
    const result = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .findOne({ _id: orcid });

    if (result?.workspaces) {
      return result.workspaces;
    }
    return [];
  };

  /**
   * Add a Workspace to the collection a User has access to
   * @param orcid User ORCiD
   * @param workspace Workspace to assign the User access to
   * @return {Promise<ResponseMessage>}
   */
  static addWorkspace = async (
    orcid: string,
    workspace: string,
  ): Promise<ResponseMessage> => {
    const result = await Users.getOne(orcid);

    // Attempt to update the `UserModel` with the Workspace
    if (result?.workspaces) {
      result.workspaces.push(workspace);
      return await Users.update(result);
    }

    return {
      success: false,
      message: "Unable to add Workspace to User",
    };
  };

  static update = async (updated: UserModel): Promise<ResponseMessage> => {
    const user = await this.getOne(updated._id);

    if (_.isNull(user)) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const update: { $set: UserModel } = {
      $set: {
        ...user,
      },
    };

    if (updated.firstName) {
      update.$set.firstName = updated.firstName;
    }

    if (updated.lastName) {
      update.$set.lastName = updated.lastName;
    }

    if (updated.email) {
      update.$set.email = updated.email;
    }

    if (updated.affiliation) {
      update.$set.affiliation = updated.affiliation;
    }

    if (updated.workspaces) {
      update.$set.workspaces = updated.workspaces;
    }

    const response = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .updateOne({ _id: updated._id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Updated User successfully"
        : "Unable to update User",
    };
  };

  static create = async (user: UserModel): Promise<ResponseMessage> => {
    const response = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .insertOne(user);

    return {
      success: response.insertedId === user._id,
      message:
        response.insertedId === user._id
          ? "Successfully created User"
          : "Error creating User",
    };
  };

  static bootstrap = async (
    user: string,
    workspace: string,
  ): Promise<ResponseMessage> => {
    const project = await Projects.create({
      name: "My First Project",
      archived: false,
      created: dayjs(Date.now()).toISOString(),
      description:
        "This is your first Project. Feel free to explore and modify it!",
      owner: user,
      entities: [], // Assuming you can add entities later
      collaborators: [], // Assuming you might want collaborators
      history: [],
    });
    await Workspaces.addProject(workspace, project.message);

    const entity = await Entities.create({
      name: "Example Entity",
      archived: false,
      created: dayjs(Date.now()).toISOString(),
      description: "This is your first Entity. Go ahead and modify it!",
      owner: user,
      projects: [],
      associations: {
        origins: [],
        products: [],
      },
      attachments: [],
      attributes: [
        {
          _id: "a-00-example",
          name: "Example Attribute",
          owner: user,
          timestamp: dayjs(Date.now()).toISOString(),
          archived: false,
          description: "An example Attribute",
          values: [
            {
              _id: "v-00-example",
              type: "text",
              name: "Test Value 01",
              data: "Test Value Data",
            },
            {
              _id: "v-01-example",
              type: "number",
              name: "Test Value 01",
              data: 10,
            },
          ],
        },
      ],
      history: [],
    });
    await Workspaces.addEntity(workspace, entity.message);

    return {
      success: true,
      message: "Created example Entity and Project",
    };
  };
}
