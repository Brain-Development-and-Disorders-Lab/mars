// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Entities model and types
import { EntityModel, ProjectModel, ResponseData } from "../../types";
import { Entities } from "../src/models/Entities";
import { Projects } from "../src/models/Projects";

import dayjs from "dayjs";

// Database connectivity
import { connect, disconnect } from "../src/connectors/database";
import { clearDatabase } from "./util";
import _ from "lodash";

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
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });
    expect(result.success).toBeTruthy();

    const entity: EntityModel | null = await Entities.getOne(result.data);
    expect(entity).not.toBeNull();
  });

  it("should create an association between two Entities when an Origin is specified in a Product", async () => {
    // Create the first Entity
    const originResult: ResponseData<string> = await Entities.create({
      name: "TestOriginEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Origin",
      projects: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create the second Entity (Product) that has the first Entity (Origin)
    const productResult: ResponseData<string> = await Entities.create({
      name: "TestProductEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Product",
      projects: [],
      associations: {
        origins: [{ name: "TestOriginEntity", _id: originResult.data }],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    // Refresh Origin Entity
    const originEntity: EntityModel | null = await Entities.getOne(
      originResult.data,
    );
    if (_.isNull(originEntity)) throw new Error();

    // Confirm Product Entity creation
    const productEntity: EntityModel | null = await Entities.getOne(
      productResult.data,
    );
    if (_.isNull(productEntity)) throw new Error();

    // Check the Origin of the Product
    expect(productEntity.associations.origins.length).toBe(1);
    expect(productEntity.associations.origins[0]._id).toStrictEqual(
      originEntity._id,
    );

    // Check the Product of the Origin
    expect(originEntity.associations.products.length).toBe(1);
    expect(originEntity.associations.products[0]._id).toStrictEqual(
      productEntity._id,
    );
  });

  it("should create an association between two Entities when a Product is specified in an Origin", async () => {
    // Create the first Entity (Product)
    const productResult: ResponseData<string> = await Entities.create({
      name: "TestProductEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Product",
      projects: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create the second Entity (Origin) that has the first Entity (Product)
    const originResult: ResponseData<string> = await Entities.create({
      name: "TestOriginEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Origin",
      projects: [],
      associations: {
        origins: [],
        products: [{ name: "TestProductEntity", _id: productResult.data }],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    const originEntity: EntityModel | null = await Entities.getOne(
      originResult.data,
    );
    if (_.isNull(originEntity)) throw new Error();

    const productEntity: EntityModel | null = await Entities.getOne(
      productResult.data,
    );
    if (_.isNull(productEntity)) throw new Error();

    // Check the Product of the Origin
    expect(originEntity.associations.products.length).toBe(1);
    expect(originEntity.associations.products[0]._id).toStrictEqual(
      productEntity._id,
    );

    // Check the Origin of the Product
    expect(productEntity.associations.origins.length).toBe(1);
    expect(productEntity.associations.origins[0]._id).toStrictEqual(
      originEntity._id,
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
      associations: {
        origins: [],
        products: [],
      },
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
      associations: {
        origins: [],
        products: [],
      },
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
      associations: {
        origins: [],
        products: [],
      },
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

    // Remove the Project from the Entity
    // await Entities.removeProject(entity._id, project._id);
    // await Projects.removeEntity(project._id, entity._id);

    // // Validate the Entity no longer has the project
    // entity = await Entities.getByName("TestEntity");
    // if (_.isNull(entity)) throw new Error();
    // expect(entity.projects.length).toBe(0);

    // project = (await Projects.all())[0];
    // if (_.isNull(project)) throw new Error();
    // expect(project.entities.length).toBe(0);
  });

  it("should update Project membership when removed", async () => {
    const entityResult: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      associations: {
        origins: [],
        products: [],
      },
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

  it("should update Origin associations", async () => {
    const entityResult: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create an Origin
    const originResult: ResponseData<string> = await Entities.create({
      name: "OriginEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    // Add the Origin
    const entity = await Entities.getOne(entityResult.data);
    if (_.isNull(entity)) throw new Error();
    entity.associations.origins.push({
      _id: originResult.data,
      name: "OriginEntity",
    });
    await Entities.update(entity);

    // Get the updated Origin Entity and original Entity
    let originEntity: EntityModel | null = await Entities.getOne(
      originResult.data,
    );
    if (_.isNull(originEntity)) throw new Error();

    let updatedEntity: EntityModel | null = await Entities.getOne(
      entityResult.data,
    );
    if (_.isNull(updatedEntity)) throw new Error();

    // Validate Entities
    expect(originEntity.associations.products.length).toBe(1);
    expect(updatedEntity.associations.origins.length).toBe(1);

    // Remove the Origin
    updatedEntity.associations.origins = [];
    await Entities.update(updatedEntity);

    // Validate Entities
    originEntity = await Entities.getOne(originResult.data);
    if (_.isNull(originEntity)) throw new Error();
    expect(originEntity.associations.products.length).toBe(0);

    updatedEntity = await Entities.getOne(entityResult.data);
    if (_.isNull(updatedEntity)) throw new Error();
    expect(updatedEntity.associations.origins.length).toBe(0);
  });

  it("should update Product associations", async () => {
    const entityResult: ResponseData<string> = await Entities.create({
      name: "TestEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create a Product
    const productResult: ResponseData<string> = await Entities.create({
      name: "ProductEntity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      projects: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    // Add the Product
    const entity = await Entities.getOne(entityResult.data);
    if (_.isNull(entity)) throw new Error();
    entity.associations.products.push({
      _id: productResult.data,
      name: "ProductEntity",
    });
    await Entities.update(entity);

    // Get the updated Product Entity and original Entity
    let productEntity: EntityModel | null = await Entities.getOne(
      productResult.data,
    );
    if (_.isNull(productEntity)) throw new Error();

    let updatedEntity: EntityModel | null = await Entities.getOne(
      entityResult.data,
    );
    if (_.isNull(updatedEntity)) throw new Error();

    // Validate Entities
    expect(productEntity.associations.origins.length).toBe(1);
    expect(updatedEntity.associations.products.length).toBe(1);

    // Remove the Product
    updatedEntity.associations.products = [];
    await Entities.update(updatedEntity);

    // Validate Entities
    productEntity = await Entities.getOne(productResult.data);
    if (_.isNull(productEntity)) throw new Error();
    expect(productEntity.associations.products.length).toBe(0);

    updatedEntity = await Entities.getOne(entityResult.data);
    if (_.isNull(updatedEntity)) throw new Error();
    expect(updatedEntity.associations.origins.length).toBe(0);
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
      associations: {
        origins: [],
        products: [],
      },
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
      associations: {
        origins: [],
        products: [],
      },
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
      associations: {
        origins: [],
        products: [],
      },
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
      associations: {
        origins: [],
        products: [],
      },
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
      associations: {
        origins: [],
        products: [],
      },
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
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    // Retrieve existing Entity state and use to create history entry
    const entity: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(entity)) throw new Error();
    await Entities.addHistory(entity);

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
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    // Retrieve existing Entity state and use to create history entry
    const entity: EntityModel | null = await Entities.getOne(result.data);
    if (_.isNull(entity)) throw new Error();
    await Entities.addHistory(entity);

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
      associations: {
        origins: [],
        products: [],
      },
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
      associations: {
        origins: [],
        products: [],
      },
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

  it("should delete an Entity with Origins, Products, and Project membership", async () => {
    // Create a base Entity
    const entityResult: ResponseData<string> = await Entities.create({
      name: "Test Entity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Test Entity description",
      projects: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    // Create a Origin Entity
    const originResult: ResponseData<string> = await Entities.create({
      name: "Origin Entity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Origin Entity description",
      projects: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });
    await Entities.addOrigin(entityResult.data, {
      _id: originResult.data,
      name: "Origin Entity",
    });

    // Create a Product Entity
    const productResult: ResponseData<string> = await Entities.create({
      name: "Product Entity",
      created: dayjs(Date.now()).toISOString(),
      archived: false,
      owner: "henry.burgess@wustl.edu",
      description: "Product Entity description",
      projects: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });
    await Entities.addProduct(entityResult.data, {
      _id: productResult.data,
      name: "Product Entity",
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
    await Entities.addProject(entityResult.data, projectResult.data);

    // Delete the Entity
    await Entities.delete(entityResult.data);

    // Validate the Origin, Product, and Project have no association with the Entity
    const updatedOrigin: EntityModel | null = await Entities.getOne(
      originResult.data,
    );
    if (_.isNull(updatedOrigin)) throw new Error();
    expect(updatedOrigin.associations.products.length).toBe(0);
    const updatedProduct: EntityModel | null = await Entities.getOne(
      productResult.data,
    );
    if (_.isNull(updatedProduct)) throw new Error();
    expect(updatedProduct.associations.origins.length).toBe(0);
    const updatedProject: ProjectModel | null = await Projects.getOne(
      projectResult.data,
    );
    if (_.isNull(updatedProject)) throw new Error();
    expect(updatedProject.entities.length).toBe(0);
  });
});
