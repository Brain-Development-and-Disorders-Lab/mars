import {
  Context,
  EntityMetrics,
  EntityModel,
  IEntity,
  ResponseMessage,
} from "@types";
import { GraphQLError } from "graphql";
import _ from "lodash";
import dayjs from "dayjs";

// Models
import { Activity } from "../models/Activity";
import { Entities } from "../models/Entities";
import { Workspaces } from "../models/Workspaces";
import { Authentication } from "src/models/Authentication";

export const EntitiesResolvers = {
  Query: {
    // Retrieve all Entities
    entities: async (
      _parent: any,
      args: { limit: 100; archived: boolean },
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
      const entities = await Entities.getMany(workspace.entities);
      return entities
        .filter((entity) => {
          if (args.archived === true) {
            // If showing all Entities, including archived
            return true;
          } else {
            // If only showing active Entities, not archived
            return entity.archived === false;
          }
        })
        .slice(0, args.limit);
    },

    // Retrieve one Entity by _id
    entity: async (
      _parent: any,
      args: { _id: string },
      context: Context,
    ): Promise<EntityModel> => {
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
      if (_.includes(workspace.entities, entity._id)) {
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
      if (_.includes(workspace.entities, entity._id)) {
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

      const authorizedEntities = [];

      // Ensure only Entities the user is authorized to access are exported
      for (const entity of args.entities) {
        const result = await Entities.getOne(entity);
        if (result && _.includes(workspace.entities, entity)) {
          authorizedEntities.push(entity);
        }
      }

      return await Entities.exportMany(authorizedEntities);
    },

    // Get collection of Entity metrics
    entityMetrics: async (
      _parent: any,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<EntityMetrics> => {
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
      const entities = await Entities.all();
      const workspaceEntities = entities.filter((entity) =>
        _.includes(workspace.entities, entity._id),
      );
      const entitiesAddedDay = workspaceEntities.filter((entity) =>
        dayjs(entity.timestamp).isAfter(dayjs(Date.now()).subtract(1, "day")),
      );

      return {
        all: workspaceEntities.length,
        addedDay: entitiesAddedDay.length,
      };
    },
  },

  Mutation: {
    setEntityDescription: async (
      _parent: any,
      args: { _id: string; description: string },
      context: Context,
    ): Promise<ResponseMessage> => {
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

      const entity = await Entities.getOne(args._id);
      if (_.isNull(entity)) {
        throw new GraphQLError("Entity does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (_.includes(workspace.entities, args._id)) {
        // Update description if Entity is in Workspace
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
      // Authenticate the provided context
      await Authentication.authenticate(context);

      // Apply create operation
      const result = await Entities.create(args.entity);

      if (result.success) {
        // Add the Entity to the Workspace
        await Workspaces.addEntity(context.workspace, result.message);

        // Create new Activity if successful
        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "create",
          actor: context.user,
          details: "Created new Entity",
          target: {
            _id: result.message,
            type: "entities",
            name: args.entity.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.message);
      }

      return result;
    },

    // Update an existing Entity from EntityModel data structure
    updateEntity: async (
      _parent: any,
      args: { entity: EntityModel },
      context: Context,
    ): Promise<ResponseMessage> => {
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

      const entity = await Entities.getOne(args.entity._id);
      if (_.isNull(entity)) {
        throw new GraphQLError("Entity does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (_.includes(workspace.entities, args.entity._id)) {
        // Apply update operation
        const result = await Entities.update(args.entity);

        // Create new Activity if successful
        if (result.success) {
          // Add history to Entity
          await Entities.addHistory(entity);

          const activity = await Activity.create({
            timestamp: dayjs(Date.now()).toISOString(),
            type: "update",
            actor: context.user,
            details: "Updated existing Entity",
            target: {
              _id: args.entity._id,
              type: "entities",
              name: args.entity.name,
            },
          });

          // Add Activity to Workspace
          await Workspaces.addActivity(context.workspace, activity.message);
        }

        return result;
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

    // Archive an Entity
    archiveEntity: async (
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

      const entity = await Entities.getOne(args._id);
      if (_.isNull(entity)) {
        throw new GraphQLError("Entity does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (!_.includes(workspace.entities, args._id)) {
        throw new GraphQLError(
          "You do not have permission to modify the archive state of this Entity",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }

      if (entity.archived === args.state) {
        return {
          success: true,
          message: "Entity archive state unchanged",
        };
      } else {
        // Perform archive operation
        const result = await Entities.setArchived(args._id, args.state);

        // Create new Activity if successful
        if (result.success) {
          const activity = await Activity.create({
            timestamp: dayjs(Date.now()).toISOString(),
            type: "archived",
            actor: context.user,
            details: args.state ? "Archived Entity" : "Restored Entity",
            target: {
              _id: entity._id,
              type: "entities",
              name: entity.name,
            },
          });

          // Add Activity to Workspace
          await Workspaces.addActivity(context.workspace, activity.message);
        }

        return result;
      }
    },

    // Archive multiple Entities
    archiveEntities: async (
      _parent: any,
      args: { toArchive: string[]; state: boolean },
      context: Context,
    ): Promise<ResponseMessage> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      let archiveCounter = 0;
      for await (const _id of args.toArchive) {
        const entity = await Entities.getOne(_id);
        if (_.isNull(entity)) {
          throw new GraphQLError("Entity does not exist", {
            extensions: {
              code: "NON_EXIST",
            },
          });
        }

        if (entity.archived === args.state) {
          archiveCounter += 1;
        } else {
          // Perform archive operation
          const result = await Entities.setArchived(_id, args.state);

          // Create new Activity if successful
          if (result.success) {
            const activity = await Activity.create({
              timestamp: dayjs(Date.now()).toISOString(),
              type: "archived",
              actor: context.user,
              details: args.state ? "Archived Entity" : "Restored Entity",
              target: {
                _id: entity._id,
                type: "entities",
                name: entity.name,
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
            ? "Archived Entities successfully"
            : "Error while archiving multiple Entities",
      };
    },

    // Delete an Entity
    deleteEntity: async (
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

      if (!_.includes(workspace.entities, args._id)) {
        throw new GraphQLError(
          "You do not have permission to delete this Entity",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }

      const entity = await Entities.getOne(args._id);
      if (_.isNull(entity)) {
        throw new GraphQLError("Entity does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Perform delete operation
      const result = await Entities.delete(args._id);

      // Create new Activity if successful
      if (result.success) {
        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "delete",
          actor: context.user,
          details: "Deleted Entity",
          target: {
            _id: entity._id,
            type: "entities",
            name: entity.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.message);
      }

      return result;
    },

    // Set the Entity "lock" status
    setEntityLock: async (
      _parent: any,
      args: { _id: string; lock: boolean },
    ) => {
      return await Entities.setLock(args._id, args.lock);
    },
  },
};
