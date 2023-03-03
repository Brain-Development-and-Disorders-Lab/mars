// .env configuration
import "dotenv/config";

// Jest imports
import { afterAll, afterEach, beforeEach, describe, expect, it } from "@jest/globals";

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

describe("POST /entities", () => {
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
    }).then((result: EntityModel) => {
        // Create a second Entity that is a Product of the initial Entity
        return Entities.create({
          name: "TestProductEntity",
          created: new Date(Date.now()).toISOString(),
          owner: "henry.burgess@wustl.edu",
          description: "Test Product",
          collections: [],
          associations: {
            origins: [{
              name: result.name,
              id: result._id,
            }],
            products: [],
          },
          attributes: [],
        });
      }).then((entity: EntityModel) => {
        // Confirm Product Entity created before retrieving Origin Entity
        expect(entity.name).toBe("TestProductEntity");
        expect(entity.associations.origins.length).toBe(1);

        return Promise.all([entity, Entities.getOne(entity.associations.origins[0].id)]);
      }).then((entities: EntityModel[]) => {
        const productEntity = entities[0];
        const originEntity = entities[1];

        // Check the Origin of the Product
        expect(productEntity.associations.origins.length).toBe(1);
        expect(productEntity.associations.origins[0].id).toStrictEqual(originEntity._id);

        // Check the Product of the Origin
        expect(originEntity.associations.products.length).toBe(1);
        expect(originEntity.associations.products[0].id).toStrictEqual(productEntity._id);
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
    }).then((result: EntityModel) => {
        // Create a second Entity that is an Origin of the initial Entity
        return Entities.create({
          name: "TestOriginEntity",
          created: new Date(Date.now()).toISOString(),
          owner: "henry.burgess@wustl.edu",
          description: "Test Origin",
          collections: [],
          associations: {
            origins: [],
            products: [{
              name: result.name,
              id: result._id,
            }],
          },
          attributes: [],
        });
      }).then((entity: EntityModel) => {
        // Confirm Origin Entity created before retrieving Product Entity
        expect(entity.name).toBe("TestOriginEntity");
        expect(entity.associations.products.length).toBe(1);

        return Promise.all([entity, Entities.getOne(entity.associations.products[0].id)]);
      }).then((entities: EntityModel[]) => {
        const originEntity = entities[0];
        const productEntity = entities[1];

        // Check the Product of the Origin
        expect(originEntity.associations.products.length).toBe(1);
        expect(originEntity.associations.products[0].id).toStrictEqual(productEntity._id);

        // Check the Origin of the Product
        expect(productEntity.associations.origins.length).toBe(1);
        expect(productEntity.associations.origins[0].id).toStrictEqual(originEntity._id);
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
    }).then((result: CollectionModel) => {
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
      }).then((entity: EntityModel) => {
        // Confirm Entity created before retrieving Collection
        expect(entity.name).toBe("TestEntity");
        expect(entity.collections.length).toBe(1);

        return Promise.all([entity, Collections.getOne(entity.collections[0])]);
      }).then((entities: any[]) => {
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
});