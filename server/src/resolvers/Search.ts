import _ from "lodash";
import { GraphQLError } from "graphql";

// Custom types
import { Context, EntityModel, IResolverParent, ProjectModel } from "@types";

// Models
import { Search } from "@models/Search";
import { Workspaces } from "@models/Workspaces";
import { AI } from "@models/AI";

// Analytics
import { PostHogClient } from "src";

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
      let results: EntityModel[] | ProjectModel[];
      if (args.isBuilder) {
        results = await Search.getQuery(args.query, args.resultType, context.workspace);
      } else {
        results = await Search.getText(args.query, args.resultType, args.showArchived, args.filters, context.workspace);
      }

      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({
          distinctId: context.user,
          event: "server_search",
          properties: {
            search_type: args.isBuilder ? "builder" : "text",
            result_type: args.resultType,
            result_count: results.length,
          },
        });
      }

      return results;
    },

    translateSearch: async (_parent: IResolverParent, args: { query: string }, context: Context): Promise<string> => {
      if (!process.env.AI_PROVIDER && !process.env.OPENAI_BASE_URL) {
        throw new GraphQLError("AI search is not configured", {
          extensions: { code: "NOT_CONFIGURED" },
        });
      }
      const result = await AI.translateSearch(args.query);
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({ distinctId: context.user, event: "server_translate_search" });
      }
      return result;
    },

    suggestColumnMapping: async (
      _parent: IResolverParent,
      args: { columns: string[] },
      context: Context,
    ): Promise<{ name: string | null; description: string | null }> => {
      if (!process.env.AI_PROVIDER && !process.env.OPENAI_BASE_URL) {
        throw new GraphQLError("AI features are not configured", {
          extensions: { code: "NOT_CONFIGURED" },
        });
      }
      const result = await AI.suggestColumnMapping(args.columns);
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({ distinctId: context.user, event: "server_suggest_column_mapping" });
      }
      return result;
    },

    suggestTemplate: async (
      _parent: IResolverParent,
      args: { name: string; description?: string; templates: { _id: string; name: string; description: string }[] },
      context: Context,
    ): Promise<string | null> => {
      if (!process.env.AI_PROVIDER && !process.env.OPENAI_BASE_URL) {
        throw new GraphQLError("AI features are not configured", {
          extensions: { code: "NOT_CONFIGURED" },
        });
      }
      const result = await AI.suggestTemplate(args.name, args.description ?? "", args.templates);
      if (process.env.DISABLE_CAPTURE !== "true") {
        PostHogClient?.capture({ distinctId: context.user, event: "server_suggest_template" });
      }
      return result;
    },
  },
};
