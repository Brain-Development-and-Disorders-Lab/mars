// Custom types
import { AttributeModel, Context, IAttribute } from "@types";

// Models
import { Activity } from "../models/Activity";
import { Attributes } from "../models/Attributes";
import { Workspaces } from "../models/Workspaces";

// Utility functions and libraries
import _ from "lodash";
import { GraphQLError } from "graphql/index";

export const AttributesResolvers = {
  Query: {
    // Retrieve all Attributes
    attributes: async (
      _parent: any,
      args: { limit: 100 },
      context: Context,
    ) => {
      // Check Workspace exists
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
      // Check Workspace exists
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check Entity exists
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

    // Check if an Attribute exists
    attributeExists: async (_parent: any, args: { _id: string }) => {
      return await Attributes.exists(args._id);
    },
  },

  Mutation: {
    // Create a new Attribute
    createAttribute: async (
      _parent: any,
      args: { attribute: IAttribute },
      context: Context,
    ) => {
      const result = await Attributes.create(args.attribute);

      if (result.success) {
        // Add the Attribute to the Workspace
        await Workspaces.addAttribute(context.workspace, result.message);

        // If successful, add Activity
        const activity = await Activity.create({
          timestamp: new Date(),
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
      const attribute = await Attributes.getOne(args.attribute._id);
      if (_.isNull(attribute)) {
        throw new GraphQLError("Attribute does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Execute update operation
      const result = await Attributes.update(args.attribute);

      if (result.success) {
        // If successful, add Activity
        const activity = await Activity.create({
          timestamp: new Date(),
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

    // Delete an Attribute
    deleteAttribute: async (
      _parent: any,
      args: { _id: string },
      context: Context,
    ) => {
      const attribute = await Attributes.getOne(args._id);
      if (_.isNull(attribute)) {
        throw new GraphQLError("Attribute does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Execute delete operation
      const result = await Attributes.delete(args._id);

      // If successful, add Activity
      if (result.success) {
        const activity = await Activity.create({
          timestamp: new Date(),
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
