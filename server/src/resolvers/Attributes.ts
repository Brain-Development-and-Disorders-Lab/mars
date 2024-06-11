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
  },
};
