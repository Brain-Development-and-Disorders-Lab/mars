// React
import React, { ChangeEvent, useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  Button,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Input,
  ModalFooter,
  FormControl,
  Select,
  FormLabel,
  Tag,
  useSteps,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  Box,
  StepTitle,
  StepSeparator,
  FormHelperText,
  Tooltip,
  Spacer,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import Icon from "@components/Icon";
import Attribute from "@components/AttributeCard";
import DataTable from "@components/DataTable";
import ActorTag from "@components/ActorTag";
import { Information } from "@components/Label";
import CounterSelect from "@components/CounterSelect";

// Custom and existing types
import {
  AttributeModel,
  AttributeCardProps,
  IGenericItem,
  EntityImportReview,
  ImportModalProps,
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

const ImportModal = (props: ImportModalProps) => {
  // Posthog
  const posthog = usePostHog();

  // File states
  const [file, setFile] = useState({} as File);
  const [fileType, setFileType] = useState(CSV_MIME_TYPE);
  const [fileName, setFileName] = useState("");

  // Page states
  const [isLoaded, setIsLoaded] = useState(false);

  // Operation and button states
  const [importLoading, setImportLoading] = useState(false);
  const [continueDisabled, setContinueDisabled] = useState(true);

  const navigate = useNavigate();
  const toast = useToast();
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
  const entitySteps = [
    { title: "Upload File" },
    { title: "Setup Entities" },
    { title: "Apply Templates" },
    { title: "Review" },
  ];
  const { activeStep: activeEntityStep, setActiveStep: setActiveEntityStep } =
    useSteps({
      index: 0,
      count: entitySteps.length,
    });

  const templateSteps = [{ title: "Upload File" }, { title: "Review" }];
  const {
    activeStep: activeTemplateStep,
    setActiveStep: setActiveTemplateStep,
  } = useSteps({
    index: 0,
    count: templateSteps.length,
  });

  // Spreadsheet column state
  const [columns, setColumns] = useState([] as string[]);

  // Data used to assign for mapping
  const [projects, setProjects] = useState([] as IGenericItem[]);

  // Fields to be assigned to columns
  const [namePrefixField, setNamePrefixField] = useState("");
  const [nameField, setNameField] = useState("");
  const [useCounter, setUseCounter] = useState(false);
  const [counter, setCounter] = useState("");
  const [descriptionField, setDescriptionField] = useState("");
  const [ownerField] = useState(token.orcid);
  const [projectField, setProjectField] = useState("");
  const [templates, setTemplates] = useState([] as AttributeModel[]);
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
  const [
    getMappingData,
    { loading: mappingDataLoading, error: mappingDataError },
  ] = useLazyQuery(GET_MAPPING_DATA);

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
              label={info.getValue()}
              hasArrow
              isDisabled={info.getValue().length < 30}
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
      !useCounter &&
      nameField !== "" &&
      fileType === CSV_MIME_TYPE
    ) {
      setContinueDisabled(false);
    }
  }, [nameField]);

  // Effect to manipulate 'Continue' button state when mapping fields from CSV file
  useEffect(() => {
    if (
      _.isEqual(entityInterfacePage, "details") &&
      useCounter &&
      counter !== "" &&
      fileType === CSV_MIME_TYPE
    ) {
      setContinueDisabled(false);
    }
  }, [counter]);

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
      toast({
        title: "JSON Import Error",
        status: "error",
        description: "Could not parse file contents",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
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
      toast({
        title: "JSON Import Error",
        status: "error",
        description: 'File does not contain top-level "entities" key',
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      return false;
    }

    // Check that it contains `EntityModel` instances
    if (parsed.entities.length === 0) {
      toast({
        title: "JSON Import Error",
        status: "error",
        description: "File does not contain any Entity data",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
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
        toast({
          title: "CSV Import Error",
          status: "error",
          description: "Error while preparing file",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        return false;
      }

      if (response.data && response.data.prepareEntityCSV.length > 0) {
        // Filter columns to exclude columns with no header ("__EMPTY...")
        const filteredColumnSet = response.data.prepareEntityCSV.filter(
          (column: string) => {
            return !_.startsWith(column, "__EMPTY");
          },
        );
        setColumns(filteredColumnSet);

        setImportLoading(true);
        const mappingResult = await setupMapping();
        setImportLoading(false);

        // Setup the next stage of CSV import
        return mappingResult;
      } else if (response.data.prepareEntityCSV.length === 0) {
        // If the CSV file is empty, display an error message
        toast({
          title: "CSV Import Error",
          status: "error",
          description: "File is empty",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
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
    setIsLoaded(!mappingDataLoading);
    setImportLoading(true);
    const response = await getMappingData();
    setImportLoading(false);

    if (response.data?.templates) {
      setTemplates(response.data.templates);
    }
    if (response.data?.projects) {
      setProjects(response.data.projects);
    }

    if (mappingDataError) {
      toast({
        title: "Import Error",
        status: "error",
        description: "Could not retrieve data for mapping columns",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      return false;
    }

    setIsLoaded(!mappingDataLoading);
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
      toast({
        title: "JSON Import Error",
        status: "error",
        description: "Error while reviewing JSON file",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  /**
   * Submit the pre-imported CSV structure and changes to the server
   * to generate a summary of the changes
   */
  const setupReviewEntityCSV = async () => {
    // Collate data to be mapped
    const mappingData: { columnMapping: any; file: any } = {
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
      toast({
        title: "CSV Import Error",
        status: "error",
        description: "Error while reviewing CSV file",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
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
      toast({
        title: "JSON Import Error",
        status: "error",
        description: "Error while importing JSON file",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    if (response.data.importEntityJSON.success === true) {
      // Close the `ImportModal` UI
      props.onClose();
      resetState();
      navigate(0);
    }
  };

  /**
   * Finish importing a CSV file
   */
  const finishImportEntityCSV = async () => {
    // Collate data to be mapped
    const mappingData: { columnMapping: IColumnMapping; file: any } = {
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
      toast({
        title: "CSV Import Error",
        status: "error",
        description: "Error while importing CSV file",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    } else {
      props.onClose();
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
      toast({
        title: "JSON Import Error",
        status: "error",
        description: "Error while importing JSON file",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    } else {
      props.onClose();
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
    id: string,
    value: any,
    setValue: React.SetStateAction<any>,
  ) => {
    return (
      <Select
        id={id}
        size={"sm"}
        rounded={"md"}
        placeholder={"Select Column"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {columns.map((column) => {
          return (
            <option key={column} value={column}>
              {column}
            </option>
          );
        })}
      </Select>
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
          setActiveEntityStep(1);
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
        setActiveEntityStep(2);
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
        setActiveEntityStep(3);
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
        setActiveTemplateStep(1);
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

    setActiveEntityStep(0);
    setEntityInterfacePage("upload");
    setActiveTemplateStep(0);
    setTemplateInterfacePage("upload");

    setContinueDisabled(true);
    setImportLoading(false);
    setIsTypeSelectDisabled(false);

    setFile({} as File);
    setFileType("");
    setFileName("");

    // Reset import and mapping state
    setColumns([]);
    setNameField("");
    setDescriptionField("");
    setProjectField("");
    setTemplates([]);
    setAttributesField([]);
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      isCentered
      size={"4xl"}
      scrollBehavior={"inside"}
    >
      <ModalOverlay />
      <ModalContent p={"2"} gap={"0"}>
        <ModalHeader p={"2"}>Import File</ModalHeader>
        <ModalCloseButton />
        <ModalBody px={"2"} gap={"2"}>
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
            <Flex>
              <Select
                value={importType}
                onChange={(event) =>
                  setImportType(event.target.value as "entities" | "template")
                }
                size={"sm"}
                rounded={"md"}
                isDisabled={isTypeSelectDisabled}
              >
                <option value={"entities"}>Entities</option>
                <option value={"template"}>Template</option>
              </Select>
            </Flex>
            <Spacer />
            <Flex py={"2"} gap={"1"} align={"center"}>
              <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.600"}>
                Supported formats:
              </Text>
              {_.isEqual(importType, "entities") && <Tag size={"sm"}>CSV</Tag>}
              <Tag size={"sm"}>JSON</Tag>
            </Flex>
          </Flex>

          {/* Stepper progress indicators */}
          {_.isEqual(importType, "entities") && (
            <Flex pb={"2"}>
              <Stepper index={activeEntityStep} w={"100%"}>
                {entitySteps.map((step, index) => (
                  <Step key={index}>
                    <StepIndicator>
                      <StepStatus
                        complete={<StepIcon />}
                        incomplete={<StepNumber />}
                        active={<StepNumber />}
                      />
                    </StepIndicator>

                    <Box flexShrink={"0"}>
                      <StepTitle>
                        <Text fontSize={"sm"}>{step.title}</Text>
                      </StepTitle>
                    </Box>

                    <StepSeparator />
                  </Step>
                ))}
              </Stepper>
            </Flex>
          )}

          {_.isEqual(importType, "template") && (
            <Flex pb={"2"}>
              <Stepper index={activeTemplateStep} w={"100%"}>
                {templateSteps.map((step, index) => (
                  <Step key={index}>
                    <StepIndicator>
                      <StepStatus
                        complete={<StepIcon />}
                        incomplete={<StepNumber />}
                        active={<StepNumber />}
                      />
                    </StepIndicator>

                    <Box flexShrink={"0"}>
                      <StepTitle>
                        <Text fontSize={"sm"}>{step.title}</Text>
                      </StepTitle>
                    </Box>

                    <StepSeparator />
                  </Step>
                ))}
              </Stepper>
            </Flex>
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
                        <Tag
                          size={"sm"}
                          key={column}
                          colorScheme={
                            columnSelected(column) ? "green" : "gray"
                          }
                        >
                          {column}
                        </Tag>
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
                <FormControl>
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
                      if (event.target.files && event.target.files.length > 0) {
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
                          toast({
                            title: "Warning",
                            status: "warning",
                            description: "Please upload a JSON or CSV file",
                            duration: 2000,
                            position: "bottom-right",
                            isClosable: true,
                          });
                        }
                      }
                    }}
                  />
                </FormControl>
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
                      Each row in the CSV file represents a new Entity that will
                      be created. Assign a column to populate the Entity fields
                      shown below.
                    </Text>
                  </Flex>
                )}

                {fileType === CSV_MIME_TYPE && (
                  <Flex direction={"row"} gap={"2"}>
                    <FormControl>
                      <FormLabel fontSize={"sm"}>Name Prefix</FormLabel>
                      <Input
                        value={namePrefixField}
                        placeholder={"Name Prefix"}
                        size={"sm"}
                        rounded={"md"}
                        onChange={(event) =>
                          setNamePrefixField(event.target.value)
                        }
                      />
                      <FormHelperText>
                        Add a prefix to each Entity name
                      </FormHelperText>
                    </FormControl>
                    <FormControl
                      isRequired
                      isInvalid={
                        (!useCounter && _.isEqual(nameField, "")) ||
                        (useCounter && _.isEqual(counter, ""))
                      }
                    >
                      <FormLabel fontSize={"sm"}>Name</FormLabel>
                      <Flex gap={"2"} justify={"space-between"}>
                        {useCounter ? (
                          <CounterSelect
                            counter={counter}
                            setCounter={setCounter}
                            showCreate
                          />
                        ) : (
                          getSelectComponent(
                            "import_name",
                            nameField,
                            setNameField,
                          )
                        )}
                        <Flex>
                          <Button
                            size={"sm"}
                            onClick={() => {
                              setUseCounter(!useCounter);

                              // Reset the stored name and counter
                              setNameField("");
                              setCounter("");
                              setContinueDisabled(true);
                            }}
                            colorScheme={"blue"}
                          >
                            Use {useCounter ? "Text" : "Counter"}
                          </Button>
                        </Flex>
                      </Flex>
                      <FormHelperText>
                        Column containing Entity names
                      </FormHelperText>
                    </FormControl>
                  </Flex>
                )}

                {fileType === JSON_MIME_TYPE && (
                  <Flex direction={"row"} gap={"2"}>
                    <FormControl>
                      <FormLabel fontSize={"sm"}>Name Prefix</FormLabel>
                      <Input
                        value={namePrefixField}
                        placeholder={"Name Prefix"}
                        size={"sm"}
                        rounded={"md"}
                        onChange={(event) =>
                          setNamePrefixField(event.target.value)
                        }
                      />
                      <FormHelperText>
                        Add a prefix to each Entity name
                      </FormHelperText>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize={"sm"}>Name</FormLabel>
                      <Select
                        size={"sm"}
                        rounded={"md"}
                        placeholder={"Defined in JSON"}
                        isDisabled
                        isReadOnly
                      />
                      <FormHelperText>
                        Field containing Entity names
                      </FormHelperText>
                    </FormControl>
                  </Flex>
                )}

                <Flex direction={"row"} gap={"2"}>
                  {/* Description */}
                  <FormControl>
                    <FormLabel fontSize={"sm"}>Description</FormLabel>
                    {getSelectComponent(
                      "import_description",
                      descriptionField,
                      setDescriptionField,
                    )}
                    <FormHelperText>
                      Column containing Entity descriptions
                    </FormHelperText>
                  </FormControl>

                  {/* Project */}
                  <FormControl>
                    <FormLabel fontSize={"sm"}>Project</FormLabel>
                    <Select
                      id={"import_projects"}
                      size={"sm"}
                      rounded={"md"}
                      placeholder={"Select Project"}
                      value={projectField}
                      onChange={(event) => setProjectField(event.target.value)}
                    >
                      {projects.map((project) => {
                        return (
                          <option key={project._id} value={project._id}>
                            {project.name}
                          </option>
                        );
                      })}
                    </Select>
                    <FormHelperText>Add Entities to a Project</FormHelperText>
                  </FormControl>
                </Flex>

                <Flex direction={"row"} gap={"2"} w={"50%"}>
                  {/* Owner */}
                  <FormControl>
                    <FormLabel fontSize={"sm"}>Owner</FormLabel>
                    <Flex>
                      <ActorTag orcid={ownerField} fallback={"Unknown"} />
                    </Flex>
                    <FormHelperText>Owner of imported Entities</FormHelperText>
                  </FormControl>
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
                    adding Values to an Attribute, select the column containing
                    the data for each Value. Use an existing Template Attribute
                    from the drop-down or create a new Attribute.
                  </Text>
                ) : (
                  <Text fontSize={"sm"}>
                    Existing attributes defined in JSON will be preserved. Use
                    an existing Template Attribute from the drop-down or create
                    a new Attribute to be added to all Entities.
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
                  <FormControl maxW={"sm"}>
                    <Tooltip
                      label={
                        templates.length > 0
                          ? "Select an existing Template"
                          : "No Templates exist yet"
                      }
                      hasArrow
                    >
                      <Select
                        size={"sm"}
                        placeholder={"Select Template Attribute"}
                        isDisabled={templates.length === 0}
                        onChange={(event) => {
                          if (!_.isEqual(event.target.value.toString(), "")) {
                            for (const template of templates) {
                              if (
                                _.isEqual(
                                  event.target.value.toString(),
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
                      >
                        {isLoaded &&
                          templates.map((template) => {
                            return (
                              <option key={template._id} value={template._id}>
                                {template.name}
                              </option>
                            );
                          })}
                        ;
                      </Select>
                    </Tooltip>
                  </FormControl>

                  <Button
                    size={"sm"}
                    rightIcon={<Icon name={"add"} />}
                    colorScheme={"green"}
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
                <FormControl>
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
                      if (event.target.files && event.target.files.length > 0) {
                        // Only accept defined file types
                        if (
                          _.isEqual(JSON_MIME_TYPE, event.target.files[0].type)
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
                          toast({
                            title: "Warning",
                            status: "warning",
                            description: "Please upload a JSON file",
                            duration: 2000,
                            position: "bottom-right",
                            isClosable: true,
                          });
                        }
                      }
                    }}
                  />
                </FormControl>
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
        </ModalBody>

        <ModalFooter p={"2"}>
          <Flex direction={"row"} w={"100%"} justify={"space-between"}>
            <Button
              id={"importCancelButton"}
              size={"sm"}
              colorScheme={"red"}
              rightIcon={<Icon name="cross" />}
              variant={"outline"}
              onClick={() => {
                // Capture event
                posthog.capture("import_cancelled", {
                  importType: importType,
                });

                // Close the `ImportModal`
                props.onClose();
                resetState();
              }}
            >
              Cancel
            </Button>

            <Flex align={"center"} justify={"center"} gap={"2"}>
              {/* {importLoading && <Spinner size={"sm"} />} */}
              <Button
                id={"importContinueButton"}
                size={"sm"}
                colorScheme={
                  _.isEqual(templateInterfacePage, "review") ||
                  _.isEqual(entityInterfacePage, "review")
                    ? "green"
                    : "blue"
                }
                rightIcon={
                  _.includes(
                    ["upload", "details", "mapping"],
                    entityInterfacePage,
                  ) ? (
                    <Icon name={"c_right"} />
                  ) : (
                    <Icon name={"check"} />
                  )
                }
                variant={"solid"}
                onClick={onContinueClick}
                isDisabled={continueDisabled || importLoading}
                isLoading={importLoading}
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
              </Button>
            </Flex>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImportModal;
