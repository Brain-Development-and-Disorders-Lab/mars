// Custom types
import { APIKey, IResponseMessage, ResponseData, UserModel } from "@types";

import _ from "lodash";
import dayjs from "dayjs";

// Database
import { getDatabase } from "@connectors/database";

// Collection name
const USERS_COLLECTION = "user";

export class User {
  static getOne = async (_id: string): Promise<UserModel | null> => {
    return await getDatabase().collection<UserModel>(USERS_COLLECTION).findOne({ _id: _id });
  };

  static getByEmail = async (email: string): Promise<ResponseData<string>> => {
    const result = await getDatabase().collection<UserModel>(USERS_COLLECTION).findOne({ email: email });

    // Return the User `_id`
    if (result) {
      return {
        message: "User found successfully",
        success: true,
        data: result._id,
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
        data: result._id,
      };
    }
    return {
      message: "User not found",
      success: false,
      data: "",
    };
  };

  static exists = async (_id: string): Promise<boolean> => {
    const result = await getDatabase().collection<UserModel>(USERS_COLLECTION).findOne({ _id: _id });

    return !_.isNull(result);
  };

  static update = async (updated: UserModel): Promise<IResponseMessage> => {
    const user = await this.getOne(updated._id);

    if (_.isNull(user)) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Reject if another account already owns this email, regardless of update context
    if (updated.email) {
      const existingByEmail = await this.getByEmail(updated.email);
      if (existingByEmail.success && existingByEmail.data !== updated._id) {
        return {
          success: false,
          message: "EMAIL_EXISTS",
        };
      }
    }

    // Profile completion validation
    if (updated.completedProfile === true) {
      // Ensure valid email is provided (catch instance of ORCiD placeholders too)
      if (!updated.email || updated.email.endsWith("@orcid.placeholder")) {
        return {
          success: false,
          message: "A valid email address is required to complete your account",
        };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updated.email)) {
        return {
          success: false,
          message: "A valid email address is required to complete your account",
        };
      }

      // Ensure valid name
      if (!updated.firstName || updated.firstName === "null" || !updated.lastName || updated.lastName === "null") {
        return {
          success: false,
          message: "A valid first and last name is required to complete your account",
        };
      }
    }

    const update: { $set: UserModel } = {
      $set: {
        ...user,
      },
    };

    if (updated.firstName && updated.firstName !== "null") {
      update.$set.firstName = updated.firstName;
    }

    if (updated.lastName && updated.lastName !== "null") {
      update.$set.lastName = updated.lastName;
    }

    if (updated.name) {
      update.$set.name = updated.name;
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

    if (!_.isUndefined(updated.hasSeenWalkthrough)) {
      update.$set.hasSeenWalkthrough = updated.hasSeenWalkthrough;
    }

    if (!_.isUndefined(updated.completedProfile)) {
      update.$set.completedProfile = updated.completedProfile;
    }

    const response = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .updateOne({ _id: updated._id }, update);
    const successStatus = response.modifiedCount === 1 || response.matchedCount === 1;

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

    const response = await getDatabase().collection<UserModel>(USERS_COLLECTION).updateOne({ _id: _id }, update);
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

    const response = await getDatabase().collection<UserModel>(USERS_COLLECTION).updateOne({ _id: _id }, update);
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
        const keys: APIKey[] = JSON.parse(user.api_keys);
        return keys.some((k) => k.value === api_key);
      }) ?? null
    );
  };
}
