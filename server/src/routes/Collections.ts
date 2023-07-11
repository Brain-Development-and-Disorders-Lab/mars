// Libraries
import express from "express";
import _ from "lodash";

// Database connection
import { CollectionModel, ICollection } from "@types";

// Operations
import { Collections } from "../operations/Collections";

const CollectionsRoute = express.Router();

// View all Collections
CollectionsRoute.route("/collections").get((_request: any, response: any) => {
  Collections.getAll().then((collections: CollectionModel[]) => {
    response.json(collections);
  });
});

// View a specific Collection
CollectionsRoute.route("/collections/:id").get(
  (request: any, response: any) => {
    Collections.getOne(request.params.id).then(
      (collection: CollectionModel) => {
        response.json(collection);
      }
    );
  }
);

// Create a new Collection, expects Collection data
CollectionsRoute.route("/collections/create").post(
  (request: { body: ICollection }, response: any) => {
    Collections.create(request.body).then((collection: CollectionModel) => {
      response.json({
        id: collection._id,
        name: collection.name,
        status: "success",
      });
    });
  }
);

/**
 * Route: Add an Entity to a Collection, expects Entity and Collection ID data.
 */
CollectionsRoute.route("/collections/add").post(
  (
    request: { body: { collection: string; entity: string } },
    response: any
  ) => {
    Collections.addEntity(request.body.collection, request.body.entity).then(
      (entity) => {
        response.json({
          id: entity,
          status: "success",
        });
      }
    );
  }
);

// Route: Update a Collection
CollectionsRoute.route("/collections/update").post(
  (request: { body: CollectionModel }, response: any) => {
    Collections.update(request.body).then(
      (updatedCollection: CollectionModel) => {
        response.json({
          id: updatedCollection._id,
          name: updatedCollection.name,
          status: "success",
        });
      }
    );
  }
);

// Get JSON-formatted data of the Entity
CollectionsRoute.route("/collections/export").post(
  (
    request: {
      body: { id: string; fields: string[]; format: "json" | "csv" | "txt" };
    },
    response: any
  ) => {
    Collections.getData(request.body).then((path: string) => {
      response.setHeader("Content-Type", `application/${request.body.format}`);
      response.download(
        path,
        `export_${request.body.id}.${request.body.format}`
      );
    });
  }
);

/**
 * Route: Remove an Entity from a Collection, expects Entity and Collection ID data.
 */
CollectionsRoute.route("/collections/remove").post(
  (
    request: { body: { entity: string; collection: string } },
    response: any
  ) => {
    Collections.removeEntity(request.body.collection, request.body.entity).then(
      (collection) => {
        response.json({
          id: collection,
          name: collection,
          status: "success",
        });
      }
    );
  }
);

// Route: Remove a Collection
CollectionsRoute.route("/collections/:id").delete(
  (request: { params: { id: any } }, response: any) => {
    Collections.delete(request.params.id).then((collection) => {
      response.json({
        id: collection._id,
        name: collection.name,
        status: "success",
      });
    });
  }
);

export default CollectionsRoute;
