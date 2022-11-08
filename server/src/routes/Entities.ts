// Libraries
import express from "express";
import consola from "consola";
import { ObjectId } from "mongodb";
import _ from "underscore";

// Import types from the client to enforce structure
import {
  EntityModel,
  EntityStruct,
} from "../../../client/types";

// Utility functions
import { getDatabase } from "../database/connection";
import { addEntity } from "../database/operations/Collections";
import { setOrigin, addProduct } from "../database/operations/Entities";

// Constants
const ENTITIES_COLLECTION = "entities";

const EntitiesRoute = express.Router();

// Route: View all Entities
EntitiesRoute.route("/entities").get((request: any, response: any) => {
  consola.debug("View all Entities:", "/entities");

  getDatabase()
    .collection(ENTITIES_COLLECTION)
    .find({})
    .toArray((error: any, result: any) => {
      if (error) throw error;
      response.json(result);
    });
});

// Route: View specific Entity
EntitiesRoute.route("/entities/:id").get((request: any, response: any) => {
  consola.debug("View Entity:", "/entities/" + request.params.id);

  const query = { _id: new ObjectId(request.params.id) };
  getDatabase()
    .collection(ENTITIES_COLLECTION)
    .findOne(query, (error: any, result: any) => {
      if (error) throw error;
      response.json(result);
    });
});

// Route: Create a new Entity, expects EntityStruct data
EntitiesRoute.route("/entities/create").post((request: { body: EntityStruct }, response: any) => {
    consola.debug("Create new Entity:", "/entities/create", '"' + request.body.name + '"');

    let entityData = {
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

    // Insert the new Entity
    getDatabase()
      .collection(ENTITIES_COLLECTION)
      .insertOne(entityData, (error: any, content: any) => {
        if (error) throw error;
        response.json(content);
      });

    // Retrieve the ID of the inserted Entity
    const insertedId = (entityData as EntityStruct & { _id: string })._id;

    // We need to apply the associations that have been specified
    if (entityData.associations.origin.id !== "") {
      addProduct(entityData.associations.origin.id, {
        name: entityData.name,
        id: insertedId,
      });
    } else if (entityData.associations.products.length > 0) {
      // Iterate over each product, setting their origin to the current Entity being added
      entityData.associations.products.forEach((product) => {
        setOrigin(product, {
          name: entityData.name,
          id: insertedId,
        });
      });
    }

    // We need to apply the collections that have been specified
    if (entityData.collections.length > 0) {
      consola.info("Collections specified, adding new Entity to each...");
      entityData.collections.map((collection) => {
        addEntity(collection, insertedId);
      });
    }
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
    getDatabase()
      .collection(ENTITIES_COLLECTION)
      .deleteOne(query, (error: any, content: any) => {
        if (error) throw error;
        consola.success("1 Entity deleted");
        response.json(content);
      });
  }
);

export default EntitiesRoute;
