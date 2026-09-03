import {
  AttributeHistory,
  AttributeModel,
  AttributeUsage,
  EntityModel,
  IAttribute,
  IResponseMessage,
  ResponseData,
} from "@types";

// Utility functions and libraries
import _ from "lodash";
import { getDatabase } from "@connectors/database";
import { getIdentifier } from "@lib/util";
import { logger } from "@lib/logger";
import dayjs from "dayjs";
import { Workspaces } from "./Workspaces";

// Generate history version IDs
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("1234567890abcdef", 10);

// Collection name
const ATTRIBUTES_COLLECTION = "attributes";

export class Attributes {
  /**
   * Get all Attribute entries from the Attributes collection
   * @returns Collection of all Attribute entries
   */
  static all = async (): Promise<AttributeModel[]> => {
    logger.debug("Retrieving all Attributes...");
    return await getDatabase().collection<AttributeModel>(ATTRIBUTES_COLLECTION).find().toArray();
  };

  static getOne = async (_id: string): Promise<AttributeModel | null> => {
    logger.debug({ attributeId: _id }, "Retrieving Attribute");
    return await getDatabase().collection<AttributeModel>(ATTRIBUTES_COLLECTION).findOne({ _id: _id });
  };

  static getMany = async (attributes: string[]): Promise<AttributeModel[]> => {
    logger.debug({ count: attributes.length }, "Retrieving Attributes...");
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
    logger.debug({ attributeId: _id }, "Checking if Attribute exists");
    const response = await getDatabase().collection<AttributeModel>(ATTRIBUTES_COLLECTION).findOne({ _id: _id });
    return !_.isNull(response);
  };

  /**
   * Create a new Attribute
   * @param {IAttribute} attribute Attribute data
   * @return {ResponseData<string>}
   */
  static create = async (attribute: IAttribute): Promise<ResponseData<string>> => {
    logger.debug("Creating new Attribute...");
    // Add an identifier to the Attribute
    const joinedAttribute: AttributeModel = {
      _id: getIdentifier("attribute"),
      timestamp: dayjs(Date.now()).toISOString(),
      ...attribute,
    };
    logger.debug({ attributeId: joinedAttribute._id, name: joinedAttribute.name }, "Attribute");

    const response = await getDatabase().collection<AttributeModel>(ATTRIBUTES_COLLECTION).insertOne(joinedAttribute);
    const successStatus = _.isEqual(response.insertedId, joinedAttribute._id);
    if (!successStatus) {
      logger.error({ attributeId: joinedAttribute._id }, "Unable to create new Attribute entry");
    }

    return {
      success: successStatus,
      message: successStatus ? "Created new Attribute" : "Unable to create Attribute",
      data: response.insertedId.toString(),
    };
  };

  static update = async (updated: AttributeModel): Promise<IResponseMessage> => {
    logger.debug({ attributeId: updated._id }, "Updating Attribute");
    const attribute = await Attributes.getOne(updated._id);
    if (_.isNull(attribute)) {
      logger.error({ attributeId: updated._id }, "Unable to retrieve Attribute");
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
      logger.info({ attributeId: updated._id }, "Updated Attribute");
    }

    return {
      success: true,
      message: response.modifiedCount === 1 ? "Updated Attribute" : "No changes made to Attribute",
    };
  };

  /**
   * Get the collection of Entities currently utilizing the Attribute and whether it has
   * been modified or not
   * @param _id Attribute identifier
   * @return {Promise<ResponseData<AttributeUsage[]>>} Collection of `AttributeUsage` objects
   */
  static usage = async (workspace: string, _id: string): Promise<AttributeUsage[]> => {
    // Get the Attribute itself
    const attribute = await Attributes.getOne(_id);

    // Retrieve collection of Entities to examine
    const entities = await Workspaces.getEntities(workspace);

    // Iterate through all Workspace Entities, extracting Attribute IDs and checking if they match known Attributes
    const activeEntities: EntityModel[] = [];
    for (const entity of entities) {
      const attributeIds = entity.attributes.map((attribute) => attribute._id);
      for (const id of attributeIds) {
        if (_.startsWith(id, _id) || _.isEqual(id, _id)) {
          activeEntities.push(entity);
          break;
        }
      }
    }

    // Run comparison check across all Entities using the attribute
    const usage: AttributeUsage[] = [];
    activeEntities.map((entity) => {
      const modifications: AttributeUsage["modifications"] = [];

      // Get the instance of the Attribute from the Entity
      const downstreamAttribute = entity.attributes.filter((attribute) => {
        return _.startsWith(attribute._id, _id) || _.isEqual(attribute._id, _id);
      })[0];

      // Run comparisons: name, description, values
      if (downstreamAttribute.name !== attribute?.name) {
        modifications.push("name");
      }
      if (downstreamAttribute.description !== attribute?.description) {
        modifications.push("description");
      }
      if (downstreamAttribute.values.length !== attribute?.values.length) {
        modifications.push("values");
      } else {
        // Iterate through values sequentially to check if Value names or types have been modified
        for (let i = 0; i < downstreamAttribute.values.length; i++) {
          const downstreamValue = downstreamAttribute.values[i];
          const originalValue = attribute.values[i];
          if (downstreamValue.name !== originalValue.name || downstreamValue.type !== originalValue.type) {
            modifications.push("values");
            break;
          }
        }
      }

      // Update usage information
      usage.push({
        entity: entity._id,
        modifications: modifications,
      });
    });

    return usage;
  };

