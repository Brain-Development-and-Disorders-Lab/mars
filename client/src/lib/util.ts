// Utility imports
import _ from "lodash";

// Custom types
import {
  IAttribute,
  ISelectOption,
  IValue,
  IValueType,
  IconNames,
  SearchAttributeValue,
  SearchQuery,
  UserModel,
} from "@types";

// Utility functions
import dayjs from "dayjs";

// Variables
import { ACCEPTED_ATTACHMENTS, ACCEPTED_IMPORTS_ENTITIES, ACCEPTED_IMPORTS_TEMPLATES } from "@variables";

export const isValidValues = (values: IValue[], allowEmptyValues = false) => {
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
 * Get the 3- or 4-letter file extension for display based on a file's MIME type
 * @param {string} mimeType File MIME type
 */
export const getFileExtension = (mimeType: string): string => {
  if (ACCEPTED_ATTACHMENTS.includes(mimeType)) {
    // Handle attachment files
    if (mimeType.endsWith(".dna")) {
      // Handle unique MIME type for DNA files
      return "DNA";
    } else {
      return _.upperCase(mimeType.split("/")[1]);
    }
  } else if (ACCEPTED_IMPORTS_ENTITIES.includes(mimeType)) {
    // Handle imported Entities files
    if (mimeType.endsWith(".sheet")) {
      // Handle unique MIME type for Excel files
      return "XLSX";
    } else {
      return _.upperCase(mimeType.split("/")[1]);
    }
  } else if (ACCEPTED_IMPORTS_TEMPLATES.includes(mimeType)) {
    // Handle imported Templates files
    return _.upperCase(mimeType.split("/")[1]);
  } else {
    return "UNKNOWN";
  }
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
export const parseError = (error: unknown): { message: string; name: string } => {
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
export const isAbortError = (errorOrMessage: unknown | string, name?: string): boolean => {
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
    // Called with (error)
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
 * Re-throw any error that is not an AbortError.
 * Use as `.catch(ignoreAbort)` on refetch() promises to suppress expected
 * cancellations while preserving genuine error propagation.
 */
export const ignoreAbort = (e: unknown): void => {
  if (!isAbortError(e)) throw e;
};

/**
 * Utility function to generate the corresponding `IconName` and color
 * for each `IValueType`
 * @param type `IValueType` representing the icon and color scheme
 * @return {{ icon: IconNames, color: string }}
 */
export const getValueTypeIconProps = (type: IValueType | undefined): { name: IconNames; color: string } => {
  switch (type) {
    case "date":
      return { name: "v_date", color: "orange.400" };
    case "text":
      return { name: "v_text", color: "blue.400" };
    case "number":
      return { name: "v_number", color: "green.400" };
    case "url":
      return { name: "v_url", color: "yellow.400" };
    case "select":
      return { name: "v_select", color: "teal.400" };
    case "entity":
      return { name: "entity", color: "purple.400" };
    default:
      return { name: "unknown", color: "red.400" };
  }
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

/**
 * Converts a `SearchQuery` into a MongoDB query object ready for JSON serialisation.
 * Each rule is translated independently, then combined with `$and` or `$or` based
 * on the query combinator. Returns an empty object when there are no rules.
 */
export const buildMongoQuery = (query: SearchQuery): Record<string, unknown> => {
  if (query.rules.length === 0) {
    return {};
  }

  const conditions = query.rules.map((rule) => {
    if (rule.field === "name" || rule.field === "description") {
      // Case-insensitive regex match against the field value
      const regex = { $regex: new RegExp(rule.value as string, "gi").toString() };
      return rule.operator === "does not contain" ? { [rule.field]: { $not: regex } } : { [rule.field]: regex };
    }

    if (rule.field === "projects") {
      // Match entities whose projects array contains (or excludes) the given project ID
      return rule.operator === "not member of"
        ? { projects: { $not: { $elemMatch: { _id: rule.value } } } }
        : { projects: { $elemMatch: { _id: rule.value } } };
    }

    if (rule.field === "relationships") {
      // "is parent/child of" filters by relationship type in addition to the target ID
      const target = { "target._id": rule.value };
      if (rule.operator === "is not related to") return { relationships: { $not: { $elemMatch: target } } };
      if (rule.operator === "is parent of") return { relationships: { $elemMatch: { ...target, type: "parent" } } };
      if (rule.operator === "is child of") return { relationships: { $elemMatch: { ...target, type: "child" } } };
      return { relationships: { $elemMatch: target } };
    }

    if (rule.field === "attributes") {
      const attr = rule.value as SearchAttributeValue;

      // Always scope to the selected value type first
      const conditions: Record<string, unknown>[] = [{ "attributes.values.type": attr.type }];

      if (attr.operator === "contains") {
        conditions.push({ "attributes.values.data": { $regex: new RegExp(attr.data, "gi").toString() } });
      } else if (attr.operator === "does not contain") {
        conditions.push({ "attributes.values.data": { $not: { $regex: new RegExp(attr.data, "gi").toString() } } });
      } else if (attr.operator === "equals") {
        if (attr.type === "number") {
          // $toDouble is required because attribute data is stored as a string
          conditions.push({
            $expr: {
              $anyElementTrue: {
                $map: {
                  input: "$attributes",
                  as: "a",
                  in: {
                    $anyElementTrue: {
                      $map: {
                        input: "$$a.values",
                        as: "v",
                        in: {
                          $and: [
                            { $eq: ["$$v.type", "number"] },
                            { $eq: [{ $toDouble: "$$v.data" }, parseFloat(attr.data)] },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        } else {
          // Date equality matches on the YYYY-MM-DD prefix of the stored ISO string
          conditions.push({
            "attributes.values.data": { $regex: new RegExp("^" + dayjs(attr.data).format("YYYY-MM-DD")).toString() },
          });
        }
      } else if (attr.operator === ">") {
        if (attr.type === "number") {
          conditions.push({
            $expr: {
              $anyElementTrue: {
                $map: {
                  input: "$attributes",
                  as: "a",
                  in: {
                    $anyElementTrue: {
                      $map: {
                        input: "$$a.values",
                        as: "v",
                        in: {
                          $and: [
                            { $eq: ["$$v.type", "number"] },
                            { $gt: [{ $toDouble: "$$v.data" }, parseFloat(attr.data)] },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        } else {
          // Date "greater than" compares against end-of-day to include the boundary date
          conditions.push({ "attributes.values.data": { $gt: dayjs(attr.data).endOf("day").toISOString() } });
        }
      } else if (attr.operator === "<") {
        if (attr.type === "number") {
          conditions.push({
            $expr: {
              $anyElementTrue: {
                $map: {
                  input: "$attributes",
                  as: "a",
                  in: {
                    $anyElementTrue: {
                      $map: {
                        input: "$$a.values",
                        as: "v",
                        in: {
                          $and: [
                            { $eq: ["$$v.type", "number"] },
                            { $lt: [{ $toDouble: "$$v.data" }, parseFloat(attr.data)] },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        } else {
          // Date "less than" compares against start-of-day for the same reason
          conditions.push({ "attributes.values.data": { $lt: dayjs(attr.data).startOf("day").toISOString() } });
        }
      }

      // $nor inverts the entire condition set when the outer operator is "does not contain"
      return rule.operator === "does not contain" ? { $nor: conditions } : { $and: conditions };
    }
    return {};
  });

  if (conditions.length === 1) {
    return conditions[0];
  }

  return query.combinator === "and" ? { $and: conditions } : { $or: conditions };
};
