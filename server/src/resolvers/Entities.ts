import {
  AttributeModel,
  Context,
  EntityModel,
  IEntity,
  IGenericItem,
  ResponseMessage,
} from "@types";
import { GraphQLError } from "graphql";
import _ from "lodash";
import { Entities } from "src/models/Entities";

export const EntitiesResolvers = {
  Query: {
    // Retrieve all Entities
    entities: async (_parent: any, args: { limit: 100 }, context: Context) => {
      const entities = await Entities.all();
      // Filter by ownership
      return entities
        .filter((e) => e.owner === context.user)
        .slice(0, args.limit);
    },

    // Retrieve one Entity by _id
    entity: async (
      _parent: any,
      args: { _id: string },
      context: Context,
    ): Promise<EntityModel> => {
      const entity = await Entities.getOne(args._id);
      if (_.isNull(entity)) {
        throw new GraphQLError("Entity does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (entity.owner === context.user) {
        return entity;
      } else {
        throw new GraphQLError(
          "You do not have permission to access this Entity",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },

    // Search owned Entities by a search string
    searchEntity: async (
      _parent: any,
      args: { search: string; limit: 100 },
      context: Context,
    ) => {
      return await Entities.search(context.user, args.search, args.limit);
    },

    // Check if Entity exists by ID
    entityExists: async (_parent: any, args: { _id: string }) => {
      return await Entities.exists(args._id);
    },

    // Check if Entity exists by name
    entityNameExists: async (_parent: any, args: { name: string }) => {
      return await Entities.existByName(args.name);
    },

    // Export one Entity by _id
    exportEntity: async (
      _parent: any,
      args: { _id: string; format: "json" | "csv"; fields?: string[] },
      context: Context,
    ) => {
      const entity = await Entities.getOne(args._id);
      if (_.isNull(entity)) {
        throw new GraphQLError("Entity does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (entity.owner === context.user) {
        return await Entities.export(args._id, args.format, args.fields);
      } else {
        throw new GraphQLError(
          "You do not have permission to access this Entity",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },
  },

  Mutation: {
    setEntityDescription: async (
      _parent: any,
      args: { _id: string; description: string },
      context: Context,
    ): Promise<ResponseMessage> => {
      const entity = await Entities.getOne(args._id);
      if (_.isNull(entity)) {
        throw new GraphQLError("Entity does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (entity.owner === context.user) {
        return await Entities.setDescription(args._id, args.description);
      } else {
        throw new GraphQLError(
          "You do not have permission to modify this Entity",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },

    createEntity: async (
      _parent: any,
      args: { entity: IEntity },
    ): Promise<ResponseMessage> => {
      return await Entities.create(args.entity);
    },

    updateEntity: async (
      _parent: any,
      args: { entity: EntityModel },
      context: Context,
    ): Promise<ResponseMessage> => {
      const entity = await Entities.getOne(args.entity._id);
      if (_.isNull(entity)) {
        throw new GraphQLError("Entity does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (entity.owner === context.user) {
        return await Entities.update(args.entity);
      } else {
        throw new GraphQLError(
          "You do not have permission to modify this Entity",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },

    deleteEntity: async (_parent: any, args: { _id: string }) => {
      return await Entities.delete(args._id);
    },

    // Set the Entity "lock" status
    setEntityLock: async (
      _parent: any,
      args: { _id: string; lock: boolean },
    ) => {
      return await Entities.setLock(args._id, args.lock);
    },

    // Projects
    addEntityProject: async (
      _parent: any,
      args: { _id: string; project: string },
    ): Promise<ResponseMessage> => {
      return await Entities.addProject(args._id, args.project);
    },
    removeEntityProject: async (
      _parent: any,
      args: { _id: string; project: string },
    ): Promise<ResponseMessage> => {
      return await Entities.removeProject(args._id, args.project);
    },
    // Associations: Products
    addEntityProduct: async (
      _parent: any,
      args: { _id: string; product: IGenericItem },
    ): Promise<ResponseMessage> => {
      return await Entities.addProduct(args._id, args.product);
    },
    addEntityProducts: async (
      _parent: any,
      args: { _id: string; products: IGenericItem[] },
    ): Promise<ResponseMessage> => {
      return await Entities.addProducts(args._id, args.products);
    },
    removeEntityProduct: async (
      _parent: any,
      args: { _id: string; product: IGenericItem },
    ): Promise<ResponseMessage> => {
      return await Entities.removeProduct(args._id, args.product);
    },
    // Associations: Origins
    addEntityOrigin: async (
      _parent: any,
      args: { _id: string; origin: IGenericItem },
    ): Promise<ResponseMessage> => {
      return await Entities.addOrigin(args._id, args.origin);
    },
    addEntityOrigins: async (
      _parent: any,
      args: { _id: string; origins: IGenericItem[] },
    ): Promise<ResponseMessage> => {
      return await Entities.addOrigins(args._id, args.origins);
    },
    removeEntityOrigin: async (
      _parent: any,
      args: { _id: string; origin: IGenericItem },
    ): Promise<ResponseMessage> => {
      return await Entities.removeOrigin(args._id, args.origin);
    },
    // Attributes
    addEntityAttribute: async (
      _parent: any,
      args: { _id: string; attribute: AttributeModel },
    ): Promise<ResponseMessage> => {
      return await Entities.addAttribute(args._id, args.attribute);
    },
    removeEntityAttribute: async (
      _parent: any,
      args: { _id: string; attribute: string },
    ): Promise<ResponseMessage> => {
      return await Entities.removeAttribute(args._id, args.attribute);
    },
    updateEntityAttribute: async (
      _parent: any,
      args: { _id: string; attribute: AttributeModel },
    ): Promise<ResponseMessage> => {
      return await Entities.updateAttribute(args._id, args.attribute);
    },
  },
};
