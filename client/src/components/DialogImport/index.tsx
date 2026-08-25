// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  Button,
  Dialog,
  Text,
  Select,
  Tag,
  Portal,
  createListCollection,
  Steps,
  CloseButton,
  useFileUpload,
} from "@chakra-ui/react";
import DialogAlert from "@components/DialogAlert";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";
import UploadStep from "@components/DialogImport/steps/UploadStep";
import EntityDetailsStep from "@components/DialogImport/steps/EntityDetailsStep";
import EntityMappingStep from "@components/DialogImport/steps/EntityMappingStep";
import EntityReviewStep from "@components/DialogImport/steps/EntityReviewStep";
import TemplateReviewStep from "@components/DialogImport/steps/TemplateReviewStep";

// Custom and existing types
import {
  AttributeModel,
  ColumnInfo,
  IGenericItem,
  EntityImportReview,
  TemplateImportReview,
  DialogImportProps,
  IColumnMapping,
  EntityModel,
  IResponseMessage,
  ResponseData,
} from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL
import { useLazyQuery, useMutation } from "@apollo/client/react";
import {
  PREPARE_ENTITY_CSV,
  GET_MAPPING_DATA,
  REVIEW_ENTITY_CSV,
  GET_COUNTER_VALUES,
  SUGGEST_COLUMN_MAPPING,
  IMPORT_ENTITY_CSV,
  REVIEW_ENTITY_JSON,
  IMPORT_ENTITY_JSON,
  REVIEW_TEMPLATE_JSON,
  IMPORT_TEMPLATE_JSON,
} from "@components/DialogImport/queries";

// Utility functions and libraries
import { removeTypename, isValidValues, getValueTypeIconProps, isSpreadsheetFile } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";

// Authentication
import { auth } from "@lib/auth";

// Events
import { usePostHog } from "posthog-js/react";

// Variables
import {
  JSON_MIME_TYPE,
  MAX_DISPLAYED_COLUMNS,
  ACCEPTED_IMPORTS_ENTITIES,
  ACCEPTED_IMPORTS_TEMPLATES,
  STYLES,
} from "@variables";

// Hooks
import { usePermissions } from "@hooks/usePermissions";

