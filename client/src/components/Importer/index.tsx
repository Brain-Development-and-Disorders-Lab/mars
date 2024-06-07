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
  TagCloseButton,
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
import { Information, Warning } from "@components/Label";

// Custom and existing types
import {
  AttributeModel,
  AttributeCardProps,
  ProjectModel,
  EntityImport,
  EntityModel,
  Item,
} from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { request } from "@database/functions";
import { useToken } from "src/authentication/useToken";
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

const Importer = (props: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) => {
  // File states
  const [file, setFile] = useState({} as File);
  const [fileType, setFileType] = useState("");
  const [jsonData, setJsonData] = useState(null); // State to store parsed JSON data

  // Page states
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Button states
  const [continueDisabled, setContinueDisabled] = useState(true);
  const [continueLoading, setContinueLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const [token, _setToken] = useToken();

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

  // Spreadsheet data state
  const [spreadsheetData, setSpreadsheetData] = useState([] as any[]);
  const [columns, setColumns] = useState([] as string[]);

  // Data to inform field assignment
  const [entities, setEntities] = useState([] as EntityModel[]);
  const [projects, setProjects] = useState([] as ProjectModel[]);

  // Fields to be assigned to columns
  const [nameField, setNameField] = useState("");
  const [descriptionField, setDescriptionField] = useState("");
  const [ownerField, _setOwnerField] = useState(token.orcid);
  const [projectField, setProjectField] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState({} as Item);
  const [originsField, setOriginsField] = useState([] as Item[]);
  const [selectedProduct, setSelectedProduct] = useState({} as Item);
  const [productsField, setProductsField] = useState([] as Item[]);
  const [attributes, setAttributes] = useState([] as AttributeModel[]);
  const [attributesField, setAttributesField] = useState(
    [] as AttributeModel[],
  );

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
  const handleJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (_.isNull(e.target?.result)) {
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

      // Attempt to parse the JSON file
      try {
        const data = JSON.parse(e.target?.result as string);
        setJsonData(data); // Set your JSON data to state
      } catch (error) {
        toast({
          title: "Error",
          status: "error",
          description: "Invalid JSON file",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
    };

    reader.readAsText(file);
  };

  /**
   * Utility function to access and assign existing JSON data with exisitng user selections. Loads existing Origin and
   * Product Entities, and populates the existing Projects field.
   * @returns Short-circuit when function called without actual JSON data
   */
  const updateJsonDataWithUserSelections = () => {
    if (!jsonData) {
      // No JSON data to update (likely CSV file)
      return;
    }

    // Clone the jsonData to avoid direct state mutation
    let updatedJsonData = _.cloneDeep(jsonData) as any;

    if (updatedJsonData._id) {
      // Single JSON document, update only one by placing in array
      updatedJsonData = [updatedJsonData];
    } else {
      // Multiple exported JSON files
      updatedJsonData = (updatedJsonData as any)?.entities;
    }

    // Update the jsonData with user selections
    // This is a simplified example, you might need to adjust it based on your actual data structure
    if (updatedJsonData && Array.isArray(updatedJsonData)) {
      (updatedJsonData as any).forEach((entity: any) => {
        if (originsField?.length > 0) {
          // Add or update the 'origins' field in the entity
          entity.associations.origins = _.unionBy(
            entity.associations.origins,
            originsField,
            "id",
          );
        }
        if (productsField?.length > 0) {
          // Add or update the 'products' field in the entity
          entity.associations.products = _.unionBy(
            entity.associations.products,
            productsField,
            "id",
          );
        }
        if (projectField) {
          // Add or update the 'project' field in the entity
          entity.projects = [projectField];
        }
        // ... add more updates as per your other fields
      });
    }

    // Update the JSON state with the modified jsonData
    if (updatedJsonData) {
      setJsonData({ entities: updatedJsonData } as any);
    }
  };

  /**
   * Utility function to perform the initial import operations. For CSV files, make POST request to `/data/import` to
   * defer the data extraction to the server. For JSON files, trigger the `handleJsonFile` method to handle the file
   * locally instead.
   */
  const performImport = async () => {
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
      handleJsonFile(file);
    } else if (_.isEqual(fileType, "text/csv")) {
      // Make POST request with CSV file contents from the form
      const response = await request<any>("POST", "/data/import", formData);
      if (response.success) {
        // Reset file upload state
        setFile({} as File);

        if (_.isEqual(fileType, "text/csv")) {
          toast({
            title: "Success",
            status: "success",
            description: "Successfully parsed CSV-formatted file.",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
          if (response.data.length > 0) {
            // Update spreadsheet data state if valid rows
            setSpreadsheetData(response.data);

            // Filter columns to exclude columns with no header ("__EMPTY...")
            const filteredColumnSet = Object.keys(response.data[0]).filter(
              (column) => {
                return !_.startsWith(column, "__EMPTY");
              },
            );
            setColumns(filteredColumnSet);
          }

          // Setup the next stage of CSV import
          await setupMapping();
        } else if (_.isEqual(fileType, "application/json")) {
          toast({
            title: "Success",
            status: "success",
            description: "Successfully imported JSON file.",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });

          // In the case of a JSON file, it has been uploaded and we can refresh
          navigate(0);
        } else {
          toast({
            title: "Import Error",
            status: "error",
            description: "Error while importing file",
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });
        }
        // Reset the loading state, but preserve the disabled state
        setContinueLoading(false);
      }
    }
  };

  /**
   * Perform import action for JSON data. Make POST request to server passing the JSON data.
   * @returns Short-circuit when function called without actual JSON data
   */
  const performImportJson = async () => {
    if (!jsonData) {
      toast({
        title: "Error",
        status: "error",
        description: "Invalid JSON data",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      return;
    }

    // Update button state to reflect loading state
    setContinueLoading(true);

    const response = await request<any>("POST", "/data/importJSON", {
      jsonData: jsonData,
    });
    if (response.success) {
      // Close the `Importer` UI
      props.onClose();
      resetState();
      navigate(0);
    } else {
      toast({
        title: "Import Error",
        status: "error",
        description: "Error while importing JSON file",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
    setContinueLoading(false);
  };

  /**
   * Utility function to populate fields required for the mapping stage of importing data. Loads all Entities, Projects,
   * and Attributes.
   */
  const setupMapping = async () => {
    // Load all Entities, Projects, and Attributes
    const entities = await request<EntityModel[]>("GET", "/entities");
    const projects = await request<ProjectModel[]>("GET", "/projects");
    const attributes = await request<AttributeModel[]>("GET", "/attributes");

    if (entities.success) {
      setEntities(entities.data);
    } else {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Entities",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }

    if (projects.success) {
      setProjects(projects.data);
    } else {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Projects",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }

    if (attributes.success) {
      setAttributes(attributes.data);
    } else {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Attributes",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }

    setIsLoaded(true);
  };

  /**
   * Perform mapping action for CSV data. Collate the mapped columns and make a POST request passing this data to
   * the server.
   */
  const performMapping = async () => {
    // Set the mapping status
    setContinueLoading(true);

    // Collate data to be mapped
    const mappingData: { fields: EntityImport; data: any[] } = {
      fields: {
        name: nameField,
        description: descriptionField,
        created: dayjs(Date.now()).toISOString(),
        owner: token.orcid,
        projects: projectField,
        origins: originsField,
        products: productsField,
        attributes: attributesField,
      },
      data: spreadsheetData,
    };

    const response = await request<any>(
      "POST",
      "/data/import/mapping",
      mappingData,
    );
    if (response.success) {
      props.onClose();
      resetState();
      navigate(0);
    } else {
      toast({
        title: "Import Error",
        status: "error",
        description: "Error while mapping data",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
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
    value: any,
    setValue: React.SetStateAction<any>,
  ) => {
    return (
      <Select
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

  /**
   * Factory-like pattern to generate `Select` components for selecting Entities
   * @param {any} value Component value
   * @param {React.SetStateAction<any>} setValue React `useState` function to set state
   * @returns {ReactElement}
   */
  const getSelectEntitiesComponent = (
    value: Item,
    setValue: React.SetStateAction<any>,
    selected: Item[],
    setSelected: React.SetStateAction<any>,
    disabled?: boolean,
  ) => {
    return (
      <Select
        placeholder={"Select Entity"}
        value={value._id}
        onChange={(event) => {
          const selection = {
            id: event.target.value,
            name: event.target.options[event.target.selectedIndex].label,
          };
          setValue(selection);
          if (
            !_.includes(
              selected.map((entity) => entity._id),
              selection.id,
            )
          ) {
            setSelected([...selected, selection]);
          }
        }}
        isDisabled={_.isUndefined(disabled) ? false : disabled}
      >
        {entities.map((entity) => {
          return (
            <option key={entity._id} value={entity._id}>
              {entity.name}
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
        if (_.isEqual(attribute._id, data.identifier)) {
          return {
            _id: data.identifier,
            name: data.name,
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
      setActiveStep(1);

      // Run setup for import and mapping
      await performImport();
      await setupMapping();

      // Proceed to the next page
      setInterfacePage("details");
    } else if (_.isEqual(interfacePage, "details")) {
      setActiveStep(2);

      if (_.isEqual(fileType, "application/json")) {
        // If JSON, merge any specified details with the existing JSON data
        updateJsonDataWithUserSelections();
      }

      // Proceed to the next page
      setInterfacePage("mapping");
    } else if (_.isEqual(interfacePage, "mapping")) {
      // Run the final import function depending on file type
      if (_.isEqual(fileType, "application/json")) {
        await performImportJson();
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
    setJsonData(null);

    // Reset data state
    setSpreadsheetData([]);
    setColumns([]);
    setNameField("");
    setDescriptionField("");
    setProjectField("");
    setSelectedOrigin({} as Item);
    setOriginsField([] as Item[]);
    setSelectedProduct({} as Item);
    setProductsField([] as Item[]);
    setAttributes([]);
    setAttributesField([]);
  };

  return (
    <>
      {isLoaded && isError ? (
        <Error />
      ) : (
        <Modal
          isOpen={props.isOpen}
          onClose={props.onClose}
          isCentered
          size={"4xl"}
        >
          <ModalOverlay />
          <ModalContent p={"2"} gap={"2"}>
            <ModalHeader p={"2"}>Import as Entities</ModalHeader>
            <ModalCloseButton />
            <ModalBody p={"2"}>
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
                  <Flex w={"100%"} py={"2"} justify={"left"}>
                    <Information
                      text={"MARS supports CSV-formatted or JSON files."}
                    />
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
                      borderColor={"gray.200"}
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
                <Flex w={"100%"} direction={"column"} gap={"4"}>
                  {columns.length > 0 && (
                    <Flex direction={"column"} gap={"2"} wrap={"wrap"}>
                      <Flex w={"100%"} py={"2"} justify={"left"} gap={"2"}>
                        <Information
                          text={`Found ${columns.length} columns.`}
                        />
                        {fileType === "text/csv" && (
                          <Warning
                            text={`Origins and Products cannot be imported from CSV files.`}
                          />
                        )}
                      </Flex>
                      <Flex
                        w={"100%"}
                        py={"2"}
                        gap={"2"}
                        align={"center"}
                        justify={"left"}
                        wrap={"wrap"}
                      >
                        <Text
                          fontWeight={"semibold"}
                          size={"xs"}
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

                  {!jsonData && (
                    <Flex direction={"row"} gap={"4"}>
                      <FormControl
                        isRequired
                        isInvalid={_.isEqual(nameField, "")}
                      >
                        <FormLabel>Name</FormLabel>
                        {getSelectComponent(nameField, setNameField)}
                        <FormHelperText>
                          Column containing Entity names
                        </FormHelperText>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        {getSelectComponent(
                          descriptionField,
                          setDescriptionField,
                        )}
                        <FormHelperText>
                          Column containing Entity descriptions
                        </FormHelperText>
                      </FormControl>
                    </Flex>
                  )}

                  <Flex direction={"row"} gap={"4"}>
                    <FormControl>
                      <FormLabel>Owner</FormLabel>
                      <Tooltip
                        label={
                          "Initially, only you will have access to imported Entities"
                        }
                      >
                        <Input value={ownerField} disabled />
                      </Tooltip>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Project</FormLabel>
                      <Select
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
                  <Flex direction={"row"} gap={"4"}>
                    <FormControl>
                      <FormLabel>Origin</FormLabel>
                      {getSelectEntitiesComponent(
                        selectedOrigin,
                        setSelectedOrigin,
                        originsField,
                        setOriginsField,
                      )}
                      <FormHelperText>
                        Existing Origin Entities to associate each Entity with
                      </FormHelperText>
                      <Flex direction={"row"} wrap={"wrap"} gap={"2"} pt={"2"}>
                        {originsField.map((origin) => {
                          return (
                            <Tag key={origin._id}>
                              {origin.name}
                              <TagCloseButton
                                onClick={() => {
                                  setOriginsField([
                                    ...originsField.filter(
                                      (existingOrigin) =>
                                        !_.isEqual(
                                          existingOrigin._id,
                                          origin._id,
                                        ),
                                    ),
                                  ]);
                                }}
                              />
                            </Tag>
                          );
                        })}
                      </Flex>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Products</FormLabel>
                      {getSelectEntitiesComponent(
                        selectedProduct,
                        setSelectedProduct,
                        productsField,
                        setProductsField,
                      )}
                      <FormHelperText>
                        Existing Product Entities to associate each Entity with
                      </FormHelperText>
                      <Flex direction={"row"} wrap={"wrap"} gap={"2"} pt={"2"}>
                        {productsField.map((product) => {
                          return (
                            <Tag key={product._id}>
                              {product.name}
                              <TagCloseButton
                                onClick={() => {
                                  setProductsField([
                                    ...productsField.filter(
                                      (existingProduct) =>
                                        !_.isEqual(
                                          existingProduct._id,
                                          product._id,
                                        ),
                                    ),
                                  ]);
                                }}
                              />
                            </Tag>
                          );
                        })}
                      </Flex>
                    </FormControl>
                  </Flex>
                </Flex>
              )}

              {/* Step 3: Advanced mapping */}
              {_.isEqual(interfacePage, "mapping") && (
                <Flex w={"100%"} direction={"column"} gap={"4"}>
                  <Text>
                    Columns can be assigned to Values within Attributes. When
                    adding Values to an Attribute, select the column containing
                    the data for each Value. Use an existing Template Attribute
                    from the drop-down or create a new Attribute.
                  </Text>
                  <Flex w={"100%"} gap={"2"}>
                    <Information
                      text={'All dates must use "MM/DD/YYYY" format'}
                    />
                  </Flex>
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
                      >
                        <Select
                          placeholder={"Select Template Attribute"}
                          isDisabled={attributes.length === 0}
                          onChange={(event) => {
                            if (!_.isEqual(event.target.value.toString(), "")) {
                              for (let attribute of attributes) {
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
                      leftIcon={<Icon name={"add"} />}
                      colorScheme={"green"}
                      onClick={() => {
                        // Create an 'empty' Attribute and add the data structure to 'selectedAttributes'
                        setAttributesField([
                          ...attributesField,
                          {
                            _id: `a-${nanoid(6)}`,
                            name: "",
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
                        key={attribute._id}
                        identifier={attribute._id}
                        name={attribute.name}
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

                {/* Back button will be enable after debugging */}
                {/* <Button
                  colorScheme={"blue"}
                  rightIcon={<Icon name="check" />}
                  variant={"solid"}
                  onClick={() => {
                    if (_.isEqual(interfacePage, "mapping")) {
                      setInterfacePage("details");
                    } else {
                      props.onOpen();
                      onMappingClose();
                    }
                  }}
                  isDisabled={_.isEqual(nameField, "") || _.isEqual(nameField, "details")}
                  isLoading={isMapping}
                  loadingText={"Please wait..."}
                >
                  Back
                </Button> */}

                <Button
                  colorScheme={
                    _.isEqual(interfacePage, "mapping") ? "green" : "blue"
                  }
                  rightIcon={
                    _.isEqual(interfacePage, "upload") ? (
                      <Icon name={"upload"} />
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
                  {_.isEqual(interfacePage, "upload") && "Upload"}
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
