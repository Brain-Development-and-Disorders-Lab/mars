// Utility imports
import _ from "lodash";

// Custom types
import {
  GenericValueType,
  IAttribute,
  IAuth,
  ISelectOption,
  ISession,
  IValue,
  UserModel,
} from "@types";

export const isValidValues = (
  values: IValue<GenericValueType>[],
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
 * Check if an ORCID is a valid format
 * @param {string} orcid the ORCID to check
 * @returns {boolean}
 */
export const isValidOrcid = (orcid: string): boolean => {
  if (_.isUndefined(orcid) || _.isEqual(orcid, "")) {
    return false;
  }
  return /^(\d{4}-){3}\d{3}(\d|X)$/.test(orcid);
};

/**
 * Check if an email is in valid format
 * @param {string} email the email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email: string): boolean => {
  if (_.isUndefined(email) || _.isEqual(email, "")) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

/**
 * Generate a collection of `ISelectOption` objects from a collection of objects, enabling the
 * Chakra UI `Select` component to be populated with options correctly.
 * @param collection Collection of objects of generic type `T`
 * @param valueProperty The property attached to `T` that will be the value of the `Select` option
 * @param labelProperty The property attached to `T` that will be the label of the `Select` option
 * @return {ISelectOption[]} Collection of `ISelectOption` objects
 */
export const createSelectOptions = <T>(
  collection: T[],
  valueProperty: keyof T,
  labelProperty: keyof T,
): ISelectOption[] => {
  const options: ISelectOption[] = [];
  for (const item of collection) {
    options.push({
      value: item[valueProperty] as string,
      label: item[labelProperty] as string,
    });
  }
  return options;
};
