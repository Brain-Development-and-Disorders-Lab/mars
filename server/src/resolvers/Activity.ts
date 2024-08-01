import { IActivity, ResponseMessage } from "@types";
import { Activity } from "src/models/Activity";

export const ActivityResolvers = {
  Query: {
    // Retrieve all Activity
    activity: async (_parent: any, args: { limit: 100 }) => {
      const allActivity = (await Activity.all()).reverse();
      return allActivity.slice(0, args.limit);
    },
  },

  Mutation: {
    // Create a new Activity
    createActivity: async (
      _parent: any,
      args: { activity: IActivity },
    ): Promise<ResponseMessage> => {
      return await Activity.create(args.activity);
    },
  },
};
