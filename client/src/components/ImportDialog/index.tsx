// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  Button,
  Dialog,
  EmptyState,
  Text,
  Input,
  Select,
  Tag,
  Fieldset,
  Field,
  Portal,
  createListCollection,
  Steps,
  CloseButton,
  FileUpload,
  useFileUpload,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import ActorTag from "@components/ActorTag";
import AlertDialog from "@components/AlertDialog";
import AddAttributeDialog from "@components/AddAttributeDialog";
import { EmptyTag, ValueTag } from "@components/FieldTag";
import FieldTagList from "@components/FieldTagList";
import { Information } from "@components/Label";
import ViewAttributeDialog from "@components/ViewAttributeDialog";
import CounterSelect from "@components/CounterSelect";
import IdentifierFormatSelect from "@components/IdentifierFormatSelect";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";
import FileUploadList from "@components/UploadList";

// Custom and existing types
import {
  AttributeModel,
  ColumnInfo,
  IGenericItem,
  EntityImportReview,
  TemplateImportReview,
  ImportDialogProps,
  IColumnMapping,
  EntityModel,
  IResponseMessage,
  ResponseData,
} from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery, useMutation } from "@apollo/client/react";

// Utility functions and libraries
import { removeTypename, isValidValues, getValueTypeIconProps, getFileExtension } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";

// Authentication
import { auth } from "@lib/auth";

// Events
import { usePostHog } from "posthog-js/react";

// Variables
import { ACCEPTED_IMPORTS_ENTITIES, ACCEPTED_IMPORTS_TEMPLATES, STYLES } from "@variables";

// Hooks
import { usePermissions } from "@hooks/usePermissions";

// Variables
const JSON_MIME_TYPE = "application/json";
const CSV_MIME_TYPE = "text/csv";
const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_DISPLAYED_COLUMNS = 10;

/** Returns true for CSV and XLSX file types, which share the same import flow. */
const isSpreadsheetFile = (type: string) => type === CSV_MIME_TYPE || type === XLSX_MIME_TYPE;

// GraphQL documents hoisted to module scope so they are not recreated on each render
const PREPARE_ENTITY_CSV = gql`
  mutation PrepareEntityCSV($file: [Upload]!) {
    prepareEntityCSV(file: $file) {
      name
      inferredType
    }
  }
`;

const GET_MAPPING_DATA = gql`
  query GetMappingData {
    projects {
      _id
      name
    }
    templates {
      _id
      name
      description
      owner
      values {
        _id
        data
        name
        type
      }
    }
  }
`;

const REVIEW_ENTITY_CSV = gql`
  mutation ReviewEntityCSV($columnMapping: ColumnMappingInput, $file: [Upload]!) {
    reviewEntityCSV(columnMapping: $columnMapping, file: $file) {
      success
      message
      data {
        name
        state
        warnings
      }
    }
  }
`;

const GET_COUNTER_VALUES = gql`
  query GetCounterValues($_id: String!, $count: Int!) {
    nextCounterValues(_id: $_id, count: $count) {
      success
      message
      data
    }
  }
`;

const SUGGEST_COLUMN_MAPPING = gql`
  query SuggestColumnMapping($columns: [String]!) {
    suggestColumnMapping(columns: $columns) {
      name
      description
    }
  }
`;

const IMPORT_ENTITY_CSV = gql`
  mutation ImportEntityCSV($columnMapping: ColumnMappingInput, $file: [Upload]!, $options: OptionsInput) {
    importEntityCSV(columnMapping: $columnMapping, file: $file, options: $options) {
      success
      message
    }
  }
`;

const REVIEW_ENTITY_JSON = gql`
  mutation ReviewEntityJSON($file: [Upload]!) {
    reviewEntityJSON(file: $file) {
      success
      message
      data {
        name
        state
      }
    }
  }
`;

const IMPORT_ENTITY_JSON = gql`
  mutation ImportEntityJSON($file: [Upload]!, $project: String, $attributes: [AttributeInput]) {
    importEntityJSON(file: $file, project: $project, attributes: $attributes) {
      success
      message
    }
  }
`;

