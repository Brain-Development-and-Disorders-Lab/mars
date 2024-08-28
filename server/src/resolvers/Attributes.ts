// Custom types
import { AttributeModel, Context, IAttribute } from "@types";

// Attributes model
import { Attributes } from "src/models/Attributes";

export const AttributesResolvers = {
  Query: {
    // Retrieve all Attributes
    attributes: async (_parent: any, args: { limit: 100 }) => {
      const attributes = await Attributes.all();
      return attributes.slice(0, args.limit);
    },

    // Retrieve one Attribute by _id
    attribute: async (_parent: any, args: { _id: string }) => {
      const attributes = await Attributes.all();
      return attributes.find(
        (attribute) => attribute._id.toString() === args._id,
      );
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
