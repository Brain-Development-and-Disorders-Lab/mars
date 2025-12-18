import {
  AttributeModel,
  IAttribute,
  IResponseMessage,
  ResponseData,
} from "@types";

// Utility functions and libraries
import _ from "lodash";
import { getDatabase } from "@connectors/database";
import { getIdentifier } from "@lib/util";
import consola from "consola";
import dayjs from "dayjs";

// Collection name
const TEMPLATES_COLLECTION = "templates";

export class Templates {
  /**
   * Get all Template entries from the Templates collection
   * @returns Collection of all Template entries
   */
  static all = async (): Promise<AttributeModel[]> => {
    consola.debug("Retrieving all Templates...");
    return await getDatabase()
      .collection<AttributeModel>(TEMPLATES_COLLECTION)
      .find()
      .toArray();
  };

  static getOne = async (_id: string): Promise<AttributeModel | null> => {
    consola.debug("Retrieving Template:", _id);
    return await getDatabase()
      .collection<AttributeModel>(TEMPLATES_COLLECTION)
      .findOne({ _id: _id });
  };

  static getMany = async (templates: string[]): Promise<AttributeModel[]> => {
    consola.debug(`Retrieving ${templates.length} Templates...`);
    return await getDatabase()
      .collection<AttributeModel>(TEMPLATES_COLLECTION)
      .find({ _id: { $in: templates } })
      .toArray();
  };

  /**
   * Utility function to check if a Template exists or not
   * @param _id Template identifier
   * @return {boolean}
   */
  static exists = async (_id: string): Promise<boolean> => {
    consola.debug("Checking if Template exists:", _id);
    const response = await getDatabase()
      .collection<AttributeModel>(TEMPLATES_COLLECTION)
      .findOne({ _id: _id });
    return !_.isNull(response);
  };

  /**
   * Create a new Template
   * @param template Template data
   * @return {ResponseData<string>}
   */
  static create = async (
    template: IAttribute,
  ): Promise<ResponseData<string>> => {
    consola.debug(`Creating new Template...`);
    // Add an identifier to the Template
    const joinedTemplate: AttributeModel = {
      _id: getIdentifier("template"),
      timestamp: dayjs(Date.now()).toISOString(),
      ...template,
    };
    consola.debug("Template:", joinedTemplate._id, joinedTemplate.name);

    const response = await getDatabase()
      .collection<AttributeModel>(TEMPLATES_COLLECTION)
      .insertOne(joinedTemplate);
    const successStatus = _.isEqual(response.insertedId, joinedTemplate._id);
    if (!successStatus) {
      consola.error("Unable to create new Template entry:", joinedTemplate._id);
    }

    return {
      success: successStatus,
      message: successStatus
        ? "Created new Template"
        : "Unable to create Template",
      data: response.insertedId.toString(),
    };
  };

  static update = async (
    updated: AttributeModel,
  ): Promise<IResponseMessage> => {
    consola.debug("Updating Template:", updated._id);
    const template = await Templates.getOne(updated._id);
    if (_.isNull(template)) {
      consola.error("Unable to retrieve Template:", updated._id);
      return {
        success: false,
        message: "Error retrieving existing Template",
      };
    }

    const update: { $set: IAttribute } = {
      $set: {
        ...template,
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
      .collection<AttributeModel>(TEMPLATES_COLLECTION)
      .updateOne({ _id: updated._id }, update);
    if (response.modifiedCount > 0) {
      consola.info("Updated Template:", updated._id);
    }

    return {
      success: true,
      message:
        response.modifiedCount === 1
          ? "Updated Template"
          : "No changes made to Template",
    };
  };

  /**
   * Generate export data for the Template
   * @param _id Template identifier
   * @returns {Promise<string>}
   */
  static export = async (_id: string): Promise<string> => {
    const template = await Templates.getOne(_id);

    if (_.isNull(template)) {
      return "";
    }

    return JSON.stringify(template, null, "  ");
  };

  /**
   * Set the archive state of an Template
   * @param _id Template identifier to archive
   * @param state Template archive state
   * @return {Promise<IResponseMessage>}
   */
  static setArchived = async (
    _id: string,
    state: boolean,
  ): Promise<IResponseMessage> => {
    consola.debug(
      "Setting archive state of Template:",
      _id,
      "Archived:",
      state,
    );
    const template = await this.getOne(_id);
    if (_.isNull(template)) {
      consola.error("Unable to retrieve Template:", _id);
      return {
        success: false,
        message: "Error retrieving existing Template",
      };
    }

    // Update the archived state
    template.archived = state;
    const update: { $set: IAttribute } = {
      $set: {
        ...template,
      },
    };

    const response = await getDatabase()
      .collection<AttributeModel>(TEMPLATES_COLLECTION)
      .updateOne({ _id: _id }, update);
    if (response.modifiedCount > 0) {
      consola.info("Set archive state of Template:", _id, "Archived:", state);
    }

    return {
      success: true,
      message:
        response.modifiedCount === 1
          ? "Set archive state of Template"
          : "No changes made to Template",
    };
  };
}
