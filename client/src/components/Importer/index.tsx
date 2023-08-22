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
  Tabs,
  Tab,
  TabPanels,
  TabPanel,
  TabList,
  Select,
  FormLabel,
  Tag,
  TagCloseButton,
  Link,
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
  const [file, setFile] = useState({} as File);
  const [fileType, setFileType] = useState(
    "spreadsheet" as "backup" | "spreadsheet"
  );
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  const [spreadsheetData, setSpreadsheetData] = useState([] as any[]);
  const [columns, setColumns] = useState([] as string[]);

  // Data to inform field assignment
  const [entities, setEntities] = useState([] as EntityModel[]);
  const [projects, setProjects] = useState([] as ProjectModel[]);

  // Fields to be assigned to columns
  const [nameField, setNameField] = useState("");
  const [descriptionField, setDescriptionField] = useState("");
  const [ownerField, _setOwnerField] = useState(token.username);
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

  const performImport = () => {
    setIsUploading(true);

    const formData = new FormData();
    formData.append("name", file.name);
    formData.append("file", file);
    formData.append("type", fileType);

    postData(`/system/import`, formData)
      .then((response: { status: boolean; message: string; data?: any }) => {
        if (_.isEqual(response.status, "success")) {
          // Reset file upload state
          setFile({} as File);
          props.onClose();

          if (_.isEqual(fileType, "spreadsheet")) {
            toast({
              title: "Success",
              status: "success",
              description: "Successfully read file.",
              duration: 4000,
              position: "bottom-right",
              isClosable: true,
            });
            setSpreadsheetData(response.data);
            setColumns(Object.keys(response.data[0]));
            setupMapping();
          } else {
            toast({
              title: "Success",
              status: "success",
              description: "Successfully imported file.",
              duration: 4000,
              position: "bottom-right",
              isClosable: true,
            });
            toast({
              title: "Success",
              status: "success",
              description: (
                <Flex w={"100%"} direction={"row"} gap={"4"}>
                  Updated data available.
                  <Link onClick={() => window.location.reload()}>
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Text fontWeight={"semibold"}>Reload</Text>
                      <Icon name={"reload"} />
                    </Flex>
                  </Link>
                </Flex>
              ),
              duration: null,
              position: "bottom",
              isClosable: true,
            });
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
          description: error.message,
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
      })
      .catch((_error) => {
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

  const performMapping = () => {
    const mappingData: { fields: EntityImport; data: any[] } = {
      fields: {
        name: nameField,
        description: descriptionField,
        created: dayjs(Date.now()).toISOString(),
        owner: token.username,
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
        toast({
          title: "Success",
          status: "success",
          description: (
            <Flex w={"100%"} direction={"row"} gap={"4"}>
              Updated data available.
              <Link onClick={() => window.location.reload()}>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Text fontWeight={"semibold"}>Reload</Text>
                  <Icon name={"reload"} />
                </Flex>
              </Link>
            </Flex>
          ),
          duration: null,
          position: "bottom",
          isClosable: true,
        });
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
        value={value}
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
        disabled={_.isUndefined(disabled) ? false : disabled}
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
          <Modal isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Import Data</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Flex w={"100%"} align={"center"} justify={"center"}>
                  <Tabs
                    variant={"soft-rounded"}
                    w={"100%"}
                    onChange={(index) => {
                      if (_.isEqual(index, 0)) {
                        setFileType("spreadsheet");
                      } else {
                        setFileType("backup");
                      }
                    }}
                  >
                    <TabList gap={"2"} p={"2"}>
                      <Tab
                        isDisabled={
                          !_.isUndefined(file.name) &&
                          _.isEqual(fileType, "backup")
                        }
                      >
                        Spreadsheet
                      </Tab>
                      <Tab
                        isDisabled={
                          !_.isUndefined(file.name) &&
                          _.isEqual(fileType, "spreadsheet")
                        }
                      >
                        System Backup
                      </Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel>
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
                          >
                            {_.isEqual(file, {}) ? (
                              <Flex
                                direction={"column"}
                                w={"100%"}
                                justify={"center"}
                                align={"center"}
                              >
                                <Text fontWeight={"semibold"}>
                                  Drag spreadsheet here
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
                                // Only accept XLSX or CSV files
                                if (
                                  _.includes(
                                    [
                                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                      "text/csv",
                                    ],
                                    event.target.files[0].type
                                  )
                                ) {
                                  setFile(event.target.files[0]);
                                } else {
                                  toast({
                                    title: "Warning",
                                    status: "warning",
                                    description:
                                      "Please upload a XLSX or CSV file",
                                    duration: 4000,
                                    position: "bottom-right",
                                    isClosable: true,
                                  });
                                }
                              }
                            }}
                          />
                        </FormControl>
                      </TabPanel>

                      <TabPanel>
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
                          >
                            {_.isEqual(file, {}) ? (
                              <Flex
                                direction={"column"}
                                w={"100%"}
                                justify={"center"}
                                align={"center"}
                              >
                                <Text fontWeight={"semibold"}>
                                  Drag backup file here
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
                            accept={"json/*"}
                            onChange={(
                              event: ChangeEvent<HTMLInputElement>
                            ) => {
                              if (event.target.files) {
                                // Only accept JSON files
                                if (
                                  _.isEqual(
                                    event.target.files[0].type,
                                    "application/json"
                                  )
                                ) {
                                  setFile(event.target.files[0]);
                                } else {
                                  toast({
                                    title: "Warning",
                                    status: "warning",
                                    description: "Please upload a JSON file",
                                    duration: 4000,
                                    position: "bottom-right",
                                    isClosable: true,
                                  });
                                }
                              }
                            }}
                          />
                        </FormControl>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Flex>
              </ModalBody>

              <ModalFooter>
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
                    disabled={_.isEqual(file, {}) || isUploading}
                    rightIcon={<Icon name={"upload"} />}
                    onClick={() => performImport()}
                    isLoading={isUploading}
                  >
                    Upload
                  </Button>
                </Flex>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isMappingOpen} onClose={onMappingClose} size={"4xl"}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Import Spreadsheet Data</ModalHeader>
              <ModalBody>
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
                    <Flex direction={"row"} gap={"4"}>
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
                    </Flex>
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

              <ModalFooter>
                <Flex direction={"row"} w={"100%"} justify={"space-between"}>
                  <Button
                    colorScheme={"red"}
                    rightIcon={<Icon name="cross" />}
                    variant={"outline"}
                    onClick={() => {
                      onMappingClose();
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    colorScheme={"green"}
                    rightIcon={
                      _.isEqual(interfacePage, "start") ? (
                        <Icon name="c_right" />
                      ) : (
                        <Icon name="check" />
                      )
                    }
                    variant={
                      _.isEqual(interfacePage, "start") ? "outline" : "solid"
                    }
                    onClick={() => {
                      if (_.isEqual(interfacePage, "start")) {
                        setInterfacePage("attributes");
                      } else {
                        performMapping();
                      }
                    }}
                    disabled={_.isEqual(nameField, "")}
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
