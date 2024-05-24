import { EntityModel, ResponseMessage } from "@types";
import { getDatabase } from "src/connectors/database";

const ENTITIES_COLLECTION = "entities"; // Collection name

export class Entities {
  /**
   * Get all Entity entries from the Entities collection
   * @returns Collection of all Entity entries
   */
  static all = async (): Promise<EntityModel[]> => {
    return await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .find()
      .toArray();
  }

  /**
   * Get an Entity by identifier
   * @param _id Entity identifier
   * @returns `null` if the Entity does not exist
   */
  static getOne = async (_id: string): Promise<EntityModel | null> => {
    return await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .findOne({ _id: _id });
  };

  /**
   * Update the Entity description
   * @param _id Entity identifier
   * @param description Update Entity description
   * @returns {ResponseMessage}
   */
  static setDescription = async (_id: string, description: string): Promise<ResponseMessage> => {
    const update = {
      $set: {
        description: description,
      }
    };
    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    return {
      success: response.modifiedCount == 1,
      message: response.modifiedCount == 1 ? "Set description successfully" : "Unable to set description",
    };
  };
};
