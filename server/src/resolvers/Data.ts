import { GraphQLError } from "graphql";
import _ from "lodash";
import { Data } from "src/models/Data";

export const DataResolvers = {
  Query: {
    // Retrieve the URL for a file to be downloaded by client
    downloadFile: async (_parent: any, args: { _id: string }) => {
      const downloadURL = await Data.downloadFile(args._id);
      if (_.isNull(downloadURL)) {
        throw new GraphQLError("Unable to retrieve file for download", {
          extensions: {
            code: "FILE_ERROR",
          },
        });
      }
      return downloadURL;
    },
  },

  Mutation: {
    uploadFile: async (_parent: any, args: { file }) => {
      return await Data.uploadFile(args.file);
    },
  },
};
