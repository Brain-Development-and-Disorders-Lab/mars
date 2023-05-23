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
import { CollectionModel, EntityModel } from "../../types";
import { Entities } from "../src/operations/Entities";

// Database connectivity
import { connect, disconnect, getDatabase } from "../src/database/connection";
import { Collections } from "../src/operations/Collections";

// Connect to the database before each test
beforeEach(() => {
  return connect();
});

// Clear the database after each test
afterEach(() => {
  return Promise.all([
    getDatabase().collection("attributes").deleteMany({}),
    getDatabase().collection("collections").deleteMany({}),
    getDatabase().collection("entities").deleteMany({}),
    getDatabase().collection("updates").deleteMany({}),
  ]);
});

// Close the database connection after all tests
afterAll(() => {
  return disconnect();
});

describe("GET /entities", () => {
  it("should return 0 Entities with an empty database", async () => {
    return Entities.getAll().then((result) => {
      expect(result.length).toBe(0);
    });
  });
});

describe("POST /entities/create", () => {
  it("should create 1 basic Entity", async () => {
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()),
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
    }).then((result: EntityModel) => {
      expect(result.name).toBe("TestEntity");
    });
  });

  it("should create an association between two Entities when an Origin is specified in a Product", async () => {
    // Start by creating the two Entities
    return Entities.create({
      name: "TestOriginEntity",
      created: new Date(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Origin",
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
    })
      .then((result: EntityModel) => {
        // Create a second Entity that is a Product of the initial Entity
        return Entities.create({
          name: "TestProductEntity",
          created: new Date(Date.now()).toISOString(),
          owner: "henry.burgess@wustl.edu",
          description: "Test Product",
          collections: [],
          associations: {
            origins: [
              {
                name: result.name,
                id: result._id,
              },
            ],
            products: [],
          },
          attributes: [],
        });
      })
      .then((entity: EntityModel) => {
        // Confirm Product Entity created before retrieving Origin Entity
        expect(entity.name).toBe("TestProductEntity");
        expect(entity.associations.origins.length).toBe(1);

        return Promise.all([
          entity,
          Entities.getOne(entity.associations.origins[0].id),
        ]);
      })
      .then((entities: EntityModel[]) => {
        const productEntity = entities[0];
        const originEntity = entities[1];

        // Check the Origin of the Product
        expect(productEntity.associations.origins.length).toBe(1);
        expect(productEntity.associations.origins[0].id).toStrictEqual(
          originEntity._id
        );

        // Check the Product of the Origin
        expect(originEntity.associations.products.length).toBe(1);
        expect(originEntity.associations.products[0].id).toStrictEqual(
          productEntity._id
        );
      });
  });

  it("should create an association between two Entities when a Product is specified in an Origin", async () => {
    // Start by creating the two Entities
    return Entities.create({
      name: "TestProductEntity",
      created: new Date(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Product",
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
    })
      .then((result: EntityModel) => {
        // Create a second Entity that is an Origin of the initial Entity
        return Entities.create({
          name: "TestOriginEntity",
          created: new Date(Date.now()).toISOString(),
          owner: "henry.burgess@wustl.edu",
          description: "Test Origin",
          collections: [],
          associations: {
            origins: [],
            products: [
              {
                name: result.name,
                id: result._id,
              },
            ],
          },
          attributes: [],
        });
      })
      .then((entity: EntityModel) => {
        // Confirm Origin Entity created before retrieving Product Entity
        expect(entity.name).toBe("TestOriginEntity");
        expect(entity.associations.products.length).toBe(1);

        return Promise.all([
          entity,
          Entities.getOne(entity.associations.products[0].id),
        ]);
      })
      .then((entities: EntityModel[]) => {
        const originEntity = entities[0];
        const productEntity = entities[1];

        // Check the Product of the Origin
        expect(originEntity.associations.products.length).toBe(1);
        expect(originEntity.associations.products[0].id).toStrictEqual(
          productEntity._id
        );

        // Check the Origin of the Product
        expect(productEntity.associations.origins.length).toBe(1);
        expect(productEntity.associations.origins[0].id).toStrictEqual(
          originEntity._id
        );
      });
  });

  it("should insert an Entity into a Collection if specified", async () => {
    // Start by creating the two Entities
    return Collections.create({
      name: "TestCollection",
      created: new Date(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Collection",
      entities: [],
    })
      .then((result: CollectionModel) => {
        // Create an Entity that is a member of the Collection
        return Entities.create({
          name: "TestEntity",
          created: new Date(Date.now()).toISOString(),
          owner: "henry.burgess@wustl.edu",
          description: "Test",
          collections: [result._id],
          associations: {
            origins: [],
            products: [],
          },
          attributes: [],
        });
      })
      .then((entity: EntityModel) => {
        // Confirm Entity created before retrieving Collection
        expect(entity.name).toBe("TestEntity");
        expect(entity.collections.length).toBe(1);

        return Promise.all([entity, Collections.getOne(entity.collections[0])]);
      })
      .then((entities: any[]) => {
        const entity: EntityModel = entities[0];
        const collection: CollectionModel = entities[1];

        // Check the Collection associated with the Entity
        expect(entity.collections.length).toBe(1);
        expect(entity.collections[0]).toStrictEqual(collection._id);

        // Check the Entity contained in the Collection
        expect(collection.entities.length).toBe(1);
        expect(collection.entities[0]).toStrictEqual(entity._id);
      });
  });

  it("should create an Attribute", async () => {
    // Start by creating an Entities
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()),
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [{
        _id: "TestAttribute",
        name: "Attribute_1",
        description: "Test Attribute description",
        parameters: [],
      }],
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
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
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

  it("should update Collection membership", async () => {
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
    })
      .then((result: EntityModel) => {
        // Create a Collection
        return Promise.all([
          result,
          Collections.create({
            name: "TestCollection",
            created: new Date(Date.now()).toISOString(),
            owner: "henry.burgess@wustl.edu",
            description: "Test Collection",
            entities: [],
          }),
        ]);
      })
      .then((result: [EntityModel, CollectionModel]) => {
        // Update Entity to include Collection
        result[0].collections.push(result[1]._id);

        return Promise.all([Entities.update(result[0]), result[1]]);
      })
      .then((result: [EntityModel, CollectionModel]) => {
        // Retrieve both the Entity and Collection
        return Promise.all([
          Entities.getOne(result[0]._id),
          Collections.getOne(result[1]._id),
        ]);
      })
      .then((result: [EntityModel, CollectionModel]) => {
        // Check that the Entity stores membership to the Collection
        expect(result[0].collections.length).toBe(1);
        expect(result[0].collections[0]).toStrictEqual(result[1]._id);

        // Check that the Collection stores membership of the Entity
        expect(result[1].entities.length).toBe(1);
        expect(result[1].entities[0]).toStrictEqual(result[0]._id);

        return result;
      })
      .then((result: [EntityModel, CollectionModel]) => {
        // Update Entity to remove Collection
        result[0].collections = [];

        return Promise.all([Entities.update(result[0]), result[1]]);
      })
      .then((result: [EntityModel, CollectionModel]) => {
        // Retrieve both the Entity and Collection
        return Promise.all([
          Entities.getOne(result[0]._id),
          Collections.getOne(result[1]._id),
        ]);
      })
      .then((result: [EntityModel, CollectionModel]) => {
        // Check that the Entity has no membership to the Collection
        expect(result[0].collections.length).toBe(0);

        // Check that the Collection has no membership of the Entity
        expect(result[1].entities.length).toBe(0);
      });
  });

  it("should update Origin associations", async () => {
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
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
            collections: [],
            associations: {
              origins: [],
              products: [],
            },
            attributes: [],
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
        // Retrieve both the Entity and Collection
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
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
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
            collections: [],
            associations: {
              origins: [],
              products: [],
            },
            attributes: [],
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
        // Retrieve both the Entity and Collection
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
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
    }).then((result: EntityModel) => {
      // Update Entity to add an Attribute
      return Entities.addAttribute(result._id, {
        _id: "TestAttribute",
        name: "Attribute_1",
        description: "Test Attribute description",
        parameters: [],
      });
    }).then((result: string) => {
      // Get the updated Entity
      return Entities.getOne(result);
    }).then((result: EntityModel) => {
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
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [{
        _id: "TestAttribute",
        name: "Attribute_1",
        description: "Test Attribute description",
        parameters: [],
      }],
    }).then((result: EntityModel) => {
      // Update Entity to remove an Attribute
      return Entities.removeAttribute(result._id, "TestAttribute");
    }).then((result: string) => {
      // Get the updated Entity
      return Entities.getOne(result);
    }).then((result: EntityModel) => {
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
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [{
        _id: "TestAttribute",
        name: "Attribute_1",
        description: "Test Attribute description",
        parameters: [],
      }],
    }).then((result: EntityModel) => {
      // Update Entity to remove an Attribute
      return Entities.updateAttribute(result._id, {
        _id: "TestAttribute",
        name: "Attribute_2",
        description: "Test Attribute updated",
        parameters: [],
      });
    }).then((result: string) => {
      // Get the updated Entity
      return Entities.getOne(result);
    }).then((result: EntityModel) => {
      // Check that an Attribute has been preserved
      expect(result.attributes.length).toBe(1);

      // Check that the Attribute has been updated
      expect(result.attributes[0].name).toBe("Attribute_2");
      expect(result.attributes[0].description).toBe("Test Attribute updated");
    });
  });
});
