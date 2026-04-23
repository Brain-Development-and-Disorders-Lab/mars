import _ from "lodash";
import { GraphQLError } from "graphql";

// Custom types
import { Context, EntityModel, IResolverParent, ProjectModel } from "@types";

// Models
import { Search } from "@models/Search";
import { Workspaces } from "@models/Workspaces";
import { AI } from "@models/AI";

export const SearchResolvers = {
  Query: {
    search: async (
      _parent: IResolverParent,
      args: {
        query: string;
        resultType: string;
        isBuilder: boolean;
        showArchived: boolean;
        filters?: {
          startDate?: string;
          endDate?: string;
          owners?: string[];
          hasAttachments?: boolean;
          hasAttributes?: boolean;
          hasRelationships?: boolean;
          attributeCountRanges?: string[];
        };
      },
      context: Context,
    ): Promise<EntityModel[] | ProjectModel[]> => {
      // Retrieve the Workspace to determine which Entities to return
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Use a single search query, but require specifying the type of `query`
      if (args.isBuilder) {
        return await Search.getQuery(args.query, args.resultType, context.workspace);
      } else {
        return await Search.getText(args.query, args.resultType, args.showArchived, args.filters, context.workspace);
      }
    },

    translateSearch: async (_parent: IResolverParent, args: { query: string }): Promise<string> => {
      if (!process.env.AI_PROVIDER && !process.env.OPENAI_BASE_URL) {
        throw new GraphQLError("AI search is not configured", {
          extensions: { code: "NOT_CONFIGURED" },
        });
      }
      return await AI.translateSearch(args.query);
    },

    suggestColumnMapping: async (
      _parent: IResolverParent,
      args: { columns: string[] },
    ): Promise<{ name: string | null; description: string | null }> => {
      if (!process.env.AI_PROVIDER && !process.env.OPENAI_BASE_URL) {
        throw new GraphQLError("AI features are not configured", {
          extensions: { code: "NOT_CONFIGURED" },
        });
      }
      return await AI.suggestColumnMapping(args.columns);
    },

    suggestTemplate: async (
      _parent: IResolverParent,
      args: { name: string; description?: string; templates: { _id: string; name: string; description: string }[] },
    ): Promise<string | null> => {
      if (!process.env.AI_PROVIDER && !process.env.OPENAI_BASE_URL) {
        throw new GraphQLError("AI features are not configured", {
          extensions: { code: "NOT_CONFIGURED" },
        });
      }
      return await AI.suggestTemplate(args.name, args.description ?? "", args.templates);
    },
  },
};
