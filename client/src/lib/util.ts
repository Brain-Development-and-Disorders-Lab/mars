// Utility imports
import _ from "lodash";

// Custom types
import {
  Collaborator,
  FormattedValueDisplay,
  IAttribute,
  ISelectOption,
  IValue,
  IValueType,
  IconNames,
  IdentifierFormatModel,
  SampleFile,
  SearchAttributeValue,
  SearchQuery,
  UserWorkspacePermissions,
} from "@types";

// Utility functions
import dayjs from "dayjs";

// Variables
import {
  ACCEPTED_ATTACHMENTS,
  ACCEPTED_IMPORTS_ENTITIES,
  ACCEPTED_IMPORTS_TEMPLATES,
  API_URL,
  CSV_MIME_TYPE,
  STYLES,
  XLSX_MIME_TYPE,
} from "@variables";

// URL of the public, unauthenticated Workspace endpoint for a given Workspace ID
export const getPublicWorkspaceUrl = (workspace: string): string => `${API_URL}/public/${workspace}`;

/** Returns true for CSV and XLSX file types, which share the same import flow. */
export const isSpreadsheetFile = (type: string) => type === CSV_MIME_TYPE || type === XLSX_MIME_TYPE;

export const isValueEqual = (a: IValue, b: IValue): boolean => {
  return a.name === b.name && a.type === b.type && a.data === b.data;
};

export const isValidValue = (value: IValue, allowEmptyValue = false) => {
  // Check the name of the Value
  if (_.isEqual(value.name, "")) {
    return false;
  }

  // Check data if empty Values are not allowed
  if (!allowEmptyValue) {
    if (_.isUndefined(value.data) || _.isEqual(value.data, "")) {
      return false;
    }
  }

  return true;
};

export const isValidValues = (values: IValue[], allowEmptyValues = false) => {
  if (values.length === 0) {
    return false;
  }

  for (const value of values) {
    isValidValue(value, allowEmptyValues);
  }
  return true;
};

/**
 * Utility function to search a list of `Collaborator` objects and locate a specific
 * User identifier if it is present
 * @param {string} _id Identifier of User to search for
 * @param {Collaborator[]} collaborators Collection of `Collaborator` instances
 * @return `true` if located, `false` if not
 */
export const isCollaborator = (_id: string, collaborators: Collaborator[]): boolean => {
  for (const collaborator of collaborators) {
    if (collaborator._id === _id) {
      return true;
    }
  }
  return false;
};

/**
 * Get a specific Collaborator's Workspace permissions from a collection
 * @param {string} _id Identifier of the Collaborator to locate
 * @param {Collaborator[]} collaborators Collection of `Collaborator` instances
 * @return {UserWorkspacePermissions | undefined} Permissions if the Collaborator is present
 */
export const getCollaboratorPermissions = (
  _id: string,
  collaborators: Collaborator[],
): UserWorkspacePermissions | undefined => {
  return collaborators.find((collaborator) => collaborator._id === _id)?.permissions;
};

/**
 * Replace a specific Collaborator's Workspace permissions within a collection
 * @param {string} _id Identifier of the Collaborator to update
 * @param {UserWorkspacePermissions} permissions Updated permissions to apply
 * @param {Collaborator[]} collaborators Collection of `Collaborator` instances
 * @return {Collaborator[]} New collection with the matching Collaborator updated
 */
export const setCollaboratorPermissions = (
  _id: string,
  permissions: UserWorkspacePermissions,
  collaborators: Collaborator[],
): Collaborator[] => {
  return collaborators.map((collaborator) =>
    collaborator._id === _id ? { ...collaborator, permissions } : collaborator,
  );
};

/**
 * Utility function to check if a User has permissions across "create", "edit", and "archive" for
 * a specific category of metadata
 * @param permissions Set of User's Workspace permissions
 * @param category Type of metadata category within the User's permissions
 * @return {boolean}
 */
const isModifyAll = (
  permissions: UserWorkspacePermissions,
  category: "entities" | "projects" | "templates",
): boolean => {
  const permissionsCategory = permissions[category];
  return permissionsCategory.create && permissionsCategory.edit && permissionsCategory.archive;
};

/**
 * Utility function to check if a User has some permissions across "create", "edit", and "archive" for
 * a specific category of metadata
 * @param permissions Set of User's Workspace permissions
 * @param category Type of metadata category within the User's permissions
 * @return {boolean}
 */
