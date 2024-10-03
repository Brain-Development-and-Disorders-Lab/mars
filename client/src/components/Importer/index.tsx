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
  StepDescription,
  StepSeparator,
  FormHelperText,
  Tooltip,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Error from "@components/Error";
import Attribute from "@components/AttributeCard";
import { Warning } from "@components/Label";

// Custom and existing types
import { AttributeModel, AttributeCardProps, IGenericItem } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

// Authentication context
import { useAuthentication } from "src/hooks/useAuthentication";

const Importer = (props: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) => {
  // File states
  const [file, setFile] = useState({} as File);
  const [fileType, setFileType] = useState("");
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
    "upload" as "upload" | "details" | "mapping",
  );

  // Used to generated numerical steps and a progress bar
  const pageSteps = [
    { title: "Upload", description: "Upload a file" },
    { title: "Entity", description: "Basic Entity information" },
    { title: "Templates", description: "Apply a Template" },
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

  // Queries
  const PREPARE_COLUMNS = gql`
    mutation PrepareColumns($file: [Upload]!) {
      prepareColumns(file: $file)
    }
  `;
  const [
    prepareColumns,
    { loading: prepareColumnsLoading, error: prepareColumnsError },
  ] = useMutation(PREPARE_COLUMNS);

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

  const MAP_COLUMNS = gql`
    mutation MapColumns($columnMapping: ColumnMappingInput, $file: [Upload]!) {
      mapColumns(columnMapping: $columnMapping, file: $file) {
        success
        message
      }
    }
  `;
  const [mapColumns, { loading: mappingLoading, error: mappingError }] =
    useMutation(MAP_COLUMNS);

  const IMPORT_OBJECTS = gql`
    mutation ImportObjects($file: [Upload]!, $owner: String, $project: String) {
      importObjects(file: $file, owner: $owner, project: $project) {
        success
        message
      }
    }
  `;
  const [importObjects, { loading: importLoading, error: importError }] =
    useMutation(IMPORT_OBJECTS);

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
  const validObjectFile = async (file: File) => {
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
   * Utility function to perform the initial import operations. For CSV files, make POST request to `/data/import` to
   * defer the data extraction to the server. For JSON files, trigger the `handleJsonFile` method to handle the file
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
      await validObjectFile(file);
    } else if (_.isEqual(fileType, "text/csv")) {
      // Mutation query with CSV file
      setContinueLoading(prepareColumnsLoading);
      const response = await prepareColumns({
        variables: {
          file: file,
        },
      });
      setContinueLoading(prepareColumnsLoading);

      if (prepareColumnsError || _.isUndefined(response.data)) {
        toast({
          title: "Import Error",
          status: "error",
          description: "Error while importing file",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }

      if (response.data) {
        toast({
          title: "Success",
          status: "success",
          description: "Successfully parsed CSV-formatted file.",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });

        if (response.data.prepareColumns.length > 0) {
          // Filter columns to exclude columns with no header ("__EMPTY...")
          const filteredColumnSet = response.data.prepareColumns.filter(
            (column: string) => {
              return !_.startsWith(column, "__EMPTY");
            },
          );
          setColumns(filteredColumnSet);
        }

        // Setup the next stage of CSV import
        await setupMapping();
      }
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
   * Perform mapping action for CSV data. Collate the mapped columns and make a POST request passing this data to
   * the server.
   */
  const performMapping = async () => {
    // Set the mapping status
    setContinueLoading(mappingLoading);

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
    await mapColumns({
      variables: {
        columnMapping: mappingData.columnMapping,
        file: mappingData.file,
      },
    });
    setContinueLoading(mappingLoading);

    if (mappingError) {
      toast({
        title: "Import Error",
        status: "error",
        description: "Error while mapping data",
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
      // Run the final import function depending on file type
      if (_.isEqual(fileType, "application/json")) {
        setContinueLoading(importLoading);
        const response = await importObjects({
          variables: {
            file: file,
            owner: ownerField,
            project: projectField,
          },
        });
        setContinueLoading(importLoading);

        if (importError) {
          toast({
            title: "Import Error",
            status: "error",
            description: "Error while importing JSON file",
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });
        }

        if (response.data.importObjects.success === true) {
          // Close the `Importer` UI
          props.onClose();
          resetState();
          navigate(0);
        }
      } else if (_.isEqual(fileType, "text/csv")) {
        await performMapping();
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
    <>
      {isLoaded && importError ? (
        <Error />
      ) : (
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
            <ModalBody px={"2"}>
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
                        <StepDescription>{step.description}</StepDescription>
                      </Box>

                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              </Flex>

              {/* Step 1: Upload */}
              {_.isEqual(interfacePage, "upload") && (
                <Flex
                  w={"100%"}
                  direction={"column"}
                  align={"center"}
                  justify={"center"}
                >
                  <Flex w={"100%"} py={"2"} justify={"left"} gap={"1"}>
                    <Text>Supported file formats:</Text>
                    <Tag colorScheme={"green"}>CSV</Tag>
                    <Tag colorScheme={"green"}>JSON</Tag>
                  </Flex>
                  <FormControl>
                    <Flex
                      direction={"column"}
                      minH={"50vh"}
                      w={"100%"}
                      align={"center"}
                      justify={"center"}
                      border={"2px"}
                      borderStyle={"dashed"}
                      borderColor={"gray.300"}
                      rounded={"md"}
                      background={"gray.50"}
                    >
                      {_.isEqual(file, {}) ? (
                        <Flex
                          direction={"column"}
                          w={"100%"}
                          justify={"center"}
                          align={"center"}
                        >
                          <Text fontWeight={"semibold"}>Drag file here</Text>
                          <Text>or click to upload</Text>
                        </Flex>
                      ) : (
                        <Flex
                          direction={"column"}
                          w={"100%"}
                          justify={"center"}
                          align={"center"}
                        >
                          <Text fontWeight={"semibold"}>{file.name}</Text>
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
                              ["text/csv", "application/json"],
                              event.target.files[0].type,
                            )
                          ) {
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
                <Flex w={"100%"} direction={"column"} gap={"2"}>
                  {columns.length > 0 && (
                    <Flex direction={"column"} gap={"2"} wrap={"wrap"}>
                      <Flex w={"100%"} justify={"left"} gap={"2"}>
                        {fileType === "text/csv" && (
                          <Warning
                            text={`Origins and Products cannot be imported from CSV files.`}
                          />
                        )}
                      </Flex>
                      <Flex
                        w={"100%"}
                        gap={"2"}
                        align={"center"}
                        justify={"left"}
                        wrap={"wrap"}
                      >
                        <Text
                          fontWeight={"semibold"}
                          fontSize={"sm"}
                          color={"gray.600"}
                        >
                          Columns:
                        </Text>
                        {columns.map((column) => {
                          return (
                            <Tag key={column} colorScheme={"green"}>
                              {column}
                            </Tag>
                          );
                        })}
                      </Flex>
                      <Text>
                        Each row represents a new Entity that will be created.
                        From the above columns, use each drop-down to select
                        which column value to map that specific detail of the
                        Entities that will be created.
                      </Text>
                    </Flex>
                  )}

                  {!objectData && (
                    <Flex direction={"row"} gap={"2"}>
                      <FormControl
                        isRequired
                        isInvalid={_.isEqual(nameField, "")}
                      >
                        <FormLabel>Name</FormLabel>
                        {getSelectComponent(
                          "import_name",
                          nameField,
                          setNameField,
                        )}
                        <FormHelperText>
                          Column containing Entity names
                        </FormHelperText>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Description</FormLabel>
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

                  <Flex direction={"row"} gap={"2"}>
                    <FormControl>
                      <FormLabel>Owner</FormLabel>
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
                          disabled
                        />
                      </Tooltip>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Project</FormLabel>
                      <Select
                        id={"import_projects"}
                        size={"sm"}
                        placeholder={"Select Project"}
                        value={projectField}
                        onChange={(event) =>
                          setProjectField(event.target.value)
                        }
                      >
                        {projects.map((project) => {
                          return (
                            <option key={project._id} value={project._id}>
                              {project.name}
                            </option>
                          );
                        })}
                      </Select>
                      <FormHelperText>
                        An existing Project to associate each Entity with
                      </FormHelperText>
                    </FormControl>
                  </Flex>
                </Flex>
              )}

              {/* Step 3: Advanced mapping */}
              {_.isEqual(interfacePage, "mapping") && (
                <Flex w={"100%"} direction={"column"} gap={"2"}>
                  <Text>
                    Columns can be assigned to Values within Attributes. When
                    adding Values to an Attribute, select the column containing
                    the data for each Value. Use an existing Template Attribute
                    from the drop-down or create a new Attribute.
                  </Text>
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
                                <option
                                  key={attribute._id}
                                  value={attribute._id}
                                >
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

                  {/* Display all Attributes */}
                  {attributesField.map((attribute) => {
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
                  })}
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
                    _.isEqual(interfacePage, "mapping") ? "green" : "blue"
                  }
                  rightIcon={
                    _.isEqual(interfacePage, "upload") ? (
                      <Icon name={"c_right"} />
                    ) : _.isEqual(interfacePage, "details") ? (
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
                  {_.isEqual(interfacePage, "mapping") && "Finish"}
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default Importer;
