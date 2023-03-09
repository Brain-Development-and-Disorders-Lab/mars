// Utility functions
import _ from "underscore";

// Custom types
import { Parameters } from "@types";

export const validateParameters = (parameters: Parameters[]) => {
  for (let parameter of parameters) {
    // Check the name of the parameter
    if (_.isEqual(parameter.name, "")) {
      return false;
    }

    // Check data
    if (_.isUndefined(parameter.data) || _.isEqual(parameter.data, "")) {
      return false;
    }
  }
  return true;
};
