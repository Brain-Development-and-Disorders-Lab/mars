import { Context, IActivity, ResponseMessage } from "@types";
import { Activity } from "src/models/Activity";
import { Workspaces } from "../models/Workspaces";
import _ from "lodash";
import { GraphQLError } from "graphql/index";

export const ActivityResolvers = {
  Query: {
    // Retrieve all Activity
    activity: async (_parent: any, args: { limit: 100 }, context: Context) => {
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      const allActivity = (
        await Activity.getMany(workspace.activity)
      ).reverse();
      return allActivity.slice(0, args.limit);
    },
  },

  Mutation: {
    // Create a new Activity
    createActivity: async (
      _parent: any,
      args: { activity: IActivity },
      context: Context,
    ): Promise<ResponseMessage> => {
      return await Activity.create(args.activity, context.workspace);
    },
  },
};
