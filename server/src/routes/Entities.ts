// Libraries
import express from "express";
import _ from "lodash";

// Import types from the client to enforce structure
import { EntityModel, IEntity } from "@types";

// Utility functions and libraries
import { Entities } from "../operations/Entities";
import { authenticate } from "src/util";
import dayjs from "dayjs";

const EntitiesRoute = express.Router();

// View all Entities
EntitiesRoute.route("/entities").get(authenticate, (_request: any, response: any) => {
  Entities.getAll().then((entities: EntityModel[]) => {
    response.json(entities);
  });
});

// View specific Entity
EntitiesRoute.route("/entities/:id").get(authenticate, (request: any, response: any) => {
  Entities.getOne(request.params.id).then((entity: EntityModel) => {
    response.json(entity);
  });
});

// Lock specific entity
EntitiesRoute.route("/entities/lock/:id").post(authenticate,
  (
    request: {
      body: { entity: { name: string; id: string }; lockState: boolean };
    },
    response: any
  ) => {
    Entities.setLock(request.body).then(
      (entity: { name: string; id: string }) => {
        response.json(entity);
      }
    );
  }
);

// Get formatted data of one Entity
EntitiesRoute.route("/entities/export/:id").post(authenticate,
  (
    request: {
      params: { id: string };
      body: { fields: string[]; format: "json" | "csv" | "txt" };
    },
    response: any
  ) => {
    Entities.getData(request.params.id, request.body).then((path: string) => {
      response.setHeader("Content-Type", `application/${request.body.format}`);
      response.download(
        path,
        `export_${request.params.id}.${request.body.format}`
      );
    });
  }
);

// Get formatted data of multiple Entities
EntitiesRoute.route("/entities/export").post(authenticate,
  (
    request: {
      body: { entities: string[]; };
    },
    response: any
  ) => {
    Entities.getDataMultiple(request.body.entities).then((path: string) => {
      response.setHeader("Content-Type", `application/csv`);
      response.download(
        path,
        `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.csv`
      );
    });
  }
);

// Create a new Entity, expects Entity data
EntitiesRoute.route("/entities/create").post(authenticate,
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
EntitiesRoute.route("/entities/update").post(authenticate,
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
EntitiesRoute.route("/entities/:id").delete(authenticate,
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
