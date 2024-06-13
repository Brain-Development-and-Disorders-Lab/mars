// Libraries
import express from "express";

// Custom types
import { AttributeModel, IAttribute } from "@types";

// Operations
import { Attributes } from "../operations/Attributes";

// Utility functions and libraries
import { restAuthenticationWrapper } from "../middleware/Authentication";
import _ from "lodash";

// Middleware to check attribute ownership
export const checkAttributeOwnership = async (
  req: any,
  res: any,
  next: any,
) => {
  let userId = req?.user?._id; // Assuming user info is attached to req.user
  const attributeId = req.params.id || req.body._id; // Get attribute ID from route params or request body

  if (_.isEqual(process.env.NODE_ENV, "development")) {
    userId = "XXXX-1234-ABCD-0000";
    req.user = { _id: userId };
  }

  try {
    const attribute = await Attributes.getOne(attributeId);
    if (!attribute) {
      return res.status(404).json({ message: "Attribute not found." });
    }

    // Check if the user is the owner of the project or has permission
    // This part depends on your application's permission model
    const isAuthorized = attribute.owner === userId;
    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this attribute." });
    }

    // If checks pass, proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error checking attribute permission:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const AttributesRoute = express.Router();

// Route: View all attributes
AttributesRoute.route("/attributes").get(
  restAuthenticationWrapper,
  (_request: any, response: any) => {
    Attributes.getAll().then((attributes: AttributeModel[]) => {
      response.json(
        attributes.filter(
          (attribute) => attribute?.owner === _request.user._id,
        ),
      );
    });
  },
);

// Route: View a specific attribute
AttributesRoute.route("/attributes/:id").get(
  restAuthenticationWrapper,
  checkAttributeOwnership,
  (request: any, response: any) => {
    Attributes.getOne(request.params.id).then((attribute: AttributeModel) => {
      response.json(attribute);
    });
  },
);

// Route: Create a new Attribute, expects Attribute data
AttributesRoute.route("/attributes/create").post(
  restAuthenticationWrapper,
  (request: { body: IAttribute; user: any }, response: any) => {
    if (!request?.user) {
      return response
        .status(400)
        .json({ message: "Attribute data not provided." });
    }
    Attributes.create({ ...request.body, owner: request.user._id }).then(
      (attribute: AttributeModel) => {
        response.json({
          id: attribute._id,
          name: attribute.name,
          status: "success",
        });
      },
    );
  },
);

// Route: Update an Attribute
AttributesRoute.route("/attributes/update").post(
  restAuthenticationWrapper,
  checkAttributeOwnership,
  (request: { body: AttributeModel }, response: any) => {
    Attributes.update(request.body).then((updateAttribute: AttributeModel) => {
      response.json({
        id: updateAttribute._id,
        name: updateAttribute.name,
        status: "success",
      });
    });
  },
);

// Route: Remove an Attribute
AttributesRoute.route("/attributes/:id").delete(
  restAuthenticationWrapper,
  checkAttributeOwnership,
  (request: any, response: { json: (content: any) => void }) => {
    Attributes.delete(request.params.id).then((attribute: AttributeModel) => {
      response.json({
        id: attribute._id,
        name: attribute.name,
        status: "success",
      });
    });
  },
);

export default AttributesRoute;
