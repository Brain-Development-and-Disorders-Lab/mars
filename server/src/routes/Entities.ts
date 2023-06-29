// Libraries
import express from "express";
import _ from "lodash";

// Import types from the client to enforce structure
import { EntityModel, IEntity } from "@types";

// Utility functions
import { Entities } from "../operations/Entities";

const EntitiesRoute = express.Router();

// View all Entities
EntitiesRoute.route("/entities").get((_request: any, response: any) => {
  Entities.getAll().then((entities: EntityModel[]) => {
    response.json(entities);
  });
});

// View specific Entity
EntitiesRoute.route("/entities/:id").get((request: any, response: any) => {
  Entities.getOne(request.params.id).then((entity: EntityModel) => {
    response.json(entity);
  });
});

// Lock specific entity
EntitiesRoute.route("/entities/lock/:id").post((request: { body: { entity: { name: string, id: string }, lockState: boolean } }, response: any) => {
  Entities.setLock(request.body).then((entity: { name: string, id: string }) => {
    response.json(entity);
  });
});

// Get JSON-formatted data of the Entity
EntitiesRoute.route("/entities/export").post(
  (request: { body: { id: string; fields: string[], format: "json" | "csv" | "txt" } }, response: any) => {
    Entities.getData(request.body).then((path: string) => {
      response.setHeader("Content-Type", `application/${request.body.format}`);
      response.download(path, `export_${request.body.id}.${request.body.format}`);
    });
  }
);

// Create a new Entity, expects Entity data
EntitiesRoute.route("/entities/create").post(
  (request: { body: IEntity }, response: any) => {
    Entities.create(request.body).then((entity: EntityModel) => {
      response.json({
        id: entity._id,
        name: entity.name,
        status: "success",
      });
    });
  }
);

// Update an Entity
EntitiesRoute.route("/entities/update").post(
  (request: { body: EntityModel }, response: any) => {
    Entities.update(request.body).then((updatedEntity: EntityModel) => {
      response.json({
        id: updatedEntity._id,
        name: updatedEntity.name,
        status: "success",
      });
    });
  }
);

// Delete an Entity
EntitiesRoute.route("/entities/:id").delete(
  (request: { params: { id: string } }, response: any) => {
    Entities.delete(request.params.id).then((entity) => {
      response.json({
        id: entity._id,
        name: entity.name,
        status: "success",
      });
    });
  }
);

export default EntitiesRoute;
