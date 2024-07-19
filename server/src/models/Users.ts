import { ResponseMessage, UserModel } from "@types";
import _ from "lodash";
import { getDatabase } from "src/connectors/database";
import { Projects } from "./Projects";
import dayjs from "dayjs";
import { Entities } from "./Entities";

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

    if (updated.name) {
      update.$set.name = updated.name;
    }

    if (updated.email) {
      update.$set.email = updated.email;
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

  static bootstrap = async (orcid: string): Promise<ResponseMessage> => {
    await Projects.create({
      name: "My First Project",
      created: dayjs(Date.now()).toISOString(),
      description:
        "This is your first Project. Feel free to explore and modify it!",
      owner: orcid,
      shared: [],
      entities: [], // Assuming you can add entities later
      collaborators: [], // Assuming you might want collaborators
      history: [],
    });

    await Entities.create({
      name: "Example Entity",
      deleted: false,
      locked: false,
      created: dayjs(Date.now()).toISOString(),
      description: "This is your first Entity. Go ahead and modify it!",
      owner: orcid,
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

    return {
      success: true,
      message: "Created example Entity and Project",
    };
  };
}
