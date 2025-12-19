// Utility imports
import _ from "lodash";

// Custom types
import {
  ApplicationStorage,
  GenericValueType,
  IAttribute,
  ISelectOption,
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

/**
 * Extract error message and name from various error formats
 * Handles Error objects, strings, or other types
 * @param error The error to parse
 * @returns Object with message and name properties
 */
export const parseError = (
  error: unknown,
): { message: string; name: string } => {
  if (error instanceof Error) {
    return { message: error.message || "", name: error.name || "" };
  }
  if (typeof error === "string") {
    return { message: error, name: "" };
  }
  if (error && typeof error === "object" && "message" in error) {
    return {
      message: String(error.message || ""),
      name: String((error as { name?: string }).name || ""),
    };
  }
  return { message: String(error || ""), name: "" };
};

/**
 * Check if an error is an abort error (expected when queries are cancelled)
 *
 * In Apollo Client v4, AbortErrors are expected when:
 * - Component unmounts while query is in-flight
 * - New query starts while previous query is still in-flight
 *
 * @param errorOrMessage Either an error object or error message string
 * @param name Optional error name (only used if first param is a string)
 * @returns true if the error is an abort error
 */
export const isAbortError = (
  errorOrMessage: unknown | string,
  name?: string,
): boolean => {
  // Check for DOMException with AbortError name
  if (errorOrMessage instanceof DOMException) {
    return errorOrMessage.name === "AbortError";
  }

  let message: string;
  let errorName: string;

  if (typeof errorOrMessage === "string") {
    // Called with (message, name)
    message = errorOrMessage;
    errorName = name || "";
  } else {
    // Called with (error) - parse it
    const parsed = parseError(errorOrMessage);
    message = parsed.message;
    errorName = parsed.name;
  }

  // Check error name first
  if (errorName === "AbortError") {
    return true;
  }

  // Check for abort-related messages
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("aborted") ||
    normalizedMessage.includes("err_aborted") ||
    message === "The operation was aborted." ||
    normalizedMessage.includes("the user aborted a request")
  );
};

/**
 * Recursively remove __typename fields from an object or array.
 * Apollo Client v4 automatically adds __typename to query results, but these
 * fields are not allowed in GraphQL input types (mutations).
 * @param obj The object or array to clean
 * @returns A new object/array with all __typename fields removed
 */
export const removeTypename = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeTypename);
  }
  if (typeof obj === "object") {
    const { __typename, ...rest } = obj;
    const cleaned: any = {};
    for (const key in rest) {
      cleaned[key] = removeTypename(rest[key]);
    }
    return cleaned;
  }
  return obj;
};
