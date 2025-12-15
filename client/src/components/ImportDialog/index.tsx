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
  Spacer,
  Fieldset,
  Field,
  Portal,
  createListCollection,
  Steps,
  CloseButton,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import ActorTag from "@components/ActorTag";
import Attribute from "@components/AttributeCard";
import CounterSelect from "@components/CounterSelect";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// Custom and existing types
import {
  AttributeModel,
  AttributeCardProps,
  IGenericItem,
  EntityImportReview,
  TemplateImportReview,
  ImportDialogProps,
  IColumnMapping,
  EntityModel,
  CSVImportData,
  IResponseMessage,
  ResponseData,
} from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery, useMutation } from "@apollo/client/react";

// Utility functions and libraries
import { removeTypename } from "src/util";
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

// Authentication context
import { useAuthentication } from "@hooks/useAuthentication";

// Variables
const JSON_MIME_TYPE = "application/json";
const CSV_MIME_TYPE = "text/csv";
const MAX_DISPLAYED_COLUMNS = 10;

// Events
import { usePostHog } from "posthog-js/react";

const ImportDialog = (props: ImportDialogProps) => {
  // Posthog
  const posthog = usePostHog();

  // File states
  const [file, setFile] = useState({} as File);
  const [fileType, setFileType] = useState(CSV_MIME_TYPE);
  const [fileName, setFileName] = useState("");

  // Operation and button states
  const [importLoading, setImportLoading] = useState(false);
  const [continueDisabled, setContinueDisabled] = useState(true);

  const navigate = useNavigate();
  const { token } = useAuthentication();

  // State to differentiate which type of file is being imported
  const [importType, setImportType] = useState(
    "entities" as "entities" | "template",
  );
  const [importTypeSelected, setImportTypeSelected] = useState(false);
  const [isTypeSelectDisabled, setIsTypeSelectDisabled] = useState(false);

  // State management to generate and present different pages
  const [entityInterfacePage, setEntityInterfacePage] = useState(
    "upload" as "upload" | "details" | "mapping" | "review",
  );
  const [templateInterfacePage, setTemplateInterfacePage] = useState(
    "upload" as "upload" | "review",
  );

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
  const [columns, setColumns] = useState([] as string[]);
  const [columnsCollection, setColumnsCollection] = useState(
    createListCollection({ items: [] as string[] }),
  );

  // Projects
  const [projectsCollection, setProjectsCollection] = useState(
    createListCollection({ items: [] as IGenericItem[] }),
  );

  // Templates
  const [templatesCollection, setTemplatesCollection] = useState(
    createListCollection({ items: [] as AttributeModel[] }),
  );

  // Fields to be assigned to columns
  const [namePrefixField, setNamePrefixField] = useState("");
  const [nameField, setNameField] = useState("");
  const [nameUseCounter, setNameUseCounter] = useState(false);
  const [counter, setCounter] = useState("");
  const [descriptionField, setDescriptionField] = useState("");
  const [ownerField] = useState(token.orcid);
  const [projectField, setProjectField] = useState("");
  const [attributesField, setAttributesField] = useState(
    [] as AttributeModel[],
  );

  // Review state
  const [reviewEntities, setReviewEntities] = useState(
    [] as EntityImportReview[],
  );
  const [reviewTemplates, setReviewTemplates] = useState(
    [] as TemplateImportReview[],
  );

  // Queries
  const PREPARE_ENTITY_CSV = gql`
    mutation PrepareEntityCSV($file: [Upload]!) {
      prepareEntityCSV(file: $file)
    }
  `;
  const [prepareEntityCSV, { error: prepareEntityCSVError }] = useMutation<{
    prepareEntityCSV: string[];
  }>(PREPARE_ENTITY_CSV);

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
        values {
          _id
          data
          name
          type
        }
      }
    }
  `;
  const [getMappingData, { error: mappingDataError }] = useLazyQuery<{
    projects: IGenericItem[];
    templates: AttributeModel[];
  }>(GET_MAPPING_DATA);

  const REVIEW_ENTITY_CSV = gql`
    mutation ReviewEntityCSV(
      $columnMapping: ColumnMappingInput
      $file: [Upload]!
    ) {
      reviewEntityCSV(columnMapping: $columnMapping, file: $file) {
        success
        message
        data {
          name
          state
        }
      }
    }
  `;
  const [reviewEntityCSV, { error: reviewEntityCSVError }] = useMutation<{
    reviewEntityCSV: ResponseData<EntityImportReview[]>;
  }>(REVIEW_ENTITY_CSV);

  const GET_COUNTER_VALUES = gql`
    query GetCounterValues($_id: String!, $count: Int!) {
      nextCounterValues(_id: $_id, count: $count) {
        success
        message
        data
      }
    }
  `;
  const [getCounterValues, { error: counterValuesError }] = useLazyQuery<{
    nextCounterValues: ResponseData<string[]>;
  }>(GET_COUNTER_VALUES);

  const IMPORT_ENTITY_CSV = gql`
    mutation ImportEntityCSV(
      $columnMapping: ColumnMappingInput
      $file: [Upload]!
      $options: OptionsInput
    ) {
      importEntityCSV(
        columnMapping: $columnMapping
        file: $file
        options: $options
      ) {
        success
        message
      }
    }
  `;
  const [importEntityCSV, { error: importEntityCSVError }] =
    useMutation(IMPORT_ENTITY_CSV);

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
  const [reviewEntityJSON, { error: reviewEntityJSONError }] = useMutation<{
    reviewEntityJSON: ResponseData<EntityImportReview[]>;
  }>(REVIEW_ENTITY_JSON);

  const IMPORT_ENTITY_JSON = gql`
    mutation ImportEntityJSON(
      $file: [Upload]!
      $project: String
      $attributes: [AttributeInput]
    ) {
      importEntityJSON(
        file: $file
        project: $project
        attributes: $attributes
      ) {
        success
        message
      }
    }
  `;
  const [importEntityJSON, { error: importEntityJSONError }] = useMutation<{
    importEntityJSON: IResponseMessage;
  }>(IMPORT_ENTITY_JSON);

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
  const [reviewTemplateJSON, { error: reviewTemplateJSONError }] = useMutation<{
    reviewTemplateJSON: ResponseData<TemplateImportReview[]>;
  }>(REVIEW_TEMPLATE_JSON);

  const IMPORT_TEMPLATE_JSON = gql`
    mutation ImportTemplateJSON($file: [Upload]!) {
      importTemplateJSON(file: $file) {
        success
        message
      }
    }
  `;
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
            <Tooltip
              content={info.getValue()}
              showArrow
              disabled={info.getValue().length < 30}
            >
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
          <Text
            fontWeight={"semibold"}
            fontSize={"xs"}
            color={info.getValue() === "update" ? "blue.600" : "green"}
          >
            {_.capitalize(info.getValue())}
          </Text>
        </Flex>
      ),
      header: "Action",
    }),
  ];

  // Setup columns for template review table
  const templateReviewTableColumnHelper =
    createColumnHelper<TemplateImportReview>();
  const templateReviewTableColumns = [
    templateReviewTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip
              content={info.getValue()}
              showArrow
              disabled={info.getValue().length < 30}
            >
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
          <Text
            fontWeight={"semibold"}
            fontSize={"xs"}
            color={info.getValue() === "update" ? "blue.600" : "green"}
          >
            {_.capitalize(info.getValue())}
          </Text>
        </Flex>
      ),
      header: "Action",
    }),
  ];

  // Effect to manipulate 'Continue' button state for 'upload' page
  useEffect(() => {
    if (
      _.isEqual(entityInterfacePage, "upload") &&
      fileName !== "" &&
      importTypeSelected
    ) {
      setContinueDisabled(false);
    }
  }, [fileName, importTypeSelected]);

  // Effect to manipulate 'Continue' button state when mapping fields from CSV file
  useEffect(() => {
    if (
      _.isEqual(entityInterfacePage, "details") &&
      nameField !== "" &&
      fileType === CSV_MIME_TYPE
    ) {
      setContinueDisabled(false);
    } else if (
      _.isEqual(entityInterfacePage, "details") &&
      !_.isEqual(counter, "") &&
      nameUseCounter
    ) {
      setContinueDisabled(false);
    }
  }, [nameField, counter]);

  // Effect to manipulate 'Continue' button state when importing JSON file
  useEffect(() => {
    if (
      _.isEqual(entityInterfacePage, "details") &&
      fileType === JSON_MIME_TYPE
    ) {
      setContinueDisabled(false);
    }
  }, [entityInterfacePage]);

  /**
   * Read a JSON file and update `Importer` state, raising errors if invalid
   * @param {File} file JSON file instance
   */
  const parseJSONFile = async (
    file: File,
  ): Promise<{ entities: EntityModel[] }> => {
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

  /**
   * Read a parsed JSON file and determine if it has valid file contents or not
   * @param parsed The parsed JSON file contents, received from `parseJSONFile`
   */
  const validJSONFile = (parsed: { entities: EntityModel[] }): boolean => {
    // Check that "entities" field exists
    if (_.isUndefined(parsed["entities"])) {
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

  /**
   * Utility function to determine if a column is selected for mapping
   * @param {string} column The column to check
   * @returns {boolean} True if the column is selected for mapping, false otherwise
   */
  const columnSelected = (column: string) => {
    if (_.includes([nameField, descriptionField], column)) return true;

    for (const attribute of attributesField) {
      for (const value of attribute.values) {
        if (_.includes(value.data, column)) return true;
      }
    }

    return false;
  };

  /**
   * Utility function to perform the initial import operations. For CSV files, execute
   * `prepareEntityCSV` query to defer the data extraction to the server.
   * For JSON files, trigger the `validJSONFile` method to handle the file
   * locally instead.
   * @return {Promise<boolean>}
   */
  const setupImport = async (): Promise<boolean> => {
    // Update state of continue button
    setContinueDisabled(true);

    // Extract data from the form
    const formData = new FormData();
    formData.append("name", file.name);
    formData.append("file", file);
    formData.append("type", fileType);

    if (fileType === JSON_MIME_TYPE) {
      // Handle JSON data separately
      setImportLoading(true);
      const data = await parseJSONFile(file);
      setImportLoading(false);

      // Validate the JSON data
      return validJSONFile(data);
    } else if (fileType === CSV_MIME_TYPE) {
      // Mutation query with CSV file
      setImportLoading(true);
      const response = await prepareEntityCSV({
        variables: {
          file: file,
        },
      });
      setImportLoading(false);

      if (prepareEntityCSVError || _.isUndefined(response.data)) {
        toaster.create({
          title: "CSV Import Error",
          type: "error",
          description: "Error while preparing file",
          duration: 4000,
          closable: true,
        });
        return false;
      }

      if (response.data && response.data.prepareEntityCSV.length > 0) {
        // Filter columns to exclude columns with no header ("__EMPTY...")
        const filteredColumnSet: string[] =
          response.data.prepareEntityCSV.filter((column: string) => {
            return !_.startsWith(column, "__EMPTY");
          });
        setColumns(filteredColumnSet);
        setColumnsCollection(
          createListCollection({ items: filteredColumnSet }),
        );

        setImportLoading(true);
        const mappingResult = await setupMapping();
        setImportLoading(false);

        // Setup the next stage of CSV import
        return mappingResult;
      } else if (response.data.prepareEntityCSV.length === 0) {
        // If the CSV file is empty, display an error message
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

  /**
   * Utility function to populate fields required for the mapping stage of importing data. Loads all Entities, Projects,
   * and Attributes.
   */
  const setupMapping = async (): Promise<boolean> => {
    setImportLoading(true);
    const response = await getMappingData();
    setImportLoading(false);

    if (response.data?.templates) {
      setTemplatesCollection(
        createListCollection({ items: response.data.templates }),
      );
    }
    if (response.data?.projects) {
      setProjectsCollection(
        createListCollection({ items: response.data.projects }),
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

  /**
   * Submit the pre-imported JSON structure and changes to the server
   * to generate a summary of the changes
   */
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

  /**
   * Submit the pre-imported CSV structure and changes to the server
   * to generate a summary of the changes
   */
  const setupReviewEntityCSV = async () => {
    // Collate data to be mapped
    const columnMapping: IColumnMapping = {
      namePrefix: namePrefixField,
      name: nameField,
      description: descriptionField,
      created: dayjs(Date.now()).toISOString(),
      owner: token.orcid,
      project: projectField,
      attributes: removeTypename(attributesField),
    };

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
        const counterValuesSpliced = reviewData.map(
          (entity: EntityImportReview, index: number) => {
            return {
              ...entity,
              name: counterValues[index],
            };
          },
        );
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

  /**
   * Submit the pre-imported Template JSON structure and changes to the server
   * to generate a summary of the changes
   */
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

  /**
   * Finish importing a JSON file
   */
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

  /**
   * Finish importing a CSV file
   */
  const finishImportEntityCSV = async () => {
    // Collate data to be mapped
    const importData: CSVImportData = {
      columnMapping: {
        namePrefix: namePrefixField,
        name: nameField,
        description: descriptionField,
        created: dayjs(Date.now()).toISOString(),
        owner: token.orcid,
        project: projectField,
        attributes: removeTypename(attributesField),
      },
      options: {
        counters: nameUseCounter ? [{ field: "name", _id: counter }] : [],
      },
      file: file,
    };

    setImportLoading(true);
    await importEntityCSV({
      variables: {
        columnMapping: removeTypename(importData.columnMapping),
        options: removeTypename(importData.options),
        file: importData.file,
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

  /**
   * Factory-like pattern to generate general `Select` components
   * @param {any} value Component value
   * @param {React.SetStateAction<any>} setValue React `useState` function to set state
   * @returns {ReactElement}
   */
  const getSelectComponent = (
    key: string,
    onValueChange: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    return (
      <Select.Root
        key={key}
        size={"xs"}
        rounded={"md"}
        collection={columnsCollection}
        onValueChange={(details) => onValueChange(details.items[0])}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger data-testid={`import-column-select-trigger-${key}`}>
            <Select.ValueText placeholder={"Select Column"} />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {columnsCollection.items?.map((column: string) => (
                <Select.Item item={column} key={column}>
                  {column}
                  <Select.ItemIndicator />
                </Select.Item>
              )) || []}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    );
  };

  // Removal callback
  const onRemoveAttribute = (identifier: string) => {
    // We need to filter the removed attribute
    setAttributesField(
      attributesField.filter((attribute) => attribute._id !== identifier),
    );
  };

  // Used to receive data from a Attribute component
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

  /**
   * Callback function to handle any click events on the Continue button
   */
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
        // Capture event
        posthog.capture("import_continue", {
          importType: "entities",
          fromPage: "mapping",
          toPage: "review",
        });

        // Run the review setup function depending on file type
        if (fileType === JSON_MIME_TYPE) {
          await setupReviewEntityJSON();
        } else if (fileType === CSV_MIME_TYPE) {
          await setupReviewEntityCSV();
        }

        // Proceed to the next page
        setEntityStep(3);
        setEntityInterfacePage("review");
      } else if (_.isEqual(entityInterfacePage, "review")) {
        // Capture event
        posthog.capture("import_finish", {
          importType: "entities",
        });

        // Run the final import function depending on file type
        setImportLoading(true);
        if (fileType === JSON_MIME_TYPE) {
          await finishImportEntityJSON();
        } else if (fileType === CSV_MIME_TYPE) {
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

  /**
   * Utility function to reset the entire `Importer` component state
   */
  const resetState = () => {
    // Reset UI state
    setImportType("entities");
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
    setColumnsCollection(createListCollection({ items: [] as string[] }));
    setNameField("");
    setNameUseCounter(false);
    setCounter("");
    setDescriptionField("");
    setProjectField("");
    setProjectsCollection(
      createListCollection({ items: [] as IGenericItem[] }),
    );
    setTemplatesCollection(
      createListCollection({ items: [] as AttributeModel[] }),
    );
    setAttributesField([]);
    setReviewEntities([]);
    setReviewTemplates([]);
  };

  /**
   * Handle closing the `Dialog` before the import process is complete
   */
  const handleOnClose = () => {
    resetState();
    props.setOpen(false);
  };

  return (
    <Dialog.Root
      open={props.open}
      placement={"center"}
      size={"xl"}
      scrollBehavior={"inside"}
      onEscapeKeyDown={handleOnClose}
      onInteractOutside={handleOnClose}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header
            p={"2"}
            fontWeight={"semibold"}
            roundedTop={"md"}
            bg={"blue.300"}
          >
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <Icon name={"upload"} size={"xs"} />
              Import File
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                size={"2xs"}
                top={"6px"}
                onClick={handleOnClose}
                _hover={{ bg: "gray.200" }}
              />
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
              >
                <Steps.List>
                  {entitySteps.map((step, index) => (
                    <Steps.Item key={index} index={index} title={step.title}>
                      <Steps.Indicator />
                      <Steps.Title>{step.title}</Steps.Title>
                      <Steps.Separator />
                    </Steps.Item>
                  ))}
                </Steps.List>
              </Steps.Root>
            )}

            {_.isEqual(importType, "template") && (
              <Steps.Root
                step={templateStep}
                colorPalette={"blue"}
                onStepChange={(event) => setTemplateStep(event.step)}
                count={templateSteps.length}
                p={"1"}
              >
                <Steps.List>
                  {templateSteps.map((step, index) => (
                    <Steps.Item key={index} index={index} title={step.title}>
                      <Steps.Indicator />
                      <Steps.Title>{step.title}</Steps.Title>
                      <Steps.Separator />
                    </Steps.Item>
                  ))}
                </Steps.List>
              </Steps.Root>
            )}

            {/* Select file type of import */}
            <Flex
              direction={"row"}
              gap={"1"}
              align={"center"}
              justify={"left"}
              w={"100%"}
              pb={"1"}
            >
              <Text fontWeight={"semibold"} fontSize={"xs"}>
                File Contents:
              </Text>
              <Select.Root
                key={"select-import-type"}
                w={"sm"}
                size={"xs"}
                rounded={"md"}
                collection={createListCollection({
                  items: ["Entities", "Template"],
                })}
                onValueChange={(details) => {
                  setImportType(
                    details.items[0].toLowerCase() as "entities" | "template",
                  );
                  setImportTypeSelected(true);
                }}
                disabled={isTypeSelectDisabled}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger data-testid={"import-type-select-trigger"}>
                    <Select.ValueText placeholder={"Select file contents"} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {createListCollection({
                        items: ["Entities", "Template"],
                      }).items.map((importType: string) => (
                        <Select.Item
                          item={importType}
                          key={importType.toLowerCase()}
                        >
                          {importType}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
              <Spacer />
              <Flex p={"1"} gap={"1"} align={"center"}>
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Supported:
                </Text>
                {_.isEqual(importType, "entities") && (
                  <Tag.Root>
                    <Tag.Label fontSize={"xs"}>CSV</Tag.Label>
                  </Tag.Root>
                )}
                <Tag.Root>
                  <Tag.Label fontSize={"xs"}>JSON</Tag.Label>
                </Tag.Root>
              </Flex>
            </Flex>

            {/* Display filename and list of columns if a CSV file after upload */}
            {_.isEqual(importType, "entities") &&
              !_.isEqual(entityInterfacePage, "upload") && (
                <Flex
                  w={"100%"}
                  justify={"left"}
                  gap={"1"}
                  align={"baseline"}
                  direction={"column"}
                  rounded={"md"}
                  bg={"gray.100"}
                  p={"1"}
                  mb={"1"}
                >
                  <Flex direction={"row"} gap={"1"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      File Name:
                    </Text>
                    <Text fontSize={"xs"} color={"gray.600"}>
                      {fileName}
                    </Text>
                  </Flex>

                  {fileType === CSV_MIME_TYPE && (
                    <Flex
                      w={"100%"}
                      gap={"1"}
                      align={"center"}
                      justify={"left"}
                      wrap={"wrap"}
                    >
                      <Text fontWeight={"semibold"} fontSize={"xs"}>
                        Columns:
                      </Text>
                      {columns.slice(0, MAX_DISPLAYED_COLUMNS).map((column) => {
                        return (
                          <Tag.Root
                            key={column}
                            colorPalette={
                              columnSelected(column) ? "green" : "blue"
                            }
                          >
                            <Tag.Label fontSize={"xs"}>{column}</Tag.Label>
                          </Tag.Root>
                        );
                      })}
                      {columns.length > MAX_DISPLAYED_COLUMNS && (
                        <Tag.Root>
                          <Tag.Label fontSize={"xs"}>
                            and {columns.length - MAX_DISPLAYED_COLUMNS} more
                          </Tag.Label>
                        </Tag.Root>
                      )}
                    </Flex>
                  )}
                </Flex>
              )}

            {/* Entity Step 1: Upload */}
            {_.isEqual(importType, "entities") &&
              _.isEqual(entityInterfacePage, "upload") && (
                <Flex
                  w={"100%"}
                  direction={"column"}
                  align={"center"}
                  justify={"center"}
                >
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root>
                        <Flex
                          direction={"column"}
                          minH={"40vh"}
                          w={"100%"}
                          align={"center"}
                          justify={"center"}
                          border={"2px"}
                          borderStyle={fileName === "" ? "dashed" : "solid"}
                          borderColor={"gray.300"}
                          rounded={"md"}
                          background={fileName === "" ? "gray.50" : "white"}
                        >
                          {_.isEqual(file, {}) ? (
                            <Flex
                              direction={"column"}
                              w={"100%"}
                              justify={"center"}
                              align={"center"}
                            >
                              <Text fontSize={"xs"} fontWeight={"semibold"}>
                                Drag file here
                              </Text>
                              <Text fontSize={"xs"}>or click to upload</Text>
                            </Flex>
                          ) : (
                            <Flex
                              direction={"column"}
                              w={"100%"}
                              justify={"center"}
                              align={"center"}
                            >
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
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            if (
                              event.target.files &&
                              event.target.files.length > 0
                            ) {
                              // Only accept defined file types
                              if (
                                _.includes(
                                  [CSV_MIME_TYPE, JSON_MIME_TYPE],
                                  event.target.files[0].type,
                                )
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
                                  description:
                                    "Please upload a JSON or CSV file",
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

            {/* Entity Step 2: Simple mapping, details */}
            {_.isEqual(importType, "entities") &&
              _.isEqual(entityInterfacePage, "details") && (
                <Flex
                  w={"100%"}
                  direction={"column"}
                  gap={"1"}
                  p={"1"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  rounded={"md"}
                >
                  {fileType === CSV_MIME_TYPE && (
                    <Fieldset.Root>
                      <Fieldset.Content>
                        <Flex direction={"row"} gap={"1"}>
                          <Field.Root>
                            <Field.Label fontSize={"xs"}>
                              Name Prefix
                            </Field.Label>
                            <Input
                              value={namePrefixField}
                              placeholder={"Name Prefix"}
                              size={"xs"}
                              rounded={"md"}
                              onChange={(event) =>
                                setNamePrefixField(event.target.value)
                              }
                            />
                            <Field.HelperText fontSize={"xs"}>
                              Add a prefix to each Entity name
                            </Field.HelperText>
                          </Field.Root>

                          <Field.Root
                            required
                            invalid={
                              (!nameUseCounter && _.isEqual(nameField, "")) ||
                              (nameUseCounter && _.isEqual(counter, ""))
                            }
                          >
                            <Field.Label fontSize={"xs"}>
                              Name
                              <Field.RequiredIndicator />
                            </Field.Label>
                            <Flex direction={"row"} gap={"1"} w={"100%"}>
                              {!nameUseCounter &&
                                getSelectComponent("name", setNameField)}
                              {nameUseCounter && (
                                <CounterSelect
                                  counter={counter}
                                  setCounter={setCounter}
                                  showCreate
                                />
                              )}
                              <Button
                                size={"xs"}
                                rounded={"md"}
                                colorPalette={"blue"}
                                onClick={() => {
                                  setNameUseCounter(!nameUseCounter);
                                  // Reset state of name and counter fields
                                  setNameField("");
                                  setCounter("");
                                  // Disable 'Continue' button
                                  setContinueDisabled(true);
                                }}
                              >
                                Use {nameUseCounter ? "Column" : "Counter"}
                                <Icon
                                  name={nameUseCounter ? "text" : "counter"}
                                  size={"xs"}
                                />
                              </Button>
                            </Flex>
                            {!nameUseCounter && (
                              <Field.HelperText fontSize={"xs"}>
                                Column containing Entity names
                              </Field.HelperText>
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
                          <Field.Root>
                            <Field.Label fontSize={"xs"}>
                              Name Prefix
                            </Field.Label>
                            <Input
                              value={namePrefixField}
                              placeholder={"Name Prefix"}
                              size={"xs"}
                              rounded={"md"}
                              onChange={(event) =>
                                setNamePrefixField(event.target.value)
                              }
                            />
                            <Field.HelperText fontSize={"xs"}>
                              Add a prefix to each Entity name
                            </Field.HelperText>
                          </Field.Root>

                          <Field.Root>
                            <Field.Label fontSize={"xs"}>Name</Field.Label>
                            <Input
                              size={"xs"}
                              rounded={"md"}
                              placeholder={"Defined in JSON"}
                              disabled
                              readOnly
                            />
                            <Field.HelperText fontSize={"xs"}>
                              Field containing Entity names
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
                          <Field.Root w={"50%"}>
                            <Field.Label fontSize={"xs"}>
                              Description
                            </Field.Label>
                            {fileType === CSV_MIME_TYPE ? (
                              getSelectComponent(
                                "description",
                                setDescriptionField,
                              )
                            ) : (
                              <Input
                                size={"xs"}
                                rounded={"md"}
                                placeholder={"Defined in JSON"}
                                disabled
                                readOnly
                              />
                            )}
                            <Field.HelperText fontSize={"xs"}>
                              {fileType === CSV_MIME_TYPE
                                ? "Column containing Entity descriptions"
                                : "Field containing Entity descriptions"}
                            </Field.HelperText>
                          </Field.Root>

                          {/* Project */}
                          <Field.Root w={"50%"}>
                            <Field.Label fontSize={"xs"}>Project</Field.Label>
                            <Select.Root
                              key={"select-project"}
                              size={"xs"}
                              rounded={"md"}
                              collection={projectsCollection}
                              onValueChange={(details) =>
                                setProjectField(details.items[0]._id)
                              }
                            >
                              <Select.HiddenSelect />
                              <Select.Control>
                                <Select.Trigger
                                  data-testid={
                                    "import-column-select-trigger-project"
                                  }
                                >
                                  <Select.ValueText
                                    placeholder={"Select Project"}
                                  />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                  <Select.Indicator />
                                </Select.IndicatorGroup>
                              </Select.Control>
                              <Portal>
                                <Select.Positioner>
                                  <Select.Content>
                                    {projectsCollection.items?.map(
                                      (project: IGenericItem) => (
                                        <Select.Item
                                          item={project}
                                          key={project._id}
                                        >
                                          {project.name}
                                          <Select.ItemIndicator />
                                        </Select.Item>
                                      ),
                                    ) || []}
                                  </Select.Content>
                                </Select.Positioner>
                              </Portal>
                            </Select.Root>
                            <Field.HelperText fontSize={"xs"}>
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
                        <Field.Root>
                          <Field.Label fontSize={"xs"}>Owner</Field.Label>
                          <Flex>
                            <ActorTag
                              orcid={ownerField}
                              fallback={"Unknown"}
                              size={"md"}
                            />
                          </Flex>
                          <Field.HelperText fontSize={"xs"}>
                            Owner of imported Entities
                          </Field.HelperText>
                        </Field.Root>
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>
                </Flex>
              )}

            {/* Entity Step 3: Advanced mapping */}
            {_.isEqual(importType, "entities") &&
              _.isEqual(entityInterfacePage, "mapping") && (
                <Flex
                  w={"100%"}
                  direction={"column"}
                  gap={"1"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  rounded={"md"}
                >
                  {_.isEqual(fileType, CSV_MIME_TYPE) ? (
                    <Text fontSize={"xs"}>
                      Columns can be assigned to Values within Attributes. When
                      adding Values to an Attribute, select the column
                      containing the data for each Value. Use an existing
                      Template Attribute from the drop-down or create a new
                      Attribute.
                    </Text>
                  ) : (
                    <Text fontSize={"xs"}>
                      Existing attributes defined in JSON will be preserved. Use
                      an existing Template Attribute from the drop-down or
                      create a new Attribute to be added to all Entities.
                    </Text>
                  )}

                  <Flex
                    direction={"row"}
                    gap={"1"}
                    align={"center"}
                    justify={"space-between"}
                    wrap={["wrap", "nowrap"]}
                  >
                    {/* Drop-down to select a Template */}
                    <Fieldset.Root maxW={"sm"}>
                      <Fieldset.Content>
                        <Field.Root>
                          <Tooltip
                            content={
                              templatesCollection.items?.length > 0
                                ? "Select an existing Template"
                                : "No Templates exist yet"
                            }
                            showArrow
                          >
                            <Select.Root
                              key={"select-template"}
                              size={"xs"}
                              rounded={"md"}
                              collection={templatesCollection}
                              onValueChange={(details) => {
                                const selectedTemplate = details.items[0];
                                if (!_.isEqual(selectedTemplate._id, "")) {
                                  for (const template of templatesCollection.items ||
                                    []) {
                                    if (
                                      _.isEqual(
                                        selectedTemplate._id,
                                        template._id,
                                      )
                                    ) {
                                      setAttributesField([
                                        ...attributesField,
                                        {
                                          _id: `a-${nanoid(6)}`,
                                          name: template.name,
                                          timestamp: template.timestamp,
                                          owner: template.owner,
                                          archived: false,
                                          description: template.description,
                                          values: template.values,
                                        },
                                      ]);
                                      break;
                                    }
                                  }
                                }
                              }}
                              disabled={templatesCollection.items?.length === 0}
                            >
                              <Select.HiddenSelect />
                              <Select.Control>
                                <Select.Trigger>
                                  <Select.ValueText
                                    placeholder={"Select Template"}
                                  />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                  <Select.Indicator />
                                </Select.IndicatorGroup>
                              </Select.Control>
                              <Portal>
                                <Select.Positioner>
                                  <Select.Content>
                                    {templatesCollection.items?.map(
                                      (template: AttributeModel) => (
                                        <Select.Item
                                          item={template}
                                          key={template._id}
                                        >
                                          {template.name}
                                          <Select.ItemIndicator />
                                        </Select.Item>
                                      ),
                                    ) || []}
                                  </Select.Content>
                                </Select.Positioner>
                              </Portal>
                            </Select.Root>
                          </Tooltip>
                        </Field.Root>
                      </Fieldset.Content>
                    </Fieldset.Root>

                    <Button
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"green"}
                      onClick={() => {
                        // Create an 'empty' Attribute and add the data structure to 'selectedAttributes'
                        setAttributesField([
                          ...attributesField,
                          {
                            _id: `a-${nanoid(6)}`,
                            name: "",
                            timestamp: dayjs(Date.now()).toISOString(),
                            owner: token.orcid,
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

                  {fileType === CSV_MIME_TYPE
                    ? // If importing from CSV, use column-mapping
                      attributesField.map((attribute) => {
                        return (
                          <Attribute
                            _id={attribute._id}
                            key={attribute._id}
                            name={attribute.name}
                            owner={attribute.owner}
                            archived={attribute.archived}
                            description={attribute.description}
                            values={attribute.values}
                            restrictDataValues={true}
                            permittedDataValues={columns}
                            onRemove={onRemoveAttribute}
                            onUpdate={onUpdateAttribute}
                          />
                        );
                      })
                    : // If importing from JSON, allow new Attributes
                      attributesField.map((attribute) => {
                        return (
                          <Attribute
                            _id={attribute._id}
                            key={attribute._id}
                            name={attribute.name}
                            owner={attribute.owner}
                            archived={attribute.archived}
                            description={attribute.description}
                            values={attribute.values}
                            restrictDataValues={true}
                            onRemove={onRemoveAttribute}
                            onUpdate={onUpdateAttribute}
                          />
                        );
                      })}
                </Flex>
              )}

            {/* Entity Step 4: Review */}
            {_.isEqual(importType, "entities") &&
              _.isEqual(entityInterfacePage, "review") && (
                <Flex
                  w={"100%"}
                  direction={"column"}
                  gap={"1"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  rounded={"md"}
                >
                  <DataTable
                    columns={reviewTableColumns}
                    data={reviewEntities}
                    visibleColumns={{}}
                    selectedRows={{}}
                    showPagination
                  />
                </Flex>
              )}

            {/* Template Step 1: Upload */}
            {_.isEqual(importType, "template") &&
              _.isEqual(templateInterfacePage, "upload") && (
                <Flex
                  w={"100%"}
                  direction={"column"}
                  align={"center"}
                  justify={"center"}
                >
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root>
                        <Flex
                          direction={"column"}
                          minH={"40vh"}
                          w={"100%"}
                          align={"center"}
                          justify={"center"}
                          border={"2px"}
                          borderStyle={fileName === "" ? "dashed" : "solid"}
                          borderColor={"gray.300"}
                          rounded={"md"}
                          background={fileName === "" ? "gray.50" : "white"}
                        >
                          {_.isEqual(file, {}) ? (
                            <Flex
                              direction={"column"}
                              w={"100%"}
                              justify={"center"}
                              align={"center"}
                            >
                              <Text fontSize={"xs"} fontWeight={"semibold"}>
                                Drag file here
                              </Text>
                              <Text fontSize={"xs"}>or click to upload</Text>
                            </Flex>
                          ) : (
                            <Flex
                              direction={"column"}
                              w={"100%"}
                              justify={"center"}
                              align={"center"}
                            >
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
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            if (
                              event.target.files &&
                              event.target.files.length > 0
                            ) {
                              // Only accept defined file types
                              if (
                                _.includes(
                                  [JSON_MIME_TYPE],
                                  event.target.files[0].type,
                                )
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
                                  description: "Please upload a JSON file",
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

            {/* Template Step 2: Review */}
            {_.isEqual(importType, "template") &&
              _.isEqual(templateInterfacePage, "review") && (
                <Flex
                  w={"100%"}
                  direction={"column"}
                  gap={"1"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  rounded={"md"}
                >
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

          <Dialog.Footer p={"1"} bg={"gray.100"} roundedBottom={"md"}>
            <Flex direction={"row"} w={"100%"} justify={"space-between"}>
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

              <Flex align={"center"} justify={"center"} gap={"1"}>
                <Button
                  id={"importContinueButton"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={
                    _.isEqual(templateInterfacePage, "review") ||
                    _.isEqual(entityInterfacePage, "review")
                      ? "green"
                      : "blue"
                  }
                  variant={"solid"}
                  onClick={onContinueClick}
                  disabled={continueDisabled || importLoading}
                  loading={importLoading}
                  loadingText={"Processing"}
                >
                  {/* Entities import type */}
                  {_.isEqual(importType, "entities") &&
                    _.isEqual(entityInterfacePage, "upload") &&
                    "Continue"}
                  {_.isEqual(importType, "entities") &&
                    _.isEqual(entityInterfacePage, "details") &&
                    "Continue"}
                  {_.isEqual(importType, "entities") &&
                    _.isEqual(entityInterfacePage, "mapping") &&
                    "Continue"}
                  {_.isEqual(importType, "entities") &&
                    _.isEqual(entityInterfacePage, "review") &&
                    "Finish"}

                  {/* Template import type */}
                  {_.isEqual(importType, "template") &&
                    _.isEqual(entityInterfacePage, "upload") &&
                    "Continue"}
                  {_.isEqual(importType, "template") &&
                    _.isEqual(entityInterfacePage, "review") &&
                    "Finish"}

                  {/* Icon */}
                  {_.includes(
                    ["upload", "details", "mapping"],
                    entityInterfacePage,
                  ) ? (
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
