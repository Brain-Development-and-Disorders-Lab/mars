import { AttributeModel, IAttribute, ResponseMessage } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { getDatabase } from "../connectors/database";
import { getIdentifier } from "../util";
import consola from "consola";
import dayjs from "dayjs";

// Collection name
const ATTRIBUTES_COLLECTION = "attributes";

export class Attributes {
  /**
   * Get all Attribute entries from the Attributes collection
   * @returns Collection of all Attribute entries
   */
  static all = async (): Promise<AttributeModel[]> => {
    consola.debug("Retrieving all Attributes...");
    return await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .find()
      .toArray();
  };

  static getOne = async (_id: string): Promise<AttributeModel | null> => {
    consola.debug("Retrieving Attribute:", _id);
    return await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .findOne({ _id: _id });
  };

  static getMany = async (attributes: string[]): Promise<AttributeModel[]> => {
    consola.debug(`Retrieving ${attributes.length} Attributes...`);
    return await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .find({ _id: { $in: attributes } })
      .toArray();
  };

  /**
   * Utility function to check if an Attribute exists or not
   * @param _id Attribute identifier
   * @return {boolean}
   */
  static exists = async (_id: string): Promise<boolean> => {
    consola.debug("Checking if Attribute exists:", _id);
    const response = await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .findOne({ _id: _id });
    return !_.isNull(response);
  };

  /**
   * Create a new Attribute
   * @param attribute Attribute data
   * @return {ResponseMessage}
   */
  static create = async (attribute: IAttribute): Promise<ResponseMessage> => {
    consola.debug(`Creating new Attribute...`);
    // Add an identifier to the Attribute
    const joinedAttribute: AttributeModel = {
      _id: getIdentifier("attribute"),
      timestamp: dayjs(Date.now()).toISOString(),
      ...attribute,
    };
    consola.debug("Attribute:", joinedAttribute._id, joinedAttribute.name);

    const response = await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .insertOne(joinedAttribute);
    const successStatus = _.isEqual(response.insertedId, joinedAttribute._id);
    if (!successStatus) {
      consola.error(
        "Unable to create new Attribute entry:",
        joinedAttribute._id,
      );
    }

    return {
      success: successStatus,
      message: successStatus
        ? response.insertedId.toString()
        : "Unable to create Attribute",
    };
  };

  static update = async (updated: AttributeModel): Promise<ResponseMessage> => {
    consola.debug("Updating Attribute:", updated._id);
    const attribute = await this.getOne(updated._id);
    if (_.isNull(attribute)) {
      consola.error("Unable to retrieve Attribute:", updated._id);
      return {
        success: false,
        message: "Error retrieving existing Attribute",
      };
    }

    const update: { $set: IAttribute } = {
      $set: {
        ...attribute,
      },
    };

    // Name
    if (!_.isUndefined(updated.name)) {
      update.$set.name = updated.name;
    }

    // Description
    if (!_.isUndefined(updated.description)) {
      update.$set.description = updated.description;
    }

    // Values
    if (!_.isUndefined(updated.values)) {
      update.$set.values = updated.values;
    }

    const response = await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .updateOne({ _id: updated._id }, update);
    if (response.modifiedCount > 0) {
      consola.info("Updated Attribute:", updated._id);
    }

    return {
      success: true,
      message:
        response.modifiedCount === 1
          ? "Updated Attribute"
          : "No changes made to Attribute",
    };
  };

  /**
   * Set the archive state of an Attribute
   * @param _id Attribute identifier to archive
   * @param state Attribute archive state
   * @return {Promise<ResponseMessage>}
   */
  static setArchived = async (
    _id: string,
    state: boolean,
  ): Promise<ResponseMessage> => {
    consola.debug(
      "Setting archive state of Attribute:",
      _id,
      "Archived:",
      state,
    );
    const attribute = await this.getOne(_id);
    if (_.isNull(attribute)) {
      consola.error("Unable to retrieve Attribute:", _id);
      return {
        success: false,
        message: "Error retrieving existing Attribute",
      };
    }

    // Update the archived state
    attribute.archived = state;
    const update: { $set: IAttribute } = {
      $set: {
        ...attribute,
      },
    };

    const response = await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .updateOne({ _id: _id }, update);
    if (response.modifiedCount > 0) {
      consola.info("Set archive state of Attribute:", _id, "Archived:", state);
    }

    return {
      success: true,
      message:
        response.modifiedCount === 1
          ? "Set archive state of Attribute"
          : "No changes made to Attribute",
    };
  };

  /**
   * Delete an Attribute
   * @param _id Attribute identifier to delete
   * @return {ResponseMessage}
   */
  static delete = async (_id: string): Promise<ResponseMessage> => {
    const response = await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .deleteOne({ _id: _id });

    if (response.deletedCount > 0) {
      consola.info("Deleted Attribute:", _id);
    } else {
      consola.warn("Unable to delete Attribute:", _id);
    }

    return {
      success: response.deletedCount > 0,
      message:
        response.deletedCount > 0
          ? "Deleted Attribute successfully"
          : "Unable to delete Attribute",
    };
  };
}
