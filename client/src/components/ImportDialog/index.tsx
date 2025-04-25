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
  ListCollection,
  Portal,
  createListCollection,
  Steps,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import Icon from "@components/Icon";
import Attribute from "@components/AttributeCard";
import DataTable from "@components/DataTable";
import ActorTag from "@components/ActorTag";
import Tooltip from "@components/Tooltip";
import { Information } from "@components/Label";
import { toaster } from "@components/Toast";

// Custom and existing types
import {
  AttributeModel,
  AttributeCardProps,
  IGenericItem,
  EntityImportReview,
  ImportDialogProps,
  IColumnMapping,
  EntityModel,
} from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

// Authentication context
import { useAuthentication } from "@hooks/useAuthentication";

// Variables
const JSON_MIME_TYPE = "application/json";
const CSV_MIME_TYPE = "text/csv";

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
    {} as ListCollection<string>,
  );

  // Projects
  const [projectsCollection, setProjectsCollection] = useState(
    {} as ListCollection<IGenericItem>,
  );

  // Templates
  const [templatesCollection, setTemplatesCollection] = useState(
    {} as ListCollection<AttributeModel>,
  );

  // Fields to be assigned to columns
  const [namePrefixField, setNamePrefixField] = useState("");
  const [nameField, setNameField] = useState("");
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

  // Queries
  const PREPARE_ENTITY_CSV = gql`
    mutation PrepareEntityCSV($file: [Upload]!) {
      prepareEntityCSV(file: $file)
    }
  `;
  const [prepareEntityCSV, { error: prepareEntityCSVError }] =
    useMutation(PREPARE_ENTITY_CSV);

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
  const [getMappingData, { error: mappingDataError }] =
    useLazyQuery(GET_MAPPING_DATA);

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
  const [reviewEntityCSV, { error: reviewEntityCSVError }] =
    useMutation(REVIEW_ENTITY_CSV);

  const IMPORT_ENTITY_CSV = gql`
    mutation ImportEntityCSV(
      $columnMapping: ColumnMappingInput
      $file: [Upload]!
    ) {
      importEntityCSV(columnMapping: $columnMapping, file: $file) {
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
  const [reviewEntityJSON, { error: reviewEntityJSONError }] =
    useMutation(REVIEW_ENTITY_JSON);

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
  const [importEntityJSON, { error: importEntityJSONError }] =
    useMutation(IMPORT_ENTITY_JSON);

  const IMPORT_TEMPLATE_JSON = gql`
    mutation ImportTemplateJSON($file: [Upload]!) {
      importTemplateJSON(file: $file) {
        success
        message
      }
    }
  `;
  const [importTemplateJSON, { error: importTemplateJSONError }] =
    useMutation(IMPORT_TEMPLATE_JSON);

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
              <Text fontSize={"sm"} fontWeight={"semibold"}>
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
        <Flex direction={"row"} gap={"2"} align={"center"} p={"1"}>
          <Icon
            name={info.getValue() === "update" ? "edit" : "add"}
            color={info.getValue() === "update" ? "blue.600" : "green"}
          />
          <Text
            fontWeight={"semibold"}
            fontSize={"sm"}
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
    if (_.isEqual(entityInterfacePage, "upload") && fileName !== "") {
      setContinueDisabled(false);
    }
  }, [fileName]);

  // Effect to manipulate 'Continue' button state when mapping fields from CSV file
  useEffect(() => {
    if (
      _.isEqual(entityInterfacePage, "details") &&
      nameField !== "" &&
      fileType === CSV_MIME_TYPE
    ) {
      setContinueDisabled(false);
    }
  }, [nameField]);

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
    const mappingData: { columnMapping: IColumnMapping; file: unknown } = {
      columnMapping: {
        namePrefix: namePrefixField,
        name: nameField,
        description: descriptionField,
        created: dayjs(Date.now()).toISOString(),
        owner: token.orcid,
        project: projectField,
        attributes: attributesField,
      },
      file: file,
    };

    setImportLoading(true);
    const response = await reviewEntityCSV({
      variables: mappingData,
    });
    setImportLoading(false);

    if (response.data && response.data.reviewEntityCSV.data) {
      setReviewEntities(response.data.reviewEntityCSV.data);
    }

    if (reviewEntityCSVError) {
      toaster.create({
        title: "CSV Import Error",
        type: "error",
        description: "Error while reviewing CSV file",
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
        attributes: attributesField,
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

    if (response.data.importEntityJSON.success === true) {
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
    const mappingData: { columnMapping: IColumnMapping; file: unknown } = {
      columnMapping: {
        namePrefix: namePrefixField,
        name: nameField,
        description: descriptionField,
        created: dayjs(Date.now()).toISOString(),
        owner: token.orcid,
        project: projectField,
        attributes: attributesField,
      },
      file: file,
    };
    setImportLoading(true);
    await importEntityCSV({
      variables: {
        columnMapping: mappingData.columnMapping,
        file: mappingData.file,
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
        size={"sm"}
        collection={columnsCollection}
        onValueChange={(details) => onValueChange(details.items[0])}
      >
        <Select.HiddenSelect />
        <Select.Label>Select Column</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder={"Select Column"} />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {columnsCollection.items.map((column: string) => (
                <Select.Item item={column} key={column}>
                  {column}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
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
    setDescriptionField("");
    setProjectField("");
    setTemplatesCollection({} as ListCollection<AttributeModel>);
    setAttributesField([]);
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
      <Dialog.Trigger />
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header
            p={"2"}
            mt={"2"}
            fontWeight={"semibold"}
            fontSize={"lg"}
          >
            Import File
          </Dialog.Header>
          <Dialog.Body px={"2"} gap={"2"}>
            <Information
              text={
                "Files can be imported into Metadatify and used to create Entities or update existing Entities. Templates can also be imported. Select the file type being imported, then upload the file to continue."
              }
            />

            {/* Select file type of import */}
            <Flex
              direction={"row"}
              gap={"2"}
              align={"center"}
              justify={"left"}
              w={"100%"}
              py={"2"}
            >
              <Text fontWeight={"semibold"} fontSize={"sm"} color={"gray.600"}>
                File contents:
              </Text>
              <Select.Root
                key={"select-import-type"}
                w={"sm"}
                size={"sm"}
                rounded={"md"}
                collection={createListCollection({
                  items: ["Entities", "Template"],
                })}
                onValueChange={(details) =>
                  setImportType(
                    details.items[0].toLowerCase() as "entities" | "template",
                  )
                }
                disabled={isTypeSelectDisabled}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={"Select Export Type"} />
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
                      }).items.map((exportType: string) => (
                        <Select.Item
                          item={exportType}
                          key={exportType.toLowerCase()}
                        >
                          {exportType}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
              <Spacer />
              <Flex py={"2"} gap={"1"} align={"center"}>
                <Text
                  fontSize={"sm"}
                  fontWeight={"semibold"}
                  color={"gray.600"}
                >
                  Supported formats:
                </Text>
                {_.isEqual(importType, "entities") && (
                  <Tag.Root>
                    <Tag.Label>CSV</Tag.Label>
                  </Tag.Root>
                )}
                <Tag.Root>
                  <Tag.Label>JSON</Tag.Label>
                </Tag.Root>
              </Flex>
            </Flex>

            {/* Stepper progress indicators */}
            {_.isEqual(importType, "entities") && (
              <Steps.Root
                step={entityStep}
                onStepChange={(event) => setEntityStep(event.step)}
                count={entitySteps.length}
                pb={"2"}
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
                onStepChange={(event) => setTemplateStep(event.step)}
                count={templateSteps.length}
                pb={"2"}
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

            {/* Display filename and list of columns if a CSV file after upload */}
            {_.isEqual(importType, "entities") &&
              !_.isEqual(entityInterfacePage, "upload") && (
                <Flex
                  w={"100%"}
                  justify={"left"}
                  gap={"2"}
                  align={"baseline"}
                  pb={"2"}
                  direction={"column"}
                >
                  <Flex direction={"row"} gap={"2"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      File:
                    </Text>
                    <Text fontSize={"sm"} color={"gray.600"}>
                      {fileName}
                    </Text>
                  </Flex>

                  {fileType === CSV_MIME_TYPE && (
                    <Flex
                      w={"100%"}
                      gap={"2"}
                      align={"center"}
                      justify={"left"}
                      wrap={"wrap"}
                    >
                      <Text fontWeight={"semibold"} fontSize={"sm"}>
                        Columns:
                      </Text>
                      {columns.map((column) => {
                        return (
                          <Tag.Root
                            key={column}
                            colorPalette={
                              columnSelected(column) ? "green" : "gray"
                            }
                          >
                            <Tag.Label>{column}</Tag.Label>
                          </Tag.Root>
                        );
                      })}
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
                          minH={"50vh"}
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
                              <Text fontSize={"sm"} fontWeight={"semibold"}>
                                Drag file here
                              </Text>
                              <Text fontSize={"sm"}>or click to upload</Text>
                            </Flex>
                          ) : (
                            <Flex
                              direction={"column"}
                              w={"100%"}
                              justify={"center"}
                              align={"center"}
                            >
                              <Text fontSize={"sm"} fontWeight={"semibold"}>
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
                  gap={"2"}
                  p={"2"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  rounded={"md"}
                >
                  {columns.length > 0 && (
                    <Flex direction={"column"} gap={"2"} wrap={"wrap"}>
                      <Text fontSize={"sm"}>
                        Each row in the CSV file represents a new Entity that
                        will be created. Assign a column to populate the Entity
                        fields shown below.
                      </Text>
                    </Flex>
                  )}

                  {fileType === CSV_MIME_TYPE && (
                    <Fieldset.Root>
                      <Fieldset.Content>
                        <Flex direction={"row"} gap={"2"}>
                          <Field.Root>
                            <Field.Label>Name Prefix</Field.Label>
                            <Input
                              value={namePrefixField}
                              placeholder={"Name Prefix"}
                              size={"sm"}
                              rounded={"md"}
                              onChange={(event) =>
                                setNamePrefixField(event.target.value)
                              }
                            />
                            <Field.HelperText>
                              Add a prefix to each Entity name
                            </Field.HelperText>
                          </Field.Root>

                          <Field.Root
                            required
                            invalid={_.isEqual(nameField, "")}
                          >
                            <Field.Label>
                              Name
                              <Field.RequiredIndicator />
                            </Field.Label>
                            {getSelectComponent("import_name", setNameField)}
                            <Field.HelperText>
                              Column containing Entity names
                            </Field.HelperText>
                          </Field.Root>
                        </Flex>
                      </Fieldset.Content>
                    </Fieldset.Root>
                  )}

                  {fileType === JSON_MIME_TYPE && (
                    <Flex direction={"row"} gap={"2"}>
                      <Fieldset.Root>
                        <Fieldset.Content>
                          <Field.Root>
                            <Field.Label>Name Prefix</Field.Label>
                            <Input
                              value={namePrefixField}
                              placeholder={"Name Prefix"}
                              size={"sm"}
                              rounded={"md"}
                              onChange={(event) =>
                                setNamePrefixField(event.target.value)
                              }
                            />
                            <Field.HelperText>
                              Add a prefix to each Entity name
                            </Field.HelperText>
                          </Field.Root>

                          <Field.Root>
                            <Field.Label>Name</Field.Label>
                            <Input
                              size={"sm"}
                              rounded={"md"}
                              placeholder={"Defined in JSON"}
                              disabled
                              readOnly
                            />
                            <Field.HelperText>
                              Field containing Entity names
                            </Field.HelperText>
                          </Field.Root>
                        </Fieldset.Content>
                      </Fieldset.Root>
                    </Flex>
                  )}

                  <Flex direction={"row"} gap={"2"}>
                    <Fieldset.Root>
                      <Fieldset.Content>
                        {/* Description */}
                        <Field.Root>
                          <Field.Label>Description</Field.Label>
                          {getSelectComponent(
                            "import_description",
                            setDescriptionField,
                          )}
                          <Field.HelperText>
                            Column containing Entity descriptions
                          </Field.HelperText>
                        </Field.Root>

                        {/* Project */}
                        <Field.Root>
                          <Field.Label>Project</Field.Label>
                          <Select.Root
                            key={"select-project"}
                            size={"sm"}
                            collection={projectsCollection}
                            onValueChange={(details) =>
                              setProjectField(details.items[0]._id)
                            }
                          >
                            <Select.HiddenSelect />
                            <Select.Label>Select Project</Select.Label>
                            <Select.Control>
                              <Select.Trigger>
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
                                  {projectsCollection.items.map(
                                    (project: IGenericItem) => (
                                      <Select.Item
                                        item={project}
                                        key={project._id}
                                      >
                                        {project.name}
                                        <Select.ItemIndicator />
                                      </Select.Item>
                                    ),
                                  )}
                                </Select.Content>
                              </Select.Positioner>
                            </Portal>
                          </Select.Root>
                          <Field.HelperText>
                            Add Entities to a Project
                          </Field.HelperText>
                        </Field.Root>
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>

                  <Flex direction={"row"} gap={"2"} w={"50%"}>
                    {/* Owner */}
                    <Fieldset.Root>
                      <Fieldset.Content>
                        <Field.Root>
                          <Field.Label>Owner</Field.Label>
                          <Flex>
                            <ActorTag
                              orcid={ownerField}
                              fallback={"Unknown"}
                              size={"md"}
                            />
                          </Flex>
                          <Field.HelperText>
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
                  gap={"2"}
                  p={"2"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  rounded={"md"}
                >
                  {_.isEqual(fileType, CSV_MIME_TYPE) ? (
                    <Text fontSize={"sm"}>
                      Columns can be assigned to Values within Attributes. When
                      adding Values to an Attribute, select the column
                      containing the data for each Value. Use an existing
                      Template Attribute from the drop-down or create a new
                      Attribute.
                    </Text>
                  ) : (
                    <Text fontSize={"sm"}>
                      Existing attributes defined in JSON will be preserved. Use
                      an existing Template Attribute from the drop-down or
                      create a new Attribute to be added to all Entities.
                    </Text>
                  )}

                  <Flex
                    direction={"row"}
                    gap={"2"}
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
                              templatesCollection.items.length > 0
                                ? "Select an existing Template"
                                : "No Templates exist yet"
                            }
                            showArrow
                          >
                            <Select.Root
                              key={"select-template"}
                              size={"sm"}
                              collection={templatesCollection}
                              onValueChange={(details) => {
                                const selectedTemplate = details.items[0];
                                if (!_.isEqual(selectedTemplate._id, "")) {
                                  for (const template of templatesCollection.items) {
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
                              disabled={templatesCollection.items.length === 0}
                            >
                              <Select.HiddenSelect />
                              <Select.Label>Select Project</Select.Label>
                              <Select.Control>
                                <Select.Trigger>
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
                                    {templatesCollection.items.map(
                                      (template: AttributeModel) => (
                                        <Select.Item
                                          item={template}
                                          key={template._id}
                                        >
                                          {template.name}
                                          <Select.ItemIndicator />
                                        </Select.Item>
                                      ),
                                    )}
                                  </Select.Content>
                                </Select.Positioner>
                              </Portal>
                            </Select.Root>
                          </Tooltip>
                        </Field.Root>
                      </Fieldset.Content>
                    </Fieldset.Root>

                    <Button
                      size={"sm"}
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
                      <Icon name={"add"} />
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
                  gap={"2"}
                  p={"2"}
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
                    showItemCount
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
                      <Flex
                        direction={"column"}
                        minH={"50vh"}
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
                            <Text fontSize={"sm"} fontWeight={"semibold"}>
                              Drag file here
                            </Text>
                            <Text fontSize={"sm"}>or click to upload</Text>
                          </Flex>
                        ) : (
                          <Flex
                            direction={"column"}
                            w={"100%"}
                            justify={"center"}
                            align={"center"}
                          >
                            <Text fontSize={"sm"} fontWeight={"semibold"}>
                              {file.name}
                            </Text>
                          </Flex>
                        )}
                      </Flex>

                      <Field.Root>
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
                                _.isEqual(
                                  JSON_MIME_TYPE,
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
                  p={"2"}
                  direction={"column"}
                  align={"center"}
                  justify={"center"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  rounded={"md"}
                >
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    Review Template
                  </Text>
                </Flex>
              )}
          </Dialog.Body>

          <Dialog.Footer p={"2"}>
            <Flex direction={"row"} w={"100%"} justify={"space-between"}>
              <Button
                id={"importCancelButton"}
                size={"sm"}
                colorPalette={"red"}
                variant={"outline"}
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
                <Icon name="cross" />
              </Button>

              <Flex align={"center"} justify={"center"} gap={"2"}>
                <Button
                  id={"importContinueButton"}
                  size={"sm"}
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
                    <Icon name={"c_right"} />
                  ) : (
                    <Icon name={"check"} />
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
