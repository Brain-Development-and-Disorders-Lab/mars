// Custom types
import {
  AttributeModel,
  Context,
  EntityImportReview,
  AttributeImportReview,
  IColumnMapping,
  IFile,
  IResolverParent,
  IResponseMessage,
  ResponseData,
  SpreadsheetImportOptions,
  ColumnInfo,
} from "@types";

// Utility functions and libraries
import { GraphQLError } from "graphql";
import _ from "lodash";

// Models
import { Data } from "@models/Data";
import { Workspaces } from "@models/Workspaces";

// Access control
import { assertWorkspaceAccess } from "@lib/access";

export const DataResolvers = {
  Query: {
    // Retrieve the URL for a file to be downloaded by client
    downloadFile: async (_parent: IResolverParent, args: { _id: string }, context: Context): Promise<string> => {
      // Verify access to the Workspace
      await assertWorkspaceAccess(context);

      // Verify the requested attachment belongs to an Entity within the Workspace
      const entities = await Workspaces.getEntities(context.workspace);
      const belongsToWorkspace = entities.some((entity) => _.some(entity.attachments, { _id: args._id }));
      if (!belongsToWorkspace) {
        throw new GraphQLError("You do not have permission to access this file", {
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
      await assertWorkspaceAccess(context);

      return await Data.uploadAttachment(args.target, args.file);
    },

    // Prepare a spreadsheet file, returning the collection of column names (if present)
    prepareEntitySpreadsheet: async (
      _parent: IResolverParent,
      args: { file: IFile[] },
      context: Context,
    ): Promise<ColumnInfo[]> => {
      // Verify access to the Workspace
      await assertWorkspaceAccess(context);

      return await Data.prepareEntitySpreadsheet(args.file);
    },

    // Review a spreadsheet file, return collection of Entity names and their updates
    reviewEntitySpreadsheet: async (
      _parent: IResolverParent,
      args: { columnMapping: IColumnMapping; file: IFile[] },
      context: Context,
    ): Promise<ResponseData<EntityImportReview[]>> => {
      // Verify access to the Workspace
      await assertWorkspaceAccess(context);

      return await Data.reviewEntitySpreadsheet(args.columnMapping, args.file);
    },

    // Map spreadsheet file columns to Entity fields
    importEntitySpreadsheet: async (
      _parent: IResolverParent,
      args: {
        columnMapping: IColumnMapping;
        file: IFile[];
        options: SpreadsheetImportOptions;
      },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Verify access to the Workspace
      await assertWorkspaceAccess(context);

      return await Data.importEntitySpreadsheet(args.columnMapping, args.file, args.options, context);
    },

    // Review a JSON file, return collection of Entity names and their updates
    reviewEntityJSON: async (
      _parent: IResolverParent,
      args: { file: IFile[] },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Verify access to the Workspace
      await assertWorkspaceAccess(context);

      return await Data.reviewEntityJSON(args.file);
    },

    // Import JSON file
    importEntityJSON: async (
      _parent: IResolverParent,
      args: { file: IFile[]; project: string; attributes: AttributeModel[] },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Verify access to the Workspace
      await assertWorkspaceAccess(context);

      return await Data.importEntityJSON(args.file, args.project, args.attributes, context);
    },

    // Review an Attribute JSON file, return collection of Attribute names and their updates
    reviewAttributeJSON: async (
      _parent: IResolverParent,
      args: { file: IFile[] },
      context: Context,
    ): Promise<ResponseData<AttributeImportReview[]>> => {
      // Verify access to the Workspace
      await assertWorkspaceAccess(context);

      return await Data.reviewAttributeJSON(args.file);
    },

    // Import Attribute JSON file
    importAttributeJSON: async (
      _parent: IResolverParent,
      args: { file: IFile[] },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Verify access to the Workspace
      await assertWorkspaceAccess(context);

      return await Data.importAttributeJSON(args.file, context);
    },
  },
};
