// Custom types
import { Context, IActivity, IResolverParent, IResponseMessage } from "@types";

// Models
import { Activity } from "../models/Activity";
import { Workspaces } from "../models/Workspaces";
import { Authentication } from "src/models/Authentication";

import _ from "lodash";
import { GraphQLError } from "graphql/index";

// Posthog
import { PostHogClient } from "src";

export const ActivityResolvers = {
  Query: {
    // Retrieve all Activity
    activity: async (
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

      return (await Activity.getMany(workspace.activity)).slice(0, args.limit);
    },
  },

  Mutation: {
    // Create a new Activity
    createActivity: async (
      _parent: IResolverParent,
      args: { activity: IActivity },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      // Apply the create operation
      const result = await Activity.create(args.activity);

      if (result.success) {
        // Add the Activity to the Workspace
        await Workspaces.addActivity(context.workspace, result.data);
      }

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "server_create_activity",
        });
      }

      return result;
    },
  },
};
