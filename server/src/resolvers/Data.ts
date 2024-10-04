// Custom types
import { Context, IResponseMessage } from "@types";

// Utility functions and libraries
import { GraphQLError } from "graphql";
import _ from "lodash";

// Data model
import { Data } from "src/models/Data";

export const DataResolvers = {
  Query: {
    // Retrieve the URL for a file to be downloaded by client
    downloadFile: async (
      _parent: any,
      args: { _id: string },
    ): Promise<string> => {
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
      _parent: any,
      args: { target: string; file: any },
    ): Promise<IResponseMessage> => {
      return await Data.uploadAttachment(args.target, args.file);
    },
    // Prepare a CSV file, returning the collection of column names (if present)
    prepareCSV: async (
      _parent: any,
      args: { file: any },
    ): Promise<string[]> => {
      return await Data.prepareCSV(args.file);
    },
    // Map CSV file columns to Entity fields
    importCSV: async (
      _parent: any,
      args: { columnMapping: Record<string, string>; file: any },
      context: Context,
    ): Promise<IResponseMessage> => {
      return await Data.importCSV(args.columnMapping, args.file, context);
    },
    importJSON: async (
      _parent: any,
      args: { file: any; owner: string; project: string },
      context: Context,
    ): Promise<IResponseMessage> => {
      return await Data.importJSON(
        args.file,
        args.owner,
        args.project,
        context,
      );
    },
  },
};
