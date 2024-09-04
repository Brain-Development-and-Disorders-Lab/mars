import {
  ActivityModel,
  Context,
  EntityModel,
  IWorkspace,
  ProjectModel,
  ResponseMessage,
  WorkspaceModel,
} from "@types";
import _ from "lodash";
import { Workspaces } from "src/models/Workspaces";
import { GraphQLError } from "graphql/index";

export const WorkspacesResolvers = {
  Query: {
    // Retrieve all Workspaces
    workspaces: async (_parent: any, _args: any, context: Context) => {
      const workspaces = await Workspaces.all();

      // Access control
      if (workspaces.length > 0) {
        return workspaces.filter((workspace) => {
          return (
            _.isEqual(workspace.owner, context.user) ||
            _.includes(workspace.collaborators, context.user)
          );
        });
      }

      // Default return
      return [];
    },

    // Get one Workspace
    workspace: async (
      _parent: any,
      args: { _id: string },
      context: Context,
    ): Promise<WorkspaceModel | null> => {
      const workspace = await Workspaces.getOne(args._id);

      // Access control
      if (
        workspace &&
        (_.includes(workspace.collaborators, context.user) ||
          _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        return workspace;
      } else {
        throw new GraphQLError(
          "You do not have permission to access this Workspace",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },

    // Get all Entities within a single Workspace
    workspaceEntities: async (
      _parent: any,
      args: { _id: string; limit: 100 },
      context: Context,
    ): Promise<EntityModel[]> => {
      const workspace = await Workspaces.getOne(args._id);

      // Access control
      if (
        workspace &&
        (_.includes(workspace.collaborators, context.user) ||
          _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        const result = await Workspaces.getEntities(args._id);
        return result.slice(0, args.limit);
      } else {
        throw new GraphQLError(
          "You do not have permission to access this Workspace",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },

    // Get all Projects within a single Workspace
    workspaceProjects: async (
      _parent: any,
      args: { _id: string; limit: 100 },
      context: Context,
    ): Promise<ProjectModel[]> => {
      const workspace = await Workspaces.getOne(args._id);

      // Access control
      if (
        workspace &&
        (_.includes(workspace.collaborators, context.user) ||
          _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        const result = await Workspaces.getProjects(args._id);
        return result.slice(0, args.limit);
      } else {
        throw new GraphQLError(
          "You do not have permission to access this Workspace",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },

    // Get all Activity within a single Workspace
    workspaceActivity: async (
      _parent: any,
      args: { _id: string; limit: 100 },
      context: Context,
    ): Promise<ActivityModel[]> => {
      const workspace = await Workspaces.getOne(args._id);

      // Access control
      if (
        workspace &&
        (_.includes(workspace.collaborators, context.user) ||
          _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        const result = await Workspaces.getActivity(args._id);
        return result.slice(0, args.limit);
      } else {
        throw new GraphQLError(
          "You do not have permission to access this Workspace",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
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

    // Update an existing Workspace
    updateWorkspace: async (
      _parent: any,
      args: { workspace: WorkspaceModel },
      context: Context,
    ): Promise<ResponseMessage> => {
      const workspace = await Workspaces.getOne(args.workspace._id);

      // Access control
      if (
        workspace &&
        (_.includes(workspace.collaborators, context.user) ||
          _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        return await Workspaces.update(args.workspace);
      } else {
        throw new GraphQLError(
          "You do not have permission to access this Workspace",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },
  },
};