const isModifyPartial = (
  permissions: UserWorkspacePermissions,
  category: "entities" | "projects" | "templates",
): boolean => {
  const permissionsCategory = permissions[category];
  return permissionsCategory.create || permissionsCategory.edit || permissionsCategory.archive;
};

/**
 * Generate a set of strings ("View", "Modify (All)", "Modify (Partial)", "Administration")
 * depending on the `UserWorkspacePermissions` object, used to generate tags or labels
 * @param {UserWorkspacePermissions} permissions Set of User's Workspace permissions
 * @return {string[]}
 */
export const getCollaboratorPermissionsLevel = (permissions: UserWorkspacePermissions): string[] => {
  const permissionsLabels = ["View"];

  // "Modify (All)" only shown if all Entities, Projects, and Templates permissions enabled
  if (
    isModifyAll(permissions, "entities") &&
    isModifyAll(permissions, "projects") &&
    isModifyAll(permissions, "templates")
  ) {
    permissionsLabels.push("Modify (All)");
  } else if (
    isModifyPartial(permissions, "entities") ||
    isModifyPartial(permissions, "projects") ||
    isModifyPartial(permissions, "templates")
  ) {
    permissionsLabels.push("Modify (Partial)");
  }

  // Administration permissions
  if (permissions.administration.edit || permissions.administration.invite) {
    permissionsLabels.push("Administration");
  }

  return permissionsLabels;
};

/**
 * Check if an ORCID is a valid format
 * @param {string} orcid the ORCID to check
 * @returns {boolean}
 */
export const getValueTypeIconProps = (type: IValueType | undefined): { name: IconNames; color: string } => {
  switch (type) {
    case "date":
      return { name: "v_date", color: "yellow.400" };
    case "text":
      return { name: "v_text", color: "gray.400" };
    case "number":
      return { name: "v_number", color: "green.400" };
    case "url":
      return { name: "v_url", color: "orange.400" };
    case "select":
      return { name: "v_select", color: "teal.400" };
    case "entity":
      return { name: "entity", color: STYLES.entity.color.icon };
    default:
      return { name: "unknown", color: "red.400" };
  }
};

// Entity/select values store a JSON payload in `data`; parse it into a display-friendly label
export const formatValueForDisplay = (value: Pick<IValue, "type" | "data">): FormattedValueDisplay => {
  if (value.type === "entity") {
    try {
      return { label: JSON.parse(value.data)?.name ?? "" };
    } catch {
      return { label: value.data };
    }
  }
  if (value.type === "select") {
    try {
      const parsed = JSON.parse(value.data);
      return {
        label: parsed?.selected ?? "",
        secondary: Array.isArray(parsed?.options) ? `Options: ${parsed.options.join(", ")}` : undefined,
      };
    } catch {
      return { label: value.data };
    }
  }
  return { label: value.data };
};

export const isValidAttribute = (attribute: IAttribute) => {
  // Check the name and description
  if (_.isEqual(attribute.name, "") || _.isEqual(attribute.description, "")) {
    return false;
  }

  // Check the data
  if (_.isEqual(isValidValues(attribute.values), false)) {
    return false;
  }

  return true;
};

