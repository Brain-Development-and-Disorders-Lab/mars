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
import { Workspaces } from "../models/Workspaces";

export const EntitiesResolvers = {
  Query: {
    // Retrieve all Entities
    entities: async (_parent: any, args: { limit: 100 }, context: Context) => {
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Filter by ownership and Workspace membership
      const entities = await Entities.all();
      return entities
        .filter((entity) => _.includes(workspace?.entities, entity._id))
        .slice(0, args.limit);
    },

    // Retrieve one Entity by _id
    entity: async (
      _parent: any,
      args: { _id: string },
      context: Context,
    ): Promise<EntityModel> => {
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
      const entity = await Entities.getOne(args._id);
      if (_.isNull(entity)) {
        throw new GraphQLError("Entity does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check that Entity is owned by the user and exists in the Workspace
      if (
        entity.owner === context.user &&
        _.includes(workspace?.entities, entity._id)
      ) {
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
      const entity = await Entities.getOne(args._id);
      if (_.isNull(entity)) {
        throw new GraphQLError("Entity does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check that Entity is owned by the user and exists in the Workspace
      if (
        entity.owner === context.user &&
        _.includes(workspace?.entities, entity._id)
      ) {
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

    // Export multiple Entities by _id
    exportEntities: async (
      _parent: any,
      args: { entities: string[] },
      context: Context,
    ) => {
      const authorizedEntities = [];

      // Ensure only Entities the user is authorized to access are exported
      for (const entity of args.entities) {
        const result = await Entities.getOne(entity);
        if (result && result.owner === context.user) {
          authorizedEntities.push(entity);
        }
      }

      return await Entities.exportMany(authorizedEntities);
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

    // Create a new Entity from IEntity data structure
    createEntity: async (
      _parent: any,
      args: { entity: IEntity },
      context: Context,
    ): Promise<ResponseMessage> => {
      return await Entities.create(args.entity, context.workspace);
    },

    // Update an existing Entity from EntityModel data structure
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

    // Delete an Entity
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

    // Project mutations
    // Add an Entity to a Project
    addEntityProject: async (
      _parent: any,
      args: { _id: string; project: string },
    ): Promise<ResponseMessage> => {
      return await Entities.addProject(args._id, args.project);
    },
    // Remove an Entity from a Project
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