const DialogImport = (props: DialogImportProps) => {
  // Posthog
  const posthog = usePostHog();

  // Permissions
  const { globalPermissions } = usePermissions();

  // Operation and button states
  const [importLoading, setImportLoading] = useState(false);
  const [continueDisabled, setContinueDisabled] = useState(true);

  const navigate = useNavigate();

  // State to differentiate which type of file is being imported
  const [importType, setImportType] = useState<"entities" | "template">();
  const [importTypeSelected, setImportTypeSelected] = useState(false);
  const [isTypeSelectDisabled, setIsTypeSelectDisabled] = useState(false);

  // File states, kept in sync with `fileUpload` below so the rest of the dialog can react to it
  const [fileType, setFileType] = useState("");
  const [fileName, setFileName] = useState("");

  const fileUpload = useFileUpload({
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024,
    accept: importType === "entities" ? ACCEPTED_IMPORTS_ENTITIES : ACCEPTED_IMPORTS_TEMPLATES,
    // No file contents type selected yet, so the dropzone shouldn't accept anything
    disabled: _.isUndefined(importType),
    onFileChange: (details) => {
      const file = details.acceptedFiles[0] as File | undefined;
      setFileName(file?.name ?? "");
      setFileType(file?.type ?? "");
    },
  });

  /** Swaps between the Entity and Template upload contexts, discarding any file picked under the old type. */
  const selectImportType = (type: "entities" | "template") => {
    if (isTypeSelectDisabled) return;

    fileUpload.clearFiles();
    setImportType(type);
    setImportTypeSelected(true);
  };

  // State management to generate and present different pages
  const [entityInterfacePage, setEntityInterfacePage] = useState(
    "upload" as "upload" | "details" | "mapping" | "review",
  );
  const [templateInterfacePage, setTemplateInterfacePage] = useState("upload" as "upload" | "review");

  // Used to generated numerical steps and a progress bar
  // Entity steps
  const entitySteps = [
    { title: "Upload File" },
    { title: "Setup Entities" },
    { title: "Apply Templates" },
    { title: "Review" },
  ];
  const [entityStep, setEntityStep] = useState(0);

  // Template steps
  const templateSteps = [{ title: "Upload File" }, { title: "Review" }];
  const [templateStep, setTemplateStep] = useState(0);

  // Spreadsheet column state
  const [columns, setColumns] = useState([] as ColumnInfo[]);
  const [columnsCollection, setColumnsCollection] = useState(
    createListCollection<ColumnInfo>({
      items: [] as ColumnInfo[],
      itemToValue: (item) => item.name,
      itemToString: (item) => item.name,
    }),
  );

  // AI column mapping suggestions
  const [suggestions, setSuggestions] = useState<{ name: string | null; description: string | null } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Projects
  const [projectsCollection, setProjectsCollection] = useState(
    createListCollection({
      items: [] as IGenericItem[],
      itemToValue: (item: IGenericItem) => item._id,
      itemToString: (item: IGenericItem) => item.name,
    }),
  );

  // Templates available for attribute creation
  const [templates, setTemplates] = useState<AttributeModel[]>([]);

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
  const [reviewTemplates, setReviewTemplates] = useState([] as TemplateImportReview[]);

  // Confirmation dialog shown when the user clicks Finish and warnings are present
  const [confirmWarningsOpen, setConfirmWarningsOpen] = useState(false);

  // Authentication and user
  const { data: session, error: sessionErrorState } = auth.useSession();

  useEffect(() => {
    if (!props.open) return;

    if (sessionErrorState || !session) {
      toaster.create({
        title: "Error",
        description: "Session expired, please login again",
        type: "error",
        duration: 4000,
        closable: true,
      });
      return;
    }

    setOwnerField(session.user.id);
  }, [props.open, session, sessionErrorState]);

  // Apollo hooks
  const [prepareEntityCSV, { error: prepareEntityCSVError }] = useMutation<{
    prepareEntityCSV: ColumnInfo[];
  }>(PREPARE_ENTITY_CSV);
  const [getMappingData, { error: mappingDataError }] = useLazyQuery<{
    projects: IGenericItem[];
    templates: AttributeModel[];
  }>(GET_MAPPING_DATA);
  const [reviewEntityCSV, { error: reviewEntityCSVError }] = useMutation<{
    reviewEntityCSV: ResponseData<EntityImportReview[]>;
  }>(REVIEW_ENTITY_CSV);
  const [getCounterValues, { error: counterValuesError }] = useLazyQuery<{
    nextCounterValues: ResponseData<string[]>;
  }>(GET_COUNTER_VALUES);
  const [runSuggestColumnMapping] = useLazyQuery<{
    suggestColumnMapping: { name: string | null; description: string | null };
  }>(SUGGEST_COLUMN_MAPPING, { fetchPolicy: "network-only" });
  const [importEntityCSV, { error: importEntityCSVError }] = useMutation(IMPORT_ENTITY_CSV);
  const [reviewEntityJSON, { error: reviewEntityJSONError }] = useMutation<{
    reviewEntityJSON: ResponseData<EntityImportReview[]>;
  }>(REVIEW_ENTITY_JSON);
  const [importEntityJSON, { error: importEntityJSONError }] = useMutation<{
    importEntityJSON: IResponseMessage;
  }>(IMPORT_ENTITY_JSON);
  const [reviewTemplateJSON, { error: reviewTemplateJSONError }] = useMutation<{
    reviewTemplateJSON: ResponseData<TemplateImportReview[]>;
  }>(REVIEW_TEMPLATE_JSON);
  const [importTemplateJSON, { error: importTemplateJSONError }] = useMutation<{
    importTemplateJSON: IResponseMessage;
  }>(IMPORT_TEMPLATE_JSON);

  // Effect to manipulate 'Continue' button state for 'upload' page, also re-disabling it
  // if the file is removed after being accepted
  useEffect(() => {
    if (_.isEqual(entityInterfacePage, "upload")) {
      setContinueDisabled(!(fileName !== "" && importTypeSelected));
    }
  }, [fileName, importTypeSelected]);

  // Effect to manipulate 'Continue' button state when mapping fields from a spreadsheet file
  useEffect(() => {
    if (_.isEqual(entityInterfacePage, "details") && nameField !== undefined && isSpreadsheetFile(fileType)) {
      setContinueDisabled(false);
    } else if (_.isEqual(entityInterfacePage, "details") && counter !== "" && nameUseCounter) {
      setContinueDisabled(false);
    }
  }, [nameField, counter]);

  // Effect to manipulate 'Continue' button state when importing JSON file
  useEffect(() => {
    if (_.isEqual(entityInterfacePage, "details") && fileType === JSON_MIME_TYPE) {
      setContinueDisabled(false);
    }
  }, [entityInterfacePage]);

  // Effect to disable 'Continue' on the mapping page when any attribute is incomplete
  useEffect(() => {
    if (!_.isEqual(entityInterfacePage, "mapping")) return;
    const allValid =
      attributesField.length === 0 ||
      attributesField.every((attr) => attr.name !== "" && attr.description !== "" && isValidValues(attr.values));
    setContinueDisabled(!allValid);
  }, [entityInterfacePage, attributesField]);

  const parseJSONFile = async (file: File): Promise<{ entities: EntityModel[] }> => {
    // Attempt to parse the JSON file
    setImportLoading(true);
    const data = await file.text();
    setImportLoading(false);

    try {
      const parsed = JSON.parse(data as string);
      return parsed;
    } catch {
      toaster.create({
        title: "JSON Import Error",
        type: "error",
        description: "Could not parse file contents",
        duration: 4000,
        closable: true,
      });
      return {} as { entities: EntityModel[] };
    }
  };

  const validJSONFile = (parsed: { entities: EntityModel[] }): boolean => {
    if (parsed.entities === undefined) {
      toaster.create({
        title: "JSON Import Error",
        type: "error",
        description: 'File does not contain top-level "entities" key',
        duration: 4000,
        closable: true,
      });
      return false;
    }

    // Check that it contains `EntityModel` instances
    if (parsed.entities.length === 0) {
      toaster.create({
        title: "JSON Import Error",
        type: "error",
        description: "File does not contain any Entity data",
        duration: 4000,
        closable: true,
      });
      return false;
    }

    // File contents are valid
    return true;
  };

  /** Returns true if `columnName` is already assigned to a field or an Attribute value. */
  const columnSelected = (columnName: string) => {
    if (_.includes([nameField?.name, descriptionField?.name, identifierField?.name], columnName)) return true;

    for (const attribute of attributesField) {
      for (const value of attribute.values) {
        if (_.includes(value.data, columnName)) return true;
      }
    }

    return false;
  };

  /** Parses and validates the uploaded file. Populates `columns` for spreadsheet files. */
  const setupImport = async (): Promise<boolean> => {
    setContinueDisabled(true);

    if (fileType === JSON_MIME_TYPE) {
      // Handle JSON data separately
      setImportLoading(true);
      const data = await parseJSONFile(fileUpload.acceptedFiles[0]);
      setImportLoading(false);

      // Validate the JSON data
      return validJSONFile(data);
    } else if (isSpreadsheetFile(fileType)) {
      // Mutation query with CSV or XLSX file
      setImportLoading(true);
      const response = await prepareEntityCSV({
        variables: {
          file: fileUpload.acceptedFiles[0],
        },
      });
      setImportLoading(false);

      if (prepareEntityCSVError || !response.data) {
        toaster.create({
          title: "CSV Import Error",
          type: "error",
          description: "Error while preparing file",
          duration: 4000,
          closable: true,
        });
        return false;
      }

      if (response.data.prepareEntityCSV.length > 0) {
        // Strip Excel placeholder columns for genuinely empty cells
        const filteredColumnSet = response.data.prepareEntityCSV.filter(
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
        toaster.create({
          title: "CSV Import Error",
          type: "error",
          description: "File is empty",
          duration: 4000,
          closable: true,
        });
        return false;
      }
    }

    // No issues with file import
    return true;
  };

  /** Fetches projects and templates to populate the mapping step dropdowns. */
  const setupMapping = async (): Promise<boolean> => {
    setImportLoading(true);
    const response = await getMappingData();
    setImportLoading(false);

    if (response.data?.templates) {
      // Templates containing entity or select values can't be mapped to CSV columns
      const supportedTemplates = response.data.templates.filter((t: AttributeModel) =>
        t.values.every((v) => !["entity", "select"].includes(v.type)),
      );
      setTemplates(supportedTemplates);
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
      toaster.create({
        title: "Import Error",
        type: "error",
        description: "Could not retrieve data for mapping columns",
        duration: 4000,
        closable: true,
      });
      return false;
    }

    return true;
  };

  /** Runs the server-side review for a JSON entity import and populates `reviewEntities`. */
  const setupReviewEntityJSON = async () => {
    setImportLoading(true);
    const response = await reviewEntityJSON({
      variables: {
        file: fileUpload.acceptedFiles[0],
      },
    });
    setImportLoading(false);

    if (response.data && response.data.reviewEntityJSON.data) {
      setReviewEntities(response.data.reviewEntityJSON.data);
    }

    if (reviewEntityJSONError) {
      toaster.create({
        title: "JSON Import Error",
        type: "error",
        description: "Error while reviewing JSON file",
        duration: 4000,
        closable: true,
      });
    }
  };

  /** Builds the column mapping object from current form state. */
  const buildColumnMapping = (): IColumnMapping => ({
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

  /** Runs the server-side review for a CSV/XLSX entity import, splicing in counter values when applicable. */
  const setupReviewEntityCSV = async () => {
    const columnMapping = buildColumnMapping();

    setImportLoading(true);
    const reviewResponse = await reviewEntityCSV({
      variables: {
        columnMapping: removeTypename(columnMapping),
        file: fileUpload.acceptedFiles[0],
      },
    });
    setImportLoading(false);

    if (reviewResponse.data && reviewResponse.data.reviewEntityCSV.data) {
      setReviewEntities(reviewResponse.data.reviewEntityCSV.data);
    }

    // Retrieve and splice in counter values if being used for names
    if (nameUseCounter && reviewResponse.data?.reviewEntityCSV?.data) {
      const reviewData = reviewResponse.data.reviewEntityCSV.data;
      const counterResponse = await getCounterValues({
        variables: {
          _id: counter,
          count: reviewData.length,
        },
      });

      const counterValues = counterResponse.data?.nextCounterValues?.data;
      if (counterValues && counterValues.length > 0) {
        const counterValuesSpliced = reviewData.map((entity: EntityImportReview, index: number) => {
          return {
            ...entity,
            name: counterValues[index],
          };
        });
        setReviewEntities(counterValuesSpliced);
      }

      if (counterValuesError || !counterValues || counterValues.length === 0) {
        toaster.create({
          title: "CSV Import Error",
          type: "error",
          description: "Error while retrieving counter values",
          duration: 4000,
          closable: true,
        });
      }
    }

    if (reviewEntityCSVError) {
      toaster.create({
        title: "CSV Import Error",
        type: "error",
        description: "Error while generating Entities for review",
        duration: 4000,
        closable: true,
      });
    }
  };

  /** Runs the server-side review for a JSON template import and populates `reviewTemplates`. */
  const setupReviewTemplateJSON = async () => {
    setImportLoading(true);
    const response = await reviewTemplateJSON({
      variables: {
        file: fileUpload.acceptedFiles[0],
      },
    });
    setImportLoading(false);

    if (response.data && response.data.reviewTemplateJSON.data) {
      setReviewTemplates(response.data.reviewTemplateJSON.data);
    }

    if (reviewTemplateJSONError) {
      toaster.create({
        title: "JSON Import Error",
        type: "error",
        description: "Error while reviewing JSON file",
        duration: 4000,
        closable: true,
      });
    }
  };

  /** Executes the final JSON entity import and resets state on success. */
  const finishImportEntityJSON = async () => {
    setImportLoading(true);
    const response = await importEntityJSON({
      variables: {
        file: fileUpload.acceptedFiles[0],
        project: projectField,
        attributes: removeTypename(attributesField),
      },
    });
    setImportLoading(false);

    if (importEntityJSONError) {
      toaster.create({
        title: "JSON Import Error",
        type: "error",
        description: "Error while importing JSON file",
        duration: 4000,
        closable: true,
      });
    }

    if (response.data?.importEntityJSON?.success === true) {
      // Close the `DialogImport` UI
      resetState();
      navigate(0);
    }
  };

  /** Executes the final CSV/XLSX entity import and resets state on success. */
  const finishImportEntityCSV = async () => {
    const columnMapping = buildColumnMapping();
    const options = { counters: nameUseCounter ? [{ field: "name", _id: counter }] : [] };

    setImportLoading(true);
    await importEntityCSV({
      variables: {
        columnMapping: removeTypename(columnMapping),
        options: removeTypename(options),
        file: fileUpload.acceptedFiles[0],
      },
    });
    setImportLoading(false);

    if (importEntityCSVError) {
      toaster.create({
        title: "CSV Import Error",
        type: "error",
        description: "Error while importing CSV file",
        duration: 4000,
        closable: true,
      });
    } else {
      resetState();
      navigate(0);
    }
  };

  /** Executes the final JSON template import and resets state on success. */
  const finishImportTemplateJSON = async () => {
    setImportLoading(true);
    await importTemplateJSON({
      variables: {
        file: fileUpload.acceptedFiles[0],
      },
    });
    setImportLoading(false);

    if (importTemplateJSONError) {
      toaster.create({
        title: "JSON Import Error",
        type: "error",
        description: "Error while importing JSON file",
        duration: 4000,
        closable: true,
      });
    } else {
      resetState();
      navigate(0);
    }
  };

  // Fetch AI column mapping suggestions when columns become available
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

  /** Renders a column-picker `Select` bound to a `ColumnInfo` value, showing the inferred type icon. */
  const getSelectComponent = (
    key: string,
    currentValue: ColumnInfo | undefined,
    onValueChange: React.Dispatch<React.SetStateAction<ColumnInfo | undefined>>,
  ) => {
    const triggerIcon = getValueTypeIconProps(currentValue?.inferredType);
    return (
      <Select.Root
        key={key}
        size={"xs"}
        rounded={"md"}
        bg={"white"}
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

  /** Steps back one page in the entity import flow, re-enabling the type selector when returning to upload. */
  const onBackClick = () => {
    if (_.isEqual(entityInterfacePage, "details")) {
      setEntityStep(0);
      setEntityInterfacePage("upload");
      setIsTypeSelectDisabled(false);
      setContinueDisabled(false);
    } else if (_.isEqual(entityInterfacePage, "mapping")) {
      setEntityStep(1);
      setEntityInterfacePage("details");
    } else if (_.isEqual(entityInterfacePage, "review")) {
      setEntityStep(2);
      setEntityInterfacePage("mapping");
    }
  };

  /** Advances the import flow one step, running any required setup or validation before proceeding. */
  const onContinueClick = async () => {
    // Disable changing the type of import unless import canceled
    setIsTypeSelectDisabled(true);

    if (_.isEqual(importType, "entities")) {
      if (_.isEqual(entityInterfacePage, "upload")) {
        // Capture event
        posthog.capture("client.import.continue", {
          importType: "entities",
          fromPage: "upload",
          toPage: "details",
        });

        // Run setup for import and mapping
        setImportLoading(true);
        const importResult = await setupImport();
        const mappingResult = await setupMapping();
        setImportLoading(false);

        if (importResult && mappingResult) {
          // Proceed to the next page if both setup steps completed successfully
          setEntityStep(1);
          setEntityInterfacePage("details");
        }
      } else if (_.isEqual(entityInterfacePage, "details")) {
        // Capture event
        posthog.capture("client.import.continue", {
          importType: "entities",
          fromPage: "details",
          toPage: "mapping",
        });

        // Proceed to the next page
        setEntityStep(2);
        setEntityInterfacePage("mapping");
      } else if (_.isEqual(entityInterfacePage, "mapping")) {
        // Validate all attributes are complete before proceeding
        const incompleteAttribute = attributesField.find(
          (attr) => attr.name === "" || attr.description === "" || !isValidValues(attr.values),
        );
        if (incompleteAttribute) {
          toaster.create({
            title: "Incomplete Attributes",
            type: "warning",
            description: "Please complete all Attributes before continuing",
            duration: 4000,
            closable: true,
          });
          return;
        }

        // Capture event
        posthog.capture("client.import.continue", {
          importType: "entities",
          fromPage: "mapping",
          toPage: "review",
        });

        // Run the review setup function depending on file type
        if (fileType === JSON_MIME_TYPE) {
          await setupReviewEntityJSON();
        } else if (isSpreadsheetFile(fileType)) {
          await setupReviewEntityCSV();
        }

        // Proceed to the next page
        setEntityStep(3);
        setEntityInterfacePage("review");
      } else if (_.isEqual(entityInterfacePage, "review")) {
        // If any rows have validation warnings, require explicit confirmation before importing
        const hasWarnings =
          isSpreadsheetFile(fileType) && reviewEntities.some((e) => e.warnings && e.warnings.length > 0);
        if (hasWarnings) {
          setConfirmWarningsOpen(true);
          return;
        }

        // Capture event
        posthog.capture("client.import.finish", {
          importType: "entities",
        });

        // Run the final import function depending on file type
        setImportLoading(true);
        if (fileType === JSON_MIME_TYPE) {
          await finishImportEntityJSON();
        } else if (isSpreadsheetFile(fileType)) {
          await finishImportEntityCSV();
        }
        setImportLoading(false);
      }
    } else if (_.isEqual(importType, "template")) {
      if (_.isEqual(templateInterfacePage, "upload")) {
        // Capture event
        posthog.capture("client.import.continue", {
          importType: "template",
          fromPage: "upload",
          toPage: "review",
        });

        // Run the review setup function for Template JSON files
        await setupReviewTemplateJSON();

        // Proceed to the next page
        setTemplateStep(1);
        setTemplateInterfacePage("review");
      } else if (_.isEqual(templateInterfacePage, "review")) {
        // Capture event
        posthog.capture("client.import.finish", {
          importType: "template",
        });

        // Run the final import function for Template JSON files
        setImportLoading(true);
        await finishImportTemplateJSON();
        setImportLoading(false);
      }
    }
  };

  const resetState = () => {
    // Reset UI state
    setImportType(undefined);
    setImportTypeSelected(false);

    setEntityStep(0);
    setEntityInterfacePage("upload");
    setTemplateStep(0);
    setTemplateInterfacePage("upload");

    setContinueDisabled(true);
    setImportLoading(false);
    setIsTypeSelectDisabled(false);

    fileUpload.clearFiles();
    setFileType("");
    setFileName("");

    // Reset import and mapping state
    setColumns([]);
    setColumnsCollection(
      createListCollection<ColumnInfo>({
        items: [] as ColumnInfo[],
        itemToValue: (item) => item.name,
        itemToString: (item) => item.name,
      }),
    );
    setSuggestions(null);
    setIsSuggesting(false);
    setNameField(undefined);
    setNameUseCounter(false);
    setCounter("");
    setDescriptionField(undefined);
    setProjectField("");
    setIdentifierField(undefined);
    setIdentifierFormat([]);
    setProjectsCollection(
      createListCollection({
        items: [] as IGenericItem[],
        itemToValue: (item: IGenericItem) => item._id,
        itemToString: (item: IGenericItem) => item.name,
      }),
    );
    setTemplates([]);
    setAddAttributeOpen(false);
    setAttributesField([]);
    setReviewEntities([]);
    setReviewTemplates([]);
    setConfirmWarningsOpen(false);
  };

  const handleOnClose = () => {
    resetState();
    props.setOpen(false);
  };

  const warningCount = reviewEntities.filter((entity) => entity.warnings && entity.warnings.length > 0).length;

  return (
    <Dialog.Root
      open={props.open}
      placement={"center"}
      size={"lg"}
      scrollBehavior={"inside"}
      onEscapeKeyDown={handleOnClose}
    >
      <DialogAlert
        open={confirmWarningsOpen}
        setOpen={setConfirmWarningsOpen}
        header={"Import with Warnings"}
        leftButtonLabel={"Cancel"}
        leftButtonColor={"red"}
        leftButtonAction={() => setConfirmWarningsOpen(false)}
        rightButtonLabel={"Import Anyway"}
        rightButtonColor={"green"}
        rightButtonAction={async () => {
          setConfirmWarningsOpen(false);
          posthog.capture("client.import.finish", { importType: "entities" });
          setImportLoading(true);
          if (fileType === JSON_MIME_TYPE) {
            await finishImportEntityJSON();
          } else if (isSpreadsheetFile(fileType)) {
            await finishImportEntityCSV();
          }
          setImportLoading(false);
        }}
      >
        <Flex direction={"column"} gap={"2"}>
          <Text fontSize={"xs"}>
            <Text as={"span"} fontWeight={"semibold"}>
              {warningCount} {warningCount === 1 ? "row has" : "rows have"}
            </Text>{" "}
            data validation warnings. Blank or default values will be substituted for any unresolvable data.
          </Text>
          <Text fontSize={"xs"}>Do you want to continue with the import?</Text>
        </Flex>
      </DialogAlert>

      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header p={"2"} flexShrink={0} bg={"surface.emphasized"} color={"text.default"} roundedTop={"md"}>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Icon name={"upload"} size={"xs"} />
              <Text fontWeight={"semibold"} fontSize={"xs"}>
                Import File
              </Text>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={handleOnClose} />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body p={"2"} gap={"2"}>
            {/* Stepper progress indicators */}
            {_.isEqual(importType, "entities") && (
              <Steps.Root
                step={entityStep}
                colorPalette={"blue"}
                onStepChange={(event) => setEntityStep(event.step)}
                count={entitySteps.length}
                p={"1"}
                size={"sm"}
              >
                <Steps.List>
                  {entitySteps.map((step, index) => (
                    <Steps.Item key={index} index={index} title={step.title} gap={"1.5"}>
                      <Steps.Indicator />
                      <Steps.Title fontSize={"xs"} fontWeight={"semibold"}>
                        {step.title}
                      </Steps.Title>
                      <Steps.Separator />
                    </Steps.Item>
                  ))}
                </Steps.List>
              </Steps.Root>
            )}

            {(_.isEqual(importType, "template") || _.isUndefined(importType)) && (
              <Steps.Root
                step={templateStep}
                colorPalette={"blue"}
                onStepChange={(event) => setTemplateStep(event.step)}
                count={templateSteps.length}
                p={"1"}
                size={"sm"}
              >
                <Steps.List>
                  {templateSteps.map((step, index) => (
                    <Steps.Item key={index} index={index} title={step.title}>
                      <Steps.Indicator />
                      <Steps.Title fontSize={"xs"} fontWeight={"semibold"}>
                        {step.title}
                      </Steps.Title>
                      <Steps.Separator />
                    </Steps.Item>
                  ))}
                </Steps.List>
              </Steps.Root>
            )}

            {/* Select import type, and upload a file */}
            {entityStep === 0 && templateStep === 0 && (
              <UploadStep
                importType={importType}
                isTypeSelectDisabled={isTypeSelectDisabled}
                onSelectImportType={selectImportType}
                fileUpload={fileUpload}
              />
            )}

            {/* Display filename and list of columns if a CSV file after upload */}
            {_.isEqual(importType, "entities") && !_.isEqual(entityInterfacePage, "upload") && (
              <Flex
                w={"100%"}
                justify={"left"}
                gap={"2"}
                align={"baseline"}
                direction={"column"}
                rounded={"md"}
                bg={"blue.50"}
                border={"1px solid"}
                borderColor={"blue.200"}
                p={"2"}
                my={"2"}
              >
                <Flex direction={"row"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    File:
                  </Text>
                  <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
                    {fileName}
                  </Text>
                </Flex>

                {isSpreadsheetFile(fileType) && (
                  <Flex w={"100%"} gap={"1"} align={"center"} justify={"left"} wrap={"wrap"}>
                    <Text fontWeight={"semibold"} fontSize={"xs"}>
                      Columns:
                    </Text>
                    <FieldTagList
                      items={columns}
                      max={MAX_DISPLAYED_COLUMNS}
                      getKey={(column) => column.name}
                      renderTag={(column) => {
                        const iconProps = getValueTypeIconProps(column.inferredType);
                        const used = columnSelected(column.name);
                        return (
                          <Tag.Root bg={used ? "green.100" : "white"} colorPalette={used ? "green" : "gray"}>
                            <Tag.StartElement>
                              <Icon name={iconProps.name} size={"xs"} color={used ? "green.600" : iconProps.color} />
                            </Tag.StartElement>
                            <Tag.Label fontSize={"xs"}>{column.name}</Tag.Label>
                          </Tag.Root>
                        );
                      }}
                    />
                  </Flex>
                )}
              </Flex>
            )}

            {/* Entity Steps */}
            {/* Entity Step 1: Simple mapping, details */}
            {_.isEqual(importType, "entities") && _.isEqual(entityInterfacePage, "details") && (
              <EntityDetailsStep
                fileType={fileType}
                columns={columns}
                namePrefixField={namePrefixField}
                onNamePrefixFieldChange={setNamePrefixField}
                nameField={nameField}
                onNameFieldChange={setNameField}
                nameUseCounter={nameUseCounter}
                onNameUseCounterChange={setNameUseCounter}
                counter={counter}
                onCounterChange={setCounter}
                onContinueDisabledChange={setContinueDisabled}
                suggestions={suggestions}
                isSuggesting={isSuggesting}
                descriptionField={descriptionField}
                onDescriptionFieldChange={setDescriptionField}
                identifierField={identifierField}
                onIdentifierFieldChange={setIdentifierField}
                identifierFormat={identifierFormat}
                onIdentifierFormatChange={setIdentifierFormat}
                projectField={projectField}
                onProjectFieldChange={setProjectField}
                projectsCollection={projectsCollection}
                ownerField={ownerField}
                getSelectComponent={getSelectComponent}
              />
            )}

            {/* Entity Step 2: Advanced mapping */}
            {_.isEqual(importType, "entities") && _.isEqual(entityInterfacePage, "mapping") && (
              <EntityMappingStep
                attributesField={attributesField}
                onAttributesFieldChange={setAttributesField}
                addAttributeOpen={addAttributeOpen}
                onAddAttributeOpenChange={setAddAttributeOpen}
                ownerField={ownerField}
                templates={templates}
                fileType={fileType}
                columns={columns}
              />
            )}

            {/* Entity Step 3: Review */}
            {_.isEqual(importType, "entities") && _.isEqual(entityInterfacePage, "review") && (
              <EntityReviewStep reviewEntities={reviewEntities} />
            )}

            {/* Template Steps */}
            {/* Template Step 1: Review */}
            {_.isEqual(importType, "template") && _.isEqual(templateInterfacePage, "review") && (
              <TemplateReviewStep reviewTemplates={reviewTemplates} />
            )}
          </Dialog.Body>

          <Dialog.Footer p={"2"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
            <Flex direction={"row"} w={"100%"} justify={"space-between"}>
              <Flex align={"center"} justify={"center"} gap={"2"}>
                <Button
                  id={"importCancelButton"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"red"}
                  variant={"solid"}
                  onClick={() => {
                    // Capture event
                    posthog.capture("client.import.cancelled", {
                      importType: importType,
                    });

                    // Close the `DialogImport`
                    handleOnClose();
                  }}
                >
                  Cancel
                  <Icon name="cross" size={"xs"} />
                </Button>
                {_.isEqual(importType, "entities") && !_.isEqual(entityInterfacePage, "upload") && (
                  <Button
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"orange"}
                    variant={"solid"}
                    onClick={onBackClick}
                    disabled={importLoading}
                  >
                    <Icon name={"c_left"} size={"xs"} />
                    Back
                  </Button>
                )}
              </Flex>

              <Flex align={"center"} justify={"center"} gap={"1"}>
                <Button
                  id={"importContinueButton"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={
                    _.isEqual(templateInterfacePage, "review") || _.isEqual(entityInterfacePage, "review")
                      ? "green"
                      : "blue"
                  }
                  variant={"solid"}
                  onClick={onContinueClick}
                  disabled={continueDisabled || importLoading}
                  loading={importLoading}
                  loadingText={"Processing"}
                >
                  {/* Default button text */}
                  {entityStep === 0 && templateStep === 0 && "Continue"}

                  {/* Entities import type */}
                  {_.isEqual(importType, "entities") && _.isEqual(entityInterfacePage, "details") && "Continue"}
                  {_.isEqual(importType, "entities") && _.isEqual(entityInterfacePage, "mapping") && "Continue"}
                  {_.isEqual(importType, "entities") && _.isEqual(entityInterfacePage, "review") && "Finish"}

                  {/* Template import type */}
                  {_.isEqual(importType, "template") && _.isEqual(templateInterfacePage, "review") && "Finish"}

                  {/* Icon */}
                  {_.includes(["upload", "details", "mapping"], entityInterfacePage) ? (
                    <Icon name={"c_right"} size={"xs"} />
                  ) : (
                    <Icon name={"check"} size={"xs"} />
                  )}
                </Button>
              </Flex>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default DialogImport;