export const isValidAttributes = (attributes: IAttribute[]) => {
  if (attributes.length === 0) {
    return false;
  }

  for (const attribute of attributes) {
    isValidAttribute(attribute);
  }

  return true;
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
 * Helper function to validate an identifier against a base identifier format
 * @param {string} value Identifier value
 * @param {string} format Expected identifier format string
 * @return {boolean}
 */
export const isValidBaseIdentifierFormat = (value: string, format: string): boolean => {
  if (format === "guid_nih_niaa") {
    // NIH NIAA format
    const regex = /^[A-Z0-9]{12}$/;
    return regex.test(value);
  }
  return false;
};

/**
 * Helper function to validate an identifier against a custom identifier format
 * @param {string} value Identifier value
 * @param {IdentifierFormatModel} format Expected identifier format parameters
 * @return {boolean}
 */
export const isValidCustomIdentifierFormat = (value: string, format: IdentifierFormatModel): boolean => {
  if (value.length !== format.fixedLength) {
    return false;
  }

  const validators = {
    alphanumeric: /^[a-zA-Z0-9]+$/,
    lettersOnly: /^[a-zA-Z]+$/,
    numbersOnly: /^[0-9]+$/,
    alphanumericSpecial: /^[a-zA-Z0-9!@#$%]+$/,
    lettersSpecial: /^[a-zA-Z!@#$%]+$/,
    numbersSpecial: /^[0-9!@#$%]+$/,
    alphanumericUpper: /^[A-Z0-9]+$/,
    lettersUpper: /^[A-Z]+$/,
    alphanumericUpperSpecial: /^[A-Z0-9!@#$%]+$/,
    lettersUpperSpecial: /^[A-Z!@#$%]+$/,
  };

  if (format.alphanumericOnly && !format.allowSpecialCharacters && !format.uppercaseRequired) {
    // Alphanumeric only
    return validators.alphanumeric.test(value);
  } else if (format.lettersOnly && !format.allowSpecialCharacters && !format.uppercaseRequired) {
    // Letters only
    return validators.lettersOnly.test(value);
  } else if (format.numbersOnly && !format.allowSpecialCharacters) {
    // Numbers only
    return validators.numbersOnly.test(value);
  } else if (format.alphanumericOnly && format.allowSpecialCharacters && !format.uppercaseRequired) {
    // Alphanumeric and special characters
    return validators.alphanumericSpecial.test(value);
  } else if (format.lettersOnly && format.allowSpecialCharacters && !format.uppercaseRequired) {
    // Letters and special characters
    return validators.lettersSpecial.test(value);
  } else if (format.numbersOnly && format.allowSpecialCharacters) {
    // Numbers and special characters
    return validators.numbersSpecial.test(value);
  } else if (format.alphanumericOnly && !format.allowSpecialCharacters && format.uppercaseRequired) {
    // Alphanumeric and uppercase
    return validators.alphanumericUpper.test(value);
  } else if (format.lettersOnly && !format.allowSpecialCharacters && format.uppercaseRequired) {
    // Letters and uppercase
    return validators.lettersUpper.test(value);
  } else if (format.alphanumericOnly && format.allowSpecialCharacters && format.uppercaseRequired) {
    // Alphanumeric, special characters, and uppercase
    return validators.alphanumericUpperSpecial.test(value);
  } else if (format.lettersOnly && format.allowSpecialCharacters && format.uppercaseRequired) {
    // Letters, special characters, and uppercase
    return validators.lettersUpperSpecial.test(value);
  }

  return false;
};

export const getBaseIdentifierFormatHelperText = (format: string): string => {
  if (format === "guid_nih_niaa") {
    return "Specify an identifier using the NIH NIAA format (e.g. INV123456789)";
  } else {
    return "Unknown identifier format";
  }
};

export const getCustomIdentifierFormatHelperText = (format: IdentifierFormatModel): string => {
  const formatParameters: string[] = [];

  if (format.alphanumericOnly && !format.uppercaseRequired) {
    formatParameters.push(...["a-z", "A-Z", "0-9"]);
  } else if (format.alphanumericOnly && format.uppercaseRequired) {
    formatParameters.push(...["A-Z", "0-9"]);
  } else if (format.lettersOnly && !format.uppercaseRequired) {
    formatParameters.push(...["a-z", "A-Z"]);
  } else if (format.lettersOnly && format.uppercaseRequired) {
    formatParameters.push(...["A-Z"]);
  } else if (format.numbersOnly) {
    formatParameters.push(...["0-9"]);
  }

  if (format.allowSpecialCharacters) {
    formatParameters.push(...["!", "@", "#", "$", "%"]);
  }

  return `Required length: ${format.fixedLength}, valid characters: ` + formatParameters.join(", ");
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
 * Trigger a browser download of an example file
 * @param {SampleFile} sample Example file to download
 */
export const downloadSampleFile = (sample: SampleFile): void => {
  const url = URL.createObjectURL(new Blob([sample.content], { type: sample.mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = sample.filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
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
 * Recursively remove __typename fields from an object or array.
 * Apollo Client v4 automatically adds __typename to query results, but these
 * fields are not allowed in GraphQL input types (mutations).
 * @param toClean The object or array to clean
 * @returns A new object/array with all __typename fields removed
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const removeTypename = (toClean: any): any => {
  if (toClean === null || toClean === undefined) {
    return toClean;
  }
  if (Array.isArray(toClean)) {
    return toClean.map(removeTypename);
  }
  if (typeof toClean === "object") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __typename, ...rest } = toClean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleaned: any = {};
    for (const key in rest) {
      cleaned[key] = removeTypename(rest[key]);
    }
    return cleaned;
  }
  return toClean;
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
