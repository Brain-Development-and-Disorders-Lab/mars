import { AttributeModel, IAttribute } from "@types";
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
    createAttribute: async (_parent: any, args: { attribute: IAttribute }) => {
      return await Attributes.create(args.attribute);
    },

    // Update an existing Attribute
    updateAttribute: async (
      _parent: any,
      args: { attribute: AttributeModel },
    ) => {
      return await Attributes.update(args.attribute);
    },
  },
};
