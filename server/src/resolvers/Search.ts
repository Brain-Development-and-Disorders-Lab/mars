import _ from "lodash";
import { GraphQLError } from "graphql";

// Custom types
import { Context, EntityModel, ProjectModel } from "@types";

// Models
import { Search } from "src/models/Search";
import { Authentication } from "src/models/Authentication";
import { Workspaces } from "src/models/Workspaces";

export const SearchResolvers = {
  Query: {
    search: async (
      _parent: any,
      args: {
        query: string;
        resultType: string;
        isBuilder: boolean;
        showArchived: boolean;
      },
      context: Context,
    ): Promise<EntityModel[] | ProjectModel[]> => {
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

      // Use a single search query, but require specifying the type of `query`
      if (args.isBuilder) {
        return await Search.getQuery(
          args.query,
          args.resultType,
          context.workspace,
        );
      } else {
        return await Search.getText(
          args.query,
          args.resultType,
          args.showArchived,
          context.workspace,
        );
      }
    },
  },
};
