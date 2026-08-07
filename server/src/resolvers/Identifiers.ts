// GraphQL imports
import { GraphQLError } from "graphql";

// Custom types
import { Context, IdentifierFormatModel, IResolverParent } from "@types";

// Models
import { Identifiers } from "@models/Identifiers";
import { Workspaces } from "@models/Workspaces";

// Utilities
import _ from "lodash";

export const IdentifiersResolvers = {
  Query: {
    identifierFormat: async (_parent: IResolverParent, args: { _id: string }, context: Context) => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(context.user, context.workspace);
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Retrieve the Workspace to determine which Identifier Format to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      const identifierFormat = await Identifiers.getIdentifierFormat(args._id);
      if (_.isNull(identifierFormat)) {
        throw new GraphQLError("Identifier Format does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check that Identifier Format exists in the Workspace
      if (_.isEqual(identifierFormat.workspace, workspace._id)) {
        return identifierFormat;
      } else {
        throw new GraphQLError("This Identifier Format is outside the current Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
    },
    identifierFormats: async (_parent: IResolverParent, _args: Record<string, unknown>, context: Context) => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(context.user, context.workspace);
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Retrieve the Workspace to determine which Identifier Format to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      return await Identifiers.getIdentifierFormats(context.workspace);
    },
  },
  Mutation: {
    createIdentifierFormat: async (
      _parent: IResolverParent,
      args: { format: IdentifierFormatModel },
      context: Context,
    ) => {
      // Verify access to the Workspace
      const hasAccess = await Workspaces.checkAccess(context.user, context.workspace);
      if (!hasAccess) {
        throw new GraphQLError("User does not have access to this Workspace", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }

      // Apply create operation
      return await Identifiers.create(args.format);
    },
  },
};
