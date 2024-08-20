import { Context, IWorkspace, ResponseMessage, WorkspaceModel } from "@types";
import { Workspaces } from "src/models/Workspaces";

export const WorkspacesResolvers = {
  Query: {
    // Retrieve all Workspaces
    workspaces: async (_parent: any, _args: any, context: Context) => {
      return await Workspaces.all(context.user);
    },

    // Get one Workspace
    workspace: async (
      _parent: any,
      args: { _id: string },
      context: Context,
    ): Promise<WorkspaceModel | null> => {
      return await Workspaces.getOne(args._id, context.user);
    },
  },

  Mutation: {
    // Create a new Workspace
    createWorkspace: async (
      _parent: any,
      args: { workspace: IWorkspace },
    ): Promise<ResponseMessage> => {
      return await Workspaces.create(args.workspace);
    },
  },
};
