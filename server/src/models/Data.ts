// Custom types
import {
  AttributeModel,
  Context,
  EntityModel,
  IEntity,
  IFile,
  IValue,
  IValueType,
  IResponseMessage,
  ResponseData,
  EntityImportReview,
  TemplateImportReview,
  IColumnMapping,
  IRow,
  CSVImportOptions,
} from "@types";

// Utility functions and libraries
import * as fs from "fs";
import XLSX from "xlsx";
import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import { getAttachments } from "@connectors/database";
import _ from "lodash";

// Models
import { Activity } from "@models/Activity";
import { Counters } from "@models/Counters";
import { Entities } from "@models/Entities";
import { Projects } from "@models/Projects";
import { Templates } from "@models/Templates";
import { Workspaces } from "@models/Workspaces";

export class Data {
  /**
   * Generate a file to be downloaded from the `/static` endpoint
   * @param _id File identifier in GridFS storage
   * @param filename File name, assuming that file exists
   * @return {Promise<string>}
   */
  private static generateFile = (_id: string, filename: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const bucket = getAttachments();
      const staticPath = `${_id}_${filename}`;
      const stream = bucket.openDownloadStream(new ObjectId(_id)).on("error", () => {
        reject("Error while generating static file for download");
      });
      stream.pipe(fs.createWriteStream(__dirname + `/public/${staticPath}`));
      stream.on("close", () => {
        resolve(`/${staticPath}`);
      });
    });
  };

  static downloadFile = async (_id: string): Promise<string> => {
    const bucket = getAttachments();
    const result = await bucket.find({ _id: new ObjectId(_id) }).toArray();
    if (result.length === 0) return "/";
    return await Data.generateFile(_id, result[0].filename);
  };

  static uploadAttachment = async (target: string, file: IFile): Promise<ResponseData<string>> => {
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
            const attachmentId = uploadStream.id.toString();
            const addResult = await Entities.addAttachment(target, {
              _id: attachmentId,
              name: filename,
            });

            if (!addResult.success) {
              resolve({ success: false, message: addResult.message, data: "" });
            } else {
              resolve({ success: true, message: `Uploaded file "${filename}"`, data: attachmentId });
            }
          } catch (error: unknown) {
            reject({
              success: false,
              message: `Error registering attachment: ${Data.errorMessage(error)}`,
              data: "",
            });
          }
        });
    });
  };

  /**
   * Concatenates all chunks from a readable stream into a single Buffer.
   * @param stream ReadableStream instance with file contents
   * @return {Promise<Buffer>}
   */
  private static bufferHelper = async (stream: fs.ReadStream): Promise<Buffer> =>
    new Promise((resolve) => {
      const buffers: Uint8Array[] = [];
      stream.on("data", (data: Uint8Array) => buffers.push(data));
      stream.on("end", () => resolve(Buffer.concat(buffers)));
    });

  /**
   * Reads the first sheet of a spreadsheet file (CSV or XLSX) into parsed row objects.
   * @param {IFile} file File descriptor from the upload stream
   * @return {Promise<IRow[]>} Parsed rows, or an empty array if the workbook has no sheets
   */
  private static parseSpreadsheet = async (file: IFile): Promise<IRow[]> => {
    const { createReadStream } = await file;
    const output = await Data.bufferHelper(createReadStream());
    const workbook = XLSX.read(output, { cellDates: true });
    if (workbook.SheetNames.length === 0) return [];
    return XLSX.utils.sheet_to_json<IRow>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
  };

  /**
   * Creates an Activity record and links it to the given Workspace.
   * @param {string} workspace Workspace identifier
   * @param {"create" | "update" | "delete" | "archived"} type Activity type
   * @param {string} actor User identifier performing the action
   * @param {string} details Human-readable activity description
   * @param {{ _id: string; type: "entities" | "projects" | "templates"; name: string }} target Target resource metadata
   */
  private static recordActivity = async (
    workspace: string,
    type: "create" | "update" | "delete" | "archived",
    actor: string,
    details: string,
    target: { _id: string; type: "entities" | "projects" | "templates"; name: string },
  ): Promise<void> => {
    const activity = await Activity.create({
      timestamp: dayjs(Date.now()).toISOString(),
      type,
      actor,
      details,
      target,
    });
    await Workspaces.addActivity(workspace, activity.data);
  };

  /**
   * Validates that a raw cell value is compatible with the expected IValueType.
   * Empty values are permitted and do not produce a warning.
   * @param {string} raw Raw cell value from the spreadsheet row
   * @param {IValueType} type Expected value type
   * @return {boolean}
   */
  private static validateValueData = (raw: string, type: IValueType): boolean => {
    if (raw === "" || raw === undefined || raw === null) return true;
    switch (type) {
      case "number":
        return !isNaN(Number(raw)) && String(raw).trim() !== "";
      case "url":
        try {
          new URL(raw);
          return true;
        } catch {
          return false;
        }
      case "date":
        return dayjs(raw).isValid();
      default:
        return true;
    }
  };

  /**
   * Maps a parsed spreadsheet into Entity and per-row warning pairs using the provided column mapping.
   * Each value's `source` field controls data resolution: `"column"` reads from the row,
   * `"value"` uses the literal data field directly.
   * @param {IColumnMapping} columnMapping Mapping of Entity fields to column names or fixed values
   * @param {IRow[]} sheet Parsed spreadsheet rows
   * @return {{ entity: IEntity; warnings: string[] }[]}
   */
  private static columnMappingHelper = (
    columnMapping: IColumnMapping,
    sheet: IRow[],
  ): { entity: IEntity; warnings: string[] }[] => {
    return sheet.map((row, rowIndex) => {
      const rowWarnings: string[] = [];

      // Check the Attributes for warnings
      const attributes: AttributeModel[] = columnMapping.attributes.map((attribute: AttributeModel) => ({
        _id: attribute._id,
        name: attribute.name,
        owner: attribute.owner,
        timestamp: attribute.timestamp,
        archived: false,
        description: attribute.description,
        values: attribute.values.map((value: IValue) => {
          const isColumnSource = !_.isEqual(value.source, "value");

          // IRow = Record<string, any>, so narrow the cell type explicitly
          const cellValue = isColumnSource
            ? (row[value.data] as string | number | Date | null | undefined)
            : value.data;

          // Start with a string representation; type-specific branches may replace it
          let processedData: string = String(cellValue ?? "");

          if (isColumnSource) {
            if (!Data.validateValueData(processedData, value.type as IValueType)) {
              rowWarnings.push(
                `Attribute "${attribute.name}", value "${value.name}": column "${value.data}" has invalid ${value.type} data "${processedData}" (row ${rowIndex + 1})`,
              );
            }

            if (_.isEqual(value.type, "date")) {
              processedData = dayjs(cellValue as string | number | Date).format("YYYY-MM-DD");
            }
            if (_.isEqual(value.type, "select")) {
              // Select data is stored as a JSON string consumed by the Values component
              const cellStr = String(cellValue ?? "");
              processedData = JSON.stringify({ selected: cellStr, options: [cellStr] });
            }
          }

          return { _id: value._id, name: value.name, type: value.type, data: processedData };
        }),
      }));

      // Check the Entity name for warnings
      if (row[columnMapping.name] === "" || _.isUndefined(row[columnMapping.name])) {
        rowWarnings.push("Entity has missing / invalid name");
      }

      const entity: IEntity = {
        archived: false,
        name: `${columnMapping.namePrefix}${row[columnMapping.name]}`,
        owner: columnMapping.owner,
        created: dayjs(Date.now()).toISOString(),
        description: row[columnMapping.description] || "",
        projects: [],
        relationships: [],
        attributes,
        attachments: [],
        history: [],
      };

      if (!_.isEqual(columnMapping.project, "")) {
        entity.projects = [columnMapping.project];
      }

      return { entity, warnings: rowWarnings };
    });
  };

  /** Extracts a human-readable message string from an unknown caught value. */
  private static errorMessage = (error: unknown): string => (error instanceof Error ? error.message : "Unknown error");

  /** Accepted MIME types for spreadsheet imports */
  private static readonly SPREADSHEET_MIME_TYPES = [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  /**
   * Infers the most specific IValueType for a column by sampling its non-empty values.
   * Checked in order: native Date objects, numeric strings, ISO date strings, URLs, then text.
   * @param {any[]} values Raw cell values for the column across all sampled rows
   * @return {IValueType}
   */
  private static inferColumnType = (values: any[]): IValueType => {
    const nonEmpty = values.filter((v) => v !== "" && v !== undefined && v !== null);
    if (nonEmpty.length === 0) return "text";

    // Check for `Date` objects
    if (nonEmpty.every((v) => v instanceof Date)) return "date";

    // Check for specific cases
    const strings = nonEmpty.map((v) => String(v));
    if (strings.every((v) => !isNaN(Number(v)) && v.trim() !== "")) return "number";
    if (strings.every((v) => dayjs(v).isValid())) return "date";
    if (
      strings.every((v) => {
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      })
    )
      return "url";

    // Default case is "text"
    return "text";
  };

  /**
   * Prepares a spreadsheet file (CSV or XLSX) for import by extracting column names and
   * inferring the data type of each column from its contents.
   * @param {IFile[]} file File object
   * @return {Promise<{ name: string; inferredType: IValueType }[]>} Column descriptors
   */
  static prepareEntityCSV = async (file: IFile[]): Promise<{ name: string; inferredType: IValueType }[]> => {
    const { mimetype } = await file[0];
    if (!Data.SPREADSHEET_MIME_TYPES.includes(mimetype)) return [];

    try {
      const parsedSheet = await Data.parseSpreadsheet(file[0]);
      if (parsedSheet.length === 0) return [];
      return Object.keys(parsedSheet[0]).map((name) => ({
        name,
        inferredType: Data.inferColumnType(parsedSheet.map((row) => row[name])),
      }));
    } catch {
      return [];
    }
  };

  /**
   * Reviews a spreadsheet file and returns a list of Entity operations that will be performed on import.
   * Includes per-row type validation warnings for column-mapped values.
   * @param {IColumnMapping} columnMapping Mapping of Entity fields to column names or fixed values
   * @param {IFile[]} file Spreadsheet file (CSV or XLSX)
   * @return {Promise<ResponseData<EntityImportReview[]>>}
   */
  static reviewEntityCSV = async (
    columnMapping: IColumnMapping,
    file: IFile[],
  ): Promise<ResponseData<EntityImportReview[]>> => {
    try {
      const parsedSheet = await Data.parseSpreadsheet(file[0]);
      if (parsedSheet.length === 0) {
        return { success: false, message: "File contains no sheets", data: [] };
      }

      const results = Data.columnMappingHelper(columnMapping, parsedSheet);
      return {
        success: true,
        message: "Collated list of Entities from file to review",
        data: results.map(({ entity, warnings }) => ({
          name: entity.name,
          state: "create" as const,
          warnings: warnings.length > 0 ? warnings : undefined,
        })),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Failed to review file: ${Data.errorMessage(error)}`,
        data: [],
      };
    }
  };

  /**
   * Maps columns to Entity fields using the provided mapping, then persists each imported Entity.
   * @param {IColumnMapping} columnMapping Mapping of Entity fields to column names or fixed values
   * @param {IFile[]} file Spreadsheet file (CSV or XLSX)
   * @param {CSVImportOptions} options Additional import options such as counter configuration
   * @param {Context} context Request context containing user and Workspace identifiers
   * @return {Promise<IResponseMessage>}
   */
  static importEntityCSV = async (
    columnMapping: IColumnMapping,
    file: IFile[],
    options: CSVImportOptions,
    context: Context,
  ): Promise<IResponseMessage> => {
    try {
      const parsedSheet = await Data.parseSpreadsheet(file[0]);
      if (parsedSheet.length === 0) {
        return { success: false, message: "File contains no sheets" };
      }

      const results = Data.columnMappingHelper(columnMapping, parsedSheet);

      for (const { entity } of results) {
        if (options.counters.length > 0) {
          const currentCounterValue = await Counters.getCurrentValue(options.counters[0]._id);
          if (currentCounterValue.success) {
            entity.name = currentCounterValue.data;
            await Counters.incrementValue(options.counters[0]._id);
          }
        }

        const response = await Entities.create(entity);
        if (response.success) {
          await Workspaces.addEntity(context.workspace, response.data);
          await Data.recordActivity(context.workspace, "create", context.user, "Created new Entity", {
            _id: response.data,
            type: "entities",
            name: entity.name,
          });
        }
      }

      return { success: true, message: "Imported file" };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Failed to import file: ${Data.errorMessage(error)}`,
      };
    }
  };

  /**
   * Reviews an Entity JSON file and returns a list of operations that will be made on import.
   * @param {IFile[]} file JSON file for import
   * @return {Promise<ResponseData<EntityImportReview[]>>}
   */
  static reviewEntityJSON = async (file: IFile[]): Promise<ResponseData<EntityImportReview[]>> => {
    const { createReadStream, mimetype } = await file[0];
    if (!_.isEqual(mimetype, "application/json")) {
      return { success: false, message: "Invalid JSON file", data: [] };
    }

    try {
      const output = await Data.bufferHelper(createReadStream());
      const parsed = JSON.parse(output.toString());

      if (_.isUndefined(parsed["entities"])) {
        return { success: false, message: 'JSON file does not contain "entities" field', data: [] };
      }

      const review: EntityImportReview[] = [];
      for (const entity of parsed["entities"]) {
        const exists = await Entities.exists(entity._id);
        review.push({ name: entity.name, state: exists ? "update" : "create" });
      }

      return { success: true, message: "Collated list of Entities from JSON file to review", data: review };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Failed to parse JSON file: ${Data.errorMessage(error)}`,
        data: [],
      };
    }
  };

  /**
   * Reviews a Template JSON file and returns a list of operations that will be made on import.
   * @param {IFile[]} file JSON file for import
   * @return {Promise<ResponseData<TemplateImportReview[]>>}
   */
  static reviewTemplateJSON = async (file: IFile[]): Promise<ResponseData<TemplateImportReview[]>> => {
    const { createReadStream, mimetype } = await file[0];
    if (!_.isEqual(mimetype, "application/json")) {
      return { success: false, message: "Invalid JSON file", data: [] };
    }

    try {
      const output = await Data.bufferHelper(createReadStream());
      const parsed = JSON.parse(output.toString());

      if (
        _.isUndefined(parsed["name"]) ||
        _.isUndefined(parsed["description"]) ||
        _.isUndefined(parsed["archived"]) ||
        _.isUndefined(parsed["values"])
      ) {
        return { success: false, message: "Template JSON file is missing required fields", data: [] };
      }

      const exists = !_.isUndefined(parsed["_id"]) && (await Templates.exists(parsed._id));
      return {
        success: true,
        message: "Collated list of Templates from JSON file to review",
        data: [{ name: parsed.name, state: exists ? "update" : "create" }],
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Failed to parse JSON file: ${Data.errorMessage(error)}`,
        data: [],
      };
    }
  };

  /**
   * Imports an Entity JSON file, creating or updating each Entity as required.
   * @param {IFile[]} file JSON file for import
   * @param project Project identifier to add Entities to, if any
   * @param {AttributeModel[]} attributes Attributes to add to each imported Entity
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
    if (!_.isEqual(mimetype, "application/json")) {
      return { success: false, message: "Invalid JSON file" };
    }

    try {
      const output = await Data.bufferHelper(createReadStream());
      const parsed = JSON.parse(output.toString());

      if (_.isUndefined(parsed["entities"])) {
        return { success: false, message: 'JSON file does not contain "entities" field' };
      }

      const projectExists = await Projects.exists(project);

      for (const entity of parsed.entities as EntityModel[]) {
        if (!_.isEqual(entity.owner, context.user)) {
          entity.owner = context.user;
        }
        if (projectExists && !_.includes(entity.projects, project)) {
          entity.projects.push(project);
        }
        if (attributes.length > 0) {
          entity.attributes.push(...attributes);
        }

        const entityExists = await Entities.exists(entity._id);
        if (entityExists) {
          const result = await Entities.update(entity);
          if (!result.success) {
            return { success: false, message: `Error updating Entity: "${entity.name}"` };
          }
          await Workspaces.addEntity(context.workspace, entity._id);
          await Data.recordActivity(context.workspace, "update", context.user, "Updated Entity", {
            _id: entity._id,
            type: "entities",
            name: entity.name,
          });
        } else {
          const result = await Entities.create(entity);
          if (!result.success) {
            return { success: false, message: `Error creating new Entity: "${entity.name}"` };
          }
          await Workspaces.addEntity(context.workspace, result.data);
          await Data.recordActivity(context.workspace, "create", context.user, "Created new Entity", {
            _id: result.data,
            type: "entities",
            name: entity.name,
          });
        }
      }

      return { success: true, message: "Successfully imported set of objects" };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Failed to import JSON file: ${Data.errorMessage(error)}`,
      };
    }
  };

  /**
   * Imports a Template JSON file, creating or updating the Template as required.
   * @param {IFile[]} file JSON file for import
   * @param context Request context containing user and Workspace identifier
   * @return {Promise<IResponseMessage>}
   */
  static importTemplateJSON = async (file: IFile[], context: Context): Promise<IResponseMessage> => {
    const { createReadStream, mimetype } = await file[0];
    if (!_.isEqual(mimetype, "application/json")) {
      return { success: false, message: "Invalid JSON file" };
    }

    try {
      const output = await Data.bufferHelper(createReadStream());
      const parsed = JSON.parse(output.toString());

      if (
        _.isUndefined(parsed["name"]) ||
        _.isUndefined(parsed["description"]) ||
        _.isUndefined(parsed["archived"]) ||
        _.isUndefined(parsed["values"])
      ) {
        return { success: false, message: "Template JSON file is missing required fields" };
      }

      if (!_.isUndefined(parsed["_id"]) && (await Templates.exists(parsed._id))) {
        const result = await Templates.update(parsed);
        if (!result.success) {
          return { success: false, message: `Error updating Template: "${parsed.name}"` };
        }
        await Data.recordActivity(context.workspace, "update", context.user, "Updated Template", {
          _id: parsed._id,
          type: "templates",
          name: parsed.name,
        });
      } else {
        const result = await Templates.create(parsed);
        if (!result.success) {
          return { success: false, message: `Error creating new Template: "${parsed.name}"` };
        }
        await Workspaces.addTemplate(context.workspace, result.data);
        await Data.recordActivity(context.workspace, "create", context.user, "Created new Template", {
          _id: result.data,
          type: "templates",
          name: parsed.name,
        });
      }

      return { success: true, message: "Successfully imported set of objects" };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Failed to import JSON file: ${Data.errorMessage(error)}`,
      };
    }
  };
}
