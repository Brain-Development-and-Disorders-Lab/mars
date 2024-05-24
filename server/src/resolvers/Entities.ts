import { ResponseMessage } from "@types";
import { Entities } from "src/models/Entities"

export const EntitiesResolvers = {
  Query: {
    // Retrieve all Entities
    entities: async (_parent: any, args: { limit: 100 }) => {
      const entities = await Entities.all();
      return entities.slice(0, args.limit);
    },

    // Retrieve one Entity by _id
    entity: async (_parent: any, args: { _id: string }) => {
      return await Entities.getOne(args._id);
    },
  },
  Mutation: {
    setEntityDescription: async (_parent: any, args: { _id: string, description: string }): Promise<ResponseMessage> => {
      return await Entities.setDescription(args._id, args.description);;
    }
  }
}
