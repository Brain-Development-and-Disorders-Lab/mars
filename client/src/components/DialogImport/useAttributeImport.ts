// React
import { useState } from "react";

// GraphQL
import { useMutation } from "@apollo/client/react";
import { REVIEW_ATTRIBUTE_JSON, IMPORT_ATTRIBUTE_JSON } from "@components/DialogImport/queries";

// Utility functions and libraries
import { reportMutationResult } from "@components/DialogImport/helpers";

// Existing and custom types
import { AttributeImportReview, IResponseMessage, ResponseData, UseAttributeImportParams } from "@types";

/** State, GraphQL calls, and handlers for the "Attribute" JSON import flow */
export const useAttributeImport = ({ fileUpload, setContinueDisabled }: UseAttributeImportParams) => {
  const [attributeImportPage, setAttributeImportPage] = useState<"upload" | "review">("upload");
  const [attributeStep, setAttributeStep] = useState(0);
  const [reviewAttributes, setReviewAttributes] = useState<AttributeImportReview[]>([]);

  const [reviewAttributeJSON, { error: reviewAttributeJSONError }] = useMutation<{
    reviewAttributeJSON: ResponseData<AttributeImportReview[]>;
  }>(REVIEW_ATTRIBUTE_JSON);
  const [importAttributeJSON, { error: importAttributeJSONError }] = useMutation<{
    importAttributeJSON: IResponseMessage;
  }>(IMPORT_ATTRIBUTE_JSON);

  /** Runs the server-side review for a JSON Attribute import and populates `reviewAttributes` */
  const setupAttributeReviewJSON = async (): Promise<boolean> => {
    const response = await reviewAttributeJSON({
      variables: { file: fileUpload.acceptedFiles[0] },
    });

    const result = response.data?.reviewAttributeJSON;
    if (!reportMutationResult(result, reviewAttributeJSONError, "Attribute Import JSON Error")) {
      setContinueDisabled(true);
      return false;
    }

    setReviewAttributes(result!.data);
    setContinueDisabled(false);
    return true;
  };

  /** Executes the final JSON Attribute import */
  const finishAttributeImportJSON = async (): Promise<boolean> => {
    const response = await importAttributeJSON({ variables: { file: fileUpload.acceptedFiles[0] } });
    return reportMutationResult(
      response.data?.importAttributeJSON,
      importAttributeJSONError,
      "Attribute Import JSON Error",
    );
  };

  const reset = () => {
    setAttributeStep(0);
    setAttributeImportPage("upload");
    setReviewAttributes([]);
  };

  return {
    attributeImportPage,
    setAttributeImportPage,
    attributeStep,
    setAttributeStep,
    reviewAttributes,
    setupAttributeReviewJSON,
    finishAttributeImportJSON,
    reset,
  };
};
