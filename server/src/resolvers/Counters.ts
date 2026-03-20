// GraphQL imports
import { GraphQLError } from "graphql";

// Custom types
import { Context, CounterModel, IResolverParent } from "@types";

// Models
import { Counters } from "@models/Counters";
import { Workspaces } from "@models/Workspaces";

// Utilities
import _ from "lodash";

export const CountersResolvers = {
  Query: {
    counter: async (
      _parent: IResolverParent,
      args: { _id: string },
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

      // Retrieve the Workspace to determine which Counter to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      const counter = await Counters.getCounter(args._id);
      if (_.isNull(counter)) {
        throw new GraphQLError("Counter does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check that Counter exists in the Workspace
      if (_.isEqual(counter.workspace, workspace._id)) {
        return counter;
      } else {
        throw new GraphQLError(
          "This Counter is outside the current Workspace",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },
    counters: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
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

      // Retrieve the Workspace to determine which Counter to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      return await Counters.getCounters(context.workspace);
    },
    currentCounterValue: async (
      _parent: IResolverParent,
      args: { _id: string },
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

      // Retrieve the Workspace to determine which Counter to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      const counter = await Counters.getCounter(args._id);
      if (_.isNull(counter)) {
        throw new GraphQLError("Counter does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check that Counter exists in the Workspace
      if (_.isEqual(counter.workspace, workspace._id)) {
        return await Counters.getCurrentValue(args._id);
      } else {
        throw new GraphQLError(
          "This Counter is outside the current Workspace",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },
    nextCounterValue: async (
      _parent: IResolverParent,
      args: { _id: string },
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

      // Retrieve the Workspace to determine which Counter to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      const counter = await Counters.getCounter(args._id);
      if (_.isNull(counter)) {
        throw new GraphQLError("Counter does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check that Counter exists in the Workspace
      if (_.isEqual(counter.workspace, workspace._id)) {
        return await Counters.getNextValue(args._id);
      } else {
        throw new GraphQLError(
          "This Counter is outside the current Workspace",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },
    nextCounterValues: async (
      _parent: IResolverParent,
      args: { _id: string; count: number },
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

      // Retrieve the Workspace to determine which Counter to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      const counter = await Counters.getCounter(args._id);
      if (_.isNull(counter)) {
        throw new GraphQLError("Counter does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check that Counter exists in the Workspace
      if (_.isEqual(counter.workspace, workspace._id)) {
        return await Counters.getNextValues(args._id, args.count);
      } else {
        throw new GraphQLError(
          "This Counter is outside the current Workspace",
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
    createCounter: async (
      _parent: IResolverParent,
      args: { counter: CounterModel },
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

      // Apply create operation
      return await Counters.create(args.counter);
    },
    incrementCounter: async (
      _parent: IResolverParent,
      args: { _id: string },
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

      // Retrieve the Workspace to determine which Counter to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      const counter = await Counters.getCounter(args._id);
      if (_.isNull(counter)) {
        throw new GraphQLError("Counter does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check that Counter exists in the Workspace
      if (_.isEqual(counter.workspace, workspace._id)) {
        return await Counters.incrementValue(args._id);
      } else {
        throw new GraphQLError(
          "This Counter is outside the current Workspace",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },
  },
};
