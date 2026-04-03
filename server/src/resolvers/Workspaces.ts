import {
  ActivityModel,
  Context,
  EntityModel,
  IWorkspace,
  ProjectModel,
  IResponseMessage,
  WorkspaceMetrics,
  WorkspaceModel,
  IResolverParent,
} from "@types";
import _ from "lodash";
import { GraphQLError } from "graphql/index";

// Models
import { Workspaces } from "@models/Workspaces";
import { User } from "@models/User";

// Email
import { sendEmail, templates } from "@lib/email";

const CLIENT_URL = process.env.NODE_ENV === "production" ? "https://app.metadatify.com" : "http://127.0.0.1:8080";

// Posthog
import { PostHogClient } from "src";

export const WorkspacesResolvers = {
  Query: {
    // Retrieve all Workspaces
    workspaces: async (_parent: IResolverParent, _args: Record<string, unknown>, context: Context) => {
      const workspaces = await Workspaces.all();

      // Access control
      if (workspaces.length > 0) {
        return workspaces.filter((workspace) => {
          return _.isEqual(workspace.owner, context.user) || _.includes(workspace.collaborators, context.user);
        });
      }

      // Default return
      return [];
    },

    // Get one Workspace
    workspace: async (
      _parent: IResolverParent,
      args: { _id: string },
      context: Context,
    ): Promise<WorkspaceModel | null> => {
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
        (_.includes(workspace.collaborators, context.user) || _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        return workspace;
      } else {
        throw new GraphQLError("You do not have permission to access this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
    },

    // Get all Entities within a single Workspace
    workspaceEntities: async (
      _parent: IResolverParent,
      args: { _id: string; limit: 100 },
      context: Context,
    ): Promise<EntityModel[]> => {
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
        (_.includes(workspace.collaborators, context.user) || _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        const result = await Workspaces.getEntities(args._id);
        return result.slice(0, args.limit);
      } else {
        throw new GraphQLError("You do not have permission to access this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
    },

    // Get all Projects within a single Workspace
    workspaceProjects: async (
      _parent: IResolverParent,
      args: { _id: string; limit: 100 },
      context: Context,
    ): Promise<ProjectModel[]> => {
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
        (_.includes(workspace.collaborators, context.user) || _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        const result = await Workspaces.getProjects(args._id);
        return result.slice(0, args.limit);
      } else {
        throw new GraphQLError("You do not have permission to access this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
    },

    // Get all Activity within a single Workspace
    workspaceActivity: async (
      _parent: IResolverParent,
      args: { _id: string; limit: 100 },
      context: Context,
    ): Promise<ActivityModel[]> => {
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
        (_.includes(workspace.collaborators, context.user) || _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        const result = await Workspaces.getActivity(args._id);
        return result.slice(0, args.limit);
      } else {
        throw new GraphQLError("You do not have permission to access this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
    },

    // Get collection of Workspace metrics
    workspaceMetrics: async (
      _parent: IResolverParent,
      args: { _id?: string },
      context: Context,
    ): Promise<WorkspaceMetrics> => {
      const workspace = await Workspaces.getOne(args._id || context.workspace);
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
      _parent: IResolverParent,
      args: { workspace: IWorkspace },
      context: Context,
    ): Promise<IResponseMessage> => {
      const result = await Workspaces.create(args.workspace);

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "server_create_workspace",
        });
      }

      return result;
    },

    // Update an existing Workspace
    updateWorkspace: async (
      _parent: IResolverParent,
      args: { workspace: WorkspaceModel },
      context: Context,
    ): Promise<IResponseMessage> => {
      const workspace = await Workspaces.getOne(args.workspace._id);

      // Access control
      if (
        workspace &&
        (_.includes(workspace.collaborators, context.user) || _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        const result = await Workspaces.update(args.workspace);

        // Notify any newly added collaborators
        const newCollaborators = _.difference(args.workspace.collaborators, workspace.collaborators);
        if (newCollaborators.length > 0) {
          const workspaceUrl = `${CLIENT_URL}/workspaces/${args.workspace._id}`;
          await Promise.allSettled(
            newCollaborators.map(async (collaboratorId) => {
              const collaborator = await User.getOne(collaboratorId);
              if (collaborator) {
                await sendEmail({
                  to: collaborator.email,
                  subject: `You've been added to "${args.workspace.name}" on Metadatify`,
                  html: templates.workspaceCollaboratorAdded(collaborator.name, args.workspace.name, workspaceUrl),
                });
              }
            }),
          );
        }

        // Capture event
        if (process.env.DISABLE_CAPTURE !== "true") {
          PostHogClient?.capture({
            distinctId: context.user,
            event: "server_update_workspace",
          });
        }

        return result;
      } else {
        throw new GraphQLError("You do not have permission to access this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
    },
  },
};
