// Utility functions
import _ from "lodash";

// Custom types
import { IAttribute, IValue } from "@types";

export const isValidValues = (
  values: IValue<any>[],
  allowEmptyValues = false
) => {
  if (values.length === 0) {
    return false;
  }

  for (let value of values) {
    // Check the name of the Value
    if (_.isEqual(value.name, "")) {
      return false;
    }

    // Check data if empty values are not allowed
    if (!allowEmptyValues) {
      if (_.isUndefined(value.data) || _.isEqual(value.data, "")) {
        return false;
      }
    }
  }
  return true;
};

export const isValidAttributes = (attributes: IAttribute[]) => {
  if (attributes.length === 0) return false;

  for (let attribute of attributes) {
    // Check the name and description
    if (_.isEqual(attribute.name, "") || _.isEqual(attribute.description, "")) {
      return false;
    }

    // Check the data
    if (_.isEqual(isValidValues(attribute.values), false)) {
      return false;
    }
  }

  return true;
};
