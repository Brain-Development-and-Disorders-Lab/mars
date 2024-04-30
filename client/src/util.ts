// Utility imports
import _ from "lodash";
import consola from "consola";

// Custom types
import { IAttribute, IValue } from "@types";

export const isValidValues = (
  values: IValue<any>[],
  allowEmptyValues = false,
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

/**
 * Retrieve an authentication token from session storage
 * @param {string} tokenKey the key of the token in storage
 * @returns {any}
 */
export const getToken = (tokenKey: string): any => {
  const storedToken = sessionStorage.getItem(tokenKey);
  if (!_.isNull(storedToken) && !_.isUndefined(storedToken)) {
    if (JSON.parse(storedToken as string).name === "Test User") {
      consola.debug("Returning token as undefined");
      return undefined;
    }
    return JSON.parse(storedToken);
  }

  // decomment if you want to use a dummy token
  if (_.isEqual(process.env.NODE_ENV, "development")) {
    // Return a dummy token
    return {
      name: "Test User",
      orcid: "XXXX-1234-ABCD-0000",
      id_token: "ABCD1234",
    };
  } else {
    return undefined;
  }
};