const REVIEW_TEMPLATE_JSON = gql`
  mutation ReviewTemplateJSON($file: [Upload]!) {
    reviewTemplateJSON(file: $file) {
      success
      message
      data {
        name
        state
      }
    }
  }
`;

const IMPORT_TEMPLATE_JSON = gql`
  mutation ImportTemplateJSON($file: [Upload]!) {
    importTemplateJSON(file: $file) {
      success
      message
    }
  }
`;

const ImportDialog = (props: ImportDialogProps) => {
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

  const getUser = async () => {
    const sessionResponse = await auth.getSession();
    if (sessionResponse.error || !sessionResponse.data) {
      toaster.create({
        title: "Error",
        description: "Session expired, please login again",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else {
      setOwnerField(sessionResponse.data.user.id);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

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

  // Setup columns for review table
  const reviewTableColumnHelper = createColumnHelper<EntityImportReview>();
  const reviewTableColumns = [
    reviewTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip content={info.getValue()} showArrow disabled={info.getValue().length < 30}>
              <Flex direction={"row"} gap={"1"} ml={"1"}>
                <Icon name={"entity"} color={STYLES.entity.color.icon} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(info.getValue(), { length: 30 })}
                </Text>
              </Flex>
            </Tooltip>
          </Flex>
        );
      },
      header: "Entity Name",
    }),
    reviewTableColumnHelper.accessor("state", {
      cell: (info) => (
        <Flex direction={"row"} gap={"1"} align={"center"} p={"1"}>
          <Icon
            name={info.getValue() === "update" ? "edit" : "add"}
            color={info.getValue() === "update" ? "blue.600" : "green"}
            size={"xs"}
          />
          <Text fontWeight={"semibold"} fontSize={"xs"} color={info.getValue() === "update" ? "blue.600" : "green"}>
            {_.capitalize(info.getValue())}
          </Text>
        </Flex>
      ),
      header: "Action",
    }),
    reviewTableColumnHelper.accessor("warnings", {
      cell: (info) => {
        const warnings = info.getValue();
        if (!warnings || warnings.length === 0) {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"} p={"1"}>
              <Icon name={"check"} color={"green"} size={"xs"} />
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"green"}>
                No Warnings
              </Text>
            </Flex>
          );
        }
        return (
          <Flex direction={"row"} gap={"1"} p={"1"}>
            {warnings.map((warning) => {
              const location = warning.split(", ")[0];
              return (
                <Tag.Root colorPalette={"orange"}>
                  <Tag.StartElement>
                    <Icon name={"warning"} color={"orange.400"} size={"xs"} />
                  </Tag.StartElement>
                  <Tag.Label>
                    <Tooltip content={warning} showArrow>
                      <Text fontSize={"xs"} color={"status.warning.emphasized"}>
                        {location}
                      </Text>
                    </Tooltip>
                  </Tag.Label>
                </Tag.Root>
              );
            })}
          </Flex>
        );
      },
      header: "Warnings",
    }),
  ];

  // Setup columns for template review table
  const templateReviewTableColumnHelper = createColumnHelper<TemplateImportReview>();
  const templateReviewTableColumns = [
    templateReviewTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip content={info.getValue()} showArrow disabled={info.getValue().length < 30}>
              <Flex direction={"row"} gap={"1"} ml={"1"}>
                <Icon name={"template"} color={STYLES.template.color.icon} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(info.getValue(), { length: 30 })}
                </Text>
              </Flex>
            </Tooltip>
          </Flex>
        );
      },
      header: "Template Name",
    }),
    templateReviewTableColumnHelper.accessor("state", {
      cell: (info) => (
        <Flex direction={"row"} gap={"1"} align={"center"} p={"1"}>
          <Icon
            name={info.getValue() === "update" ? "edit" : "add"}
            color={info.getValue() === "update" ? "blue.600" : "green"}
            size={"xs"}
          />
          <Text fontWeight={"semibold"} fontSize={"xs"} color={info.getValue() === "update" ? "blue.600" : "green"}>
            {_.capitalize(info.getValue())}
          </Text>
        </Flex>
      ),
      header: "Action",
    }),
  ];

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
      // Close the `ImportDialog` UI
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

  const onRemoveAttribute = (identifier: string) => {
    setAttributesField(attributesField.filter((attribute) => attribute._id !== identifier));
  };

  const onUpdateAttribute = (updated: AttributeModel) => {
    setAttributesField(attributesField.map((attr) => (_.isEqual(attr._id, updated._id) ? updated : attr)));
  };

  const attributeColumnHelper = createColumnHelper<AttributeModel>();
  const attributeTableColumns = [
    attributeColumnHelper.accessor("name", {
      cell: (info) => {
        const attribute = info.row.original;
        const [viewAttributeDialogOpen, setViewAttributeDialogOpen] = useState(false);
        return (
          <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"} w={"100%"}>
            <Flex direction={"row"} gap={"1"} ml={"1"}>
              <Icon name={"template"} color={STYLES.template.color.icon} size={"xs"} />
              <Text fontSize={"xs"} fontWeight={"semibold"} color={info.getValue() !== "" ? "black" : "gray.400"}>
                {info.getValue() !== "" ? info.getValue() : "Unnamed"}
              </Text>
            </Flex>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Button
                size="2xs"
                variant="subtle"
                rounded="md"
                colorPalette="gray"
                aria-label={"View Attribute"}
                onClick={() => setViewAttributeDialogOpen(true)}
              >
                Edit
                <Icon name={"edit"} size={"xs"} />
              </Button>
              <Button
                size="2xs"
                rounded="md"
                variant="subtle"
                colorPalette="red"
                aria-label={"Delete Attribute"}
                onClick={() => onRemoveAttribute(attribute._id)}
              >
                Delete
                <Icon name={"delete"} size={"xs"} />
              </Button>
              <ViewAttributeDialog
                open={viewAttributeDialogOpen}
                setOpen={setViewAttributeDialogOpen}
                attribute={attribute}
                editing={true}
                permittedDataValues={isSpreadsheetFile(fileType) ? columns : undefined}
                onAttributeUpdate={onUpdateAttribute}
              />
            </Flex>
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 320,
      },
    }),
    attributeColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <EmptyTag label={"Description"} />;
        }
        return (
          <Flex>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 32} showArrow>
              <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 32 })}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
    }),
    attributeColumnHelper.accessor("values", {
      cell: (info) => (
        <FieldTagList
          items={info.row.original.values}
          max={2}
          emptyLabel={"Values"}
          getKey={(value) => value._id}
          renderTag={(value) => <ValueTag value={value} />}
        />
      ),
      header: "Values",
    }),
  ];

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
      <AlertDialog
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
      </AlertDialog>

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

            {/* Select file type of import */}
            {entityStep === 0 && templateStep === 0 && (
              <Flex direction={"column"} gap={"2"} py={"2"}>
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                  File Contents
                </Text>
                <Flex gap={"2"}>
                  {(["entities", "template"] as const).map((type) => (
                    <Button
                      key={type}
                      size={"xs"}
                      rounded={"md"}
                      flex={"1"}
                      variant={importType === type ? "solid" : "outline"}
                      colorPalette={importType === type ? "blue" : "gray"}
                      onClick={() => selectImportType(type)}
                      disabled={isTypeSelectDisabled}
                      data-testid={`import-type-select-trigger-${type}`}
                    >
                      <Icon name={type === "entities" ? "entity" : "template"} size={"xs"} />
                      {_.capitalize(type)}
                    </Button>
                  ))}
                </Flex>
              </Flex>
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

            {/* Global Step: Upload */}
            {entityStep === 0 && templateStep === 0 && (
              <Flex w={"100%"} direction={"column"} align={"center"} justify={"center"}>
                <Fieldset.Root>
                  <Fieldset.Content>
                    <Field.Root>
                      <FileUpload.RootProvider w={"100%"} alignItems={"stretch"} gap={"2"} value={fileUpload}>
                        <FileUpload.HiddenInput />
                        <FileUpload.Dropzone>
                          <FileUpload.DropzoneContent gap={"0"}>
                            {/* Condition 1: File type not specified */}
                            {_.isUndefined(importType) && (
                              <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"} gap={"3"}>
                                <Flex direction={"row"} align={"center"} justify={"center"} gap={"2"}>
                                  <Icon name={"entity"} size={"lg"} color={STYLES.entity.color.light} />
                                  <Icon name={"template"} size={"lg"} color={STYLES.template.color.light} />
                                </Flex>
                                <Text fontSize={"xs"} fontWeight={"semibold"}>
                                  Select File Contents
                                </Text>
                              </Flex>
                            )}

                            {/* Condition 2: File type specified, no file uploaded */}
                            {fileUpload.acceptedFiles.length === 0 && !_.isUndefined(importType) && (
                              <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"} gap={"3"}>
                                <Icon
                                  name={importType === "entities" ? "entity" : "template"}
                                  size={"lg"}
                                  color={
                                    importType === "entities" ? STYLES.entity.color.light : STYLES.template.color.light
                                  }
                                />
                                <Flex direction={"column"} gap={"1"} justify={"center"} align={"center"}>
                                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                                    Click to upload {_.capitalize(importType)} file
                                  </Text>
                                  <Text fontSize={"xs"} color={"text.subtle"}>
                                    or drag and drop
                                  </Text>
                                  <Flex direction={"row"} gap={"1"} mt={"1"}>
                                    <Flex direction={"row"} gap={"1"} mt={"1"}>
                                      {(importType === "entities"
                                        ? ACCEPTED_IMPORTS_ENTITIES
                                        : ACCEPTED_IMPORTS_TEMPLATES
                                      ).map((format) => {
                                        return (
                                          <Tag.Root
                                            key={getFileExtension(format)}
                                            size={"sm"}
                                            colorPalette={"gray"}
                                            variant={"outline"}
                                          >
                                            <Tag.Label fontSize={"xs"}>{getFileExtension(format)}</Tag.Label>
                                          </Tag.Root>
                                        );
                                      })}
                                    </Flex>
                                  </Flex>
                                </Flex>
                              </Flex>
                            )}

                            {/* Condition 3: File type specified, file uploaded */}
                            {fileUpload.acceptedFiles.length > 0 && !_.isUndefined(importType) && (
                              <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"} gap={"3"}>
                                <Icon
                                  name={importType === "entities" ? "entity" : "template"}
                                  size={"xl"}
                                  color={
                                    importType === "entities" ? STYLES.entity.color.light : STYLES.template.color.light
                                  }
                                />
                                <Text fontSize={"xs"} fontWeight={"semibold"}>
                                  {fileUpload.acceptedFiles.length > 0 && fileUpload.acceptedFiles[0].name}
                                </Text>
                              </Flex>
                            )}
                          </FileUpload.DropzoneContent>
                        </FileUpload.Dropzone>
                        <FileUploadList />
                      </FileUpload.RootProvider>
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
              </Flex>
            )}

            {/* Entity Steps */}
            {/* Entity Step 1: Simple mapping, details */}
            {_.isEqual(importType, "entities") && _.isEqual(entityInterfacePage, "details") && (
              <Flex
                w={"100%"}
                direction={"column"}
                gap={"2"}
                p={"2"}
                bg={STYLES.card.bg}
                border={STYLES.border.style}
                borderColor={STYLES.border.color}
                rounded={"md"}
              >
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                  Setup
                </Text>
                {isSpreadsheetFile(fileType) && (
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Flex direction={"row"} gap={"1"}>
                        <Field.Root gap={"0.5"}>
                          <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                            Name Prefix
                          </Field.Label>
                          <Input
                            value={namePrefixField}
                            placeholder={"Name Prefix"}
                            bg={"white"}
                            size={"xs"}
                            rounded={"md"}
                            onChange={(event) => setNamePrefixField(event.target.value)}
                          />
                          <Field.HelperText fontSize={"xs"} ml={"0.5"}>
                            Append a prefix to each Entity name
                          </Field.HelperText>
                        </Field.Root>

                        <Field.Root
                          gap={"0.5"}
                          invalid={
                            (!nameUseCounter && nameField === undefined) || (nameUseCounter && _.isEqual(counter, ""))
                          }
                          required
                        >
                          <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                            Name
                            <Field.RequiredIndicator />
                          </Field.Label>
                          <Flex direction={"row"} gap={"1"} w={"100%"}>
                            {!nameUseCounter && getSelectComponent("name", nameField, setNameField)}
                            {nameUseCounter && <CounterSelect counter={counter} setCounter={setCounter} showCreate />}
                            <Button
                              size={"xs"}
                              rounded={"md"}
                              colorPalette={"blue"}
                              onClick={() => {
                                setNameUseCounter(!nameUseCounter);
                                // Reset state of name and counter fields
                                setNameField(undefined);
                                setCounter("");
                                // Disable 'Continue' button
                                setContinueDisabled(true);
                              }}
                            >
                              Use {nameUseCounter ? "Column" : "Counter"}
                              <Icon name={nameUseCounter ? "v_text" : "counter"} size={"xs"} />
                            </Button>
                          </Flex>
                          {!nameUseCounter && (
                            <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                              {isSuggesting && (
                                <>
                                  <Icon name={"lightning"} size={"xs"} color={"purple.300"} />
                                  <Text fontSize={"xs"} color={"purple.300"}>
                                    Suggesting...
                                  </Text>
                                </>
                              )}
                              {!isSuggesting && suggestions?.name && suggestions.name !== nameField?.name && (
                                <>
                                  <Icon name={"lightning"} size={"xs"} color={"purple.600"} />
                                  <Text
                                    fontSize={"xs"}
                                    color={"purple.600"}
                                    cursor={"pointer"}
                                    _hover={{ textDecoration: "underline" }}
                                    onClick={() => setNameField(columns.find((c) => c.name === suggestions.name))}
                                  >
                                    Suggested Column: {suggestions.name}
                                  </Text>
                                </>
                              )}
                            </Flex>
                          )}
                        </Field.Root>
                      </Flex>
                    </Fieldset.Content>
                  </Fieldset.Root>
                )}

                {fileType === JSON_MIME_TYPE && (
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Flex direction={"row"} gap={"1"}>
                        <Field.Root gap={"0.5"}>
                          <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                            Name Prefix
                          </Field.Label>
                          <Input
                            value={namePrefixField}
                            placeholder={"Name Prefix"}
                            size={"xs"}
                            bg={"white"}
                            rounded={"md"}
                            onChange={(event) => setNamePrefixField(event.target.value)}
                          />
                          <Field.HelperText fontSize={"xs"} ml={"0.5"}>
                            Append a prefix to each Entity name
                          </Field.HelperText>
                        </Field.Root>

                        <Field.Root gap={"0.5"}>
                          <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                            Name
                          </Field.Label>
                          <Input
                            size={"xs"}
                            bg={"white"}
                            rounded={"md"}
                            placeholder={'JSON: "name"'}
                            disabled
                            readOnly
                          />
                        </Field.Root>
                      </Flex>
                    </Fieldset.Content>
                  </Fieldset.Root>
                )}

                <Flex direction={"row"} gap={"1"}>
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Flex direction={"row"} gap={"1"}>
                        {/* Secondary Identifier */}
                        <Field.Root w={"50%"} gap={"0.5"}>
                          <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                            Secondary Identifier
                          </Field.Label>
                          {isSpreadsheetFile(fileType) ? (
                            getSelectComponent("identifier", identifierField, setIdentifierField)
                          ) : (
                            <Input
                              size={"xs"}
                              bg={"white"}
                              rounded={"md"}
                              placeholder={'JSON: "secondaryIdentifier.value"'}
                              disabled
                              readOnly
                            />
                          )}
                        </Field.Root>

                        {/* Identifier Format */}
                        <Field.Root w={"50%"} gap={"0.5"}>
                          <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                            Identifier Format
                          </Field.Label>
                          <IdentifierFormatSelect
                            format={identifierFormat}
                            setFormat={setIdentifierFormat}
                            showCreate
                          />
                        </Field.Root>
                      </Flex>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>

                <Flex direction={"row"} gap={"1"}>
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Flex direction={"row"} gap={"1"}>
                        {/* Description */}
                        <Field.Root w={"50%"} gap={"0.5"}>
                          <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                            Description
                          </Field.Label>
                          {isSpreadsheetFile(fileType) ? (
                            getSelectComponent("description", descriptionField, setDescriptionField)
                          ) : (
                            <Input
                              size={"xs"}
                              bg={"white"}
                              rounded={"md"}
                              placeholder={'JSON: "description"'}
                              disabled
                              readOnly
                            />
                          )}
                          <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                            {isSpreadsheetFile(fileType) && isSuggesting && (
                              <>
                                <Icon name={"lightning"} size={"xs"} color={"purple.300"} />
                                <Text fontSize={"xs"} color={"purple.300"}>
                                  Suggesting...
                                </Text>
                              </>
                            )}
                            {isSpreadsheetFile(fileType) &&
                              !isSuggesting &&
                              suggestions?.description &&
                              suggestions.description !== descriptionField?.name && (
                                <Flex direction={"row"} align={"center"} gap={"1"} py={"0"}>
                                  <Icon name={"lightning"} size={"xs"} color={"purple.600"} />
                                  <Text
                                    fontSize={"xs"}
                                    color={"purple.600"}
                                    cursor={"pointer"}
                                    _hover={{ textDecoration: "underline" }}
                                    onClick={() =>
                                      setDescriptionField(columns.find((c) => c.name === suggestions.description))
                                    }
                                  >
                                    Suggested Column: {suggestions.description}
                                  </Text>
                                </Flex>
                              )}
                          </Flex>
                        </Field.Root>

                        {/* Project */}
                        <Field.Root w={"50%"} gap={"0.5"}>
                          <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                            Project
                          </Field.Label>
                          <Select.Root
                            key={"select-project"}
                            size={"xs"}
                            bg={"white"}
                            rounded={"md"}
                            collection={projectsCollection}
                            value={[projectField]}
                            onValueChange={(details) => setProjectField(details.items[0]._id)}
                          >
                            <Select.HiddenSelect />
                            <Select.Control>
                              <Select.Trigger data-testid={"import-column-select-trigger-project"} rounded={"md"}>
                                <Flex direction={"row"} gap={"2"} align={"center"}>
                                  <Icon
                                    name={"project"}
                                    size={"xs"}
                                    color={projectField ? STYLES.project.color.icon : STYLES.project.color.light}
                                  />
                                  <Text fontSize={"xs"} color={projectField ? "black" : "gray.500"}>
                                    {(projectField &&
                                      projectsCollection.items.filter((project) => project._id === projectField)[0]
                                        .name) ||
                                      "Select Project"}
                                  </Text>
                                </Flex>
                              </Select.Trigger>
                              <Select.IndicatorGroup>
                                <Select.Indicator />
                              </Select.IndicatorGroup>
                            </Select.Control>
                            <Portal>
                              <Select.Positioner>
                                <Select.Content>
                                  {projectsCollection.items?.map((project: IGenericItem) => (
                                    <Select.Item item={project} key={project._id}>
                                      <Flex direction={"row"} gap={"2"} align={"center"}>
                                        <Icon name={"project"} size={"xs"} color={STYLES.project.color.icon} />
                                        {project.name}
                                      </Flex>
                                      <Select.ItemIndicator />
                                    </Select.Item>
                                  )) || []}
                                </Select.Content>
                              </Select.Positioner>
                            </Portal>
                          </Select.Root>
                        </Field.Root>
                      </Flex>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>

                <Flex direction={"row"} gap={"2"} w={"50%"}>
                  {/* Owner */}
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root gap={"0.5"}>
                        <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                          Owner
                        </Field.Label>
                        <Flex>
                          <ActorTag identifier={ownerField} fallback={"Unknown"} size={"md"} />
                        </Flex>
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>
              </Flex>
            )}

            {/* Entity Step 2: Advanced mapping */}
            {_.isEqual(importType, "entities") && _.isEqual(entityInterfacePage, "mapping") && (
              <Flex
                w={"100%"}
                direction={"column"}
                gap={"2"}
                p={"2"}
                border={STYLES.border.style}
                borderColor={STYLES.border.color}
                rounded={"md"}
              >
                <Flex direction={"row"} align={"center"} justify={"space-between"}>
                  <Flex direction={"column"} gap={"1"} ml={"0.5"}>
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Icon name={"attribute"} color={STYLES.template.color.icon} size={"xs"} />
                      <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                        Attributes
                      </Text>
                    </Flex>
                    <Information text={"Attributes created here will be appended to all imported Entities"} />
                  </Flex>
                  <Button size={"xs"} rounded={"md"} colorPalette={"green"} onClick={() => setAddAttributeOpen(true)}>
                    Add
                    <Icon name={"add"} size={"xs"} />
                  </Button>
                </Flex>

                {attributesField.length > 0 ? (
                  <DataTable
                    columns={attributeTableColumns}
                    data={attributesField}
                    visibleColumns={{}}
                    selectedRows={{}}
                  />
                ) : (
                  <Flex justify={"center"} align={"center"} minH={"80px"}>
                    <EmptyState.Root>
                      <EmptyState.Content>
                        <EmptyState.Indicator>
                          <Icon name={"attribute"} size={"lg"} color={STYLES.template.color.light} />
                        </EmptyState.Indicator>
                        <EmptyState.Description>No Attributes added</EmptyState.Description>
                      </EmptyState.Content>
                    </EmptyState.Root>
                  </Flex>
                )}

                <AddAttributeDialog
                  open={addAttributeOpen}
                  onClose={() => setAddAttributeOpen(false)}
                  owner={ownerField}
                  templates={templates}
                  entityName={""}
                  entityDescription={""}
                  permittedDataValues={isSpreadsheetFile(fileType) ? columns : undefined}
                  onAdd={(attribute) => setAttributesField([...attributesField, attribute])}
                />
              </Flex>
            )}

            {/* Entity Step 3: Review */}
            {_.isEqual(importType, "entities") && _.isEqual(entityInterfacePage, "review") && (
              <Flex w={"100%"} direction={"column"} gap={"2"} rounded={"md"}>
                <Flex
                  direction={"row"}
                  gap={"2"}
                  p={"2"}
                  align={"center"}
                  rounded={"md"}
                  bg={STYLES.entity.color.light}
                  border={"1px solid"}
                  borderColor={STYLES.entity.color.border}
                >
                  <Icon name={"entity"} size={"sm"} color={STYLES.entity.color.icon} />
                  <Flex direction={"column"} gap={"0.5"}>
                    <Text fontSize={"xs"} fontWeight={"bold"}>
                      Reviewing {reviewEntities.length} {reviewEntities.length === 1 ? "Entity" : "Entities"}
                    </Text>
                    <Text fontSize={"xs"} color={"text.subtle"}>
                      Existing Entities will be updated, new Entities will be created.
                    </Text>
                  </Flex>
                </Flex>
                <DataTable
                  columns={reviewTableColumns}
                  data={reviewEntities}
                  visibleColumns={{}}
                  selectedRows={{}}
                  showPagination
                />
              </Flex>
            )}

            {/* Template Steps */}
            {/* Template Step 1: Review */}
            {_.isEqual(importType, "template") && _.isEqual(templateInterfacePage, "review") && (
              <Flex w={"100%"} direction={"column"} gap={"2"} rounded={"md"} mt={"2"}>
                <Flex
                  direction={"row"}
                  gap={"2"}
                  p={"2"}
                  align={"center"}
                  rounded={"md"}
                  bg={STYLES.template.color.light}
                  border={"1px solid"}
                  borderColor={STYLES.template.color.border}
                >
                  <Icon name={"template"} size={"sm"} color={STYLES.template.color.icon} />
                  <Flex direction={"column"} gap={"0.5"}>
                    <Text fontSize={"xs"} fontWeight={"bold"}>
                      Reviewing {reviewTemplates.length} {reviewTemplates.length === 1 ? "Template" : "Templates"}
                    </Text>
                    <Text fontSize={"xs"} color={"text.subtle"}>
                      Existing Templates will be updated, new Templates will be created.
                    </Text>
                  </Flex>
                </Flex>
                <DataTable
                  columns={templateReviewTableColumns}
                  data={reviewTemplates}
                  visibleColumns={{}}
                  selectedRows={{}}
                  showPagination
                />
              </Flex>
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

                    // Close the `ImportDialog`
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

export default ImportDialog;
