// Custom types
import {
  AttributeMetrics,
  AttributeModel,
  Context,
  IAttribute,
  IResponseMessage,
} from "@types";

// Models
import { Activity } from "../models/Activity";
import { Attributes } from "../models/Attributes";
import { Workspaces } from "../models/Workspaces";
import { Authentication } from "src/models/Authentication";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

import { GraphQLError } from "graphql/index";

export const AttributesResolvers = {
  Query: {
    // Retrieve all Attributes
    attributes: async (
      _parent: any,
      args: { limit: 100 },
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

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
        .filter((attribute) => _.includes(workspace.attributes, attribute._id))
        .slice(0, args.limit);
    },

    // Retrieve one Attribute by _id
    attribute: async (
      _parent: any,
      args: { _id: string },
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

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
        throw new GraphQLError(
          "You do not have permission to access this Attribute",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },

    // Get collection of Attribute metrics
    attributeMetrics: async (
      _parent: any,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<AttributeMetrics> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

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
      const workspaceAttributes = attributes.filter((attribute) =>
        _.includes(workspace.attributes, attribute._id),
      );
      const attributesAddedDay = workspaceAttributes.filter((attribute) =>
        dayjs(attribute.timestamp).isAfter(
          dayjs(Date.now()).subtract(1, "day"),
        ),
      );

      return {
        all: workspaceAttributes.length,
        addedDay: attributesAddedDay.length,
      };
    },
  },

  Mutation: {
    // Create a new Attribute
    createAttribute: async (
      _parent: any,
      args: { attribute: IAttribute },
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      const result = await Attributes.create(args.attribute);

      if (result.success) {
        // Add the Attribute to the Workspace
        await Workspaces.addAttribute(context.workspace, result.message);

        // If successful, add Activity
        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "create",
          actor: context.user,
          details: "Created new Attribute",
          target: {
            _id: result.message, // New Attribute identifier
            type: "attributes",
            name: args.attribute.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.message);
      }

      return result;
    },

    // Update an existing Attribute
    updateAttribute: async (
      _parent: any,
      args: { attribute: AttributeModel },
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

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
        throw new GraphQLError(
          "You do not have permission to modify this Attribute",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }

      // Execute update operation
      const result = await Attributes.update(args.attribute);

      if (result.success) {
        // If successful, add Activity
        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "update",
          actor: context.user,
          details: "Updated existing Attribute",
          target: {
            _id: args.attribute._id,
            type: "attributes",
            name: args.attribute.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.message);
      }

      return result;
    },

    // Archive an Attribute
    archiveAttribute: async (
      _parent: any,
      args: { _id: string; state: boolean },
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

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
        throw new GraphQLError(
          "You do not have permission to modify the archive state of this Attribute",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
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
          await Workspaces.addActivity(context.workspace, activity.message);
        }

        return result;
      }
    },

    // Archive multiple Attributes
    archiveAttributes: async (
      _parent: any,
      args: { toArchive: string[]; state: boolean },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

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
            await Workspaces.addActivity(context.workspace, activity.message);
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

    // Delete an Attribute
    deleteAttribute: async (
      _parent: any,
      args: { _id: string },
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

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
        throw new GraphQLError(
          "You do not have permission to delete this Attribute",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }

      // Execute delete operation
      const result = await Attributes.delete(args._id);

      // If successful, add Activity
      if (result.success) {
        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "delete",
          actor: context.user,
          details: "Deleted Attribute",
          target: {
            _id: args._id,
            type: "attributes",
            name: attribute.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.message);
      }

      return result;
    },
  },
};
