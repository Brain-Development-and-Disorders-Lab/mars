import {
  ActivityModel,
  Context,
  EntityModel,
  IWorkspace,
  ProjectModel,
  IResponseMessage,
  WorkspaceMetrics,
  WorkspaceModel,
} from "@types";
import _ from "lodash";
import { GraphQLError } from "graphql/index";

// Models
import { Authentication } from "src/models/Authentication";
import { Workspaces } from "src/models/Workspaces";
import { Users } from "src/models/Users";

// Posthog
import { PostHogClient } from "src";

export const WorkspacesResolvers = {
  Query: {
    // Retrieve all Workspaces
    workspaces: async (_parent: any, _args: any, context: Context) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

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
      // Authenticate the provided context
      await Authentication.authenticate(context);

      const workspace = await Workspaces.getOne(args._id);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

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
      // Authenticate the provided context
      await Authentication.authenticate(context);

      const workspace = await Workspaces.getOne(args._id);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

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
      // Authenticate the provided context
      await Authentication.authenticate(context);

      const workspace = await Workspaces.getOne(args._id);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

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
      // Authenticate the provided context
      await Authentication.authenticate(context);

      const workspace = await Workspaces.getOne(args._id);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

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

    // Get collection of Workspace metrics
    workspaceMetrics: async (
      _parent: any,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<WorkspaceMetrics> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      return {
        collaborators: workspace.collaborators.length,
      };
    },
  },

  Mutation: {
    // Create a new Workspace
    createWorkspace: async (
      _parent: any,
      args: { workspace: IWorkspace },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      const result = await Workspaces.create(args.workspace);

      if (result.success) {
        // If successful, add Workspace to the User
        await Users.addWorkspace(context.user, result.data);
      }

      // Capture event
      PostHogClient.capture({
        distinctId: context.user,
        event: "server_create_workspace",
      });

      return result;
    },

    // Update an existing Workspace
    updateWorkspace: async (
      _parent: any,
      args: { workspace: WorkspaceModel },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      const workspace = await Workspaces.getOne(args.workspace._id);

      // Access control
      if (
        workspace &&
        (_.includes(workspace.collaborators, context.user) ||
          _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        const result = await Workspaces.update(args.workspace);

        // Capture event
        PostHogClient.capture({
          distinctId: context.user,
          event: "server_update_workspace",
        });

        return result;
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
