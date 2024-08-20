import { Context, IWorkspace, ResponseMessage } from "@types";
import { Workspaces } from "src/models/Workspaces";

export const WorkspacesResolvers = {
  Query: {
    // Retrieve all Workspaces
    workspaces: async (_parent: any, _args: any, context: Context) => {
      return await Workspaces.all(context.user);
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
