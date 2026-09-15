// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Data model and types
import { Data } from "@models/Data";
import { Entities } from "@models/Entities";
import { AttributeModel, Context, EntityModel, IColumnMapping, IFile } from "@types";

// Utility functions and libraries
import { Readable } from "stream";
import * as fs from "fs";
import dayjs from "dayjs";

// Database connectivity
import { connect, disconnect, getDatabase } from "@connectors/database";
import { clearDatabase } from "../helpers";

const TEST_USER = "henry.burgess@wustl.edu";
const TEST_WORKSPACE = "workspace-data-test"; // Deliberately does not exist

/** Wraps raw file contents as the `IFile` shape expected by `Data` model methods */
const mockFile = (contents: string, mimetype: string, filename: string): IFile =>
  Promise.resolve({
    filename,
    mimetype,
    encoding: "7bit",
    createReadStream: () => Readable.from(Buffer.from(contents)) as unknown as fs.ReadStream,
  });

const testContext: Context = {
  user: TEST_USER,
  workspace: TEST_WORKSPACE,
  userRole: "owner",
};

const baseColumnMapping = (overrides: Partial<IColumnMapping> = {}): IColumnMapping => ({
  namePrefix: "",
  name: "Name",
  description: "Description",
  created: dayjs(Date.now()).toISOString(),
  owner: TEST_USER,
  project: "",
  attributes: [],
  ...overrides,
});

