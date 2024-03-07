// React
import React, { ChangeEvent, useState } from "react";

// Existing and custom components
import {
  Flex,
  Button,
  useDisclosure,
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
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Error from "@components/Error";
import Attribute from "@components/AttributeCard";

// Custom and existing types
import {
  AttributeModel,
  AttributeCardProps,
  ProjectModel,
  EntityImport,
  EntityModel,
} from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { getData, postData } from "@database/functions";
import { useToken } from "src/authentication/useToken";
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

const Importer = (props: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) => {
  // File state
  const [file, setFile] = useState({} as File);
  const [fileType, setFileType] = useState("");
  const [jsonData, setJsonData] = useState(null); // State to store parsed JSON data

  // Page state
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMapping, setIsMapping] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const [token, _setToken] = useToken();

  const {
    isOpen: isMappingOpen,
    onOpen: onMappingOpen,
    onClose: onMappingClose,
  } = useDisclosure();
  const [interfacePage, setInterfacePage] = useState(
    "start" as "start" | "attributes"
  );
  const pageSteps = [
    { title: "Start", description: "Basic information" },
    { title: "Attributes", description: "Mapping fields to Attributes" },
  ];
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: pageSteps.length,
  });

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
  const [selectedOrigin, setSelectedOrigin] = useState(
    {} as { name: string; id: string }
  );
  const [originsField, setOriginsField] = useState(
    [] as { name: string; id: string }[]
  );
  const [selectedProduct, setSelectedProduct] = useState(
    {} as { name: string; id: string }
  );
  const [productsField, setProductsField] = useState(
    [] as { name: string; id: string }[]
  );
  const [attributes, setAttributes] = useState([] as AttributeModel[]);
  const [attributesField, setAttributesField] = useState(
    [] as AttributeModel[]
  );

  const isJsonFile = (filename: string) => {
    // Use a regular expression to test if the filename ends with '.json'
    return filename.toLowerCase().endsWith('.json');
  }

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
      try {
        const data = JSON.parse(e.target?.result as string);
        setJsonData(data); // Set your JSON data to state
        setupMapping(); // Proceed to setup mapping after loading the JSON
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

  const updateJsonDataWithUserSelections = () => {
    if (!jsonData) {
      // No jsonData to update (if CSV file)
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
          entity.associations.origins = _.unionBy(entity.associations.origins, originsField, 'id');
        }
        if (productsField?.length > 0) {
          // Add or update the 'products' field in the entity
          entity.associations.products = _.unionBy(entity.associations.products, productsField, 'id');;
        }
        if (projectField) {
          // Add or update the 'project' field in the entity
          entity.projects = [projectField];
        }
        // ... add more updates as per your other fields
      });
    }

    // Update the state with the modified jsonData
    if (updatedJsonData) {
      setJsonData({ entities: updatedJsonData } as any);
    }
  };


  const performImport = () => {
    setIsUploading(true);

    const formData = new FormData();
    formData.append("name", file.name);
    formData.append("file", file);
    formData.append("type", fileType);

    if (isJsonFile(file.name)) {
      handleJsonFile(file);
      return;
    }

    postData(`/system/import`, formData)
      .then((response: { status: boolean; message: string; data?: any }) => {
        if (_.isEqual(response.status, "success")) {
          // Reset file upload state
          setFile({} as File);
          props.onClose();

          if (_.isEqual(fileType, "text/csv")) {
            toast({
              title: "Success",
              status: "success",
              description: "Successfully parsed CSV-formatted file.",
              duration: 4000,
              position: "bottom-right",
              isClosable: true,
            });
            if (response.data?.length > 0) {
              setSpreadsheetData(response.data);

              // Filter columns to exclude columns with no header ("__EMPTY...")
              const filteredColumnSet = Object.keys(response.data[0]).filter((column) => {
                return !_.startsWith(column, "__EMPTY");
              })
              setColumns(filteredColumnSet);
            }
            setupMapping();
          } else if (_.isEqual(fileType, "application/json")) {
            toast({
              title: "Success",
              status: "success",
              description: "Successfully imported JSON file.",
              duration: 4000,
              position: "bottom-right",
              isClosable: true,
            });
            navigate(0);
          }
        } else {
          toast({
            title: "Error",
            status: "error",
            description: response.message,
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });
        }
        setIsUploading(false);
      })
      .catch((error: { message: string }) => {
        toast({
          title: "Error",
          status: "error",
          description: error.message + " Please try again.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsUploading(false);
      });
  };

  const setupMapping = () => {
    Promise.all([
      getData(`/entities`),
      getData(`/projects`),
      getData(`/attributes`),
    ])
      .then((results: [EntityModel[], ProjectModel[], AttributeModel[]]) => {
        setEntities(results[0]);
        setProjects(results[1]);
        setAttributes(results[2]);
        setIsLoaded(true);
        onMappingOpen();
        if (results[1][0]?._id) {
          setProjectField(results[1][0]._id);
        }
      })
      .catch((_error) => {
        console.log("_error:", _error);
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Entities data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      });
  };

  const performImportJson = () => {
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
    };

    setIsMapping(true);

    postData(`/system/importJSON`, { jsonData: jsonData })
      .then(() => {
        onMappingClose();
        navigate(0);
      })
      .catch((error: { message: string }) => {
        toast({
          title: "Error",
          status: "error",
          description: error.message,
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        setIsMapping(false);
      });
  };

  const performMapping = () => {
    // Set the mapping status
    setIsMapping(true);

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

    postData(`/system/import/mapping`, mappingData)
      .then((_response: { status: boolean; message: string; data?: any }) => {
        onMappingClose();
        navigate(0);
      })
      .catch((error: { message: string }) => {
        toast({
          title: "Error",
          status: "error",
          description: error.message,
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        setIsMapping(false);
      });
  };

  const getSelectComponent = (
    value: any,
    setValue: React.SetStateAction<any>
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

  const getSelectProjectComponent = (
    value: string,
    setValue: React.SetStateAction<any>
  ) => {
    return (
      <Select
        placeholder={"Select Project"}
        value={value || (projects?.length > 0 ? projects[0]._id : '')}
        onChange={(event) => setValue(event.target.value)}
      >
        {projects.map((project) => {
          return (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          );
        })}
      </Select>
    );
  };

  const getSelectEntitiesComponent = (
    value: { name: string; id: string },
    setValue: React.SetStateAction<any>,
    selected: { name: string; id: string }[],
    setSelected: React.SetStateAction<any>,
    disabled?: boolean
  ) => {
    return (
      <Select
        placeholder={"Select Entity"}
        value={value.id}
        onChange={(event) => {
          const selection = {
            id: event.target.value,
            name: event.target.options[event.target.selectedIndex].label,
          };
          setValue(selection);
          if (
            !_.includes(
              selected.map((entity) => entity.id),
              selection.id
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
      attributesField.filter((attribute) => attribute._id !== identifier)
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

  return (
    <>
      {isLoaded && isError ? (
        <Error />
      ) : (
        <>
          <Modal
            isOpen={props.isOpen}
            onClose={props.onClose}
            isCentered
            size={"3xl"}
          >
            <ModalOverlay />
            <ModalContent p={"2"} gap={"2"}>
              <ModalHeader p={"2"}>Import</ModalHeader>
              <ModalCloseButton />
              <ModalBody p={"2"}>
                <Flex w={"100%"} direction={"column"} align={"center"} justify={"center"}>
                  <Flex w={"100%"} direction={"column"} mx={"4"} mb={"4"} gap={"2"}>
                    <Text>
                      MARS supports importing CSV-formatted files or JSON files.
                    </Text>
                  </Flex>

                  <FormControl>
                    <Flex
                      direction={"column"}
                      minH={"200px"}
                      w={"100%"}
                      align={"center"}
                      justify={"center"}
                      border={"2px"}
                      borderStyle={"dashed"}
                      borderColor={"gray.100"}
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
                          <Text fontWeight={"semibold"}>
                            Drag file here
                          </Text>
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
                      onChange={(
                        event: ChangeEvent<HTMLInputElement>
                      ) => {
                        if (event.target.files) {
                          // Only accept defined file types
                          if (_.includes(["text/csv", "application/json"], event.target.files[0].type)) {
                            setFileType(event.target.files[0].type);
                            setFile(event.target.files[0]);
                          } else {
                            toast({
                              title: "Warning",
                              status: "warning",
                              description:
                                "Please upload a JSON or CSV file",
                              duration: 4000,
                              position: "bottom-right",
                              isClosable: true,
                            });
                          }
                        }
                      }}
                    />
                  </FormControl>
                </Flex>
              </ModalBody>

              <ModalFooter p={"2"}>
                <Flex direction={"row"} w={"100%"} justify={"space-between"}>
                  <Button
                    colorScheme={"red"}
                    rightIcon={<Icon name="cross" />}
                    variant={"outline"}
                    onClick={() => {
                      setFile({} as File);
                      props.onClose();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme={"blue"}
                    isDisabled={_.isEqual(file, {}) || isUploading}
                    rightIcon={<Icon name={"upload"} />}
                    onClick={() => performImport()}
                    isLoading={isUploading}
                    loadingText={"Processing..."}
                  >
                    Upload
                  </Button>
                </Flex>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal
            isOpen={isMappingOpen}
            onClose={onMappingClose}
            size={"4xl"}
            isCentered
          >
            <ModalOverlay />
            <ModalContent p={"2"} gap={"4"}>
              <ModalHeader p={"2"}>Import</ModalHeader>
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

                {/* Page content */}
                {_.isEqual(interfacePage, "start") && (
                  <Flex w={"100%"} direction={"column"} gap={"4"}>
                    <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                      <Text fontWeight={"semibold"}>Columns:</Text>
                      {columns.map((column) => {
                        return (
                          <Tag key={column} colorScheme={"teal"}>
                            {column}
                          </Tag>
                        );
                      })}
                    </Flex>
                    {!jsonData && <Flex direction={"row"} gap={"4"}>
                      <FormControl
                        isRequired
                        isInvalid={_.isEqual(nameField, "")}
                      >
                        <FormLabel>Name</FormLabel>
                        {getSelectComponent(nameField, setNameField)}
                      </FormControl>
                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        {getSelectComponent(
                          descriptionField,
                          setDescriptionField
                        )}
                      </FormControl>
                    </Flex>}
                    <Flex direction={"row"} gap={"4"}>
                      <FormControl>
                        <FormLabel>Owner</FormLabel>
                        <Input value={ownerField} disabled />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Project</FormLabel>
                        {getSelectProjectComponent(
                          projectField,
                          setProjectField
                        )}
                      </FormControl>
                    </Flex>
                    <Flex direction={"row"} gap={"4"}>
                      <FormControl>
                        <FormLabel>Origin</FormLabel>
                        <Flex direction={"column"} gap={"4"}>
                          {getSelectEntitiesComponent(
                            selectedOrigin,
                            setSelectedOrigin,
                            originsField,
                            setOriginsField
                          )}
                          <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                            {originsField.map((origin) => {
                              return (
                                <Tag key={origin.id}>
                                  {origin.name}
                                  <TagCloseButton
                                    onClick={() => {
                                      setOriginsField([
                                        ...originsField.filter(
                                          (existingOrigin) =>
                                            !_.isEqual(
                                              existingOrigin.id,
                                              origin.id
                                            )
                                        ),
                                      ]);
                                    }}
                                  />
                                </Tag>
                              );
                            })}
                          </Flex>
                        </Flex>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Products</FormLabel>
                        {getSelectEntitiesComponent(
                          selectedProduct,
                          setSelectedProduct,
                          productsField,
                          setProductsField
                        )}
                        {productsField.map((product) => {
                          return (
                            <Tag key={product.id}>
                              {product.name}
                              <TagCloseButton
                                onClick={() => {
                                  setProductsField([
                                    ...productsField.filter(
                                      (existingProduct) =>
                                        !_.isEqual(
                                          existingProduct.id,
                                          product.id
                                        )
                                    ),
                                  ]);
                                }}
                              />
                            </Tag>
                          );
                        })}
                      </FormControl>
                    </Flex>
                  </Flex>
                )}

                {_.isEqual(interfacePage, "attributes") && (
                  <Flex w={"100%"} direction={"column"} gap={"4"}>
                    <Text>Attributes</Text>
                    <Flex
                      direction={"row"}
                      gap={"2"}
                      align={"center"}
                      justify={"space-between"}
                      wrap={["wrap", "nowrap"]}
                    >
                      {/* Drop-down to select template Attributes */}
                      <FormControl maxW={"sm"}>
                        <Select
                          placeholder={"Use template Attribute"}
                          onChange={(event) => {
                            if (!_.isEqual(event.target.value.toString(), "")) {
                              for (let attribute of attributes) {
                                if (
                                  _.isEqual(
                                    event.target.value.toString(),
                                    attribute._id
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
                      setInterfacePage("start"); // Reset to "start"
                      onMappingClose();
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
                      if (_.isEqual(interfacePage, "attributes")) {
                        setInterfacePage("start");
                      } else {
                        props.onOpen();
                        onMappingClose();
                      }
                    }}
                    isDisabled={_.isEqual(nameField, "") || _.isEqual(nameField, "start")}
                    isLoading={isMapping}
                    loadingText={"Please wait..."}
                  >
                    Back
                  </Button> */}

                  <Button
                    colorScheme={"green"}
                    rightIcon={
                      _.isEqual(interfacePage, "start") ? (
                        <Icon name="c_right" />
                      ) : (
                        <Icon name="check" />
                      )
                    }
                    variant={"solid"}
                    onClick={() => {
                      if (_.isEqual(interfacePage, "start")) {
                        setActiveStep(1);
                        setInterfacePage("attributes");
                        updateJsonDataWithUserSelections();
                      } else {
                        if (jsonData) {
                          performImportJson();
                        } else {
                          performMapping();
                        }
                      }
                    }}
                    isDisabled={_.isEqual(nameField, "") && !jsonData}
                    isLoading={isMapping}
                    loadingText={"Please wait..."}
                  >
                    {_.isEqual(interfacePage, "start") ? "Continue" : "Apply"}
                  </Button>
                </Flex>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )}
    </>
  );
};

export default Importer;
