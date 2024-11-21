// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Entities model and types
import { EntityModel, ProjectModel, ResponseData } from "../../types";
import { Entities } from "../src/models/Entities";
import { Projects } from "../src/models/Projects";

// Utility functions and libraries
import dayjs from "dayjs";
import _ from "lodash";

// Variables
import { DEMO_USER_ORCID } from "../src/variables";

// Database connectivity
import { connect, disconnect } from "../src/connectors/database";
import { clearDatabase } from "./util";

describe("Entity model", () => {
  beforeEach(async () => {
    // Connect to the database
    await connect();

    // Clear the database prior to running tests
    await clearDatabase();
  });

  // Teardown after each test
  afterEach(async () => {
    // Clear the database after each test
    await clearDatabase();
    await disconnect();
  });

  it("should return 0 Entities with an empty database", async () => {
    const result = await Entities.all();
    expect(result.length).toBe(0);
  });

  it("should create an Entity", async () => {
    const result: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });
    expect(result.success).toBeTruthy();

    const entity: EntityModel | null = await Entities.getOne(result.data);
    expect(entity).not.toBeNull();
  });

  it("should create a parent-child relationship between two Entities", async () => {
    // Create the first Entity
    const parentResult: ResponseData<string> = await Entities.create({
      name: "TestParentEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Parent",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create the second Entity (child) that has the first Entity as a parent
    const childResult: ResponseData<string> = await Entities.create({
      name: "TestChildEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Child",
      projects: [],
      relationships: [
        {
          source: { name: "TestChildEntity", _id: "no_id" },
          target: { name: "TestParentEntity", _id: parentResult.data },
          type: "child",
        },
      ],
      attributes: [],
      attachments: [],
      history: [],
    });

    // Refresh parent Entity
    const parentEntity: EntityModel | null = await Entities.getOne(
      parentResult.data,
    );
    if (_.isNull(parentEntity)) throw new Error();

    // Confirm child Entity creation
    const childEntity: EntityModel | null = await Entities.getOne(
      childResult.data,
    );
    if (_.isNull(childEntity)) throw new Error();

    // Check the parent of the child
    expect(childEntity.relationships.length).toBe(1);
    expect(childEntity.relationships[0].target._id).toStrictEqual(
      parentEntity._id,
    );

    // Check the child of the parent
    expect(parentEntity.relationships.length).toBe(1);
    expect(parentEntity.relationships[0].target._id).toStrictEqual(
      childEntity._id,
    );
  });

  it("should create a child-parent relationship between two Entities", async () => {
    // Create the first Entity (child)
    const childResult: ResponseData<string> = await Entities.create({
      name: "TestChildEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Child",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create the second Entity (parent) that has the first Entity as a child
    const parentResult: ResponseData<string> = await Entities.create({
      name: "TestParentEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Parent",
      projects: [],
      relationships: [
        {
          source: { name: "TestParentEntity", _id: "no_id" },
          target: { name: "TestChildEntity", _id: childResult.data },
          type: "parent",
        },
      ],
      attributes: [],
      attachments: [],
      history: [],
    });

    const childEntity: EntityModel | null = await Entities.getOne(
      childResult.data,
    );
    if (_.isNull(childEntity)) throw new Error();

    const parentEntity: EntityModel | null = await Entities.getOne(
      parentResult.data,
    );
    if (_.isNull(parentEntity)) throw new Error();

    // Check the child of the parent
    expect(parentEntity.relationships.length).toBe(1);
    expect(parentEntity.relationships[0].target._id).toStrictEqual(
      childEntity._id,
    );

    // Check the parent of the child
    expect(childEntity.relationships.length).toBe(1);
    expect(childEntity.relationships[0].target._id).toStrictEqual(
      parentEntity._id,
    );
  });

  it("should create an Attribute", async () => {
    // Start by creating an Entity
    const result: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [
        {
          _id: "TestAttribute",
          archived: false,
          name: "Attribute_1",
          timestamp: dayjs(Date.now()).toISOString(),
          owner: "henry.burgess@wustl.edu",
          description: "Test Attribute description",
          values: [],
        },
      ],
      attachments: [],
      history: [],
    });

    const entity: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(entity)) throw new Error();

    // Check that an Attribute exists and it has the correct ID
    expect(entity.attributes.length).toBe(1);
    expect(entity.attributes[0]._id).toBe("TestAttribute");
  });

  it("should update the description", async () => {
    const result: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    const entity: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(entity)) throw new Error();

    entity.description = "Updated";
    await Entities.update(entity);

    const updated: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(updated)) throw new Error();
    expect(updated.description).toBe("Updated");
  });

  it("should update Project membership when added", async () => {
    const entityResult: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create a Project
    const projectResult: ResponseData<string> = await Projects.create({
      name: "TestProject",
      archived: false,
      created: dayjs(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Project",
      entities: [],
      collaborators: [],
      history: [],
    });

    // Update the Entity to be added to the new Project
    const entity: EntityModel | null = await Entities.getOne(entityResult.data);
    if (_.isNull(entity)) throw new Error();
    entity.projects.push(projectResult.data);
    await Entities.update(entity);

    // Retrieve updated Entity and Project models
    const updatedEntity: EntityModel | null = await Entities.getOne(
      entityResult.data,
    );
    if (_.isNull(updatedEntity)) throw new Error();
    const updatedProject: ProjectModel | null = await Projects.getOne(
      projectResult.data,
    );
    if (_.isNull(updatedProject)) throw new Error();

    // Validate the Entity has the Project
    expect(updatedEntity.projects.length).toBe(1);
    expect(updatedEntity.projects.pop()).toBe(projectResult.data);

    // Validate the Project has the Entity
    expect(updatedProject.entities.length).toBe(1);
    expect(updatedProject.entities.pop()).toBe(entityResult.data);
  });

  it("should update Project membership when removed", async () => {
    const entityResult: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create a Project
    const projectResult: ResponseData<string> = await Projects.create({
      name: "TestProject",
      archived: false,
      created: dayjs(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Project",
      entities: [],
      collaborators: [],
      history: [],
    });

    // Update the Entity to be added to the new Project
    const entity: EntityModel | null = await Entities.getOne(entityResult.data);
    if (_.isNull(entity)) throw new Error();
    entity.projects.push(projectResult.data);
    await Entities.update(entity);

    // Remove the Project from the Entity and update
    entity.projects = [];
    await Entities.update(entity);

    // Retrieve updated Entity and Project models
    const updatedEntity: EntityModel | null = await Entities.getOne(
      entityResult.data,
    );
    if (_.isNull(updatedEntity)) throw new Error();
    const updatedProject: ProjectModel | null = await Projects.getOne(
      projectResult.data,
    );
    if (_.isNull(updatedProject)) throw new Error();

    // Validate the Entity does not have the Project
    expect(updatedEntity.projects.length).toBe(0);

    // Validate the Project does not have the Entity
    expect(updatedProject.entities.length).toBe(0);
  });

  it("should update Entity relationships from the child", async () => {
    const entityResult: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create a parent Entity
    const parentResult: ResponseData<string> = await Entities.create({
      name: "ParentEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    const entity = await Entities.getOne(entityResult.data);
    if (_.isNull(entity)) throw new Error();

    // Add the parent
    entity.relationships.push({
      target: {
        _id: parentResult.data,
        name: "ParentEntity",
      },
      source: {
        _id: entityResult.data,
        name: "TestEntity",
      },
      type: "parent",
    });
    await Entities.update(entity);

    // Get the updated parent Entity and child Entity
    let parentEntity: EntityModel | null = await Entities.getOne(
      parentResult.data,
    );
    if (_.isNull(parentEntity)) throw new Error();

    let childEntity: EntityModel | null = await Entities.getOne(
      entityResult.data,
    );
    if (_.isNull(childEntity)) throw new Error();

    // Validate Entities
    expect(parentEntity.relationships.length).toBe(1);
    expect(childEntity.relationships.length).toBe(1);

    // Remove the parent from the child
    childEntity.relationships = [];
    await Entities.update(childEntity);

    // Validate Entities
    parentEntity = await Entities.getOne(parentResult.data);
    if (_.isNull(parentEntity)) throw new Error();
    expect(parentEntity.relationships.length).toBe(0);

    childEntity = await Entities.getOne(entityResult.data);
    if (_.isNull(childEntity)) throw new Error();
    expect(childEntity.relationships.length).toBe(0);
  });

  it("should update Entity relationships from the parent", async () => {
    const entityResult: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create a child Entity
    const childResult: ResponseData<string> = await Entities.create({
      name: "ChildEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    const entity = await Entities.getOne(entityResult.data);
    if (_.isNull(entity)) throw new Error();

    // Add the child
    entity.relationships.push({
      target: {
        _id: childResult.data,
        name: "ChildEntity",
      },
      source: {
        _id: entityResult.data,
        name: "TestEntity",
      },
      type: "child",
    });
    await Entities.update(entity);

    // Get the updated child Entity and original parent Entity
    let updatedEntity: EntityModel | null = await Entities.getOne(
      entityResult.data,
    );
    if (_.isNull(updatedEntity)) throw new Error();

    let childEntity: EntityModel | null = await Entities.getOne(
      childResult.data,
    );
    if (_.isNull(childEntity)) throw new Error();

    // Validate Entities
    expect(updatedEntity.relationships.length).toBe(1);
    expect(childEntity.relationships.length).toBe(1);

    // Remove the Product
    updatedEntity.relationships = [];
    await Entities.update(updatedEntity);

    // Validate Entities
    updatedEntity = await Entities.getOne(entityResult.data);
    if (_.isNull(updatedEntity)) throw new Error();
    expect(updatedEntity.relationships.length).toBe(0);

    childEntity = await Entities.getOne(childResult.data);
    if (_.isNull(childEntity)) throw new Error();
    expect(childEntity.relationships.length).toBe(0);
  });

  it("should add an Attribute", async () => {
    // Start by creating an Entities
    const result: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    await Entities.addAttribute(result.data, {
      _id: "TestAttribute",
      archived: false,
      name: "Attribute_1",
      timestamp: dayjs(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Attribute description",
      values: [],
    });

    const entity: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(entity)) throw new Error();

    // Check that an Attribute exists and it has the correct ID
    expect(entity.attributes.length).toBe(1);
    expect(entity.attributes[0]._id).toBe("TestAttribute");
  });

  it("should remove an Attribute", async () => {
    // Start by creating an Entities
    const result: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [
        {
          _id: "a-test-remove",
          archived: false,
          name: "Attribute_1",
          timestamp: dayjs(Date.now()).toISOString(),
          owner: "henry.burgess@wustl.edu",
          description: "Test Attribute description",
          values: [],
        },
      ],
      attachments: [],
      history: [],
    });

    // Remove the Attribute from the Entity
    await Entities.removeAttribute(result.data, "a-test-remove");

    // Check that the Attribute has been removed
    const entity: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(entity)) throw new Error();
    expect(entity.attributes.length).toBe(0);
  });

  it("should update an Attribute", async () => {
    // Start by creating an Entity
    const result: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      relationships: [],
      attributes: [
        {
          _id: "TestAttribute",
          archived: false,
          name: "Test Attribute",
          owner: "henry.burgess@wustl.edu",
          timestamp: dayjs(Date.now()).toISOString(),
          description: "Test Attribute description",
          values: [],
        },
      ],
      attachments: [],
      history: [],
    });

    await Entities.updateAttribute(result.data, {
      _id: "TestAttribute",
      archived: false,
      name: "Test Attribute Updated",
      timestamp: dayjs(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Attribute updated",
      values: [],
    });

    const entity = await Entities.getByName("TestEntity");
    if (_.isNull(entity)) throw new Error();

    // Check that an Attribute has been updated
    expect(entity.attributes.length).toBe(1);
    expect(entity.attributes[0].name).toBe("Test Attribute Updated");
    expect(entity.attributes[0].description).toBe("Test Attribute updated");
  });

  it("should retrieve raw data for multiple entities", async () => {
    // Arrange: Create multiple entities
    await Entities.create({
      name: "TestProductEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Product",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create the second Entity (Origin) that has the first Entity (Product)
    await Entities.create({
      name: "TestOriginEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Origin",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    // Act: Retrieve raw data for created entities
    const entities = await Entities.all();

    // Assert: Raw data should include data for both Entities
    expect(entities.length).toBe(2);
    expect(
      entities[0].name.toString() == "TestProductEntity" ||
        entities[1].name.toString() == "TestProductEntity",
    ).toBeTruthy();
    expect(
      entities[0].name.toString() == "TestOriginEntity" ||
        entities[1].name.toString() == "TestOriginEntity",
    ).toBeTruthy();
  });

  it("should handle non-existent entity IDs gracefully", async () => {
    // Arrange: Non-existent entity IDs
    const fakeIds = ["noID_1", "noID_2"];

    // Act: Try to retrieve raw data for non-existent entities
    const rawData = await Entities.getMany(fakeIds);

    // Assert: Function should return an empty array or appropriate response
    expect(rawData.length).toBe(0);
  });

  it("should add a history entry to an existing Entity", async () => {
    const result: ResponseData<string> = await Entities.create({
      name: "Test Entity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Entity description",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    // Retrieve existing Entity state and use to create history entry
    const entity: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(entity)) throw new Error();
    await Entities.addHistory(entity, DEMO_USER_ORCID);

    // Get updated Entity and check that it contains history
    const updated: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(updated)) throw new Error();
    expect(updated.history.length).toBe(1);
  });

  it("should include history entry with prior Entity data when updated", async () => {
    const result: ResponseData<string> = await Entities.create({
      name: "Test Entity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Entity description",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });

    // Retrieve existing Entity state and use to create history entry
    const entity: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(entity)) throw new Error();
    await Entities.addHistory(entity, DEMO_USER_ORCID);

    // Get updated Entity and check that it contains expected history
    const updated: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(updated)) throw new Error();
    expect(updated.history.length).toBe(1);
    expect(updated.history.pop()?.description).toBe("Test Entity description");
  });

  it("should archive an Entity", async () => {
    const result: ResponseData<string> = await Entities.create({
      name: "Test Entity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Entity description",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });
    expect(result.success).toBeTruthy();

    // Archive the Entity and validate it has been archived
    await Entities.setArchived(result.data, true);

    const entity: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(entity)) throw new Error("Entity is null");
    expect(entity.archived).toBeTruthy();
  });

  it("should restore an Entity", async () => {
    const result: ResponseData<string> = await Entities.create({
      name: "Test Entity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Entity description",
      projects: [],
      relationships: [],
      attributes: [],
      attachments: [],
      history: [],
    });
    expect(result.success).toBeTruthy();

    // Archive the Entity and validate it has been archived
    await Entities.setArchived(result.data, true);
    const entity: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(entity)) throw new Error();
    expect(entity.archived).toBeTruthy();

    // Restore the Entity and validate it has been restored
    await Entities.setArchived(result.data, false);

    const restored: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(restored)) throw new Error("Entity is null");
    expect(restored.archived).toBeFalsy();
  });
});
