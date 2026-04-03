// Custom types
import { APIKey, IResponseMessage, ResponseData, UserModel } from "@types";

import _ from "lodash";
import dayjs from "dayjs";

// Models
import { Entities } from "@models/Entities";
import { Projects } from "@models/Projects";
import { Templates } from "@models/Templates";
import { Workspaces } from "@models/Workspaces";

// Database
import { ObjectId } from "mongodb";
import { getDatabase } from "@connectors/database";

// Collection name
const USERS_COLLECTION = "user";

export class User {
  /**
   * Get all User entries from the Users collection
   * @returns Collection of all User entries
   */
  static all = async (): Promise<UserModel[]> => {
    return await getDatabase().collection<UserModel>(USERS_COLLECTION).find().toArray();
  };

  static getOne = async (_id: string): Promise<UserModel | null> => {
    return await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .findOne({ _id: new ObjectId(_id) });
  };

  static getByEmail = async (email: string): Promise<ResponseData<string>> => {
    const result = await getDatabase().collection<UserModel>(USERS_COLLECTION).findOne({ email: email });

    // Return the User `_id`
    if (result) {
      return {
        message: "User found successfully",
        success: true,
        data: (result._id as ObjectId).toString(),
      };
    }
    return {
      message: "User not found",
      success: false,
      data: "",
    };
  };

  static getByOrcid = async (orcid: string): Promise<ResponseData<string>> => {
    const result = await getDatabase().collection<UserModel>(USERS_COLLECTION).findOne({ account_orcid: orcid });

    // Return the User `_id`
    if (result) {
      return {
        message: "User found successfully",
        success: true,
        data: (result._id as ObjectId).toString(),
      };
    }
    return {
      message: "User not found",
      success: false,
      data: "",
    };
  };

  static exists = async (_id: string): Promise<boolean> => {
    const result = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .findOne({ _id: new ObjectId(_id) });

    return !_.isNull(result);
  };

  static update = async (updated: UserModel): Promise<IResponseMessage> => {
    const user = await this.getOne(updated._id.toString());

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

    if (updated.api_keys) {
      update.$set.api_keys = updated.api_keys;
    }

    if (updated.account_orcid) {
      update.$set.account_orcid = updated.account_orcid;
    }

    const response = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .updateOne({ _id: new ObjectId(updated._id) }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Updated User successfully" : "Unable to update User",
    };
  };

  static create = async (user: UserModel): Promise<IResponseMessage> => {
    const response = await getDatabase().collection<UserModel>(USERS_COLLECTION).insertOne(user);

    return {
      success: response.insertedId === user._id,
      message: response.insertedId === user._id ? "Successfully created User" : "Error creating User",
    };
  };

  static addKey = async (_id: string, key: APIKey): Promise<IResponseMessage> => {
    const user = await User.getOne(_id);

    if (_.isNull(user)) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Note: Modifying outside of better-auth means that `api_keys` is stored as a JSON string
    const apiKeys = JSON.parse(_.cloneDeep(user.api_keys));
    apiKeys.push(key);

    const update: { $set: Partial<UserModel> } = {
      $set: {
        api_keys: JSON.stringify(apiKeys),
      },
    };

    const response = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .updateOne({ _id: new ObjectId(_id) }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Added API key to User successfully" : "Unable to add API key to User",
    };
  };

  static removeKey = async (_id: string, key: string): Promise<IResponseMessage> => {
    const user = await User.getOne(_id);

    if (_.isNull(user)) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Note: Modifying outside of better-auth means that `api_keys` is stored as a JSON string
    const apiKeys = JSON.parse(_.cloneDeep(user.api_keys));

    // Iterate through the list of API keys and set the removed key to have expiration 1 year ago
    apiKeys.map((existingKey: APIKey) => {
      if (_.isEqual(existingKey.value, key)) {
        existingKey.expires = dayjs(Date.now()).subtract(1, "year").toISOString();
      }
    });

    const update: { $set: Partial<UserModel> } = {
      $set: {
        api_keys: JSON.stringify(apiKeys),
      },
    };

    const response = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .updateOne({ _id: new ObjectId(_id) }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Revoked API key successfully" : "Unable to revoke API key",
    };
  };

  static findByKey = async (api_key: string): Promise<UserModel | null> => {
    // `api_keys` is stored as a JSON string by better-auth, so dot-notation
    // MongoDB queries don't work on it, parse and filter in application code.
    const users = await getDatabase().collection<UserModel>(USERS_COLLECTION).find().toArray();
    return (
      users.find((user) => {
        if (!user.api_keys) return false;
        const keys: APIKey[] = JSON.parse(user.api_keys as unknown as string);
        return keys.some((k) => k.value === api_key);
      }) ?? null
    );
  };

  static bootstrap = async (user: string, workspace: string): Promise<IResponseMessage> => {
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
              _id: "v-test-00",
              type: "text",
              name: "Test Value 00",
              data: "Test Value Data",
            },
            {
              _id: "v-test-01",
              type: "number",
              name: "Test Value 01",
              data: "10",
            },
            {
              _id: "v-test-02",
              type: "date",
              name: "Test Value 02",
              data: "2026-03-19",
            },
          ],
        },
      ],
      history: [],
    });
    await Workspaces.addEntity(workspace, entity.data);

    const project = await Projects.create({
      name: "Example Project",
      archived: false,
      created: dayjs(Date.now()).toISOString(),
      description: "This is an example Project. Feel free to explore and modify it!",
      owner: user,
      entities: [],
      collaborators: [],
      history: [],
    });
    await Workspaces.addProject(workspace, project.data);

    // Add the example Entity to the Project
    await Projects.addEntity(workspace, entity.data);

    // Create an example Template
    const template = await Templates.create({
      name: "Example Template",
      owner: user,
      archived: false,
      description: "An example Template Attribute",
      values: [
        {
          _id: "v-01-example0",
          type: "text",
          name: "Test Value 01",
          data: "Test Value Data",
        },
        {
          _id: "v-02-example0",
          type: "number",
          name: "Test Value 01",
          data: "0",
        },
      ],
    });
    await Workspaces.addTemplate(workspace, template.data);

    return {
      success: true,
      message: "Created example Entity and Project",
    };
  };
}
