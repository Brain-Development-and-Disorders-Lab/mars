// Utility imports
import _ from "lodash";

// Custom types
import { IAttribute, IAuth, ISession, IValue, UserModel } from "@types";

export const isValidValues = (
  values: IValue<any>[],
  allowEmptyValues = false,
) => {
  if (values.length === 0) {
    return false;
  }

  for (const value of values) {
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

  for (const attribute of attributes) {
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

export const isValidUser = (user: UserModel): boolean => {
  if (
    _.isUndefined(user.affiliation) ||
    _.isUndefined(user.email) ||
    _.isUndefined(user.firstName) ||
    _.isUndefined(user.lastName) ||
    user.affiliation === "" ||
    user.email === "" ||
    user.firstName === "" ||
    user.lastName === ""
  ) {
    return false;
  }
  return true;
};

/**
 * Retrieve an authentication token from session storage
 * @param {string} tokenKey the key of the token in storage
 * @returns {any}
 */
export const getToken = (tokenKey: string): IAuth => {
  const storedToken = sessionStorage.getItem(tokenKey);
  if (!_.isNull(storedToken) && !_.isUndefined(storedToken)) {
    return JSON.parse(storedToken);
  }
  return {
    orcid: "",
    token: "",
    setup: false,
  };
};

/**
 * Retrieve a session vaue from session storage
 * @param {string} sessionKey the key of the token in storage
 * @returns {any}
 */
export const getSession = (sessionKey: string): ISession => {
  const storedSession = sessionStorage.getItem(sessionKey);
  if (!_.isNull(storedSession) && !_.isUndefined(storedSession)) {
    return JSON.parse(storedSession);
  }
  return {
    workspace: "",
  };
};
