// Libraries
import express from "express";
import consola from "consola";
import { ObjectId } from "mongodb";
import _ from "underscore";

// Import types from the client to enforce structure
import { EntityModel, EntityStruct } from "@types";

// Utility functions
import { getDatabase } from "../database/connection";
import { registerUpdate } from "../operations/Updates";
import { Entities } from "../operations/Entities";

// Constants
const ENTITIES = "entities";

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

// Create a new Entity, expects EntityStruct data
EntitiesRoute.route("/entities/create").post((request: { body: EntityStruct }, response: any) => {
  Entities.create(request.body).then((entity: EntityModel) => {
    response.json({
      id: entity._id,
      name: entity.name,
      status: "success",
    });
  });
});

// Update an Entity
EntitiesRoute.route("/entities/update").post((request: { body: EntityModel }, response: any) => {
  Entities.update(request.body).then((updatedEntity: EntityModel) => {
    response.json({
      id: updatedEntity._id,
      name: updatedEntity.name,
      status: "success"
    });
  });
});

// Delete an Entity
EntitiesRoute.route("/entities/:id").delete((request: { params: { id: string } }, response: any) => {
  getDatabase()
    .collection(ENTITIES)
    .findOne({ _id: new ObjectId(request.params.id) }, (error: any, result: any) => {
      if (error) {
        throw error;
      }

      // Remove the Entity from all Collections

      // Remove the Entity as a product of the listed Origin

      // Delete the Entity
      getDatabase()
        .collection(ENTITIES)
        .deleteOne({ _id: new ObjectId(request.params.id) }, (error: any, content: any) => {
          if (error) {
            throw error;
          }
          response.json(content);
      });
    });
});

export default EntitiesRoute;
