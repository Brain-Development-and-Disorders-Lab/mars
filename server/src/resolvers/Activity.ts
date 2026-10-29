// Custom types
import { Context, IActivity, IResolverParent, IResponseMessage } from "@types";

// Models
import { Activity } from "@models/Activity";
import { Workspaces } from "@models/Workspaces";

// Posthog
import { PostHogClient } from "@lib/posthog";

// Access control
import { assertWorkspaceAccess } from "@lib/access";

export const ActivityResolvers = {
  Query: {
    // Retrieve all Activity
    activity: async (_parent: IResolverParent, args: { limit: 100 }, context: Context) => {
      // Verify access to the Workspace
      const workspace = await assertWorkspaceAccess(context, "read");

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
      // Verify access to the Workspace
      await assertWorkspaceAccess(context, "member");

      // Apply the create operation, always attributed to the requesting User
      const result = await Activity.create({ ...args.activity, actor: context.user });

      if (result.success) {
        // Add the Activity to the Workspace
        await Workspaces.addActivity(context.workspace, result.data);
      }

      // Capture event
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "activity.created",
        });
      }

      return result;
    },
  },
};
