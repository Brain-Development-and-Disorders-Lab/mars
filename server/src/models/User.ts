// Custom types
import { APIKey, IResponseMessage, UserModel } from "@types";

import _ from "lodash";
import { getDatabase } from "@connectors/database";
import dayjs from "dayjs";

// Models
import { Entities } from "@models/Entities";
import { Projects } from "@models/Projects";
import { Workspaces } from "@models/Workspaces";

// Collection name
const USERS_COLLECTION = "user";

export class User {
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
   * @return {Promise<IResponseMessage>}
   */
  static addWorkspace = async (
    orcid: string,
    workspace: string,
  ): Promise<IResponseMessage> => {
    const result = await User.getOne(orcid);

    // Attempt to update the `UserModel` with the Workspace
    if (result?.workspaces) {
      result.workspaces.push(workspace);
      return await User.update(result);
    }

    return {
      success: false,
      message: "Unable to add Workspace to User",
    };
  };

  static update = async (updated: UserModel): Promise<IResponseMessage> => {
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

    if (updated.lastLogin) {
      update.$set.lastLogin = updated.lastLogin;
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

  static create = async (user: UserModel): Promise<IResponseMessage> => {
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

  static addKey = async (
    orcid: string,
    key: APIKey,
  ): Promise<IResponseMessage> => {
    const user = await User.getOne(orcid);

    if (_.isNull(user)) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const apiKeys = _.cloneDeep(user.api_keys);
    apiKeys.push(key);

    const update: { $set: Partial<UserModel> } = {
      $set: {
        api_keys: apiKeys,
      },
    };

    const response = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .updateOne({ _id: orcid }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Added API key to User successfully"
        : "Unable to add API key to User",
    };
  };

  static removeKey = async (
    orcid: string,
    key: string,
  ): Promise<IResponseMessage> => {
    const user = await User.getOne(orcid);

    if (_.isNull(user)) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const apiKeys = _.cloneDeep(user.api_keys);

    // Iterate through the list of API keys and set the removed key to have expiration 1 year ago
    apiKeys.map((existingKey) => {
      if (_.isEqual(existingKey.value, key)) {
        existingKey.expires = dayjs(Date.now())
          .subtract(1, "year")
          .toISOString();
      }
    });

    const update: { $set: Partial<UserModel> } = {
      $set: {
        api_keys: apiKeys,
      },
    };

    const response = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .updateOne({ _id: orcid }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Revoked API key successfully"
        : "Unable to revoke API key",
    };
  };

  static findByKey = async (api_key: string): Promise<UserModel | null> => {
    return await getDatabase().collection<UserModel>(USERS_COLLECTION).findOne({
      "api_keys.value": api_key,
    });
  };

  static bootstrap = async (
    user: string,
    workspace: string,
  ): Promise<IResponseMessage> => {
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
    await Workspaces.addProject(workspace, project.data);

    const entity = await Entities.create({
      name: "Example Entity",
      archived: false,
      created: dayjs(Date.now()).toISOString(),
      description: "This is your first Entity. Go ahead and modify it!",
      owner: user,
      projects: [],
      relationships: [],
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
    await Workspaces.addEntity(workspace, entity.data);

    return {
      success: true,
      message: "Created example Entity and Project",
    };
  };
}
