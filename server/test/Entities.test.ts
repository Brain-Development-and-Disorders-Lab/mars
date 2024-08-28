// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Entities model and types
import { EntityModel } from "../../types";
import { Entities } from "../src/models/Entities";
import { Projects } from "../src/models/Projects";

// Database connectivity
import { connect, disconnect } from "../src/connectors/database";
import { clearDatabase, setupWorkspace } from "./util";
import { isNull } from "lodash";

describe("Entity model", () => {
  let workspace = ""; // Workspace identifier used in all tests

  beforeEach(async () => {
    // Connect to the database
    await connect();

    // Clear the database prior to running tests
    await clearDatabase();

    // Create a new Workspace environment to bypass requirement
    workspace = await setupWorkspace();
  });

  // Teardown after each test
  afterEach(async () => {
    // Clear the database after each test
    await clearDatabase();
    await disconnect();
  });

  it("should return 1 Entity with a new Workspace", async () => {
    const result = await Entities.all();
    expect(result.length).toBe(1);
  });

  it("should create a basic Entity", async () => {
    const result = await Entities.create(
      {
        name: "TestEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );
    expect(result.success).toBeTruthy();

    const entity: EntityModel | null = await Entities.getByName("TestEntity");
    expect(entity).not.toBeNull();
  });

  it("should create an association between two Entities when an Origin is specified in a Product", async () => {
    // Create the first Entity
    await Entities.create(
      {
        name: "TestOriginEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    // Confirm Origin Entity creation
    let originEntity: EntityModel | null =
      await Entities.getByName("TestOriginEntity");
    if (isNull(originEntity)) throw new Error();

    // Create the second Entity (Product) that has the first Entity (Origin)
    await Entities.create(
      {
        name: "TestProductEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
        owner: "henry.burgess@wustl.edu",
        description: "Test Product",
        projects: [],
        associations: {
          origins: [{ name: "TestOriginEntity", _id: originEntity._id }],
          products: [],
        },
        attributes: [],
        attachments: [],
        history: [],
      },
      workspace,
    );

    // Confirm Product Entity creation
    const productEntity: EntityModel | null =
      await Entities.getByName("TestProductEntity");
    if (isNull(productEntity)) throw new Error();

    // Refresh Origin Entity
    originEntity = await Entities.getByName("TestOriginEntity");
    if (isNull(originEntity)) throw new Error();

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
    await Entities.create(
      {
        name: "TestProductEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    const productEntity: EntityModel | null =
      await Entities.getByName("TestProductEntity");
    if (isNull(productEntity)) throw new Error();

    // Create the second Entity (Origin) that has the first Entity (Product)
    await Entities.create(
      {
        name: "TestOriginEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
        owner: "henry.burgess@wustl.edu",
        description: "Test Origin",
        projects: [],
        associations: {
          origins: [],
          products: [{ name: "TestProductEntity", _id: productEntity._id }],
        },
        attributes: [],
        attachments: [],
        history: [],
      },
      workspace,
    );

    const originEntity: EntityModel | null =
      await Entities.getByName("TestOriginEntity");
    if (isNull(originEntity)) throw new Error();

    // Retrieve the Product Entity associated with the Origin Entity
    const retrievedProductEntity = await Entities.getOne(
      originEntity.associations.products[0]._id,
    );
    if (isNull(retrievedProductEntity)) throw new Error();

    // Check the Product of the Origin
    expect(originEntity.associations.products.length).toBe(1);
    expect(originEntity.associations.products[0]._id).toStrictEqual(
      productEntity._id,
    );

    // Check the Origin of the Product
    expect(retrievedProductEntity.associations.origins.length).toBe(1);
    expect(retrievedProductEntity.associations.origins[0]._id).toStrictEqual(
      originEntity._id,
    );
  });

  it("should create an association between two Entities when a Product is specified in an Origin", async () => {
    // Create the first Entity (Product)
    await Entities.create(
      {
        name: "TestProductEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    const productEntity: EntityModel | null =
      await Entities.getByName("TestProductEntity");
    if (isNull(productEntity)) throw new Error();

    // Create the second Entity (Origin) that has the first Entity (Product)
    await Entities.create(
      {
        name: "TestOriginEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
        owner: "henry.burgess@wustl.edu",
        description: "Test Origin",
        projects: [],
        associations: {
          origins: [],
          products: [{ name: productEntity.name, _id: productEntity._id }],
        },
        attributes: [],
        attachments: [],
        history: [],
      },
      workspace,
    );

    const originEntity: EntityModel | null =
      await Entities.getByName("TestOriginEntity");
    if (isNull(originEntity)) throw new Error();
    expect(originEntity.associations.products.length).toBe(1);

    // Retrieve the Product Entity associated with the Origin Entity
    const retrievedProductEntity: EntityModel | null = await Entities.getOne(
      originEntity.associations.products[0]._id,
    );
    if (isNull(retrievedProductEntity)) throw new Error();

    // Check the Product of the Origin
    expect(originEntity.associations.products[0]._id).toStrictEqual(
      productEntity._id,
    );

    // Check the Origin of the Product
    expect(retrievedProductEntity.associations.origins.length).toBe(1);
    expect(retrievedProductEntity.associations.origins[0]._id).toStrictEqual(
      originEntity._id,
    );
  });

  it("should create an Attribute", async () => {
    // Start by creating an Entity
    await Entities.create(
      {
        name: "TestEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
            name: "Attribute_1",
            description: "Test Attribute description",
            values: [],
          },
        ],
        attachments: [],
        history: [],
      },
      workspace,
    );

    const entity: EntityModel | null = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();

    // Check that an Attribute exists and it has the correct ID
    expect(entity.attributes.length).toBe(1);
    expect(entity.attributes[0]._id).toBe("TestAttribute");
  });

  it("should update the description", async () => {
    await Entities.create(
      {
        name: "TestEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    const entity: EntityModel | null = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();

    entity.description = "Updated";
    await Entities.update(entity, workspace);

    const updated: EntityModel | null = await Entities.getByName("TestEntity");
    if (isNull(updated)) throw new Error();

    expect(updated.description).toBe("Updated");
  });

  it("should update Project membership", async () => {
    await Entities.create(
      {
        name: "TestEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    let entity = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();

    // Create a Project
    await Projects.create(
      {
        name: "TestProject",
        created: new Date(Date.now()).toISOString(),
        owner: "henry.burgess@wustl.edu",
        description: "Test Project",
        entities: [],
        shared: [],
      },
      workspace,
    );

    let project = (await Projects.all())[0];
    if (isNull(project)) throw new Error();

    // Add the Entity to the Project
    await Entities.addProject(entity._id, project._id);
    await Projects.addEntity(project._id, entity._id);

    // Validate the Entity has the Project
    entity = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();
    expect(entity.projects.length).toBe(1);

    project = (await Projects.all())[0];
    if (isNull(project)) throw new Error();
    expect(project.entities.length).toBe(1);

    // Remove the Project from the Entity
    await Entities.removeProject(entity._id, project._id);
    await Projects.removeEntity(project._id, entity._id);

    // Validate the Entity no longer has the project
    entity = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();
    expect(entity.projects.length).toBe(0);

    project = (await Projects.all())[0];
    if (isNull(project)) throw new Error();
    expect(project.entities.length).toBe(0);
  });

  it("should update Origin associations", async () => {
    await Entities.create(
      {
        name: "TestEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    let entity = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();

    // Create an Origin
    await Entities.create(
      {
        name: "OriginEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    let originEntity = await Entities.getByName("OriginEntity");
    if (isNull(originEntity)) throw new Error();

    // Add the Origin
    entity.associations.origins.push({
      _id: originEntity._id,
      name: originEntity.name,
    });
    await Entities.update(entity, workspace);

    // Validate Entities
    entity = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();

    originEntity = await Entities.getByName("OriginEntity");
    if (isNull(originEntity)) throw new Error();

    expect(entity.associations.origins.length).toBe(1);
    expect(originEntity.associations.products.length).toBe(1);

    // Remove the Origin
    entity.associations.origins = [];
    await Entities.update(entity, workspace);

    // Validate Entities
    entity = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();
    expect(entity.associations.origins.length).toBe(0);

    originEntity = await Entities.getByName("OriginEntity");
    if (isNull(originEntity)) throw new Error();
    expect(originEntity.associations.products.length).toBe(0);
  });

  it("should update Product associations", async () => {
    await Entities.create(
      {
        name: "TestEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    let entity: EntityModel | null = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();

    // Create a Product
    await Entities.create(
      {
        name: "ProductEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    let productEntity: EntityModel | null =
      await Entities.getByName("ProductEntity");
    if (isNull(productEntity)) throw new Error();

    // Add the Product
    entity.associations.products.push({
      _id: productEntity._id,
      name: productEntity.name,
    });
    await Entities.update(entity, workspace);

    // Validate Entities
    entity = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();
    expect(entity.associations.products.length).toBe(1);

    productEntity = await Entities.getByName("ProductEntity");
    if (isNull(productEntity)) throw new Error();
    expect(productEntity.associations.origins.length).toBe(1);

    // Remove the Origin
    entity.associations.products = [];
    await Entities.update(entity, workspace);

    // Validate Entities
    entity = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();
    expect(entity.associations.products.length).toBe(0);

    productEntity = await Entities.getByName("ProductEntity");
    if (isNull(productEntity)) throw new Error();
    expect(productEntity.associations.origins.length).toBe(0);
  });

  it("should add an Attribute", async () => {
    // Start by creating an Entities
    await Entities.create(
      {
        name: "TestEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    let entity: EntityModel | null = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();

    await Entities.addAttribute(entity._id, {
      _id: "TestAttribute",
      name: "Attribute_1",
      description: "Test Attribute description",
      values: [],
    });

    entity = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();

    // Check that an Attribute exists and it has the correct ID
    expect(entity.attributes.length).toBe(1);
    expect(entity.attributes[0]._id).toBe("TestAttribute");
  });

  it("should remove an Attribute", async () => {
    // Start by creating an Entities
    await Entities.create(
      {
        name: "TestEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
            name: "Attribute_1",
            description: "Test Attribute description",
            values: [],
          },
        ],
        attachments: [],
        history: [],
      },
      workspace,
    );

    let entity: EntityModel | null = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();

    // Remove the Attribute from the Entity
    await Entities.removeAttribute(entity._id, "TestAttribute");

    entity = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();
    expect(entity.attributes.length).toBe(0);
  });

  it("should update an Attribute", async () => {
    // Start by creating an Entities
    await Entities.create(
      {
        name: "TestEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
            name: "Attribute_1",
            description: "Test Attribute description",
            values: [],
          },
        ],
        attachments: [],
        history: [],
      },
      workspace,
    );

    let entity: EntityModel | null = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();

    await Entities.updateAttribute(entity._id, {
      _id: "TestAttribute",
      name: "Attribute_2",
      description: "Test Attribute updated",
      values: [],
    });

    entity = await Entities.getByName("TestEntity");
    if (isNull(entity)) throw new Error();

    // Check that an Attribute has been preserved
    expect(entity.attributes.length).toBe(1);

    // Check that the Attribute has been updated
    expect(entity.attributes[0].name).toBe("Attribute_2");
    expect(entity.attributes[0].description).toBe("Test Attribute updated");
  });

  it("should retrieve raw data for multiple entities", async () => {
    // Arrange: Create multiple entities
    await Entities.create(
      {
        name: "TestProductEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    // Create the second Entity (Origin) that has the first Entity (Product)
    await Entities.create(
      {
        name: "TestOriginEntity",
        created: new Date(Date.now()).toISOString(),
        deleted: false,
        locked: false,
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
      },
      workspace,
    );

    // Act: Retrieve raw data for created entities
    const rawData = await Entities.all();

    // Assert: Raw data should include data for both Entities and demo Entity
    expect(rawData.length).toBe(3);
    expect(
      rawData[1].name.toString() == "TestProductEntity" ||
        rawData[2].name.toString() == "TestProductEntity",
    ).toBeTruthy();
    expect(
      rawData[1].name.toString() == "TestOriginEntity" ||
        rawData[2].name.toString() == "TestOriginEntity",
    ).toBeTruthy();
  });

  it("should handle non-existent entity IDs gracefully", async () => {
    // Arrange: Non-existent entity IDs
    const fakeIds = ["fakeId1", "fakeId2"];

    // Act: Try to retrieve raw data for non-existent entities
    const rawData = await Entities.getMany(fakeIds);

    // Assert: Function should return an empty array or appropriate response
    expect(rawData.length).toBe(0);
  });
});
