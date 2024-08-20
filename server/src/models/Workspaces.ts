import { IWorkspace, ResponseMessage, WorkspaceModel } from "@types";
import { getDatabase } from "../connectors/database";
import { getIdentifier } from "src/util";

// Collection name
const WORKSPACES_COLLECTION = "workspaces";

export class Workspaces {
  /**
   * Get all Workspace entries from the Workspaces collection where the user
   * is either the owner or a collaborator
   * @returns Collection of all Workspace entries
   */
  static all = async (user: string): Promise<WorkspaceModel[]> => {
    return await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .find({
        $or: [{ owner: user }, { collaborators: user }],
      })
      .toArray();
  };

  /**
   * Get one Workspace entry from the Workspaces collection where the user
   * is either the owner or a collaborator
   * @returns Workspace entry
   */
  static getOne = async (
    _id: string,
    user: string,
  ): Promise<WorkspaceModel | null> => {
    return await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .findOne({
        _id: _id,
        $or: [{ owner: user }, { collaborators: user }],
      });
  };

  /**
   * Create a new Workspace entry
   * @param workspace Workspace data
   * @return {ResponseMessage}
   */
  static create = async (workspace: IWorkspace): Promise<ResponseMessage> => {
    const joinedWorkspace: WorkspaceModel = {
      _id: getIdentifier("workspace"), // Generate new identifier
      ...workspace, // Unpack existing IEntity fields
    };
    const response = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .insertOne(joinedWorkspace);

    return {
      success: response.acknowledged,
      message: response.acknowledged
        ? response.insertedId.toString()
        : "Unable to create Workspace",
    };
  };
}
