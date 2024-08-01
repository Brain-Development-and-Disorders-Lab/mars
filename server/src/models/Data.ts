import { ObjectId } from "mongodb";
import { getAttachments } from "../connectors/database";
import _ from "lodash";
import * as fs from "fs";
import { Entities } from "./Entities";
import {
  AttributeModel,
  EntityModel,
  IEntity,
  IValue,
  ResponseMessage,
} from "@types";
import XLSX from "xlsx";
import dayjs from "dayjs";
import { Projects } from "./Projects";

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

  static uploadAttachment = async (
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
   * @param stream ReadableStream instance with file contents
   * @return {Promise<Buffer>}
   */
  static bufferHelper = async (stream: any): Promise<Buffer> =>
    new Promise((resolve, _reject) => {
      const buffers: Uint8Array[] = [];
      stream.on("data", (data: any) => buffers.push(data));
      stream.on("end", () => {
        const buffer = Buffer.concat(buffers);
        resolve(buffer);
      });
    });

  /**
   * Prepare a CSV file for import by extracting column names for mapping
   * @param file File object
   * @return {Promise<string[]>}
   */
  static prepareColumns = async (file: any[]): Promise<string[]> => {
    const { createReadStream, mimetype } = await file[0];
    const stream = createReadStream();

    // Validate correct MIME type before continuing
    if (_.isEqual(mimetype, "text/csv")) {
      const output = await Data.bufferHelper(stream);
      const workbook = XLSX.read(output, { cellDates: true });
      if (workbook.SheetNames.length > 0) {
        const primarySheet = workbook.Sheets[workbook.SheetNames[0]];
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

  /**
   * Map the set of columns as specified to Entity parameters
   * @param columnMapping Collection of mapped values with their corresponding columns names
   * @param file CSV file
   * @return {Promise<ResponseMessage>}
   */
  static mapColumns = async (
    columnMapping: { [key: string]: any },
    file: any,
  ): Promise<ResponseMessage> => {
    const { createReadStream } = await file[0];
    const stream = createReadStream();

    const output = await Data.bufferHelper(stream);
    const workbook = XLSX.read(output, { cellDates: true });
    if (workbook.SheetNames.length > 0) {
      const primarySheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedSheet = XLSX.utils.sheet_to_json<any>(primarySheet, {
        defval: "",
      });

      // Create generic set of Entities
      const entities = [] as EntityModel[];
      parsedSheet.map(async (row) => {
        // Extract Attributes
        const attributes = [] as AttributeModel[];

        columnMapping.attributes.map((attribute: AttributeModel) => {
          attributes.push({
            _id: attribute._id,
            name: attribute.name,
            description: attribute.description,
            values: attribute.values.map((value: IValue<any>) => {
              // Clean the data for specific types
              let valueData = row[value.data];
              if (_.isEqual(value.type, "date")) {
                // "date" type
                valueData = dayjs(row[value.data]).format("YYYY-MM-DD");
              }
              if (_.isEqual(value.type, "select")) {
                // "select" type
                valueData = {
                  selected: row[value.data],
                  options: [row[value.data]],
                };
              }
              return {
                _id: value._id,
                name: value.name,
                type: value.type,
                data: valueData,
              };
            }),
          });
        });

        // Core Entity data
        const data: IEntity = {
          deleted: false,
          locked: false,
          name: row[columnMapping.name],
          owner: columnMapping.owner,
          created: dayjs(Date.now()).toISOString(),
          description: row[columnMapping.description],
          projects: [],
          associations: {
            origins: [], // Clear Origins list
            products: [], // Clear Products list
          },
          attributes: attributes,
          attachments: [],
          history: [],
        };

        if (!_.isEqual(columnMapping.project, "")) {
          data.projects = [columnMapping.project];
        }

        // Create the Entity and merge in the generated ID
        const response = await Entities.create(data);
        if (response.success) {
          entities.push({
            _id: response.message,
            ...data,
          });
        }
      });

      if (!_.isEqual(columnMapping.project, "")) {
        // Add all Entities to Project
        await Projects.addEntities(
          columnMapping.project,
          entities.map((entity) => entity._id),
        );
      }

      return {
        success: true,
        message: "Mapped fields in spreadsheet",
      };
    } else {
      return {
        success: false,
        message: "Default sheet is empty",
      };
    }
  };

  /**
   * Import a JSON file or set of objects
   * @param objectsData Set of Objects to import
   * @return {Promise<ResponseMessage>}
   */
  static importObjects = async (
    file: any[],
    owner: string,
    project: string,
  ): Promise<ResponseMessage> => {
    const { createReadStream, mimetype } = await file[0];
    const stream = createReadStream();

    // Validate correct MIME type before continuing
    if (_.isEqual(mimetype, "application/json")) {
      const output = await Data.bufferHelper(stream);
      const parsed = JSON.parse(output.toString());

      // Check that JSON file contains required "entities" field
      if (_.isUndefined(parsed["entities"])) {
        return {
          success: false,
          message: 'JSON file does not contain "entities" field',
        };
      }

      for (let entity of parsed.entities as EntityModel[]) {
        // Splice in the owner and Project information
        entity.owner = owner;
        entity.projects = [project];

        // Check if Entity exists and update or create as required
        const exists = await Entities.exists(entity._id);
        if (exists) {
          // Update the Entity if it already exists
          const result = await Entities.update(entity);
          if (result.success === false) {
            return {
              success: false,
              message: `Error updating existing Entity: "${entity.name}"`,
            };
          }
        } else {
          // Create a new Entity if it does not exist
          const result = await Entities.create(entity);
          if (result.success === false) {
            return {
              success: false,
              message: `Error creating new Entity: "${entity.name}"`,
            };
          }
        }
      }
    }

    return {
      success: true,
      message: "Successfully imported set of objects",
    };
  };
}
