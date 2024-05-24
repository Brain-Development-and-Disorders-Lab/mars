import { Activity } from "src/models/Activity"

export const ActivityResolvers = {
  Query: {
    // Retrieve all Activity
    activity: async (_parent: any, args: { limit: 100 }) => {
      const allActivity = await Activity.all();
      return allActivity.slice(0, args.limit).reverse();
    },
  }
}
