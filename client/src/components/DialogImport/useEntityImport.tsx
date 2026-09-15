// React
import React, { useEffect, useState } from "react";

// Components
import Icon from "@components/Icon";
import { Flex, Select, Portal, Text, createListCollection } from "@chakra-ui/react";
import { SELECT_BG, SELECT_ROUNDED, SELECT_SIZE } from "@components/Select";

// GraphQL
import { useLazyQuery, useMutation } from "@apollo/client/react";
import {
  PREPARE_ENTITY_SPREADSHEET,
  GET_MAPPING_DATA,
  REVIEW_ENTITY_SPREADSHEET,
  GET_COUNTER_VALUES,
  SUGGEST_COLUMN_MAPPING,
  IMPORT_ENTITY_SPREADSHEET,
  REVIEW_ENTITY_JSON,
  IMPORT_ENTITY_JSON,
} from "@components/DialogImport/queries";

// Utility functions and libraries
import { removeTypename, isValidValues, getValueTypeIconProps, isSpreadsheetFile } from "@lib/util";
import {
  reportMutationResult,
  emptyColumnsCollection,
  emptyProjectsCollection,
} from "@components/DialogImport/helpers";
import _ from "lodash";
import dayjs from "dayjs";

// Authentication
import { auth } from "@lib/auth";

// Hooks
import { usePermissions } from "@hooks/usePermissions";

// Variables
import { JSON_MIME_TYPE } from "@variables";

// Existing and custom types
import {
  AttributeModel,
  ColumnInfo,
  ColumnMappingSuggestion,
  IGenericItem,
  EntityImportReview,
  IColumnMapping,
  EntityModel,
  IResponseMessage,
  ResponseData,
  UseEntityImportParams,
} from "@types";

