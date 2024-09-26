// Custom types
import { Context, IActivity, IResponseMessage } from "@types";

// Models
import { Activity } from "../models/Activity";
import { Workspaces } from "../models/Workspaces";
import { Authentication } from "src/models/Authentication";

import _ from "lodash";
import { GraphQLError } from "graphql/index";

export const ActivityResolvers = {
  Query: {
    // Retrieve all Activity
    activity: async (_parent: any, args: { limit: 100 }, context: Context) => {
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
      _parent: any,
      args: { activity: IActivity },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      // Apply the create operation
      const result = await Activity.create(args.activity);

      if (result.success) {
        // Add the Activity to the Workspace
        await Workspaces.addActivity(context.workspace, result.message);
      }

      return result;
    },
  },
};
