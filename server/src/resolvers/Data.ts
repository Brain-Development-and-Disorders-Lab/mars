// Custom types
import {
  AttributeModel,
  Context,
  CSVImportOptions,
  EntityImportReview,
  TemplateImportReview,
  IColumnMapping,
  IFile,
  IResolverParent,
  IResponseMessage,
  ResponseData,
} from "@types";

// Utility functions and libraries
import { GraphQLError } from "graphql";
import _ from "lodash";

// Models
import { Data } from "@models/Data";
import { Workspaces } from "@models/Workspaces";

export const DataResolvers = {
  Query: {
    // Retrieve the URL for a file to be downloaded by client
    downloadFile: async (
      _parent: IResolverParent,
      args: { _id: string },
      context: Context,
    ): Promise<string> => {
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

      const response = await Data.downloadFile(args._id);
      if (_.isNull(response)) {
        throw new GraphQLError("Unable to retrieve file for download", {
          extensions: {
            code: "FILE_ERROR",
          },
        });
      }
      return response;
    },
  },

  Mutation: {
    // Upload a file to be attached to Entity with ID `target`
    uploadAttachment: async (
      _parent: IResolverParent,
      args: { target: string; file: IFile },
      context: Context,
    ): Promise<ResponseData<string>> => {
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

      return await Data.uploadAttachment(args.target, args.file);
    },

    // Prepare a CSV file, returning the collection of column names (if present)
    prepareEntityCSV: async (
      _parent: IResolverParent,
      args: { file: IFile[] },
      context: Context,
    ): Promise<string[]> => {
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

      return await Data.prepareEntityCSV(args.file);
    },

    // Review a CSV file, return collection of Entity names and their updates
    reviewEntityCSV: async (
      _parent: IResolverParent,
      args: { columnMapping: Record<string, string>; file: IFile[] },
      context: Context,
    ): Promise<ResponseData<EntityImportReview[]>> => {
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

      return await Data.reviewEntityCSV(args.columnMapping, args.file);
    },

    // Map CSV file columns to Entity fields
    importEntityCSV: async (
      _parent: IResolverParent,
      args: {
        columnMapping: IColumnMapping;
        file: IFile[];
        options: CSVImportOptions;
      },
      context: Context,
    ): Promise<IResponseMessage> => {
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

      return await Data.importEntityCSV(
        args.columnMapping,
        args.file,
        args.options,
        context,
      );
    },

    // Review a JSON file, return collection of Entity names and their updates
    reviewEntityJSON: async (
      _parent: IResolverParent,
      args: { file: IFile[] },
      context: Context,
    ): Promise<IResponseMessage> => {
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

      return await Data.reviewEntityJSON(args.file);
    },

    // Import JSON file
    importEntityJSON: async (
      _parent: IResolverParent,
      args: { file: IFile[]; project: string; attributes: AttributeModel[] },
      context: Context,
    ): Promise<IResponseMessage> => {
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

      return await Data.importEntityJSON(
        args.file,
        args.project,
        args.attributes,
        context,
      );
    },

    // Review a Template JSON file, return collection of Template names and their updates
    reviewTemplateJSON: async (
      _parent: IResolverParent,
      args: { file: IFile[] },
      context: Context,
    ): Promise<ResponseData<TemplateImportReview[]>> => {
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

      return await Data.reviewTemplateJSON(args.file);
    },

    // Import Template JSON file
    importTemplateJSON: async (
      _parent: IResolverParent,
      args: { file: IFile[] },
      context: Context,
    ): Promise<IResponseMessage> => {
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

      return await Data.importTemplateJSON(args.file, context);
    },
  },
};
