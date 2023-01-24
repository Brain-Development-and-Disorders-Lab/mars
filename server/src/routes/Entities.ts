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
const ENTITIES_COLLECTION = "entities";

const EntitiesRoute = express.Router();

// Route: View all Entities
EntitiesRoute.route("/entities").get((request: any, response: any) => {
  Entities.getAll().then((entities: EntityStruct[]) => {
    response.json(entities);
  });
});

// Route: View specific Entity
EntitiesRoute.route("/entities/:id").get((request: any, response: any) => {
  Entities.getOne(request.params.id).then((entity: EntityStruct) => {
    response.json(entity);
  });
});

// Route: Create a new Entity, expects EntityStruct data
EntitiesRoute.route("/entities/create").post((request: { body: EntityStruct }, response: any) => {
  Entities.insert(request.body).then((entity: EntityModel) => {
      registerUpdate({
        targets: {
          primary: {
            type: "entities",
            id: entity._id,
            name: entity.name,
          },
        },
        operation: {
          timestamp: new Date(Date.now()),
          type: "add",
        }
      });

      response.json({
        id: entity._id,
        name: entity.name,
        status: "success",
      });
    });
  }
);

// Route: Update an Entity
EntitiesRoute.route("/entities/update").post((request: { body: EntityModel }, response: any) => {
  Entities.modify(request.body).then((updatedEntity: EntityModel) => {
    // Respond
    response.json({
      id: updatedEntity._id,
      name: updatedEntity.name,
      status: "success"
    });
  });
});

// Route: Remove an Entity
EntitiesRoute.route("/entities/:id").delete((request: { params: { id: any } }, response: any) => {
    consola.debug("Remove an Entity:", "/entities");

    let query = { _id: new ObjectId(request.params.id) };

    // Get the Entity data
    let entityResult: EntityModel;
    getDatabase()
      .collection(ENTITIES_COLLECTION)
      .findOne(query, (error: any, result: any) => {
        if (error) throw error;
        entityResult = result;
        response.json(result);
      });

    // Delete the Entity
    getDatabase()
      .collection(ENTITIES_COLLECTION)
      .deleteOne(query, (error: any, content: any) => {
        if (error) throw error;
        consola.success("1 Entity deleted");
        registerUpdate({
          targets: {
            primary: {
              type: "entities",
              id: entityResult._id,
              name: entityResult.name,
            },
          },
          operation: {
            timestamp: new Date(Date.now()),
            type: "remove",
          }
        });
        response.json(content);
      });
  }

  // To Do: Remove references to Entity.
);

export default EntitiesRoute;
