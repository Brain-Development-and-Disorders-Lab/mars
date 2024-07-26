import { ObjectId } from "mongodb";
import { getAttachments } from "../connectors/database";
import _ from "lodash";
import * as fs from "fs";
import { Entities } from "./Entities";
import { ResponseMessage } from "@types";

export class Data {
  static downloadFile = async (_id: string): Promise<string | null> => {
    // Access bucket and create open stream to write to storage
    const bucket = getAttachments();

    // Create stream from buffer
    const stream = bucket
      .openDownloadStream(new ObjectId(_id))
      .on("error", () => {
        return null;
      });
    stream.pipe(fs.createWriteStream(`./static/${_id}`));

    return `/${_id}`;
  };

  static uploadFile = async (
    target: string,
    file: any,
  ): Promise<ResponseMessage> => {
    const { createReadStream, filename, mimetype } = await file;

    const bucket = getAttachments();
    const stream: fs.ReadStream = createReadStream();
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { type: mimetype },
    });

    stream
      .pipe(uploadStream)
      .on("error", (error: Error) => {
        return {
          success: false,
          message: `Unable to upload file: ${error.message}`,
        };
      })
      .on("finish", async () => {
        // Once the upload is finished, register attachment with Entity
        await Entities.addAttachment(target, {
          _id: uploadStream.id.toString(),
          name: filename,
        });
      });

    return {
      success: true,
      message: `Uploaded file "${filename}"`,
    };
  };
}