  /**
   * Generate export data for the Attribute
   * @param _id Attribute identifier
   * @returns {Promise<string>}
   */
  static export = async (_id: string, fields?: string[], includeHistory = false): Promise<string> => {
    const attribute = await Attributes.getOne(_id);

    if (_.isNull(attribute)) {
      return "";
    }

    if (!includeHistory) {
      delete (attribute as never)["history"];
    }

    if (_.isUndefined(fields)) {
      return JSON.stringify(attribute, null, "  ");
    }

    const formatted: Record<string, unknown> = {
      _id: attribute._id,
      name: attribute.name,
      values: attribute.values,
    };

    for (const field of fields) {
      if (_.isEqual(field, "description")) {
        formatted["description"] = attribute.description;
      } else if (_.isEqual(field, "owner")) {
        formatted["owner"] = attribute.owner;
      } else if (_.isEqual(field, "timestamp")) {
        formatted["timestamp"] = attribute.timestamp;
      } else if (_.isEqual(field, "archived")) {
        formatted["archived"] = attribute.archived;
      }
    }

    if (includeHistory) {
      formatted["history"] = attribute.history;
    }

    return JSON.stringify(formatted, null, "  ");
  };

  /**
   * Add a history entry to an Attribute based on provided Attribute state
   * @param historyAttribute Existing Attribute state to add to Attribute history
   * @param author Identifier of User who authored changes
   * @param message Changelog message associated with changes
   * @return {Promise<IResponseMessage>}
   */
  static addHistory = async (
    historyAttribute: AttributeModel,
    author?: string,
    message?: string,
  ): Promise<IResponseMessage> => {
    const attribute = await Attributes.getOne(historyAttribute._id);
    if (_.isNull(attribute)) {
      return {
        success: false,
        message: "Attribute not found",
      };
    }

    const historyEntry: AttributeHistory = {
      author: author || "",
      message: message || "",
      version: nanoid(),
      timestamp: dayjs(Date.now()).toISOString(),

      _id: historyAttribute._id,
      name: historyAttribute.name,
      owner: historyAttribute.owner,
      archived: historyAttribute.archived,
      description: historyAttribute.description,
      values: historyAttribute.values,
    };

    const update: { $set: Partial<AttributeModel> } = {
      $set: {
        history: [historyEntry, ...(attribute.history || [])],
      },
    };

    const response = await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .updateOne({ _id: historyAttribute._id }, update);
    if (response.modifiedCount > 0) {
      logger.info({ attributeId: historyAttribute._id }, "Added history to Attribute");
    }

    return {
      success: true,
      message: response.modifiedCount === 1 ? "Added history to Attribute" : "No history added to Attribute",
    };
  };

  /**
   * Set the archive state of an Attribute
   * @param _id Attribute identifier to archive
   * @param state Attribute archive state
   * @return {Promise<IResponseMessage>}
   */
  static setArchived = async (_id: string, state: boolean): Promise<IResponseMessage> => {
    logger.debug({ attributeId: _id, archived: state }, "Setting archive state of Attribute");
    const attribute = await this.getOne(_id);
    if (_.isNull(attribute)) {
      logger.error({ attributeId: _id }, "Unable to retrieve Attribute");
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
      logger.info({ attributeId: _id, archived: state }, "Set archive state of Attribute");
    }

    return {
      success: true,
      message: response.modifiedCount === 1 ? "Set archive state of Attribute" : "No changes made to Attribute",
    };
  };
}