describe("Data model", () => {
  beforeEach(async () => {
    await connect();
    await clearDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
    await disconnect();
  });

  describe("spreadsheet imports", () => {
    it("should flag a row with a missing name as a warning when reviewing a CSV file", async () => {
      const csv = ["Name,Description", ",Missing name row"].join("\n");
      const file = [mockFile(csv, "text/csv", "test.csv")];

      const result = await Data.reviewEntitySpreadsheet(baseColumnMapping(), file);
      expect(result.success).toBeTruthy();
      expect(result.data[0].warnings).toContain("Entity has missing / invalid name");
    });

    it("should not flag warnings for a CSV file where every row has a valid name", async () => {
      const csv = ["Name,Description", "Row One,First row", "Row Two,Second row"].join("\n");
      const file = [mockFile(csv, "text/csv", "test.csv")];

      const result = await Data.reviewEntitySpreadsheet(baseColumnMapping(), file);
      expect(result.success).toBeTruthy();
      expect(result.data.every((entity) => entity.warnings === undefined)).toBeTruthy();
    });

    it("should refuse to import a CSV file when a row has validation warnings", async () => {
      const csv = ["Name,Description", ",Missing name row"].join("\n");
      const file = [mockFile(csv, "text/csv", "test.csv")];

      const result = await Data.importEntitySpreadsheet(baseColumnMapping(), file, { counters: [] }, testContext);
      expect(result.success).toBeFalsy();

      const entities = await Entities.all();
      expect(entities.length).toBe(0);
    });

    it("should import a valid CSV file and generate a unique Attribute instance id per Entity", async () => {
      const csv = ["Name,Description", "Row One,First row", "Row Two,Second row"].join("\n");
      const file = [mockFile(csv, "text/csv", "test.csv")];

      const templateAttribute: AttributeModel = {
        _id: "template-attribute",
        name: "Extra Attribute",
        owner: TEST_USER,
        timestamp: dayjs(Date.now()).toISOString(),
        archived: false,
        description: "Applied to every imported Entity",
        values: [{ _id: "value-1", name: "Fixed Value", type: "text", data: "constant", source: "value" }],
      };

      const result = await Data.importEntitySpreadsheet(
        baseColumnMapping({ attributes: [templateAttribute] }),
        file,
        { counters: [] },
        testContext,
      );
      expect(result.success).toBeTruthy();

      const entities = await Entities.all();
      expect(entities.length).toBe(2);

      const [firstId, secondId] = entities.map((entity) => entity.attributes[0]._id);
      expect(firstId).not.toEqual(secondId);
      expect(firstId.startsWith("template-attribute-")).toBeTruthy();
      expect(secondId.startsWith("template-attribute-")).toBeTruthy();
    });
  });

  describe("Entity JSON imports", () => {
    it('should reject a JSON file missing the "entities" field on review', async () => {
      const file = [mockFile(JSON.stringify({ foo: "bar" }), "application/json", "test.json")];

      const result = await Data.reviewEntityJSON(file);
      expect(result.success).toBeFalsy();
      expect(result.message).toContain('"entities" field');
    });

    it("should apply the same validation to importEntityJSON as reviewEntityJSON", async () => {
      // Each call needs its own file/stream, since a stream can only be read once
      const invalidPayload = { foo: "bar" };
      const reviewResult = await Data.reviewEntityJSON([
        mockFile(JSON.stringify(invalidPayload), "application/json", "test.json"),
      ]);
      const importResult = await Data.importEntityJSON(
        [mockFile(JSON.stringify(invalidPayload), "application/json", "test.json")],
        "",
        [],
        testContext,
      );

      expect(importResult.success).toBeFalsy();
      expect(importResult.message).toEqual(reviewResult.message);
    });

    it("should import a valid Entities JSON file, creating each Entity", async () => {
      const payload = { entities: [{ name: "Imported Entity One" }, { name: "Imported Entity Two" }] };
      const file = [mockFile(JSON.stringify(payload), "application/json", "test.json")];

      const result = await Data.importEntityJSON(file, "", [], testContext);
      expect(result.success).toBeTruthy();

      const entities = await Entities.all();
      expect(entities.map((entity) => entity.name).sort()).toEqual(["Imported Entity One", "Imported Entity Two"]);
      expect(entities.every((entity) => entity.owner === TEST_USER)).toBeTruthy();
    });

    it("should generate a unique Attribute instance id per Entity for JSON imports", async () => {
      const file = [
        mockFile(
          JSON.stringify({ entities: [{ name: "Entity A" }, { name: "Entity B" }] }),
          "application/json",
          "test.json",
        ),
      ];
      const extraAttribute: AttributeModel = {
        _id: "template-attribute",
        name: "Extra Attribute",
        owner: TEST_USER,
        timestamp: dayjs(Date.now()).toISOString(),
        archived: false,
        description: "Applied to every imported Entity",
        values: [],
      };

      const result = await Data.importEntityJSON(file, "", [extraAttribute], testContext);
      expect(result.success).toBeTruthy();

      const entities = await Entities.all();
      const [firstId, secondId] = entities.map((entity) => entity.attributes[0]._id);
      expect(firstId).not.toEqual(secondId);
    });

    it("should update an existing Entity when importing JSON with a matching _id", async () => {
      const created = await Entities.create({
        name: "Original Name",
        created: dayjs(Date.now()).toISOString(),
        archived: false,
        owner: TEST_USER,
        description: "",
        projects: [],
        links: [],
        attributes: [],
        attachments: [],
        history: [],
      });
      expect(created.success).toBeTruthy();

      const file = [
        mockFile(
          JSON.stringify({ entities: [{ _id: created.data, name: "Updated Name" }] }),
          "application/json",
          "test.json",
        ),
      ];

      const result = await Data.importEntityJSON(file, "", [], testContext);
      expect(result.success).toBeTruthy();

      const updated: EntityModel | null = await Entities.getOne(created.data);
      if (!updated) throw new Error("Entity not found after update");
      expect(updated.name).toEqual("Updated Name");

      // No duplicate Entity should have been created
      const entities = await Entities.all();
      expect(entities.length).toBe(1);
    });
  });

  describe("Attribute JSON imports", () => {
    it("should reject an Attribute JSON file missing required fields, identically on review and import", async () => {
      const missingFields = { name: "Incomplete Attribute" };

      const reviewResult = await Data.reviewAttributeJSON([
        mockFile(JSON.stringify(missingFields), "application/json", "test.json"),
      ]);
      const importResult = await Data.importAttributeJSON(
        [mockFile(JSON.stringify(missingFields), "application/json", "test.json")],
        testContext,
      );

      expect(reviewResult.success).toBeFalsy();
      expect(importResult.success).toBeFalsy();
      expect(reviewResult.message).toEqual(importResult.message);
      expect(reviewResult.message).toContain("description, values");
    });

    it("should import a valid Attribute JSON file", async () => {
      const validAttribute = { name: "New Attribute", description: "A description", values: [] };
      const file = [mockFile(JSON.stringify(validAttribute), "application/json", "test.json")];

      const result = await Data.importAttributeJSON(file, testContext);
      expect(result.success).toBeTruthy();

      const stored = await getDatabase().collection("attributes").findOne({ name: "New Attribute" });
      expect(stored).not.toBeNull();
    });
  });
});
