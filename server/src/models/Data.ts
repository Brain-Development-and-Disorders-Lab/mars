// Custom types
import {
  AttributeModel,
  Context,
  EntityModel,
  IEntity,
  IFile,
  IValue,
  IResponseMessage,
  ResponseData,
  EntityImportReview,
  IColumnMapping,
  IRow,
  GenericValueType,
  CSVImportOptions,
} from "@types";

// Utility functions and libraries
import * as fs from "fs";
import XLSX from "xlsx";
import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import { getAttachments } from "../connectors/database";
import _ from "lodash";

// Models
import { Activity } from "./Activity";
import { Counters } from "./Counters";
import { Entities } from "./Entities";
import { Projects } from "./Projects";
import { Templates } from "./Templates";
import { Workspaces } from "./Workspaces";

export class Data {
  /**
   * Generate a file to be downloaded from the `/static` endpoint
   * @param _id File identifier in GridFS storage
   * @param filename File name, assuming that file exists
   * @return {Promise<string>}
   */
  private static generateFile = (
    _id: string,
    filename: string,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Access bucket and create open stream to write to storage
      const bucket = getAttachments();

      // Get the first file object from the results and generate `/public` path
      const staticPath = `${_id}_${filename}`;

      // Create stream from buffer and write to `/public` path
      const stream = bucket
        .openDownloadStream(new ObjectId(_id))
        .on("error", () => {
          reject("Error while generating static file for download");
        });
      stream.pipe(fs.createWriteStream(__dirname + `/public/${staticPath}`));

      stream.on("close", () => {
        // Resolve with the final static identifier of the file
        resolve(`/${staticPath}`);
      });
    });
  };

  static downloadFile = async (_id: string): Promise<string> => {
    // Access bucket and create open stream to write to storage
    const bucket = getAttachments();

    // Check that the file exists
    const result = await bucket.find({ _id: new ObjectId(_id) }).toArray();

    if (result.length === 0) {
      return "/";
    }

    return await Data.generateFile(_id, result[0].filename);
  };

  static uploadAttachment = async (
    target: string,
    file: IFile,
  ): Promise<ResponseData<string>> => {
    const { createReadStream, filename, mimetype } = await file;

    const bucket = getAttachments();
    const stream: fs.ReadStream = createReadStream();
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { type: mimetype },
    });

    return new Promise((resolve, reject) => {
      stream
        .pipe(uploadStream)
        .on("error", (error: Error) => {
          reject({
            success: false,
            message: `Unable to upload file: ${error.message}`,
            data: "",
          });
        })
        .on("finish", async () => {
          try {
            // Once the upload is finished, register attachment with Entity
            const attachmentId = uploadStream.id.toString();
            const addResult = await Entities.addAttachment(target, {
              _id: attachmentId,
              name: filename,
            });

            if (!addResult.success) {
              resolve({
                success: false,
                message: addResult.message,
                data: "",
              });
            } else {
              resolve({
                success: true,
                message: `Uploaded file "${filename}"`,
                data: attachmentId,
              });
            }
          } catch (error: any) {
            reject({
              success: false,
              message: `Error registering attachment: ${error.message}`,
              data: "",
            });
          }
        });
    });
  };

  /**
   * Helper function to receive data from a readable stream and concatenate
   * @param stream ReadableStream instance with file contents
   * @return {Promise<Buffer>}
   */
  private static bufferHelper = async (
    stream: fs.ReadStream,
  ): Promise<Buffer> =>
    new Promise((resolve) => {
      const buffers: Uint8Array[] = [];
      stream.on("data", (data: Uint8Array) => buffers.push(data));
      stream.on("end", () => {
        const buffer = Buffer.concat(buffers);
        resolve(buffer);
      });
    });

  /**
   * Helper function to generate Entity collection after applying CSV column mapping.
   * @param {IColumnMapping} columnMapping Collection of key-value pairs defining the mapping between CSV columns and Entity fields
   * @param sheet Target sheet of imported CSV file
   * @return {Promise<IEntity[]>}
   */
  private static columnMappingHelper = async (
    columnMapping: IColumnMapping,
    sheet: IRow[],
  ): Promise<IEntity[]> => {
    // Create generic set of Entities
    const entities = [] as IEntity[];

    // Asynchronously iterate over all rows, importing Entity data
    for await (const row of sheet) {
      // Extract Attributes
      const attributes = [] as AttributeModel[];

      columnMapping.attributes.map((attribute: AttributeModel) => {
        attributes.push({
          _id: attribute._id,
          name: attribute.name,
          owner: attribute.owner,
          timestamp: attribute.timestamp,
          archived: false,
          description: attribute.description,
          values: attribute.values.map((value: IValue<GenericValueType>) => {
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
      const entity: IEntity = {
        archived: false,
        name: `${columnMapping.namePrefix}${row[columnMapping.name]}`,
        owner: columnMapping.owner,
        created: dayjs(Date.now()).toISOString(),
        description: row[columnMapping.description] || "",
        projects: [],
        relationships: [],
        attributes: attributes,
        attachments: [],
        history: [],
      };

      if (!_.isEqual(columnMapping.project, "")) {
        entity.projects = [columnMapping.project];
      }

      entities.push(entity);
    }

    return entities;
  };

  /**
   * Prepare an Entity CSV file for import by extracting column names for mapping
   * @param {IFile[]} file File object
   * @return {Promise<string[]>} List of column names
   */
  static prepareEntityCSV = async (file: IFile[]): Promise<string[]> => {
    const { createReadStream, mimetype } = await file[0];
    const stream = createReadStream();

    // Validate correct MIME type before continuing
    if (_.isEqual(mimetype, "text/csv")) {
      const output = await Data.bufferHelper(stream);
      const workbook = XLSX.read(output, { cellDates: true });

      // File must contain at least 1 sheet
      if (workbook.SheetNames.length > 0) {
        // Get the first sheet and parse to JSON format
        const primarySheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsedSheet: IRow[] = XLSX.utils.sheet_to_json(primarySheet, {
          defval: "",
        });

        // Check if no rows present
        if (parsedSheet.length === 0) {
          return [];
        }

        // Generate the column list from present keys
        return Object.keys(parsedSheet[0]);
      } else {
        return [];
      }
    } else {
      return [];
    }
  };

  /**
   * Review an Entity CSV file and collate a list of operations that will be made to the imported Entities
   * @param {IColumnMapping} columnMapping Collection of key-value pairs defining the mapping between CSV columns and Entity fields
   * @param {IFile[]} file CSV file
   * @return {Promise<ResponseData<EntityImportReview[]>>}
   */
  static reviewEntityCSV = async (
    columnMapping: IColumnMapping,
    file: IFile[],
  ): Promise<ResponseData<EntityImportReview[]>> => {
    const { createReadStream } = await file[0];
    const stream = createReadStream();

    const output = await Data.bufferHelper(stream);
    const workbook = XLSX.read(output, { cellDates: true });

    // File must contain at least 1 sheet
    if (workbook.SheetNames.length > 0) {
      const primarySheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedSheet: IRow[] = XLSX.utils.sheet_to_json(primarySheet, {
        defval: "",
      });

      // Generate collection of Entities to import
      const entities = await Data.columnMappingHelper(
        columnMapping,
        parsedSheet,
      );

      return {
        success: true,
        message: "Collated list of Entities from CSV file to review",
        data: entities.map((entity) => {
          return {
            name: entity.name,
            state: "create",
          };
        }),
      };
    }

    return {
      success: false,
      message: "Default sheet is empty",
      data: [],
    };
  };

  /**
   * Map the set of columns as specified to Entity parameters
   * @param {IColumnMapping} columnMapping Collection of mapped values with their corresponding columns names
   * @param {IFile[]} file CSV file
   * @param {Context} context Request context, containing user and Workspace identifiers
   * @return {Promise<IResponseMessage>}
   */
  static importEntityCSV = async (
    columnMapping: IColumnMapping,
    file: IFile[],
    options: CSVImportOptions,
    context: Context,
  ): Promise<IResponseMessage> => {
    const { createReadStream } = await file[0];
    const stream = createReadStream();

    const output = await Data.bufferHelper(stream);
    const workbook = XLSX.read(output, { cellDates: true });
    if (workbook.SheetNames.length > 0) {
      const primarySheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedSheet: IRow[] = XLSX.utils.sheet_to_json(primarySheet, {
        defval: "",
      });

      // Generate collection of Entities to import
      const entities = await Data.columnMappingHelper(
        columnMapping,
        parsedSheet,
      );

      // Iterate over all Entities
      for await (const entity of entities) {
        // Apply specified options
        if (options.counters.length > 0) {
          const currentCounterValue = await Counters.getCurrentValue(
            options.counters[0]._id,
          );
          if (currentCounterValue.success) {
            entity.name = currentCounterValue.data;
            await Counters.incrementValue(options.counters[0]._id);
          }
        }

        // Create the Entity and add to Workspace
        const response = await Entities.create(entity);

        if (response.success) {
          // Add Entity to Workspace
          await Workspaces.addEntity(context.workspace, response.data);

          // Create new Activity if successful
          const activity = await Activity.create({
            timestamp: dayjs(Date.now()).toISOString(),
            type: "create",
            actor: context.user,
            details: "Created new Entity",
            target: {
              _id: response.data,
              type: "entities",
              name: entity.name,
            },
          });

          // Add Activity to Workspace
          await Workspaces.addActivity(context.workspace, activity.data);
        }
      }

      return {
        success: true,
        message: "Imported CSV file",
      };
    } else {
      return {
        success: false,
        message: "Default sheet is empty",
      };
    }
  };

  /**
   * Review an Entity JSON file and collate a list of operations that will be made to the imported Entities
   * @param {IFile[]} file JSON file for import
   * @return {Promise<ResponseData<EntityImportReview[]>>}
   */
  static reviewEntityJSON = async (
    file: IFile[],
  ): Promise<ResponseData<EntityImportReview[]>> => {
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
          data: [],
        };
      }

      const review: EntityImportReview[] = [];
      for await (const entity of parsed["entities"]) {
        // Check if Entity exists and update or create as required
        const exists = await Entities.exists(entity._id);

        review.push({
          name: entity.name,
          state: exists ? "update" : "create",
        });
      }

      return {
        success: true,
        message: "Collated list of Entities from JSON file to review",
        data: review,
      };
    }

    return {
      success: false,
      message: "Invalid JSON file",
      data: [],
    };
  };

  /**
   * Import an Entity JSON file or set of objects
   * @param {IFile[]} file JSON file for import
   * @param project Project identifier to add Entities to (if any)
   * @param {AttributeModel[]} attributes Collection of Attributes to add to each Entity (if specified)
   * @param context Request context containing user and Workspace identifier
   * @return {Promise<IResponseMessage>}
   */
  static importEntityJSON = async (
    file: IFile[],
    project: string,
    attributes: AttributeModel[],
    context: Context,
  ): Promise<IResponseMessage> => {
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

      // Check that the specified Project exists
      const projectExists = await Projects.exists(project);

      for await (const entity of parsed.entities as EntityModel[]) {
        // Apply various Entity data modifications depending on provided import details
        if (!_.isEqual(entity.owner, context.user)) {
          // Set the owner to be the user importing the Entity
          entity.owner = context.user;
        }

        if (projectExists && !_.includes(entity.projects, project)) {
          // If the Project exists, add it to the collection of Projects
          entity.projects.push(project);
        }

        if (attributes.length > 0) {
          // Add the new Attributes
          entity.attributes.push(...attributes);
        }

        // Check if Entity exists and update or create as required
        const entityExists = await Entities.exists(entity._id);
        if (entityExists) {
          // Update the Entity if it already exists
          const result = await Entities.update(entity);
          if (!result.success) {
            return {
              success: false,
              message: `Error updating existing Entity: "${entity.name}"`,
            };
          } else {
            // Add the Entity to the Workspace
            await Workspaces.addEntity(context.workspace, entity._id);

            const activity = await Activity.create({
              timestamp: dayjs(Date.now()).toISOString(),
              type: "update",
              actor: context.user,
              details: "Updated existing Entity",
              target: {
                _id: entity._id,
                type: "entities",
                name: entity.name,
              },
            });

            // Add Activity to Workspace
            await Workspaces.addActivity(context.workspace, activity.data);
          }
        } else {
          // Create a new Entity if it does not exist
          const result = await Entities.create(entity);
          if (!result.success) {
            return {
              success: false,
              message: `Error creating new Entity: "${entity.name}"`,
            };
          } else {
            // Add the Entity to the Workspace
            await Workspaces.addEntity(context.workspace, result.data);

            const activity = await Activity.create({
              timestamp: dayjs(Date.now()).toISOString(),
              type: "update",
              actor: context.user,
              details: "Updated existing Entity",
              target: {
                _id: result.data,
                type: "entities",
                name: entity.name,
              },
            });

            // Add Activity to Workspace
            await Workspaces.addActivity(context.workspace, activity.data);
          }
        }
      }
    }

    return {
      success: true,
      message: "Successfully imported set of objects",
    };
  };

  /**
   * Import a Template JSON file
   * @param {IFile[]} file JSON file for import
   * @param context Request context containing user and Workspace identifier
   * @return {Promise<IResponseMessage>}
   */
  static importTemplateJSON = async (
    file: IFile[],
    context: Context,
  ): Promise<IResponseMessage> => {
    const { createReadStream, mimetype } = await file[0];
    const stream = createReadStream();

    // Validate correct MIME type before continuing
    if (_.isEqual(mimetype, "application/json")) {
      const output = await Data.bufferHelper(stream);
      const parsed = JSON.parse(output.toString());

      // Check that JSON file contains required fields
      if (
        _.isUndefined(parsed["name"]) ||
        _.isUndefined(parsed["description"]) ||
        _.isUndefined(parsed["archived"]) ||
        _.isUndefined(parsed["values"])
      ) {
        return {
          success: false,
          message: "Template JSON file is missing required fields",
        };
      }

      if (
        !_.isUndefined(parsed["_id"]) &&
        (await Templates.exists(parsed._id))
      ) {
        // Update an existing Template if it exists
        const result = await Templates.update(parsed);
        if (!result.success) {
          return {
            success: false,
            message: `Error updating Template: "${parsed.name}"`,
          };
        }

        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "update",
          actor: context.user,
          details: "Updated existing Template",
          target: {
            _id: parsed._id,
            type: "templates",
            name: parsed.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.data);
      } else {
        // Create a new Template if it does not exist
        const result = await Templates.create(parsed);
        if (!result.success) {
          return {
            success: false,
            message: `Error creating new Template: "${parsed.name}"`,
          };
        }

        // Add the Entity to the Workspace
        await Workspaces.addTemplate(context.workspace, result.data);

        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "create",
          actor: context.user,
          details: "Created new Template",
          target: {
            _id: result.data,
            type: "templates",
            name: parsed.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.data);
      }
    }

    return {
      success: true,
      message: "Successfully imported set of objects",
    };
  };
}
