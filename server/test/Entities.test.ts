// .env configuration
import "dotenv/config";

// Jest imports
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";

// Entity operations and types
import { ProjectModel, EntityModel } from "../../types";
import { Entities } from "../src/operations/Entities";
import { Projects } from "../src/operations/Projects";

// Database connectivity
import {
  connectPrimary,
  disconnect,
  getDatabase,
} from "../src/database/connection";

// Connect to the database before each test
beforeEach(() => {
  return connectPrimary();
});

// Clear the database after each test
afterEach(() => {
  return Promise.all([
    getDatabase().collection("attributes").deleteMany({}),
    getDatabase().collection("projects").deleteMany({}),
    getDatabase().collection("entities").deleteMany({}),
    getDatabase().collection("activity").deleteMany({}),
  ]);
});

// Close the database connection after all tests
afterAll(() => {
  return disconnect();
});

describe("GET /entities", () => {
  it("should return 0 Entities with an empty database", async () => {
    const result = await Entities.getAll();
    expect(result.length).toBe(0);
  });
});

describe("POST /entities/create", () => {
  it("should create 1 basic Entity", async () => {
    const result = await Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()),
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

    expect(result.name).toBe("TestEntity");
  });

  it("should create an association between two Entities when an Origin is specified in a Product", async () => {
    // Create the first Entity
    const originEntity = await Entities.create({
      name: "TestOriginEntity",
      created: new Date(Date.now()).toISOString(),
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
    const productEntity = await Entities.create({
      name: "TestProductEntity",
      created: new Date(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Product",
      projects: [],
      associations: {
        origins: [{ name: originEntity.name, id: originEntity._id }],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
    });

    // Confirm Product Entity creation
    expect(productEntity.name).toBe("TestProductEntity");
    expect(productEntity.associations.origins.length).toBe(1);

    // Retrieve the Origin Entity associated with the Product Entity
    const retrievedOriginEntity = await Entities.getOne(productEntity.associations.origins[0].id);

    // Check the Origin of the Product
    expect(productEntity.associations.origins[0].id).toStrictEqual(originEntity._id);

    // Check the Product of the Origin
    expect(retrievedOriginEntity.associations.products.length).toBe(1);
    expect(retrievedOriginEntity.associations.products[0].id).toStrictEqual(productEntity._id);
  });

  it("should create an association between two Entities when a Product is specified in an Origin", async () => {
    // Create the first Entity (Product)
    const productEntity = await Entities.create({
      name: "TestProductEntity",
      created: new Date(Date.now()).toISOString(),
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
    const originEntity = await Entities.create({
      name: "TestOriginEntity",
      created: new Date(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Origin",
      projects: [],
      associations: {
        origins: [],
        products: [{ name: productEntity.name, id: productEntity._id }],
      },
      attributes: [],
      attachments: [],
      history: [],
    });
  
    // Confirm Origin Entity creation
    expect(originEntity.name).toBe("TestOriginEntity");
    expect(originEntity.associations.products.length).toBe(1);
  
    // Retrieve the Product Entity associated with the Origin Entity
    const retrievedProductEntity = await Entities.getOne(originEntity.associations.products[0].id);
  
    // Check the Product of the Origin
    expect(originEntity.associations.products[0].id).toStrictEqual(productEntity._id);
  
    // Check the Origin of the Product
    expect(retrievedProductEntity.associations.origins.length).toBe(1);
    expect(retrievedProductEntity.associations.origins[0].id).toStrictEqual(originEntity._id);
  });
  

  it("should create an association between two Entities when a Product is specified in an Origin", async () => {
    // Create the first Entity (Product)
    const productEntity = await Entities.create({
      name: "TestProductEntity",
      created: new Date(Date.now()).toISOString(),
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
    const originEntity = await Entities.create({
      name: "TestOriginEntity",
      created: new Date(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Origin",
      projects: [],
      associations: {
        origins: [],
        products: [{ name: productEntity.name, id: productEntity._id }],
      },
      attributes: [],
      attachments: [],
      history: [],
    });
  
    // Confirm Origin Entity creation
    expect(originEntity.name).toBe("TestOriginEntity");
    expect(originEntity.associations.products.length).toBe(1);
  
    // Retrieve the Product Entity associated with the Origin Entity
    const retrievedProductEntity = await Entities.getOne(originEntity.associations.products[0].id);
  
    // Check the Product of the Origin
    expect(originEntity.associations.products[0].id).toStrictEqual(productEntity._id);
  
    // Check the Origin of the Product
    expect(retrievedProductEntity.associations.origins.length).toBe(1);
    expect(retrievedProductEntity.associations.origins[0].id).toStrictEqual(originEntity._id);
  });
  
  it("should create an Attribute", async () => {
    // Start by creating an Entities
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()),
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
    }).then((result: EntityModel) => {
      // Check that an Attribute exists and it has the correct ID
      expect(result.attributes.length).toBe(1);
      expect(result.attributes[0]._id).toBe("TestAttribute");
    });
  });
});

describe("POST /entities/update", () => {
  it("should update the description", async () => {
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()).toISOString(),
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
    })
      .then((result: EntityModel) => {
        // Update the description
        result.description = "Updated";

        return Entities.update(result);
      })
      .then((result: EntityModel) => {
        expect(result.description).toBe("Updated");
      });
  });

  it("should update Project membership", async () => {
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()).toISOString(),
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
    })
      .then((result: EntityModel) => {
        // Create a Project
        return Promise.all([
          result,
          Projects.create({
            name: "TestProject",
            created: new Date(Date.now()).toISOString(),
            owner: "henry.burgess@wustl.edu",
            description: "Test Project",
            entities: [],
          }),
        ]);
      })
      .then((result: [EntityModel, ProjectModel]) => {
        // Update Entity to include Project
        result[0].projects.push(result[1]._id);

        return Promise.all([Entities.update(result[0]), result[1]]);
      })
      .then((result: [EntityModel, ProjectModel]) => {
        // Retrieve both the Entity and Project
        return Promise.all([
          Entities.getOne(result[0]._id),
          Projects.getOne(result[1]._id),
        ]);
      })
      .then((result: [EntityModel, ProjectModel]) => {
        // Check that the Entity stores membership to the Project
        expect(result[0].projects.length).toBe(1);
        expect(result[0].projects[0]).toStrictEqual(result[1]._id);

        // Check that the Project stores membership of the Entity
        // expect(result[1].entities.length).toBe(1);
        // expect(result[1].entities[0]).toStrictEqual(result[0]._id);

        return result;
      })
      .then((result: [EntityModel, ProjectModel]) => {
        // Update Entity to remove Project
        result[0].projects = [];

        return Promise.all([Entities.update(result[0]), result[1]]);
      })
      .then((result: [EntityModel, ProjectModel]) => {
        // Retrieve both the Entity and Project
        return Promise.all([
          Entities.getOne(result[0]._id),
          Projects.getOne(result[1]._id),
        ]);
      })
      .then((result: [EntityModel, ProjectModel]) => {
        // Check that the Entity has no membership to the Project
        expect(result[0].projects.length).toBe(0);

        // Check that the Project has no membership of the Entity
        expect(result[1].entities.length).toBe(0);
      });
  });

  it("should update Origin associations", async () => {
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()).toISOString(),
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
    })
      .then((result: EntityModel) => {
        // Create an Origin
        return Promise.all([
          result,
          Entities.create({
            name: "OriginEntity",
            created: new Date(Date.now()).toISOString(),
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
          }),
        ]);
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Update Entity to include Origin
        result[0].associations.origins.push({
          id: result[1]._id,
          name: result[1].name,
        });

        return Promise.all([Entities.update(result[0]), result[1]]);
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Retrieve both the Entity and Origin
        return Promise.all([
          Entities.getOne(result[0]._id),
          Entities.getOne(result[1]._id),
        ]);
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Check that the Entity stores an Origin
        expect(result[0].associations.origins.length).toBe(1);
        expect(result[0].associations.origins[0].id).toStrictEqual(
          result[1]._id
        );

        // Check that the Origin stores a Product
        expect(result[1].associations.products.length).toBe(1);
        expect(result[1].associations.products[0].id).toStrictEqual(
          result[0]._id
        );

        return result;
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Update Entity to remove Origin
        result[0].associations.origins = [];

        return Promise.all([Entities.update(result[0]), result[1]]);
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Retrieve both the Entity and Project
        return Promise.all([
          Entities.getOne(result[0]._id),
          Entities.getOne(result[1]._id),
        ]);
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Check that the Entity has no Origin
        expect(result[0].associations.origins.length).toBe(0);

        // Check that the Origin has no Product
        expect(result[1].associations.products.length).toBe(0);
      });
  });

  it("should update Product associations", async () => {
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()).toISOString(),
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
    })
      .then((result: EntityModel) => {
        // Create a Product
        return Promise.all([
          result,
          Entities.create({
            name: "ProductEntity",
            created: new Date(Date.now()).toISOString(),
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
          }),
        ]);
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Update Entity to include a Product
        result[0].associations.products.push({
          id: result[1]._id,
          name: result[1].name,
        });

        return Promise.all([Entities.update(result[0]), result[1]]);
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Retrieve both the Entity and Project
        return Promise.all([
          Entities.getOne(result[0]._id),
          Entities.getOne(result[1]._id),
        ]);
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Check that the Entity stores a Product
        expect(result[0].associations.products.length).toBe(1);
        expect(result[0].associations.products[0].id).toStrictEqual(
          result[1]._id
        );

        // Check that the Product stores an Origin
        expect(result[1].associations.origins.length).toBe(1);
        expect(result[1].associations.origins[0].id).toStrictEqual(
          result[0]._id
        );

        return result;
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Update Entity to remove Product
        result[0].associations.products = [];

        return Promise.all([Entities.update(result[0]), result[1]]);
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Retrieve both the Entity and Product
        return Promise.all([
          Entities.getOne(result[0]._id),
          Entities.getOne(result[1]._id),
        ]);
      })
      .then((result: [EntityModel, EntityModel]) => {
        // Check that the Entity has no Product
        expect(result[0].associations.products.length).toBe(0);

        // Check that the Product has no Origin
        expect(result[1].associations.origins.length).toBe(0);
      });
  });

  it("should add an Attribute", async () => {
    // Start by creating an Entities
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()),
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
    })
      .then((result: EntityModel) => {
        // Update Entity to add an Attribute
        return Entities.addAttribute(result._id, {
          _id: "TestAttribute",
          name: "Attribute_1",
          description: "Test Attribute description",
          values: [],
        });
      })
      .then((result: string) => {
        // Get the updated Entity
        return Entities.getOne(result);
      })
      .then((result: EntityModel) => {
        // Check that an Attribute exists and it has the correct ID
        expect(result.attributes.length).toBe(1);
        expect(result.attributes[0]._id).toBe("TestAttribute");
      });
  });

  it("should remove an Attribute", async () => {
    // Start by creating an Entities
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()),
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
    })
      .then((result: EntityModel) => {
        // Update Entity to remove an Attribute
        return Entities.removeAttribute(result._id, "TestAttribute");
      })
      .then((result: string) => {
        // Get the updated Entity
        return Entities.getOne(result);
      })
      .then((result: EntityModel) => {
        // Check that an Attribute has been removed
        expect(result.attributes.length).toBe(0);
      });
  });

  it("should update an Attribute", async () => {
    // Start by creating an Entities
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()),
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
    })
      .then((result: EntityModel) => {
        // Update Entity to remove an Attribute
        return Entities.updateAttribute(result._id, {
          _id: "TestAttribute",
          name: "Attribute_2",
          description: "Test Attribute updated",
          values: [],
        });
      })
      .then((result: string) => {
        // Get the updated Entity
        return Entities.getOne(result);
      })
      .then((result: EntityModel) => {
        // Check that an Attribute has been preserved
        expect(result.attributes.length).toBe(1);

        // Check that the Attribute has been updated
        expect(result.attributes[0].name).toBe("Attribute_2");
        expect(result.attributes[0].description).toBe("Test Attribute updated");
      });
  });
});

describe("getDataMultipleRaw", () => {
  it("should retrieve raw data for multiple entities", async () => {
    // Arrange: Create multiple entities
    const entity1 = await Entities.create({
      name: "TestProductEntity",
      created: new Date(Date.now()).toISOString(),
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
    const entity2 = await Entities.create({
      name: "TestOriginEntity",
      created: new Date(Date.now()).toISOString(),
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
    const rawData = await Entities.getDataMultipleRaw([entity1._id, entity2._id]);

    // Assert: Raw data should include data for both entities
    expect(rawData.length).toBe(2);
    expect(rawData[0]._id.toString() == entity1._id).toBeTruthy();
    expect(rawData[1]._id.toString() == entity2._id).toBeTruthy();
  });

  it("should handle non-existent entity IDs gracefully", async () => {
    // Arrange: Non-existent entity IDs
    const fakeIds = ["fakeId1", "fakeId2"];

    // Act: Try to retrieve raw data for non-existent entities
    const rawData = await Entities.getDataMultipleRaw(fakeIds);

    // Assert: Function should return an empty array or appropriate response
    expect(rawData.length).toBe(0);
  });
});

