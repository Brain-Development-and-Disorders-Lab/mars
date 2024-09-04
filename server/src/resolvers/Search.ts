import { Context, EntityModel } from "@types";
import { Search } from "src/models/Search";

export const SearchResolvers = {
  Query: {
    search: async (
      _parent: any,
      args: { query: string; isBuilder: boolean; limit: number },
      context: Context,
    ): Promise<EntityModel[]> => {
      // Use a single search query, but require specifying the type of `query`
      if (args.isBuilder) {
        return await Search.getQuery(args.query, context.workspace, args.limit);
      } else {
        return await Search.getText(args.query, context.workspace, args.limit);
      }
    },
  },
};
