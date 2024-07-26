import { ResponseMessage } from "@types";
import { GraphQLError } from "graphql";
import _ from "lodash";
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
    uploadFile: async (
      _parent: any,
      args: { target: string; file: any },
    ): Promise<ResponseMessage> => {
      return await Data.uploadFile(args.target, args.file);
    },
    importFile: async (
      _parent: any,
      args: { file: any },
    ): Promise<string[]> => {
      return await Data.importFile(args.file);
    },
    mapFile: async (
      _parent: any,
      args: { columnMapping: { [column: string]: string }; file: any },
    ): Promise<ResponseMessage> => {
      return await Data.mapFile(args.columnMapping, args.file);
    },
  },
};
