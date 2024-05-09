import { Entities } from "src/models/Entities"

export const EntitiesResolvers = {
  Query: {
    // Retrieve all Entities
    entities: async () => await Entities.all(),

    // Retrieve one Entity by _id
    entity: async (_parent: any, args: { _id: string }) => {
      const entities = await Entities.all();
      return entities.find((entity) => entity._id.toString() === args._id);
    },
  }
}
