// Custom types
import {
  AttributeModel,
  AttributeUsage,
  Context,
  IAttribute,
  IResolverParent,
  IResponseMessage,
  AttributeMetrics,
} from "@types";

// Models
import { Activity } from "@models/Activity";
import { Attributes } from "@models/Attributes";
import { Workspaces } from "@models/Workspaces";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

import { GraphQLError } from "graphql/index";

// Posthog
import { PostHogClient } from "@lib/posthog";

export const AttributesResolvers = {
  Query: {
    // Retrieve all Attribute
    attributes: async (_parent: IResolverParent, args: { limit: 100 }, context: Context) => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(context.user, context.workspace);
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Retrieve the Workspace to determine which Entities to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Filter by ownership and Workspace membership
      const attributes = await Attributes.all();
      return attributes
        .filter((attribute: AttributeModel) => _.includes(workspace.attributes, attribute._id))
        .slice(0, args.limit);
    },

    // Retrieve one Attribute by _id
    attribute: async (_parent: IResolverParent, args: { _id: string }, context: Context) => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(context.user, context.workspace);
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Retrieve the Workspace to determine which Entities to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check Attribute exists
      const attribute = await Attributes.getOne(args._id);
      if (_.isNull(attribute)) {
        throw new GraphQLError("Attribute does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check that Attribute exists in the Workspace
      if (_.includes(workspace.attributes, attribute._id)) {
        return attribute;
      } else {
        throw new GraphQLError("You do not have permission to access this Attribute", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
    },

    attributeUsage: async (
      _parent: IResolverParent,
      args: { _id: string },
      context: Context,
    ): Promise<AttributeUsage[]> => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(context.user, context.workspace);
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Retrieve the Workspace to confirm it exists
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      return await Attributes.usage(workspace._id, args._id);
    },

    // Get collection of Attribute metrics
    attributeMetrics: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<AttributeMetrics> => {
      // Retrieve the Workspace to determine which Entities to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Filter by ownership and Workspace membership, then if created in the last 24 hours
      const attributes = await Attributes.all();
      const workspaceAttributes = attributes.filter((attribute) => _.includes(workspace.attributes, attribute._id));

      // Filter Activity by Workspace and then timestamps (within last 24 hours)
      const activity = await Activity.all();
      const workspaceActivity = activity.filter((activity) => {
        return (
          _.includes(workspace.activity, activity._id) && // Activity in Workspace
          activity.target.type === "attributes" && // Activity on Attributes
          activity.type === "create" && // Activity is Attribute creation
          dayjs(activity.timestamp).isAfter(dayjs(Date.now()).subtract(1, "day")) // Within last 24 hours
        );
      });

      return {
        all: workspaceAttributes.length,
        addedDay: workspaceActivity.length,
      };
    },

    // Export an Attribute
    exportAttribute: async (
      _parent: IResolverParent,
      args: { _id: string; fields?: string[]; includeHistory?: boolean },
      context: Context,
    ): Promise<string> => {
      // Retrieve the Workspace to determine which Entities to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      const attribute = await Attributes.getOne(args._id);
      if (_.isNull(attribute)) {
        throw new GraphQLError("Attribute does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (_.includes(workspace.attributes, args._id)) {
        return await Attributes.export(args._id, args.fields, args.includeHistory);
      } else {
        throw new GraphQLError("You do not have permission to access this Attribute", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
    },
  },

  Mutation: {
    // Create a new Attribute
    createAttribute: async (_parent: IResolverParent, args: { attribute: IAttribute }, context: Context) => {
      const result = await Attributes.create(args.attribute);

      if (result.success) {
        // Add the Attribute to the Workspace
        await Workspaces.addAttribute(context.workspace, result.data);

        // If successful, add Activity
        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "create",
          actor: context.user,
          details: "Created new Attribute",
          target: {
            _id: result.data, // New Attribute identifier
            type: "attributes",
            name: args.attribute.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.data);
      }

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "attribute.created",
        });
      }

      return result;
    },

    // Update an existing Attribute
    updateAttribute: async (
      _parent: IResolverParent,
      args: { attribute: AttributeModel; message?: string },
      context: Context,
    ) => {
      // Retrieve the Workspace to determine which Entities to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      const attribute = await Attributes.getOne(args.attribute._id);
      if (_.isNull(attribute)) {
        throw new GraphQLError("Attribute does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (!_.includes(workspace.attributes, args.attribute._id)) {
        throw new GraphQLError("You do not have permission to modify this Attribute", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Add history entry before executing the update
      await Attributes.addHistory(attribute, context.user, args.message);

      // Execute update operation
      const result = await Attributes.update(args.attribute);

      if (result.success) {
        // If successful, add Activity
        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "update",
          actor: context.user,
          details: "Updated Attribute",
          target: {
            _id: args.attribute._id,
            type: "attributes",
            name: args.attribute.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.data);
      }

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "attribute.updated",
        });
      }

      return result;
    },

    // Archive a Attribute
    archiveAttribute: async (_parent: IResolverParent, args: { _id: string; state: boolean }, context: Context) => {
      // Retrieve the Workspace to determine which Entities to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      const attribute = await Attributes.getOne(args._id);
      if (_.isNull(attribute)) {
        throw new GraphQLError("Attribute does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (!_.includes(workspace.attributes, args._id)) {
        throw new GraphQLError("You do not have permission to modify the archive state of this Attribute", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "attribute.archived",
        });
      }

      // Execute archive operation
      if (attribute.archived === args.state) {
        return {
          success: true,
          message: "Attribute archive state unchanged",
        };
      } else {
        const result = await Attributes.setArchived(args._id, args.state);

        // If successful, add Activity
        if (result.success) {
          const activity = await Activity.create({
            timestamp: dayjs(Date.now()).toISOString(),
            type: "archived",
            actor: context.user,
            details: args.state ? "Archived Attribute" : "Restored Attribute",
            target: {
              _id: args._id,
              type: "attributes",
              name: attribute.name,
            },
          });

          // Add Activity to Workspace
          await Workspaces.addActivity(context.workspace, activity.data);
        }

        return result;
      }
    },

    // Archive multiple Attributes
    archiveAttributes: async (
      _parent: IResolverParent,
      args: { toArchive: string[]; state: boolean },
      context: Context,
    ): Promise<IResponseMessage> => {
      let archiveCounter = 0;
      for await (const _id of args.toArchive) {
        const attribute = await Attributes.getOne(_id);
        if (_.isNull(attribute)) {
          throw new GraphQLError("Attribute does not exist", {
            extensions: {
              code: "NON_EXIST",
            },
          });
        }

        if (attribute.archived === args.state) {
          archiveCounter += 1;
        } else {
          // Execute archive operation
          const result = await Attributes.setArchived(_id, args.state);

          // If successful, add Activity
          if (result.success) {
            const activity = await Activity.create({
              timestamp: dayjs(Date.now()).toISOString(),
              type: "archived",
              actor: context.user,
              details: args.state ? "Archived Attribute" : "Restored Attribute",
              target: {
                _id: _id,
                type: "attributes",
                name: attribute.name,
              },
            });

            // Add Activity to Workspace
            await Workspaces.addActivity(context.workspace, activity.data);
            archiveCounter += 1;
          }
        }
      }

      return {
        success: args.toArchive.length === archiveCounter,
        message:
          args.toArchive.length === archiveCounter
            ? "Archived Attributes successfully"
            : "Error while archiving multiple Attributes",
      };
    },
  },
};
