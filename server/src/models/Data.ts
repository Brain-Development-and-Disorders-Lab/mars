import { ObjectId } from "mongodb";
import { getAttachments } from "../connectors/database";
import _ from "lodash";
import * as fs from "fs";
import { Entities } from "./Entities";
import { ResponseMessage } from "@types";
import XLSX from "xlsx";

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

  /**
   * Helper function to receive data from a readable stream and concatenate
   * @param stream ReadableStream instance with CSV contents
   * @return {Promise<XLSX.WorkBook>}
   */
  static bufferHelper = async (stream: any): Promise<XLSX.WorkBook> =>
    new Promise((resolve, _reject) => {
      const buffers: Uint8Array[] = [];
      stream.on("data", (data: any) => buffers.push(data));
      stream.on("end", () => {
        const buffer = Buffer.concat(buffers);
        const workbook = XLSX.read(buffer, { cellDates: true });
        resolve(workbook);
      });
    });

  static importFile = async (file: any[]): Promise<string[]> => {
    const { createReadStream, mimetype } = await file[0];
    const stream = createReadStream();

    if (_.isEqual(mimetype, "text/csv")) {
      const output = await Data.bufferHelper(stream);
      if (output.SheetNames.length > 0) {
        const primarySheet = output.Sheets[output.SheetNames[0]];
        const parsedSheet = XLSX.utils.sheet_to_json<any>(primarySheet, {
          defval: "",
        });

        // Check if no rows present
        if (parsedSheet.length === 0) {
          return [];
        }

        // Generate the column list from present keys
        return Object.keys(parsedSheet.pop());
      } else {
        return [];
      }
    } else {
      return [];
    }
  };
}
