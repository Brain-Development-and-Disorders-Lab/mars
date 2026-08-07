// Database operations
import { getDatabase } from "@connectors/database";

// Utilities
import _ from "lodash";
import dayjs from "dayjs";
import { getIdentifier } from "@lib/util";

// Custom types
import { IdentifierFormatModel, IIdentifierFormat, ResponseData } from "@types";

const IDENTIFIERS_COLLECTION = "identifiers"; // Collection name

export class Identifiers {
  static create = async (format: IIdentifierFormat): Promise<ResponseData<string>> => {
    const joinedFormat: IdentifierFormatModel = {
      _id: getIdentifier("identifier"),
      ...format,
      created: dayjs(Date.now()).toISOString(),
    };

    const response = await getDatabase()
      .collection<IdentifierFormatModel>(IDENTIFIERS_COLLECTION)
      .insertOne(joinedFormat);
    const successStatus = _.isEqual(response.insertedId, joinedFormat._id);

    // Return the Identifier Format identifier if successful
    return {
      success: successStatus,
      message: successStatus ? "Created new Identifier Format" : "Unable to create Identifier Format",
      data: response.insertedId.toString(),
    };
  };

  /**
   * Get a Identifier Format associated with a unique identifier
   * @param _id Unique identifier of the Identifier Format instance
   * @return {IdentifierFormatModel}
   */
  static getIdentifierFormat = async (_id: string): Promise<IdentifierFormatModel | null> => {
    return await getDatabase().collection<IdentifierFormatModel>(IDENTIFIERS_COLLECTION).findOne({ _id: _id });
  };

  /**
   * Get all Identifier Formats associated with a Workspace
   * @param workspace The current Workspace
   * @return {Promise<IdentifierFormatModel[]>}
   */
  static getIdentifierFormats = async (workspace: string): Promise<IdentifierFormatModel[]> => {
    return await getDatabase()
      .collection<IdentifierFormatModel>(IDENTIFIERS_COLLECTION)
      .find({ workspace: workspace })
      .toArray();
  };
}
