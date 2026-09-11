import {
  ActivityModel,
  Context,
  EntityModel,
  IWorkspace,
  ProjectModel,
  IResponseMessage,
  CollaboratorMetrics,
  WorkspaceModel,
  IResolverParent,
  ResponseData,
} from "@types";
import _ from "lodash";
import { GraphQLError } from "graphql/index";

// Models
import { Activity } from "@models/Activity";
import { Workspaces } from "@models/Workspaces";
import { User } from "@models/User";

// Email
import { emailTemplates, sendEmail } from "@lib/email";

// Posthog
import { PostHogClient } from "@lib/posthog";

// Utility functions
import { isCollaborator } from "@lib/util";
import dayjs from "dayjs";

const CLIENT_URL = process.env.NODE_ENV === "production" ? "https://app.metadatify.com" : "http://127.0.0.1:8080";

export const WorkspacesResolvers = {
  Query: {
    // Retrieve all Workspaces
    workspaces: async (_parent: IResolverParent, _args: Record<string, unknown>, context: Context) => {
      const workspaces = await Workspaces.all();

      // Access control
      if (workspaces.length > 0) {
        return workspaces.filter((workspace) => {
          return _.isEqual(workspace.owner, context.user) || isCollaborator(context.user, workspace.collaborators);
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
        (workspace.isPublic ||
          isCollaborator(context.user, workspace.collaborators) ||
          _.isEqual(workspace.owner, context.user))
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
        (isCollaborator(context.user, workspace.collaborators) || _.isEqual(workspace.owner, context.user))
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
        (isCollaborator(context.user, workspace.collaborators) || _.isEqual(workspace.owner, context.user))
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
        (isCollaborator(context.user, workspace.collaborators) || _.isEqual(workspace.owner, context.user))
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
    collaboratorMetrics: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<CollaboratorMetrics> => {
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Filter Activity by Workspace and then timestamps (within last 24 hours)
      const activity = await Activity.all();
      const workspaceActivity = activity.filter((activity) => {
        return (
          _.includes(workspace.activity, activity._id) && // Activity in Workspace
          activity.target.type === "workspaces" && // Activity on Workspace
          activity.type === "update" && // Activity is Workspace Updates
          activity.details.includes("Added") &&
          dayjs(activity.timestamp).isAfter(dayjs(Date.now()).subtract(1, "day")) // Within last 24 hours
        );
      });

      return {
        all: workspace.collaborators.length,
        addedDay: workspaceActivity.length,
      };
    },
  },

  Mutation: {
    // Create a new Workspace
    createWorkspace: async (
      _parent: IResolverParent,
      args: { workspace: IWorkspace },
      context: Context,
    ): Promise<ResponseData<string>> => {
      const result = await Workspaces.create(args.workspace);

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "workspace.created",
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
        (isCollaborator(context.user, workspace.collaborators) || _.isEqual(workspace.owner, context.user))
      ) {
        // Check if user is a Workspace owner or collaborator
        const result = await Workspaces.update(args.workspace);

        if (result.success) {
          // Notify any newly added collaborators
          const newCollaborators = _.differenceBy(args.workspace.collaborators, workspace.collaborators, "_id");
          if (newCollaborators.length > 0) {
            const workspaceUrl = `${CLIENT_URL}/workspaces/${args.workspace._id}`;
            await Promise.allSettled(
              newCollaborators.map(async (collaborator) => {
                const collaboratorResult = await User.getOne(collaborator._id);
                if (collaboratorResult) {
                  await sendEmail({
                    to: collaboratorResult.email,
                    subject: `You've been added to "${args.workspace.name}" on Metadatify`,
                    html: emailTemplates.workspaceCollaboratorAdded(
                      collaboratorResult.name,
                      args.workspace.name,
                      workspaceUrl,
                    ),
                  });
                }
              }),
            );

            // Create new Activity if successful
            const activity = await Activity.create({
              timestamp: dayjs(Date.now()).toISOString(),
              type: "update",
              actor: context.user,
              details: `Added ${newCollaborators.length} Collaborator${newCollaborators.length !== 1 ? "s" : ""}`,
              target: {
                _id: workspace._id,
                type: "workspaces",
                name: workspace.name,
              },
            });

            // Add Activity to Workspace
            await Workspaces.addActivity(context.workspace, activity.data);
          } else if (args.workspace.collaborators.length < workspace.collaborators.length) {
            const removedCollaborators = workspace.collaborators.length - args.workspace.collaborators.length;

            // Create new Activity if successful
            const activity = await Activity.create({
              timestamp: dayjs(Date.now()).toISOString(),
              type: "update",
              actor: context.user,
              details: `Removed ${removedCollaborators} Collaborator${removedCollaborators !== 1 ? "s" : ""}`,
              target: {
                _id: workspace._id,
                type: "workspaces",
                name: workspace.name,
              },
            });

            // Add Activity to Workspace
            await Workspaces.addActivity(context.workspace, activity.data);
          }

          // Add Activity for other Workspace modifications
          if (workspace.description !== args.workspace.description) {
            const activity = await Activity.create({
              timestamp: dayjs(Date.now()).toISOString(),
              type: "update",
              actor: context.user,
              details: "Updated Workspace description",
              target: {
                _id: workspace._id,
                type: "workspaces",
                name: workspace.name,
              },
            });

            // Add Activity to Workspace
            await Workspaces.addActivity(context.workspace, activity.data);
          } else if (workspace.name !== args.workspace.name) {
            const activity = await Activity.create({
              timestamp: dayjs(Date.now()).toISOString(),
              type: "update",
              actor: context.user,
              details: "Updated Workspace name",
              target: {
                _id: workspace._id,
                type: "workspaces",
                name: workspace.name,
              },
            });

            // Add Activity to Workspace
            await Workspaces.addActivity(context.workspace, activity.data);
          }

          // Capture event
          if (process.env.DISABLE_CAPTURE !== "true") {
            PostHogClient?.capture({
              distinctId: context.user,
              event: "workspace.updated",
            });
          }
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
