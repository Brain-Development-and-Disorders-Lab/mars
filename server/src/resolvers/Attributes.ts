// Custom types
import { AttributeModel, Context, IAttribute } from "@types";

// Models
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

      // Check that Attribute is owned by the user and exists in the Workspace
      if (
        attribute.owner === context.user &&
        _.includes(workspace.attributes, attribute._id)
      ) {
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
      return await Attributes.create(args.attribute, context.workspace);
    },

    // Update an existing Attribute
    updateAttribute: async (
      _parent: any,
      args: { attribute: AttributeModel },
      context: Context,
    ) => {
      return await Attributes.update(args.attribute, context.workspace);
    },

    // Delete an Attribute
    deleteAttribute: async (
      _parent: any,
      args: { _id: string },
      context: Context,
    ) => {
      return await Attributes.delete(args._id, context.workspace);
    },
  },
};
