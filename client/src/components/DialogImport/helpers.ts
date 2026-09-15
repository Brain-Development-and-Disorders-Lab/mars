// Components
import { createListCollection } from "@chakra-ui/react";
import { toaster } from "@components/Toast";

// Existing and custom types
import { ColumnInfo, IGenericItem, MutationResult } from "@types";

// Utility functions and libraries
import _ from "lodash";

/**
 * Shows an error toast for a failed or malformed mutation response
 * @param {MutationResult | undefined} result Response payload to check
 * @param {unknown} mutationError Apollo error captured alongside the mutation, if any
 * @param {string} errorTitle Toast title, identifying which import step failed
 * @return {boolean} `true` if the response succeeded
 */
export const reportMutationResult = (
  result: MutationResult | undefined,
  mutationError: unknown,
  errorTitle: string,
): boolean => {
  if (_.isUndefined(result) || mutationError) {
    toaster.create({
      title: errorTitle,
      type: "error",
      description: "Invalid response returned by server",
      duration: 4000,
      closable: true,
    });
    return false;
  }

  if (result.success === false) {
    toaster.create({ title: errorTitle, type: "error", description: result.message, duration: 4000, closable: true });
    return false;
  }

  return true;
};

/** Empty `columnsCollection`, used for both initial state and resetting the dialog */
export const emptyColumnsCollection = () =>
  createListCollection<ColumnInfo>({
    items: [] as ColumnInfo[],
    itemToValue: (item) => item.name,
    itemToString: (item) => item.name,
  });

/** Empty `projectsCollection`, used for both initial state and resetting the dialog */
export const emptyProjectsCollection = () =>
  createListCollection({
    items: [] as IGenericItem[],
    itemToValue: (item: IGenericItem) => item._id,
    itemToString: (item: IGenericItem) => item.name,
  });
