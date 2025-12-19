// Existing and custom types
import { ApplicationStorage } from "@types";

// Utility functions and libraries
import _ from "lodash";
import consola from "consola";

// Variables
import { STORAGE_KEY } from "src/variables";

export const useStorage = (): {
  storage: ApplicationStorage;
  updateStorage: (storage: ApplicationStorage) => void;
  updateStorageField: (
    field: keyof ApplicationStorage,
    value: string | boolean,
  ) => void;
} => {
  let initialStringValue = sessionStorage.getItem(STORAGE_KEY);
  if (_.isNull(initialStringValue)) {
    initialStringValue = JSON.stringify({
      setup: false,
      workspace: "",
      firstLogin: true,
    } as ApplicationStorage);
  }

  let storage = JSON.parse(initialStringValue);

  /**
   * Update the stored token data in the session storage
   * @param {IAuth} token Updated token data to store
   */
  const updateStorage = (updatedStorage: ApplicationStorage) => {
    if (_.isEqual(updatedStorage, {})) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStorage));
    }
    storage = updatedStorage;
  };

  /**
   * Update a specific field within the `ApplicationStorage` type
   * @param {keyof ApplicationStorage} field Specific storage field to update
   * @param {string | boolean} value Corresponding value
   */
  const updateStorageField = (
    field: keyof ApplicationStorage,
    value: string | boolean,
  ) => {
    const updatedStorage = _.cloneDeep(storage);
    if (field === "firstLogin" && typeof value === "boolean") {
      updatedStorage.firstLogin = value;
      updateStorage(updatedStorage);
    } else if (field === "setup" && typeof value === "boolean") {
      updatedStorage.setup = value;
      updateStorage(updatedStorage);
    } else if (field === "workspace" && typeof value === "string") {
      updatedStorage.workspace = value;
      updateStorage(updatedStorage);
    } else {
      consola.error(
        `Invalid update operation to storage: Field "${field}" cannot be set to value of type "${typeof value}"`,
      );
    }
  };

  return { storage, updateStorage, updateStorageField };
};
