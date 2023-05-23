// Utility functions
import _ from "lodash";

// Custom types
import { Attribute, Parameters } from "@types";

export const validateParameters = (parameters: Parameters[], allowEmptyValues=false) => {
  for (let parameter of parameters) {
    // Check the name of the parameter
    if (_.isEqual(parameter.name, "")) {
      return false;
    }

    // Check data if empty values are not allowed
    if (!allowEmptyValues) {
      if (_.isUndefined(parameter.data) || _.isEqual(parameter.data, "")) {
        return false;
      }
    }
  }
  return true;
};

export const validateAttributes = (attributes: Attribute[]) => {
  if (attributes.length === 0) return true;

  for (let attribute of attributes) {
    // Check the name and description
    if (_.isEqual(attribute.name, "") || _.isEqual(attribute.description, "")) {
      return false;
    }

    // Check the data
    if (validateParameters(attribute.parameters) === false) {
      return false;
    }
  }

  return true;
};
