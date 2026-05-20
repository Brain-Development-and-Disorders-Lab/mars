// React
import React, { ChangeEvent, useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  Button,
  Dialog,
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
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import ActorTag from "@components/ActorTag";
import AlertDialog from "@components/AlertDialog";
import Attribute from "@components/AttributeCard";
import CounterSelect from "@components/CounterSelect";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import { Information } from "@components/Label";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// Custom and existing types
import {
  AttributeModel,
  AttributeCardProps,
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
import { removeTypename, isValidValues, getValueTypeIconProps } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

// Authentication
import { auth } from "@lib/auth";

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

// Events
import { usePostHog } from "posthog-js/react";

// Variables
import { GLOBAL_STYLES } from "@variables";

// Hooks
import { useFeatures } from "@hooks/useFeatures";

const ImportDialog = (props: ImportDialogProps) => {
  // Posthog
  const posthog = usePostHog();
  const { features } = useFeatures();

  // File states
  const [file, setFile] = useState({} as File);
  const [fileType, setFileType] = useState(CSV_MIME_TYPE);
  const [fileName, setFileName] = useState("");

  // Operation and button states
  const [importLoading, setImportLoading] = useState(false);
  const [continueDisabled, setContinueDisabled] = useState(true);

  const navigate = useNavigate();

  // State to differentiate which type of file is being imported
  const [importType, setImportType] = useState<"entities" | "template">();
  const [importTypeSelected, setImportTypeSelected] = useState(false);
  const [isTypeSelectDisabled, setIsTypeSelectDisabled] = useState(false);

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

  // Templates
  const [templatesCollection, setTemplatesCollection] = useState(
    createListCollection({
      items: [] as AttributeModel[],
      itemToValue: (item: AttributeModel) => item._id,
      itemToString: (item: AttributeModel) => item.name,
    }),
  );
  const [selectedTemplateValue, setSelectedTemplateValue] = useState<string[]>([]);

  // Fields to be assigned to columns
  const [namePrefixField, setNamePrefixField] = useState("");
  const [nameField, setNameField] = useState<ColumnInfo | undefined>(undefined);
  const [nameUseCounter, setNameUseCounter] = useState(false);
  const [counter, setCounter] = useState("");
  const [descriptionField, setDescriptionField] = useState<ColumnInfo | undefined>(undefined);
  const [ownerField, setOwnerField] = useState("");
  const [projectField, setProjectField] = useState("");
  const [attributesField, setAttributesField] = useState([] as AttributeModel[]);
  const [attributeValidity, setAttributeValidity] = useState<Record<string, boolean>>({});

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
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 30 })}
              </Text>
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
                      <Text fontSize={"xs"} color={"orange.600"}>
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
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 30 })}
              </Text>
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

  // Effect to manipulate 'Continue' button state for 'upload' page
  useEffect(() => {
    if (_.isEqual(entityInterfacePage, "upload") && fileName !== "" && importTypeSelected) {
      setContinueDisabled(false);
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
      attributesField.length === 0 || attributesField.every((attr) => attributeValidity[attr._id] === true);
    setContinueDisabled(!allValid);
  }, [entityInterfacePage, attributeValidity, attributesField]);

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
    if (_.includes([nameField?.name, descriptionField?.name], columnName)) return true;

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
      const data = await parseJSONFile(file);
      setImportLoading(false);

      // Validate the JSON data
      return validJSONFile(data);
    } else if (isSpreadsheetFile(fileType)) {
      // Mutation query with CSV or XLSX file
      setImportLoading(true);
      const response = await prepareEntityCSV({
        variables: {
          file: file,
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
      setTemplatesCollection(
        createListCollection({
          items: supportedTemplates,
          itemToValue: (item: AttributeModel) => item._id,
          itemToString: (item: AttributeModel) => item.name,
        }),
      );
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
        file: file,
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
        file: file,
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
        file: file,
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
        file: file,
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
        file: file,
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
        file: file,
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
    if (!features.ai || columns.length === 0 || !isSpreadsheetFile(fileType)) return;

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
                <Icon name={"grid"} size={"xs"} color={"gray.400"} />
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
    setAttributeValidity((prev) => {
      const next = { ...prev };
      delete next[identifier];
      return next;
    });
  };

  const onAttributeValidityChange = (id: string, isValid: boolean) => {
    setAttributeValidity((prev) => ({ ...prev, [id]: isValid }));
  };

  const onUpdateAttribute = (data: AttributeCardProps) => {
    setAttributesField([
      ...attributesField.map((attribute) => {
        if (_.isEqual(attribute._id, data._id)) {
          return {
            _id: data._id,
            name: data.name,
            timestamp: attribute.timestamp,
            owner: attribute.owner,
            archived: false,
            description: data.description,
            values: data.values,
          };
        }
        return attribute;
      }),
    ]);
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
        posthog.capture("import_continue", {
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
        posthog.capture("import_continue", {
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
        posthog.capture("import_continue", {
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
        posthog.capture("import_finish", {
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
        posthog.capture("import_continue", {
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
        posthog.capture("import_finish", {
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

    setFile({} as File);
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
    setProjectsCollection(
      createListCollection({
        items: [] as IGenericItem[],
        itemToValue: (item: IGenericItem) => item._id,
        itemToString: (item: IGenericItem) => item.name,
      }),
    );
    setTemplatesCollection(
      createListCollection({
        items: [] as AttributeModel[],
        itemToValue: (item: AttributeModel) => item._id,
        itemToString: (item: AttributeModel) => item.name,
      }),
    );
    setSelectedTemplateValue([]);
    setAttributesField([]);
    setAttributeValidity({});
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
      size={"xl"}
      scrollBehavior={"inside"}
      onEscapeKeyDown={handleOnClose}
    >
      <AlertDialog
        open={confirmWarningsOpen}
        setOpen={setConfirmWarningsOpen}
        header="Import with Warnings"
        leftButtonLabel="Cancel"
        leftButtonColor="red"
        leftButtonAction={() => setConfirmWarningsOpen(false)}
        rightButtonLabel="Import Anyway"
        rightButtonColor="green"
        rightButtonAction={async () => {
          setConfirmWarningsOpen(false);
          posthog.capture("import_finish", { importType: "entities" });
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
          <Dialog.Header p={"2"} flexShrink={0} bg={GLOBAL_STYLES.dialog.headerColor} roundedTop={"md"}>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Icon name={"upload"} size={"xs"} />
              <Text fontWeight={"semibold"} fontSize={"xs"}>
                Import File
              </Text>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={handleOnClose} _hover={{ bg: "gray.200" }} />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body p={"1"} gap={"1"}>
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
              <Flex direction={"column"} gap={"1"} pb={"1"}>
                <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                  File Contents
                </Text>
                <Flex gap={"1"}>
                  {(["entities", "template"] as const).map((type) => (
                    <Button
                      key={type}
                      size={"xs"}
                      rounded={"md"}
                      flex={"1"}
                      variant={importType === type ? "solid" : "outline"}
                      colorPalette={importType === type ? "blue" : "gray"}
                      onClick={() => {
                        if (!isTypeSelectDisabled) {
                          setImportType(type);
                          setImportTypeSelected(true);
                        }
                      }}
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
                gap={"1"}
                align={"baseline"}
                direction={"column"}
                rounded={"md"}
                bg={"blue.50"}
                border={"1px solid"}
                borderColor={"blue.200"}
                p={"2"}
                my={"1"}
              >
                <Flex direction={"row"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    File:
                  </Text>
                  <Text fontSize={"xs"} color={"gray.600"}>
                    {fileName}
                  </Text>
                </Flex>

                {isSpreadsheetFile(fileType) && (
                  <Flex w={"100%"} gap={"1"} align={"center"} justify={"left"} wrap={"wrap"}>
                    <Text fontWeight={"semibold"} fontSize={"xs"}>
                      Columns:
                    </Text>
                    {columns.slice(0, MAX_DISPLAYED_COLUMNS).map((column) => {
                      const iconProps = getValueTypeIconProps(column.inferredType);
                      const used = columnSelected(column.name);
                      return (
                        <Tag.Root
                          key={column.name}
                          bg={used ? "green.100" : "white"}
                          colorPalette={used ? "green" : "gray"}
                        >
                          <Tag.StartElement>
                            <Icon name={iconProps.name} size={"xs"} color={used ? "green.600" : iconProps.color} />
                          </Tag.StartElement>
                          <Tag.Label fontSize={"xs"}>{column.name}</Tag.Label>
                        </Tag.Root>
                      );
                    })}
                    {columns.length > MAX_DISPLAYED_COLUMNS && (
                      <Tag.Root>
                        <Tag.Label fontSize={"xs"}>and {columns.length - MAX_DISPLAYED_COLUMNS} more</Tag.Label>
                      </Tag.Root>
                    )}
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
                      <Flex
                        direction={"column"}
                        minH={"40vh"}
                        w={"100%"}
                        align={"center"}
                        justify={"center"}
                        border={GLOBAL_STYLES.border.style}
                        borderStyle={fileName === "" ? "dashed" : "solid"}
                        borderColor={fileName !== "" ? "blue.300" : GLOBAL_STYLES.border.color}
                        rounded={"md"}
                        bg={fileName !== "" ? "blue.50" : "gray.50"}
                        cursor={"pointer"}
                      >
                        {/* Condition 1: File type not specified */}
                        {_.isUndefined(importType) && (
                          <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"} gap={"3"}>
                            <Flex direction={"row"} align={"center"} justify={"center"} gap={"2"}>
                              <Icon name={"entity"} size={"lg"} color={GLOBAL_STYLES.entity.lightColor} />
                              <Icon name={"template"} size={"lg"} color={GLOBAL_STYLES.template.lightColor} />
                            </Flex>
                            <Text fontSize={"xs"} fontWeight={"semibold"}>
                              Select File Contents
                            </Text>
                          </Flex>
                        )}

                        {/* Condition 2: File type specified, no file uploaded */}
                        {_.isEqual(file, {}) && !_.isUndefined(importType) && (
                          <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"} gap={"3"}>
                            <Icon
                              name={importType === "entities" ? "entity" : "template"}
                              size={"xl"}
                              color={
                                importType === "entities"
                                  ? GLOBAL_STYLES.entity.lightColor
                                  : GLOBAL_STYLES.template.lightColor
                              }
                            />
                            <Flex direction={"column"} gap={"1"} justify={"center"} align={"center"}>
                              <Text fontSize={"xs"} fontWeight={"semibold"}>
                                Click to upload {_.capitalize(importType)} file
                              </Text>
                              <Text fontSize={"xs"} color={"gray.500"}>
                                or drag and drop
                              </Text>
                              <Flex direction={"row"} gap={"1"} mt={"1"}>
                                {(importType === "entities" ? ["JSON", "CSV", "XLSX"] : ["JSON"]).map((fmt) => (
                                  <Tag.Root key={fmt} size={"sm"} colorPalette={"gray"} variant={"outline"}>
                                    <Tag.Label fontSize={"xs"}>{fmt}</Tag.Label>
                                  </Tag.Root>
                                ))}
                              </Flex>
                            </Flex>
                          </Flex>
                        )}

                        {/* Condition 3: File type specified, file uploaded */}
                        {!_.isEqual(file, {}) && !_.isUndefined(importType) && (
                          <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"} gap={"3"}>
                            <Icon
                              name={importType === "entities" ? "entity" : "template"}
                              size={"xl"}
                              color={
                                importType === "entities"
                                  ? GLOBAL_STYLES.entity.lightColor
                                  : GLOBAL_STYLES.template.lightColor
                              }
                            />
                            <Text fontSize={"xs"} fontWeight={"semibold"}>
                              {file.name}
                            </Text>
                          </Flex>
                        )}
                      </Flex>

                      <Input
                        type={"file"}
                        h={"100%"}
                        w={"100%"}
                        position={"absolute"}
                        rounded={"md"}
                        top={"0"}
                        left={"0"}
                        opacity={"0"}
                        aria-hidden={"true"}
                        disabled={_.isUndefined(importType)}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          if (event.target.files && event.target.files.length > 0) {
                            // Only accept defined file types
                            if (
                              _.includes([CSV_MIME_TYPE, XLSX_MIME_TYPE, JSON_MIME_TYPE], event.target.files[0].type)
                            ) {
                              // Capture event
                              posthog.capture("import_upload_file", {
                                importType: importType,
                                fileName: event.target.files[0].name,
                              });

                              setFileName(event.target.files[0].name);
                              setFileType(event.target.files[0].type);
                              setFile(event.target.files[0]);
                            } else {
                              toaster.create({
                                title: "Warning",
                                type: "warning",
                                description: "Please upload a JSON, CSV, or XLSX file",
                                duration: 2000,
                                closable: true,
                              });
                            }
                          }
                        }}
                      />
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
                bg={"gray.50"}
                border={GLOBAL_STYLES.border.style}
                borderColor={GLOBAL_STYLES.border.color}
                rounded={"md"}
              >
                <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                  Setup
                </Text>
                {isSpreadsheetFile(fileType) && (
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Flex direction={"row"} gap={"1"}>
                        <Field.Root gap={"0.5"}>
                          <Field.Label fontSize={"xs"} ml={"0.5"}>
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
                            Add a prefix to each Entity name
                          </Field.HelperText>
                        </Field.Root>

                        <Field.Root
                          gap={"0.5"}
                          invalid={
                            (!nameUseCounter && nameField === undefined) || (nameUseCounter && _.isEqual(counter, ""))
                          }
                          required
                        >
                          <Field.Label fontSize={"xs"} ml={"0.5"}>
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
                              <Icon name={nameUseCounter ? "text" : "counter"} size={"xs"} />
                            </Button>
                          </Flex>
                          {!nameUseCounter && (
                            <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                              <Field.HelperText fontSize={"xs"}>Column containing Entity name</Field.HelperText>
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
                                    Suggested: {suggestions.name}
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
                          <Field.Label fontSize={"xs"} ml={"0.5"}>
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
                          <Field.Label fontSize={"xs"} ml={"0.5"}>
                            Name
                          </Field.Label>
                          <Input size={"xs"} bg={"white"} rounded={"md"} placeholder={'"name"'} disabled readOnly />
                          <Field.HelperText fontSize={"xs"} ml={"0.5"}>
                            JSON field containing Entity name
                          </Field.HelperText>
                        </Field.Root>
                      </Flex>
                    </Fieldset.Content>
                  </Fieldset.Root>
                )}

                <Flex direction={"row"} gap={"1"}>
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Flex direction={"row"} gap={"1"}>
                        {/* Description */}
                        <Field.Root w={"50%"} gap={"0.5"}>
                          <Field.Label fontSize={"xs"} ml={"0.5"}>
                            Description
                          </Field.Label>
                          {isSpreadsheetFile(fileType) ? (
                            getSelectComponent("description", descriptionField, setDescriptionField)
                          ) : (
                            <Input
                              size={"xs"}
                              bg={"white"}
                              rounded={"md"}
                              placeholder={'"description"'}
                              disabled
                              readOnly
                            />
                          )}
                          <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                            <Field.HelperText fontSize={"xs"}>
                              {isSpreadsheetFile(fileType)
                                ? "Column containing Entity description"
                                : "JSON field containing Entity description"}
                            </Field.HelperText>
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
                                    Suggested: {suggestions.description}
                                  </Text>
                                </Flex>
                              )}
                          </Flex>
                        </Field.Root>

                        {/* Project */}
                        <Field.Root w={"50%"} gap={"0.5"}>
                          <Field.Label fontSize={"xs"} ml={"0.5"}>
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
                                    color={
                                      projectField ? GLOBAL_STYLES.project.iconColor : GLOBAL_STYLES.project.lightColor
                                    }
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
                                        <Icon name={"project"} size={"xs"} color={GLOBAL_STYLES.project.iconColor} />
                                        {project.name}
                                      </Flex>
                                      <Select.ItemIndicator />
                                    </Select.Item>
                                  )) || []}
                                </Select.Content>
                              </Select.Positioner>
                            </Portal>
                          </Select.Root>
                          <Field.HelperText fontSize={"xs"} ml={"0.5"}>
                            Add Entities to a Project
                          </Field.HelperText>
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
                        <Field.Label fontSize={"xs"} ml={"0.5"}>
                          Owner
                        </Field.Label>
                        <Flex>
                          <ActorTag identifier={ownerField} fallback={"Unknown"} size={"md"} />
                        </Flex>
                        <Field.HelperText fontSize={"xs"} ml={"0.5"}>
                          Owner of imported Entities
                        </Field.HelperText>
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
                bg={"gray.50"}
                border={GLOBAL_STYLES.border.style}
                borderColor={GLOBAL_STYLES.border.color}
                rounded={"md"}
              >
                <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                  Attributes
                </Text>
                <Information
                  text={
                    isSpreadsheetFile(fileType)
                      ? "Assign spreadsheet columns to Attribute values, or use an existing Template."
                      : "Existing Attributes from the JSON file will be preserved."
                  }
                />

                <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"} wrap={["wrap", "nowrap"]}>
                  {/* Drop-down to select a Template */}
                  <Fieldset.Root maxW={"sm"}>
                    <Fieldset.Content>
                      <Field.Root>
                        <Select.Root
                          key={"select-template"}
                          size={"xs"}
                          bg={"white"}
                          rounded={"md"}
                          collection={templatesCollection}
                          value={selectedTemplateValue}
                          onValueChange={(details) => {
                            const selectedTemplate = details.items[0];
                            if (!_.isEqual(selectedTemplate._id, "")) {
                              for (const template of templatesCollection.items || []) {
                                if (_.isEqual(selectedTemplate._id, template._id)) {
                                  setAttributesField([
                                    ...attributesField,
                                    {
                                      _id: `${template._id}-${nanoid(6)}`,
                                      name: template.name,
                                      timestamp: template.timestamp,
                                      owner: template.owner,
                                      archived: false,
                                      description: template.description,
                                      values: template.values,
                                    },
                                  ]);
                                  setSelectedTemplateValue([]);
                                  break;
                                }
                              }
                            }
                          }}
                          disabled={templatesCollection.items?.length === 0}
                        >
                          <Select.HiddenSelect />
                          <Select.Control>
                            <Select.Trigger rounded={"md"}>
                              <Flex direction={"row"} gap={"2"} align={"center"}>
                                <Icon name={"template"} size={"xs"} color={GLOBAL_STYLES.template.lightColor} />
                                <Text fontSize={"xs"} color={"gray.500"}>
                                  {"Select Template"}
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
                                {templatesCollection.items?.map((template: AttributeModel) => (
                                  <Select.Item item={template} key={template._id}>
                                    <Flex direction={"row"} gap={"2"} align={"center"}>
                                      <Icon name={"template"} size={"xs"} color={GLOBAL_STYLES.template.iconColor} />
                                      {template.name}
                                    </Flex>
                                    <Select.ItemIndicator />
                                  </Select.Item>
                                )) || []}
                              </Select.Content>
                            </Select.Positioner>
                          </Portal>
                        </Select.Root>
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>

                  <Button
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={() => {
                      setAttributesField([
                        ...attributesField,
                        {
                          _id: `a-${nanoid(6)}`,
                          name: "",
                          timestamp: dayjs(Date.now()).toISOString(),
                          owner: ownerField,
                          archived: false,
                          description: "",
                          values: [],
                        },
                      ]);
                    }}
                  >
                    Create
                    <Icon name={"add"} size={"xs"} />
                  </Button>
                </Flex>

                {attributesField.map((attribute) => (
                  <Attribute
                    _id={attribute._id}
                    key={attribute._id}
                    name={attribute.name}
                    owner={attribute.owner}
                    archived={attribute.archived}
                    description={attribute.description}
                    values={attribute.values}
                    restrictDataValues={true}
                    permittedDataValues={isSpreadsheetFile(fileType) ? columns : undefined}
                    onRemove={onRemoveAttribute}
                    onUpdate={onUpdateAttribute}
                    onValidityChange={onAttributeValidityChange}
                  />
                ))}
              </Flex>
            )}

            {/* Entity Step 3: Review */}
            {_.isEqual(importType, "entities") && _.isEqual(entityInterfacePage, "review") && (
              <Flex w={"100%"} direction={"column"} gap={"1"} rounded={"md"}>
                <Flex
                  direction={"row"}
                  gap={"2"}
                  p={"2"}
                  align={"center"}
                  rounded={"md"}
                  bg={"purple.50"}
                  border={"1px solid"}
                  borderColor={"purple.200"}
                >
                  <Icon name={"entity"} size={"sm"} color={GLOBAL_STYLES.entity.iconColor} />
                  <Flex direction={"column"} gap={"0.5"}>
                    <Text fontSize={"xs"} fontWeight={"bold"}>
                      Reviewing {reviewEntities.length} {reviewEntities.length === 1 ? "Entity" : "Entities"}
                    </Text>
                    <Text fontSize={"xs"} color={"gray.500"}>
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
              <Flex w={"100%"} direction={"column"} gap={"1"} rounded={"md"}>
                <Flex
                  direction={"row"}
                  gap={"2"}
                  p={"2"}
                  align={"center"}
                  rounded={"md"}
                  bg={"teal.50"}
                  border={"1px solid"}
                  borderColor={"teal.200"}
                >
                  <Icon name={"template"} size={"sm"} color={GLOBAL_STYLES.template.iconColor} />
                  <Flex direction={"column"} gap={"0.5"}>
                    <Text fontSize={"xs"} fontWeight={"bold"}>
                      Reviewing {reviewTemplates.length} {reviewTemplates.length === 1 ? "Template" : "Templates"}
                    </Text>
                    <Text fontSize={"xs"} color={"gray.500"}>
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

          <Dialog.Footer p={"2"} bg={GLOBAL_STYLES.dialog.footerColor} roundedBottom={"md"}>
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
                    posthog.capture("import_cancelled", {
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
                  {_.isEqual(importType, "template") && _.isEqual(entityInterfacePage, "review") && "Finish"}

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
