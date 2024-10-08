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
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import Icon from "@components/Icon";
import Attribute from "@components/AttributeCard";
import DataTable from "@components/DataTable";

// Custom and existing types
import {
  AttributeModel,
  AttributeCardProps,
  IGenericItem,
  EntityImportReview,
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

const Importer = (props: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) => {
  // File states
  const [file, setFile] = useState({} as File);
  const [fileType, setFileType] = useState("");
  const [fileName, setFileName] = useState("");
  const [objectData, setObjectData] = useState(null); // State to store parsed JSON data

  // Page states
  const [isLoaded, setIsLoaded] = useState(false);

  // Button states
  const [continueDisabled, setContinueDisabled] = useState(true);
  const [continueLoading, setContinueLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const { token } = useAuthentication();

  // State management to generate and present different pages
  const [interfacePage, setInterfacePage] = useState(
    "upload" as "upload" | "details" | "mapping" | "review",
  );

  // Used to generated numerical steps and a progress bar
  const pageSteps = [
    { title: "Upload File" },
    { title: "Setup Entities" },
    { title: "Apply Templates" },
    { title: "Review" },
  ];
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: pageSteps.length,
  });

  // Spreadsheet column state
  const [columns, setColumns] = useState([] as string[]);

  // Data used to assign for mapping
  const [projects, setProjects] = useState([] as IGenericItem[]);

  // Fields to be assigned to columns
  const [nameField, setNameField] = useState("");
  const [descriptionField, setDescriptionField] = useState("");
  const [ownerField] = useState(token.orcid);
  const [projectField, setProjectField] = useState("");
  const [attributes, setAttributes] = useState([] as AttributeModel[]);
  const [attributesField, setAttributesField] = useState(
    [] as AttributeModel[],
  );

  // Review state
  const [reviewEntities, setReviewEntities] = useState(
    [] as EntityImportReview[],
  );

  // Queries
  const PREPARE_CSV = gql`
    mutation PrepareCSV($file: [Upload]!) {
      prepareCSV(file: $file)
    }
  `;
  const [prepareCSV, { loading: prepareCSVLoading, error: prepareCSVError }] =
    useMutation(PREPARE_CSV);

  const GET_MAPPING_DATA = gql`
    query GetMappingData {
      projects {
        _id
        name
      }
      attributes {
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

  const REVIEW_CSV = gql`
    mutation ReviewCSV($columnMapping: ColumnMappingInput, $file: [Upload]!) {
      reviewCSV(columnMapping: $columnMapping, file: $file) {
        success
        message
        data {
          name
          state
        }
      }
    }
  `;
  const [reviewCSV, { loading: reviewCSVLoading, error: reviewCSVError }] =
    useMutation(REVIEW_CSV);

  const IMPORT_CSV = gql`
    mutation ImportCSV($columnMapping: ColumnMappingInput, $file: [Upload]!) {
      importCSV(columnMapping: $columnMapping, file: $file) {
        success
        message
      }
    }
  `;
  const [importCSV, { loading: importCSVLoading, error: importCSVError }] =
    useMutation(IMPORT_CSV);

  const REVIEW_JSON = gql`
    mutation ReviewJSON($file: [Upload]!) {
      reviewJSON(file: $file) {
        success
        message
        data {
          name
          state
        }
      }
    }
  `;
  const [reviewJSON, { loading: reviewJSONLoading, error: reviewJSONError }] =
    useMutation(REVIEW_JSON);

  const IMPORT_JSON = gql`
    mutation ImportJSON($file: [Upload]!, $project: String) {
      importJSON(file: $file, project: $project) {
        success
        message
      }
    }
  `;
  const [importJSON, { loading: importJSONLoading, error: importJSONError }] =
    useMutation(IMPORT_JSON);

  // Setup columns for review table
  const reviewTableColumnHelper = createColumnHelper<EntityImportReview>();
  const reviewTableColumns = [
    reviewTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Tooltip label={info.getValue()} hasArrow>
            <Text fontSize={"sm"} fontWeight={"semibold"}>
              {_.truncate(info.getValue(), { length: 30 })}
            </Text>
          </Tooltip>
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
    if (_.isEqual(interfacePage, "upload") && fileType !== "") {
      setContinueLoading(false);
      setContinueDisabled(false);
    }
  }, [fileType]);

  // Effect to manipulate 'Continue' button state when mapping fields from CSV file
  useEffect(() => {
    if (
      _.isEqual(interfacePage, "details") &&
      nameField !== "" &&
      fileType === "text/csv"
    ) {
      setContinueLoading(false);
      setContinueDisabled(false);
    }
  }, [nameField]);

  // Effect to manipulate 'Continue' button state when importing JSON file
  useEffect(() => {
    if (
      _.isEqual(interfacePage, "details") &&
      fileType === "application/json"
    ) {
      setContinueLoading(false);
      setContinueDisabled(false);
    }
  }, [interfacePage]);

  /**
   * Read a JSON file and update `Importer` state, raising errors if invalid
   * @param {File} file JSON file instance
   */
  const validJSONFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (_.isNull(event.target)) {
        toast({
          title: "Error",
          status: "error",
          description: "Invalid JSON file",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        return;
      }

      try {
        // Attempt to parse the JSON file
        const data = JSON.parse(event.target.result as string);
        setObjectData(data); // Set your JSON data to state
      } catch (error) {
        toast({
          title: "Error",
          status: "error",
          description: "Error while parsing JSON file",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
    };

    reader.readAsText(file);
  };

  /**
   * Utility function to perform the initial import operations. For CSV files, execute
   * `prepareCSV` query to defer the data extraction to the server.
   * For JSON files, trigger the `validJSONFile` method to handle the file
   * locally instead.
   */
  const setupImport = async () => {
    // Update state of continue button
    setContinueLoading(true);
    setContinueDisabled(true);

    // Extract data from the form
    const formData = new FormData();
    formData.append("name", file.name);
    formData.append("file", file);
    formData.append("type", fileType);

    if (_.isEqual(fileType, "application/json")) {
      // Handle JSON data separately
      await validJSONFile(file);
    } else if (_.isEqual(fileType, "text/csv")) {
      // Mutation query with CSV file
      setContinueLoading(prepareCSVLoading);
      const response = await prepareCSV({
        variables: {
          file: file,
        },
      });
      setContinueLoading(prepareCSVLoading);

      if (prepareCSVError || _.isUndefined(response.data)) {
        toast({
          title: "CSV Import Error",
          status: "error",
          description: "Error while preparing CSV file",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }

      if (response.data && response.data.prepareCSV.length > 0) {
        // Filter columns to exclude columns with no header ("__EMPTY...")
        const filteredColumnSet = response.data.prepareCSV.filter(
          (column: string) => {
            return !_.startsWith(column, "__EMPTY");
          },
        );
        setColumns(filteredColumnSet);
      }

      // Setup the next stage of CSV import
      await setupMapping();
    }
  };

  /**
   * Utility function to populate fields required for the mapping stage of importing data. Loads all Entities, Projects,
   * and Attributes.
   */
  const setupMapping = async () => {
    setIsLoaded(!mappingDataLoading);
    const response = await getMappingData();

    if (response.data?.attributes) {
      setAttributes(response.data.attributes);
    }
    if (response.data?.projects) {
      setProjects(response.data.projects);
    }

    if (mappingDataError) {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve data for mapping",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    setIsLoaded(!mappingDataLoading);
  };

  /**
   * Submit the pre-imported JSON structure and changes to the server
   * to generate a summary of the changes
   */
  const setupReviewJSON = async () => {
    setContinueLoading(reviewJSONLoading);
    const response = await reviewJSON({
      variables: {
        file: file,
      },
    });
    setContinueLoading(reviewJSONLoading);

    if (response.data && response.data.reviewJSON.data) {
      setReviewEntities(response.data.reviewJSON.data);
    }

    if (reviewJSONError) {
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
  const setupReviewCSV = async () => {
    // Collate data to be mapped
    const mappingData: { columnMapping: any; file: any } = {
      columnMapping: {
        name: nameField,
        description: descriptionField,
        created: dayjs(Date.now()).toISOString(),
        owner: token.orcid,
        project: projectField,
        attributes: attributesField,
      },
      file: file,
    };

    setContinueLoading(reviewCSVLoading);
    const response = await reviewCSV({
      variables: mappingData,
    });
    setContinueLoading(reviewCSVLoading);

    if (response.data && response.data.reviewCSV.data) {
      setReviewEntities(response.data.reviewCSV.data);
    }

    if (reviewCSVError) {
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
  const finishImportJSON = async () => {
    setContinueLoading(importJSONLoading);
    const response = await importJSON({
      variables: {
        file: file,
        project: projectField,
      },
    });
    setContinueLoading(importJSONLoading);

    if (importJSONError) {
      toast({
        title: "JSON Import Error",
        status: "error",
        description: "Error while importing JSON file",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    if (response.data.importJSON.success === true) {
      // Close the `Importer` UI
      props.onClose();
      resetState();
      navigate(0);
    }
  };

  /**
   * Finish importing a CSV file
   */
  const finishImportCSV = async () => {
    // Set the mapping status
    setContinueLoading(importCSVLoading);

    // Collate data to be mapped
    const mappingData: { columnMapping: any; file: any } = {
      columnMapping: {
        name: nameField,
        description: descriptionField,
        created: dayjs(Date.now()).toISOString(),
        owner: token.orcid,
        project: projectField,
        attributes: attributesField,
      },
      file: file,
    };
    await importCSV({
      variables: {
        columnMapping: mappingData.columnMapping,
        file: mappingData.file,
      },
    });
    setContinueLoading(importCSVLoading);

    if (importCSVError) {
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

    setContinueLoading(false);
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
    if (_.isEqual(interfacePage, "upload")) {
      // Run setup for import and mapping
      await setupImport();
      await setupMapping();

      // Proceed to the next page
      setActiveStep(1);
      setInterfacePage("details");
    } else if (_.isEqual(interfacePage, "details")) {
      // Proceed to the next page
      setActiveStep(2);
      setInterfacePage("mapping");
    } else if (_.isEqual(interfacePage, "mapping")) {
      // Run the review setup function depending on file type
      if (_.isEqual(fileType, "application/json")) {
        await setupReviewJSON();
      } else if (_.isEqual(fileType, "text/csv")) {
        await setupReviewCSV();
      }

      // Proceed to the next page
      setActiveStep(3);
      setInterfacePage("review");
    } else if (_.isEqual(interfacePage, "review")) {
      // Run the final import function depending on file type
      if (_.isEqual(fileType, "application/json")) {
        await finishImportJSON();
      } else if (_.isEqual(fileType, "text/csv")) {
        await finishImportCSV();
      }
    }
  };

  /**
   * Utility function to reset the entire `Importer` component state
   */
  const resetState = () => {
    // Reset UI state
    setActiveStep(0);
    setInterfacePage("upload");
    setContinueDisabled(true);
    setContinueLoading(false);
    setFile({} as File);
    setFileType("");
    setFileName("");
    setObjectData(null);

    // Reset data state
    setColumns([]);
    setNameField("");
    setDescriptionField("");
    setProjectField("");
    setAttributes([]);
    setAttributesField([]);
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      isCentered
      size={"4xl"}
    >
      <ModalOverlay />
      <ModalContent p={"2"} gap={"0"}>
        <ModalHeader p={"2"}>Import Entities</ModalHeader>
        <ModalCloseButton />
        <ModalBody px={"2"} gap={"2"}>
          {/* Stepper progress indicator */}
          <Flex pb={"4"}>
            <Stepper index={activeStep} w={"100%"}>
              {pageSteps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber />}
                      active={<StepNumber />}
                    />
                  </StepIndicator>

                  <Box flexShrink={"0"}>
                    <StepTitle>{step.title}</StepTitle>
                  </Box>

                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
          </Flex>

          {!_.isEqual(interfacePage, "upload") && (
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
              {_.isNull(objectData) && (
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
                      <Tag size={"sm"} key={column}>
                        {column}
                      </Tag>
                    );
                  })}
                </Flex>
              )}
            </Flex>
          )}

          {/* Step 1: Upload */}
          {_.isEqual(interfacePage, "upload") && (
            <Flex
              w={"100%"}
              direction={"column"}
              align={"center"}
              justify={"center"}
            >
              <Flex
                w={"100%"}
                py={"2"}
                justify={"left"}
                gap={"1"}
                align={"center"}
              >
                <Text
                  fontSize={"sm"}
                  fontWeight={"semibold"}
                  color={"gray.600"}
                >
                  Supported Formats:
                </Text>
                <Tag size={"sm"}>CSV</Tag>
                <Tag size={"sm"}>JSON</Tag>
              </Flex>
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
                          ["text/csv", "application/json"],
                          event.target.files[0].type,
                        )
                      ) {
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

          {/* Step 2: Simple mapping, details */}
          {_.isEqual(interfacePage, "details") && (
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

              {!objectData && (
                <Flex direction={"row"} gap={"2"}>
                  <FormControl isRequired isInvalid={_.isEqual(nameField, "")}>
                    <FormLabel fontSize={"sm"}>Name</FormLabel>
                    {getSelectComponent("import_name", nameField, setNameField)}
                    <FormHelperText>
                      Column containing Entity names
                    </FormHelperText>
                  </FormControl>
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
                </Flex>
              )}

              {objectData && (
                <Flex direction={"row"} gap={"2"}>
                  <FormControl>
                    <FormLabel fontSize={"sm"}>Name</FormLabel>
                    <Select
                      size={"sm"}
                      rounded={"md"}
                      placeholder={"Defined in JSON"}
                      isReadOnly
                    />
                    <FormHelperText>
                      Field containing Entity names
                    </FormHelperText>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={"sm"}>Description</FormLabel>
                    <Select
                      size={"sm"}
                      rounded={"md"}
                      placeholder={"Defined in JSON"}
                      isReadOnly
                    />
                    <FormHelperText>
                      Field containing Entity descriptions
                    </FormHelperText>
                  </FormControl>
                </Flex>
              )}

              <Flex direction={"row"} gap={"2"}>
                <FormControl>
                  <FormLabel fontSize={"sm"}>Owner</FormLabel>
                  <Tooltip
                    label={
                      "Initially, only you will have access to imported Entities"
                    }
                    hasArrow
                  >
                    <Input
                      value={ownerField}
                      size={"sm"}
                      rounded={"md"}
                      isReadOnly
                    />
                  </Tooltip>
                </FormControl>
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
            </Flex>
          )}

          {/* Step 3: Advanced mapping */}
          {_.isEqual(interfacePage, "mapping") && (
            <Flex
              w={"100%"}
              direction={"column"}
              gap={"2"}
              p={"2"}
              border={"1px"}
              borderColor={"gray.300"}
              rounded={"md"}
            >
              {_.isNull(objectData) ? (
                <Text fontSize={"sm"}>
                  Columns can be assigned to Values within Attributes. When
                  adding Values to an Attribute, select the column containing
                  the data for each Value. Use an existing Template Attribute
                  from the drop-down or create a new Attribute.
                </Text>
              ) : (
                <Text fontSize={"sm"}>
                  Existing attributes defined in JSON will be preserved. Use an
                  existing Template Attribute from the drop-down or create a new
                  Attribute to be added to all Entities.
                </Text>
              )}

              <Flex
                direction={"row"}
                gap={"2"}
                align={"center"}
                justify={"space-between"}
                wrap={["wrap", "nowrap"]}
              >
                {/* Drop-down to select template Attributes */}
                <FormControl maxW={"sm"}>
                  <Tooltip
                    label={
                      attributes.length > 0
                        ? "Select an existing Template Attribute"
                        : "No Template Attributes exist yet"
                    }
                    hasArrow
                  >
                    <Select
                      size={"sm"}
                      placeholder={"Select Template Attribute"}
                      isDisabled={attributes.length === 0}
                      onChange={(event) => {
                        if (!_.isEqual(event.target.value.toString(), "")) {
                          for (const attribute of attributes) {
                            if (
                              _.isEqual(
                                event.target.value.toString(),
                                attribute._id,
                              )
                            ) {
                              setAttributesField([
                                ...attributesField,
                                {
                                  _id: `a-${nanoid(6)}`,
                                  name: attribute.name,
                                  timestamp: attribute.timestamp,
                                  owner: attribute.owner,
                                  archived: false,
                                  description: attribute.description,
                                  values: attribute.values,
                                },
                              ]);
                              break;
                            }
                          }
                        }
                      }}
                    >
                      {isLoaded &&
                        attributes.map((attribute) => {
                          return (
                            <option key={attribute._id} value={attribute._id}>
                              {attribute.name}
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

              {_.isNull(objectData)
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

          {/* Step 4: Review */}
          {_.isEqual(interfacePage, "review") && (
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
                showSelection
                showPagination
                showItemCount
              />
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
                // Close importer modal
                props.onClose();
                resetState();
              }}
            >
              Cancel
            </Button>

            <Button
              id={"importContinueButton"}
              size={"sm"}
              colorScheme={
                _.isEqual(interfacePage, "review") ? "green" : "blue"
              }
              rightIcon={
                _.includes(["upload", "details", "mapping"], interfacePage) ? (
                  <Icon name={"c_right"} />
                ) : (
                  <Icon name={"check"} />
                )
              }
              variant={"solid"}
              onClick={onContinueClick}
              isDisabled={continueDisabled}
              isLoading={continueLoading}
              loadingText={"Processing"}
            >
              {_.isEqual(interfacePage, "upload") && "Continue"}
              {_.isEqual(interfacePage, "details") && "Continue"}
              {_.isEqual(interfacePage, "mapping") && "Continue"}
              {_.isEqual(interfacePage, "review") && "Finish"}
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default Importer;
