// Libraries
import express from "express";

// Custom types
import { AttributeModel, Attribute } from "@types";

// Operations
import { Attributes } from "../operations/Attributes";

const AttributesRoute = express.Router();

// Route: View all attributes
AttributesRoute.route("/attributes").get((_request: any, response: any) => {
  Attributes.getAll().then((attributes: AttributeModel[]) => {
    response.json(attributes);
  });
});

// Route: View a specific attribute
AttributesRoute.route("/attributes/:id").get((request: any, response: any) => {
  Attributes.getOne(request.params.id).then((attribute: AttributeModel) => {
    response.json(attribute);
  });
});

// Route: Create a new Attribute, expects Attribute data
AttributesRoute.route("/attributes/create").post(
  (request: { body: Attribute }, response: any) => {
    Attributes.create(request.body).then((attribute: AttributeModel) => {
      response.json({
        id: attribute._id,
        name: attribute.name,
        status: "success",
      });
    });
  }
);

// Route: Update an Attribute
AttributesRoute.route("/attributes/update").post(
  (request: { body: AttributeModel }, response: any) => {
    Attributes.update(request.body).then(
      (updateAttribute: AttributeModel) => {
        response.json({
          id: updateAttribute._id,
          name: updateAttribute.name,
          status: "success",
        });
      }
    );
  }
);

// Route: Remove an Attribute
AttributesRoute.route("/attributes/:id").delete((request: any,response: { json: (content: any) => void }) => {
  Attributes.delete(request.params.id).then((attribute: AttributeModel) => {
    response.json({
      id: attribute._id,
      name: attribute.name,
      status: "success",
    });
  });
});

export default AttributesRoute;
