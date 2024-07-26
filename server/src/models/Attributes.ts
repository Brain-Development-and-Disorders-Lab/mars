import { AttributeModel, IAttribute, ResponseMessage } from "@types";
import _ from "lodash";
import { getDatabase } from "../connectors/database";
import { getIdentifier } from "../util";
import { Activity } from "./Activity";

// Collection name
const ATTRIBUTES_COLLECTION = "attributes";

export class Attributes {
  /**
   * Get all Attribute entries from the Attributes collection
   * @returns Collection of all Attribute entries
   */
  static all = async (): Promise<AttributeModel[]> => {
    return await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .find()
      .toArray();
  };

  static getOne = async (_id: string): Promise<AttributeModel | null> => {
    return await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .findOne({ _id: _id });
  };

  /**
   * Utility function to check if an Attribute exists or not
   * @param _id Attribute identifier
   * @return {boolean}
   */
  static exists = async (_id: string): Promise<boolean> => {
    const response = await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .findOne({ _id: _id });
    return _.isNull(response);
  };

  /**
   * Create a new Attribute
   * @param attribute Attribute data
   * @return {ResponseMessage}
   */
  static create = async (attribute: IAttribute): Promise<ResponseMessage> => {
    // Add an identifier to the Attribute
    const joinedAttribute: AttributeModel = {
      _id: getIdentifier("attribute"),
      ...attribute,
    };

    const response = await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .insertOne(joinedAttribute);
    const successStatus = _.isEqual(response.insertedId, joinedAttribute._id);

    await Activity.create({
      timestamp: new Date(),
      type: "create",
      details: "Created new Attribute",
      target: {
        _id: joinedAttribute._id,
        type: "attributes",
        name: joinedAttribute.name,
      },
    });

    return {
      success: successStatus,
      message: successStatus
        ? response.insertedId.toString()
        : "Unable to create Attribute",
    };
  };

  static update = async (updated: AttributeModel): Promise<ResponseMessage> => {
    const attribute = await this.getOne(updated._id);

    if (_.isNull(attribute)) {
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

    // Description
    if (updated.description) {
      update.$set.description = updated.description;
    }

    // Values
    if (updated.values) {
      update.$set.values = updated.values;
    }

    const response = await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .updateOne({ _id: updated._id }, update);

    await Activity.create({
      timestamp: new Date(),
      type: "update",
      details: "Updated existing Attribute",
      target: {
        _id: updated._id,
        type: "attributes",
        name: updated.name,
      },
    });

    return {
      success: true,
      message:
        response.modifiedCount == 1
          ? "Updated Attribute"
          : "No changes made to Attribute",
    };
  };

  /**
   * Delete an Attribute
   * @param _id Attribute identifier to delete
   * @return {ResponseMessage}
   */
  static delete = async (_id: string): Promise<ResponseMessage> => {
    const attribute = await Attributes.getOne(_id);
    const response = await getDatabase()
      .collection<AttributeModel>(ATTRIBUTES_COLLECTION)
      .deleteOne({ _id: _id });

    if (attribute && response.deletedCount > 0) {
      await Activity.create({
        timestamp: new Date(),
        type: "delete",
        details: "Deleted Attribute",
        target: {
          _id: attribute._id,
          type: "attributes",
          name: attribute.name,
        },
      });
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
