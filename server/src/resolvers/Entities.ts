import {
  Context,
  EntityMetrics,
  EntityModel,
  IEntity,
  IResolverParent,
  IResponseMessage,
  ResponseData,
} from "@types";
import { GraphQLError } from "graphql";
import _ from "lodash";
import dayjs from "dayjs";

// Models
import { Activity } from "@models/Activity";
import { Entities } from "@models/Entities";
import { Workspaces } from "@models/Workspaces";

// Posthog
import { PostHogClient } from "src";

export const EntitiesResolvers = {
  Query: {
    // Retrieve all Entities
    entities: async (
      _parent: IResolverParent,
      args: {
        limit: number | undefined;
        archived: boolean | undefined;
        reverse: boolean | undefined;
        page: number | undefined;
        pageSize: number | undefined;
        filter:
          | {
              startDate?: string;
              endDate?: string;
              owners?: string[];
              hasAttachments?: boolean;
              attributeCountRanges?: string[];
            }
          | undefined;
        sort: { field: string; direction: string } | undefined;
      },
      context: Context,
    ) => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(
        context.user,
        context.workspace,
      );
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Retrieve the Workspace to determine which Entities to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Determine archived filter value
      // If archived is explicitly true, show all (including archived)
      // If archived is false or undefined, show only non-archived
      const archivedFilter: boolean | undefined =
        args.archived === true ? undefined : false;

      // Determine pagination parameters
      let page = 0;
      let pageSize = 20; // Default page size

      // If pagination parameters are explicitly provided, use them
      if (
        !_.isUndefined(args.page) &&
        !_.isUndefined(args.pageSize) &&
        args.pageSize > 0
      ) {
        page = Math.max(0, args.page);
        pageSize = Math.max(1, args.pageSize);
      } else if (!_.isUndefined(args.limit) && args.limit > 0) {
        // If limit is provided, use it as page size
        pageSize = args.limit;
        page = 0;
      }

      const skip = page * pageSize;

      // Get paginated entities and total count
      const [entities, total] = await Promise.all([
        Entities.getManyPaginated(
          workspace.entities,
          skip,
          pageSize,
          archivedFilter,
          args.reverse || false,
          args.filter,
          args.sort,
        ),
        Entities.countMany(workspace.entities, archivedFilter, args.filter),
      ]);

      return {
        entities,
        total,
      };
    },

    // Retrieve one Entity by _id
    entity: async (
      _parent: IResolverParent,
      args: { _id: string },
      context: Context,
    ): Promise<EntityModel> => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(
        context.user,
        context.workspace,
      );
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

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
    entityNameExists: async (
      _parent: IResolverParent,
      args: { name: string },
      context: Context,
    ) => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(
        context.user,
        context.workspace,
      );
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      return await Entities.existByName(args.name);
    },

    // Export one Entity by _id
    exportEntity: async (
      _parent: IResolverParent,
      args: { _id: string; format: "json" | "csv"; fields?: string[] },
      context: Context,
    ) => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(
        context.user,
        context.workspace,
      );
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

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
      _parent: IResolverParent,
      args: { entities: string[]; format: string },
      context: Context,
    ) => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(
        context.user,
        context.workspace,
      );
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

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
      for await (const entity of args.entities) {
        const result = await Entities.getOne(entity);
        if (result && _.includes(workspace.entities, entity)) {
          authorizedEntities.push(entity);
        }
      }

      return await Entities.exportMany(authorizedEntities, args.format);
    },

    // Get collection of Entity metrics
    entityMetrics: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<EntityMetrics> => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(
        context.user,
        context.workspace,
      );
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

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
      _parent: IResolverParent,
      args: { _id: string; description: string },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(
        context.user,
        context.workspace,
      );
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

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
      _parent: IResolverParent,
      args: { entity: IEntity },
      context: Context,
    ): Promise<ResponseData<string>> => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(
        context.user,
        context.workspace,
      );
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Apply create operation
      const result = await Entities.create(args.entity);

      if (result.success) {
        // Add the Entity to the Workspace
        await Workspaces.addEntity(context.workspace, result.data);

        // Create new Activity if successful
        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "create",
          actor: context.user,
          details: "Created new Entity",
          target: {
            _id: result.data,
            type: "entities",
            name: args.entity.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.data);
      }

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "server_create_entity",
        });
      }

      return result;
    },

    // Update an existing Entity from EntityModel data structure
    updateEntity: async (
      _parent: IResolverParent,
      args: { entity: EntityModel; message: string },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(
        context.user,
        context.workspace,
      );
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

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
          await Entities.addHistory(entity, context.user, args.message);

          const activity = await Activity.create({
            timestamp: dayjs(Date.now()).toISOString(),
            type: "update",
            actor: context.user,
            details: "Updated Entity",
            target: {
              _id: args.entity._id,
              type: "entities",
              name: args.entity.name,
            },
          });

          // Add Activity to Workspace
          await Workspaces.addActivity(context.workspace, activity.data);
        }

        // Capture event
        if (process.env.DISABLE_CAPTURE !== "true") {
          PostHogClient?.capture({
            distinctId: context.user,
            event: "server_update_entity",
          });
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
      _parent: IResolverParent,
      args: { _id: string; state: boolean },
      context: Context,
    ) => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(
        context.user,
        context.workspace,
      );
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

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
          await Workspaces.addActivity(context.workspace, activity.data);
        }

        return result;
      }
    },

    // Archive multiple Entities
    archiveEntities: async (
      _parent: IResolverParent,
      args: { toArchive: string[]; state: boolean },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(
        context.user,
        context.workspace,
      );
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

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
            await Workspaces.addActivity(context.workspace, activity.data);
            archiveCounter += 1;
          }
        }
      }

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "server_archive_entity",
        });
      }

      return {
        success: args.toArchive.length === archiveCounter,
        message:
          args.toArchive.length === archiveCounter
            ? "Archived Entities successfully"
            : "Error while archiving multiple Entities",
      };
    },
  },
};
