import { ObjectId } from "mongodb";
import { getAttachments } from "src/connectors/database";
import * as fs from "fs";

export class Data {
  static downloadFile = async (_id: string): Promise<string | null> => {
    // Access bucket and create open stream to write to storage
    const bucket = getAttachments();

    let downloadURL = null;
    const setDownloadURL = (url: string) => {
      downloadURL = url;
    };

    // Create stream from buffer
    const stream = bucket
      .openDownloadStream(new ObjectId(_id))
      .on("error", () => {
        return null;
      });

    stream.pipe(fs.createWriteStream(`./static/${_id}.txt`)).on("close", () => {
      setDownloadURL(`/static/${_id}.txt`);
    });

    return downloadURL;
  };

  static uploadFile = async (file: any) => {
    const { createReadStream, filename, mimetype, encoding } = await file;

    // // Invoking the `createReadStream` will return a Readable Stream.
    // // See https://nodejs.org/api/stream.html#stream_readable_streams
    // const stream = createReadStream();

    // // This is purely for demonstration purposes and will overwrite the
    // // local-file-output.txt in the current working directory on EACH upload.
    // const out = require('fs').createWriteStream('local-file-output.txt');
    // stream.pipe(out);
    // await finished(out);

    return { filename, mimetype, encoding };
  };
}
