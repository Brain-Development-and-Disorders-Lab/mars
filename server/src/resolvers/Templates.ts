// Custom types
import {
  AttributeModel,
  Context,
  IAttribute,
  IResolverParent,
  IResponseMessage,
  TemplateMetrics,
} from "@types";

// Models
import { Activity } from "../models/Activity";
import { Templates } from "../models/Templates";
import { Workspaces } from "../models/Workspaces";
import { Authentication } from "src/models/Authentication";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

import { GraphQLError } from "graphql/index";

// Posthog
import { PostHogClient } from "src";

export const TemplatesResolvers = {
  Query: {
    // Retrieve all Templates
    templates: async (
      _parent: IResolverParent,
      args: { limit: 100 },
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
      const templates = await Templates.all();
      return templates
        .filter((template: AttributeModel) =>
          _.includes(workspace.templates, template._id),
        )
        .slice(0, args.limit);
    },

    // Retrieve one Template by _id
    template: async (
      _parent: IResolverParent,
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

      // Check Template exists
      const template = await Templates.getOne(args._id);
      if (_.isNull(template)) {
        throw new GraphQLError("Template does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check that Template exists in the Workspace
      if (_.includes(workspace.templates, template._id)) {
        return template;
      } else {
        throw new GraphQLError(
          "You do not have permission to access this Template",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },

    // Get collection of Template metrics
    templateMetrics: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<TemplateMetrics> => {
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
      const templates = await Templates.all();
      const workspaceTemplates = templates.filter((template) =>
        _.includes(workspace.templates, template._id),
      );
      const templatesAddedDay = workspaceTemplates.filter((template) =>
        dayjs(template.timestamp).isAfter(dayjs(Date.now()).subtract(1, "day")),
      );

      return {
        all: workspaceTemplates.length,
        addedDay: templatesAddedDay.length,
      };
    },

    // Export a Template
    exportTemplate: async (
      _parent: IResolverParent,
      args: { _id: string },
      context: Context,
    ): Promise<string> => {
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

      const template = await Templates.getOne(args._id);
      if (_.isNull(template)) {
        throw new GraphQLError("Template does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (_.includes(workspace.templates, args._id)) {
        return await Templates.export(args._id);
      } else {
        throw new GraphQLError(
          "You do not have permission to access this Template",
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
    // Create a new Template
    createTemplate: async (
      _parent: IResolverParent,
      args: { template: IAttribute },
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      const result = await Templates.create(args.template);

      if (result.success) {
        // Add the Template to the Workspace
        await Workspaces.addTemplate(context.workspace, result.data);

        // If successful, add Activity
        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "create",
          actor: context.user,
          details: "Created new Template",
          target: {
            _id: result.data, // New Template identifier
            type: "templates",
            name: args.template.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.data);
      }

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "server_create_template",
        });
      }

      return result;
    },

    // Update an existing Template
    updateTemplate: async (
      _parent: IResolverParent,
      args: { template: AttributeModel },
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

      const template = await Templates.getOne(args.template._id);
      if (_.isNull(template)) {
        throw new GraphQLError("Template does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (!_.includes(workspace.templates, args.template._id)) {
        throw new GraphQLError(
          "You do not have permission to modify this Template",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }

      // Execute update operation
      const result = await Templates.update(args.template);

      if (result.success) {
        // If successful, add Activity
        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "update",
          actor: context.user,
          details: "Updated existing Template",
          target: {
            _id: args.template._id,
            type: "templates",
            name: args.template.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.data);
      }

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "server_update_template",
        });
      }

      return result;
    },

    // Archive a Template
    archiveTemplate: async (
      _parent: IResolverParent,
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

      const template = await Templates.getOne(args._id);
      if (_.isNull(template)) {
        throw new GraphQLError("Template does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (!_.includes(workspace.templates, args._id)) {
        throw new GraphQLError(
          "You do not have permission to modify the archive state of this Template",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "server_archive_template",
        });
      }

      // Execute archive operation
      if (template.archived === args.state) {
        return {
          success: true,
          message: "Template archive state unchanged",
        };
      } else {
        const result = await Templates.setArchived(args._id, args.state);

        // If successful, add Activity
        if (result.success) {
          const activity = await Activity.create({
            timestamp: dayjs(Date.now()).toISOString(),
            type: "archived",
            actor: context.user,
            details: args.state ? "Archived Template" : "Restored Template",
            target: {
              _id: args._id,
              type: "templates",
              name: template.name,
            },
          });

          // Add Activity to Workspace
          await Workspaces.addActivity(context.workspace, activity.data);
        }

        return result;
      }
    },

    // Archive multiple Templates
    archiveTemplates: async (
      _parent: IResolverParent,
      args: { toArchive: string[]; state: boolean },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      let archiveCounter = 0;
      for await (const _id of args.toArchive) {
        const template = await Templates.getOne(_id);
        if (_.isNull(template)) {
          throw new GraphQLError("Template does not exist", {
            extensions: {
              code: "NON_EXIST",
            },
          });
        }

        if (template.archived === args.state) {
          archiveCounter += 1;
        } else {
          // Execute archive operation
          const result = await Templates.setArchived(_id, args.state);

          // If successful, add Activity
          if (result.success) {
            const activity = await Activity.create({
              timestamp: dayjs(Date.now()).toISOString(),
              type: "archived",
              actor: context.user,
              details: args.state ? "Archived Template" : "Restored Template",
              target: {
                _id: _id,
                type: "templates",
                name: template.name,
              },
            });

            // Add Activity to Workspace
            await Workspaces.addActivity(context.workspace, activity.data);
            archiveCounter += 1;
          }
        }
      }

      return {
        success: args.toArchive.length === archiveCounter,
        message:
          args.toArchive.length === archiveCounter
            ? "Archived Templates successfully"
            : "Error while archiving multiple Templates",
      };
    },
  },
};