/** State, GraphQL calls, and handlers for the "Entities" import flow */
export const useEntityImport = ({ open, fileUpload, fileType, setContinueDisabled }: UseEntityImportParams) => {
  const { globalPermissions } = usePermissions();

  // State management to generate and present different pages
  const [entityImportPage, setEntityImportPage] = useState<"upload" | "details" | "mapping" | "review">("upload");
  const [entityStep, setEntityStep] = useState(0);

  // Spreadsheet column state
  const [columns, setColumns] = useState([] as ColumnInfo[]);
  const [columnsCollection, setColumnsCollection] = useState(emptyColumnsCollection());

  // AI column mapping suggestions
  const [suggestions, setSuggestions] = useState<ColumnMappingSuggestion | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Projects
  const [projectsCollection, setProjectsCollection] = useState(emptyProjectsCollection());

  // Attributes available for Attribute creation
  const [attributes, setAttributes] = useState<AttributeModel[]>([]);

  // Controls the "Add Attribute" dialog on the mapping step
  const [addAttributeOpen, setAddAttributeOpen] = useState(false);

  // Fields to be assigned to columns
  const [namePrefixField, setNamePrefixField] = useState("");
  const [nameField, setNameField] = useState<ColumnInfo | undefined>(undefined);
  const [nameUseCounter, setNameUseCounter] = useState(false);
  const [counter, setCounter] = useState("");
  const [descriptionField, setDescriptionField] = useState<ColumnInfo | undefined>(undefined);
  const [ownerField, setOwnerField] = useState("");
  const [projectField, setProjectField] = useState("");
  const [attributesField, setAttributesField] = useState([] as AttributeModel[]);
  const [identifierField, setIdentifierField] = useState<ColumnInfo | undefined>(undefined);
  const [identifierFormat, setIdentifierFormat] = useState<string[]>([]);

  // Review state
  const [reviewEntities, setReviewEntities] = useState([] as EntityImportReview[]);

  // Authentication and user
  const { data: session, error: sessionErrorState } = auth.useSession();

  useEffect(() => {
    if (!open) return;
    if (sessionErrorState || !session) return;
    setOwnerField(session.user.id);
  }, [open, session, sessionErrorState]);

  /** GraphQL queries and mutations */
  const [prepareEntitySpreadsheet, { error: prepareEntitySpreadsheetError }] = useMutation<{
    prepareEntitySpreadsheet: ColumnInfo[];
  }>(PREPARE_ENTITY_SPREADSHEET);
  const [getMappingData, { error: mappingDataError }] = useLazyQuery<{
    projects: IGenericItem[];
    attributes: AttributeModel[];
  }>(GET_MAPPING_DATA);
  const [reviewEntitySpreadsheet, { error: reviewEntitySpreadsheetError }] = useMutation<{
    reviewEntitySpreadsheet: ResponseData<EntityImportReview[]>;
  }>(REVIEW_ENTITY_SPREADSHEET);
  const [getCounterValues, { error: counterValuesError }] = useLazyQuery<{
    nextCounterValues: ResponseData<string[]>;
  }>(GET_COUNTER_VALUES);
  const [runSuggestColumnMapping] = useLazyQuery<{
    suggestColumnMapping: ColumnMappingSuggestion;
  }>(SUGGEST_COLUMN_MAPPING, { fetchPolicy: "network-only" });
  const [importEntitySpreadsheet, { error: importEntitySpreadsheetError }] = useMutation<{
    importEntitySpreadsheet: IResponseMessage;
  }>(IMPORT_ENTITY_SPREADSHEET);
  const [reviewEntityJSON, { error: reviewEntityJSONError }] = useMutation<{
    reviewEntityJSON: ResponseData<EntityImportReview[]>;
  }>(REVIEW_ENTITY_JSON);
  const [importEntityJSON, { error: importEntityJSONError }] = useMutation<{
    importEntityJSON: IResponseMessage;
  }>(IMPORT_ENTITY_JSON);

  // Effect to manipulate 'Continue' button state when mapping columns from a spreadsheet file, or a JSON file
  useEffect(() => {
    if (!_.isEqual(entityImportPage, "details")) return;
    if (isSpreadsheetFile(fileType) && nameField !== undefined) {
      setContinueDisabled(false);
    } else if (isSpreadsheetFile(fileType) && nameUseCounter && counter !== "") {
      setContinueDisabled(false);
    } else if (fileType === JSON_MIME_TYPE) {
      setContinueDisabled(false);
    }
  }, [entityImportPage, fileType, nameField, nameUseCounter, counter]);

  // Effect to disable 'Continue' on the Entity mapping page when any Attribute is incomplete
  useEffect(() => {
    if (!_.isEqual(entityImportPage, "mapping")) return;
    const allValid =
      attributesField.length === 0 ||
      attributesField.every((attr) => attr.name !== "" && attr.description !== "" && isValidValues(attr.values));
    setContinueDisabled(!allValid);
  }, [entityImportPage, attributesField]);

  // Effect to block 'Finish' on the review page while any row has a data validation warning
  useEffect(() => {
    if (!_.isEqual(entityImportPage, "review")) return;
    const hasWarnings = isSpreadsheetFile(fileType) && reviewEntities.some((e) => e.warnings && e.warnings.length > 0);
    setContinueDisabled(hasWarnings);
  }, [entityImportPage, reviewEntities, fileType]);

  // Effect to fetch AI column mapping suggestions when columns become available
  useEffect(() => {
    if (!globalPermissions.features.ai || columns.length === 0 || !isSpreadsheetFile(fileType)) return;

    const fetchSuggestions = async () => {
      setIsSuggesting(true);
      try {
        const result = await runSuggestColumnMapping({ variables: { columns: columns.map((c) => c.name) } });
        if (result.data?.suggestColumnMapping) {
          setSuggestions(result.data.suggestColumnMapping);
        }
      } finally {
        setIsSuggesting(false);
      }
    };

    fetchSuggestions();
  }, [columns]);

  /**
   * Utility function to parse the JSON file at the client-level
   * @param {File} file JSON file containing Entity information
   * @return {Promise<{ entities: EntityModel[] }>}
   */
  const parseEntityJSONFile = async (file: File): Promise<{ entities: EntityModel[] }> => {
    const data = await file.text();
    try {
      return JSON.parse(data as string);
    } catch {
      reportMutationResult(
        { success: false, message: "Could not parse Entity JSON file contents" },
        false,
        "Entity Import JSON Error",
      );
      return {} as { entities: EntityModel[] };
    }
  };

  /**
   * Validate the content structure of an uploaded JSON file at the client-level
   * @param {{ entities: EntityModel[] }} parsed Parsed contents of the JSON file containing Entity information
   * @return {boolean}
   */
  const validEntityJSONFile = (parsed: { entities: EntityModel[] }): boolean => {
    if (parsed.entities === undefined) {
      reportMutationResult(
        { success: false, message: 'Entity JSON file does not contain top-level "entities" key' },
        false,
        "Entity Import JSON Error",
      );
      return false;
    }
    if (parsed.entities.length === 0) {
      reportMutationResult(
        { success: false, message: "Entity JSON file does not contain any Entities" },
        false,
        "Entity Import JSON Error",
      );
      return false;
    }
    return true;
  };

  /**
   * Returns true if `columnName` is already assigned to a field or an Attribute value
   * @param {string} columnName Name of the column being checked
   * @return {boolean}
   */
  const columnIsAssigned = (columnName: string): boolean => {
    if (_.includes([nameField?.name, descriptionField?.name, identifierField?.name], columnName)) return true;

    for (const attribute of attributesField) {
      for (const value of attribute.values) {
        if (_.includes(value.data, columnName)) return true;
      }
    }

    return false;
  };

  /**
   * Parses and validates the uploaded file, populates `columns` for CSV and XLSX files
   * @return {Promise<boolean>}
   */
  const setupEntityImport = async (): Promise<boolean> => {
    if (fileType === JSON_MIME_TYPE) {
      const data = await parseEntityJSONFile(fileUpload.acceptedFiles[0]);
      return validEntityJSONFile(data);
    } else if (isSpreadsheetFile(fileType)) {
      const response = await prepareEntitySpreadsheet({
        variables: { file: fileUpload.acceptedFiles[0] },
      });

      if (prepareEntitySpreadsheetError || !response.data) {
        reportMutationResult(
          undefined,
          prepareEntitySpreadsheetError || !response.data,
          "Entity Import Spreadsheet Error",
        );
        return false;
      }

      if (response.data.prepareEntitySpreadsheet.length > 0) {
        // Strip Excel placeholder columns for genuinely empty cells
        const filteredColumnSet = response.data.prepareEntitySpreadsheet.filter(
          (col: ColumnInfo) => !_.startsWith(col.name, "__EMPTY"),
        );
        setColumns(filteredColumnSet);
        setColumnsCollection(
          createListCollection<ColumnInfo>({
            items: filteredColumnSet,
            itemToValue: (item) => item.name,
            itemToString: (item) => item.name,
          }),
        );
        return true;
      } else {
        reportMutationResult(
          { success: false, message: "Entity spreadsheet file is empty" },
          false,
          "Entity Import Spreadsheet Error",
        );
        return false;
      }
    }

    // No issues with file import
    return true;
  };

  /**
   * Fetches Projects and Attributes to populate the mapping step dropdowns
   * @return {boolean}
   */
  const setupEntityColumnMapping = async (): Promise<boolean> => {
    const response = await getMappingData();

    if (response.data?.attributes) {
      if (!_.isEqual(fileType, JSON_MIME_TYPE)) {
        // Attributes containing "Entity" or "Select"-type Values can't be mapped to CSV columns
        const supportedAttributes = response.data.attributes.filter((a: AttributeModel) =>
          a.values.every((v) => !["entity", "select"].includes(v.type)),
        );
        setAttributes(supportedAttributes);
      } else {
        setAttributes(response.data.attributes);
      }
    }
    if (response.data?.projects) {
      setProjectsCollection(
        createListCollection({
          items: response.data.projects,
          itemToValue: (item: IGenericItem) => item._id,
          itemToString: (item: IGenericItem) => item.name,
        }),
      );
    }

    if (mappingDataError) {
      reportMutationResult(undefined, mappingDataError, "Entity Import Column Error");
      return false;
    }

    return true;
  };

  /** Parses the uploaded file and fetches the mapping dropdown data concurrently */
  const setupEntityUploadStep = async (): Promise<boolean> => {
    const [importResult, mappingResult] = await Promise.all([setupEntityImport(), setupEntityColumnMapping()]);
    return importResult && mappingResult;
  };

  /**
   * Builds the column mapping object from current state
   * @return {IColumnMapping}
   */
  const buildEntityColumnMapping = (): IColumnMapping => ({
    namePrefix: namePrefixField,
    name: nameField?.name,
    secondaryIdentifier: {
      value: identifierField?.name,
      format: identifierFormat[0] || "",
    },
    description: descriptionField?.name,
    created: dayjs(Date.now()).toISOString(),
    owner: ownerField,
    project: projectField,
    attributes: removeTypename(attributesField),
  });

  /**
   * Runs the server-side review for a JSON Entity import and populates `reviewEntities`
   */
  const setupEntityReviewJSON = async (): Promise<boolean> => {
    const response = await reviewEntityJSON({
      variables: { file: fileUpload.acceptedFiles[0] },
    });

    const result = response.data?.reviewEntityJSON;
    if (!reportMutationResult(result, reviewEntityJSONError, "Entity Import JSON Error")) {
      setContinueDisabled(true);
      return false;
    }

    setReviewEntities(result!.data);
    return true;
  };

  /**
   * Runs the server-side review for a CSV/XLSX entity import, splicing in counter values when applicable
   */
  const setupEntityReviewSpreadsheet = async (): Promise<boolean> => {
    const columnMapping = buildEntityColumnMapping();

    const response = await reviewEntitySpreadsheet({
      variables: {
        columnMapping: removeTypename(columnMapping),
        file: fileUpload.acceptedFiles[0],
      },
    });

    const result = response.data?.reviewEntitySpreadsheet;
    if (!reportMutationResult(result, reviewEntitySpreadsheetError, "Entity Import Spreadsheet Error")) {
      setContinueDisabled(true);
      return false;
    }

    // Retrieve and splice in counter values if being used for names
    if (nameUseCounter) {
      const reviewData = result!.data;
      const counterResponse = await getCounterValues({
        variables: { _id: counter, count: reviewData.length },
      });

      const counterValues = counterResponse.data?.nextCounterValues?.data;
      if (counterValues && counterValues.length > 0) {
        const counterValuesSpliced = reviewData.map((entity: EntityImportReview, index: number) => ({
          ...entity,
          name: counterValues[index],
        }));
        setReviewEntities(counterValuesSpliced);
      }

      if (counterValuesError || !counterValues || counterValues.length === 0) {
        reportMutationResult(
          { success: false, message: "Error while retrieving counter values" },
          false,
          "Entity Import Spreadsheet Error",
        );
        return false;
      }
    } else {
      setReviewEntities(result!.data);
    }

    return true;
  };

  /**
   * Executes the final JSON entity import
   */
  const finishEntityImportJSON = async (): Promise<boolean> => {
    const response = await importEntityJSON({
      variables: {
        file: fileUpload.acceptedFiles[0],
        project: projectField,
        attributes: removeTypename(attributesField),
      },
    });

    const success = reportMutationResult(
      response.data?.importEntityJSON,
      importEntityJSONError,
      "Entity Import JSON Error",
    );
    if (!success) {
      setContinueDisabled(true);
    }
    return success;
  };

  /**
   * Executes the final spreadsheet Entity import
   */
  const finishEntityImportSpreadsheet = async (): Promise<boolean> => {
    const columnMapping = buildEntityColumnMapping();
    const options = { counters: nameUseCounter ? [{ field: "name", _id: counter }] : [] };

    const response = await importEntitySpreadsheet({
      variables: {
        columnMapping: removeTypename(columnMapping),
        options: removeTypename(options),
        file: fileUpload.acceptedFiles[0],
      },
    });

    return reportMutationResult(
      response.data?.importEntitySpreadsheet,
      importEntitySpreadsheetError,
      "Entity Import Spreadsheet Error",
    );
  };

  // Generate the total number of warnings for an Entity import
  const importEntityWarningCount = reviewEntities.filter(
    (entity) => entity.warnings && entity.warnings.length > 0,
  ).length;

  /**
   * Renders a column-picker `Select` bound to a `ColumnInfo` value, showing the inferred type icon
   * @param {string} key Unique key for the Select component
   * @param {ColumnInfo | undefined} currentValue Current value of the Select component
   * @param {React.Dispatch<React.SetStateAction<ColumnInfo | undefined>>} onValueChange Callback function for when the value is changed
   * @return {React.JSX.Element}
   */
  const getSelectComponent = (
    key: string,
    currentValue: ColumnInfo | undefined,
    onValueChange: React.Dispatch<React.SetStateAction<ColumnInfo | undefined>>,
  ): React.JSX.Element => {
    const triggerIcon = getValueTypeIconProps(currentValue?.inferredType);
    return (
      <Select.Root
        key={key}
        size={SELECT_SIZE}
        rounded={SELECT_ROUNDED}
        bg={SELECT_BG}
        collection={columnsCollection}
        value={currentValue ? [currentValue.name] : []}
        onValueChange={(details) => onValueChange(details.items[0])}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger data-testid={`import-column-select-trigger-${key}`} rounded={"md"}>
            <Flex direction={"row"} gap={"2"} align={"center"}>
              {currentValue ? (
                <Icon name={triggerIcon.name} size={"xs"} color={triggerIcon.color} />
              ) : (
                <Icon name={"grid"} size={"xs"} color={"text.faint"} />
              )}
              <Text fontSize={"xs"}>{currentValue?.name || "Select Column"}</Text>
            </Flex>
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {columnsCollection.items?.map((column: ColumnInfo) => {
                const iconProps = getValueTypeIconProps(column.inferredType);
                return (
                  <Select.Item item={column} key={column.name}>
                    <Flex direction={"row"} gap={"2"} align={"center"}>
                      <Icon name={iconProps.name} size={"xs"} color={iconProps.color} />
                      {column.name}
                    </Flex>
                    <Select.ItemIndicator />
                  </Select.Item>
                );
              }) || []}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    );
  };

  /** Reset the Entity import UI state (note: `namePrefixField` and `ownerField` intentionally persist) */
  const reset = () => {
    setEntityStep(0);
    setEntityImportPage("upload");
    setColumns([]);
    setColumnsCollection(emptyColumnsCollection());
    setSuggestions(null);
    setIsSuggesting(false);
    setNameField(undefined);
    setNameUseCounter(false);
    setCounter("");
    setDescriptionField(undefined);
    setProjectField("");
    setIdentifierField(undefined);
    setIdentifierFormat([]);
    setProjectsCollection(emptyProjectsCollection());
    setAttributes([]);
    setAddAttributeOpen(false);
    setAttributesField([]);
    setReviewEntities([]);
  };

  return {
    entityImportPage,
    setEntityImportPage,
    entityStep,
    setEntityStep,
    columns,
    columnsCollection,
    suggestions,
    isSuggesting,
    projectsCollection,
    attributes,
    addAttributeOpen,
    setAddAttributeOpen,
    namePrefixField,
    setNamePrefixField,
    nameField,
    setNameField,
    nameUseCounter,
    setNameUseCounter,
    counter,
    setCounter,
    descriptionField,
    setDescriptionField,
    ownerField,
    projectField,
    setProjectField,
    attributesField,
    setAttributesField,
    identifierField,
    setIdentifierField,
    identifierFormat,
    setIdentifierFormat,
    reviewEntities,
    importEntityWarningCount,
    columnIsAssigned,
    getSelectComponent,
    setupEntityUploadStep,
    setupEntityReviewJSON,
    setupEntityReviewSpreadsheet,
    finishEntityImportJSON,
    finishEntityImportSpreadsheet,
    reset,
  };
};
