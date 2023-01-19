// Libraries
import express from "express";
import consola from "consola";
import { ObjectId } from "mongodb";
import _ from "underscore";

// Import types from the client to enforce structure
import {
  EntityModel,
  EntityStruct,
} from "../../types";

// Utility functions
import { getDatabase } from "../database/connection";
import { registerUpdate } from "../database/operations/Updates";
import { Entities } from "../database/operations/Entities";

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
  Entities.addOne(request.body).then((entity: EntityModel) => {
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
  // Extract data from the request
  let entityRequest: EntityModel = {
    _id: request.body._id,
    name: request.body.name,
    created: request.body.created,
    owner: request.body.owner,
    description: request.body.description,
    collections: request.body.collections,
    associations: {
      origin: request.body.associations.origin,
      products: request.body.associations.products,
    },
    attributes: request.body.attributes,
  };

  let entityResult: EntityModel;
  const entityQuery = { _id: new ObjectId(entityRequest._id) };
  getDatabase()
    .collection(ENTITIES_COLLECTION)
    .findOne(entityQuery, (error: any, result: any) => {
      if (error) throw error;
      entityResult = result;

      // Apply ID field to allow direct comparison
      entityResult._id = entityRequest._id;

      // Construct to track required changes
      const toUpdate = {
        name: false,
        description: false,
        collections: false,
        associations: {
          origin: false,
          products: false,
        },
        attributes: false,
      };

      // Overall equality check
      if (_.isEqual(entityRequest, entityResult)) {
        consola.success("No changes to Entity:", entityRequest.name);
      }
      if (!_.isEqual(entityRequest.name, entityResult.name)) {
        toUpdate.name = true;
      }
      if (!_.isEqual(entityRequest.description, entityResult.description)) {
        toUpdate.description = true;
      }

      // Update the Entity to use the received values
      const entityUpdates = {
        $set: {
          name: entityRequest.name,
          description: entityRequest.description,
          collections: entityRequest.collections,
          associations: {
            origin: entityRequest.associations.origin,
            products: entityRequest.associations.products,
          },
          attributes: entityRequest.attributes,
        },
      };

      // If there are changes to the products or collections, we need to update those
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .updateOne(
          entityQuery,
          entityUpdates,
          (error: any, response: any) => {
            if (error) throw error;
            consola.success("Updated Entity:", entityRequest.name);
            registerUpdate({
              targets: {
                primary: {
                  type: "entities",
                  id: entityRequest._id,
                  name: entityRequest.name,
                },
              },
              operation: {
                timestamp: new Date(Date.now()),
                type: "modify",
              }
            });
          }
          );
        });

    // Respond
    response.json({
      id: entityRequest._id,
      name: entityRequest.name,
      status: "success"
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
