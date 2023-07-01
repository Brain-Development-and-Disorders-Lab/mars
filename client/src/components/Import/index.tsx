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
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Error from "@components/Error";

// Custom and existing types
import { CollectionModel, EntityExport, EntityModel } from "@types";

// Utility functions and libraries
import { getData, postData } from "@database/functions";
import { useToken } from "src/authentication/useToken";
import _ from "lodash";
import dayjs from "dayjs";

const Import = (props: {
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void,
}) => {
  const [file, setFile] = useState({} as File);
  const [fileType, setFileType] = useState("spreadsheet" as "backup" | "spreadsheet");
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
  const [spreadsheetData, setSpreadsheetData] = useState([] as any[]);
  const [columns, setColumns] = useState([] as string[]);

  // Data to inform field assignment
  const [entities, setEntities] = useState([] as EntityModel[]);
  const [collections, setCollections] = useState([] as CollectionModel[]);

  // Fields to be assigned to columns
  const [nameField, setNameField] = useState("");
  const [descriptionField, setDescriptionField] = useState("");
  const [ownerField, _setOwnerField] = useState(token.username);
  const [collectionField, setCollectionField] = useState("");
  const [originField, setOriginField] = useState("");

  const performImport = () => {
    setIsUploading(true);

    const formData = new FormData();
    formData.append("name", file.name);
    formData.append("file", file);
    formData.append("type", fileType);

    postData(`/system/import`, formData)
      .then((response: { status: boolean; message: string; data?: any; }) => {
        if (_.isEqual(response.status, "success")) {
          toast({
            title: "Success",
            status: "success",
            description: "Successfully imported file.",
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });

          // Reset file upload state
          setFile({} as File);
          props.onClose();

          if (!_.isUndefined(response.data)) {
            setSpreadsheetData(response.data);
            setColumns(Object.keys(response.data[0]));
            setupMapping();
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
      getData(`/collections`),
    ]).then((results: [EntityModel[], CollectionModel[]]) => {
      setEntities(results[0]);
      setCollections(results[1]);
      setIsLoaded(true);
      onMappingOpen();
    }).catch((_error) => {
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
    const mappingData: { fields: EntityExport, data: any[] } = {
      fields: {
        name: nameField,
        description: descriptionField,
        created: dayjs(Date.now()).toISOString(),
        owner: token.username,
        collections: collectionField,
        products: "",
        origins: "",
      },
      data: spreadsheetData,
    };

    postData(`/system/import/mapping`, mappingData)
      .then((response: { status: boolean; message: string; data?: any; }) => {
        toast({
          title: "Success",
          status: "success",
          description: response.message,
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        onMappingClose();
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

  const getSelectComponent = (value: any, setValue: React.SetStateAction<any>) => {
    return (
      <Select
        placeholder={"Select Column"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {columns.map((column) => {
          return (
            <option key={column} value={column}>{column}</option>
          );
        })}
      </Select>
    );
  };

  const getSelectCollectionComponent = (value: string, setValue: React.SetStateAction<any>) => {
    return (
      <Select
        placeholder={"Select Collection"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {collections.map((collection) => {
          return (
            <option key={collection._id} value={collection._id}>{collection.name}</option>
          );
        })}
      </Select>
    );
  };

  const getSelectEntityComponent = (value: string, setValue: React.SetStateAction<any>) => {
    return (
      <Select
        placeholder={"Select Entity"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {entities.map((entity) => {
          return (
            <option key={entity._id} value={entity._id}>{entity.name}</option>
          );
        })}
      </Select>
    );
  };

  return (
    <>
    {isLoaded &&
      isError ? (
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
                    <Tabs variant={"soft-rounded"} w={"100%"} onChange={(index) => {
                      if (_.isEqual(index, 0)) {
                        setFileType("spreadsheet");
                      } else {
                        setFileType("backup");
                      }
                    }}>
                      <TabList>
                        <Tab isDisabled={!_.isUndefined(file.name) && _.isEqual(fileType, "backup")}>Spreadsheet</Tab>
                        <Tab isDisabled={!_.isUndefined(file.name) && _.isEqual(fileType, "spreadsheet")}>Backup</Tab>
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
                                  <Text fontWeight={"semibold"}>Drag spreadsheet here</Text>
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
                                if (event.target.files) {
                                  // Only accept XLSX or CSV files
                                  if (_.includes(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"], event.target.files[0].type)) {
                                    setFile(event.target.files[0]);
                                  } else {
                                    toast({
                                      title: "Warning",
                                      status: "warning",
                                      description: "Please upload a XLSX or CSV file",
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
                                  <Text fontWeight={"semibold"}>Drag backup file here</Text>
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
                              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                if (event.target.files) {
                                  // Only accept JSON files
                                  if (_.isEqual(event.target.files[0].type, "application/json")) {
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

            <Modal isOpen={isMappingOpen} onClose={onMappingClose}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Map Spreadsheet Data</ModalHeader>
                <ModalBody>
                  <Flex w={"100%"} direction={"column"} gap={"4"}>
                    <Flex direction={"row"} gap={"4"}>
                      <Text fontWeight={"semibold"}>Columns:</Text>
                      <Text>{columns.join(", ")}</Text>
                    </Flex>
                    <FormControl>
                      <FormLabel>Name</FormLabel>
                      {getSelectComponent(nameField, setNameField)}
                    </FormControl>
                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      {getSelectComponent(descriptionField, setDescriptionField)}
                    </FormControl>
                    <FormControl>
                      <FormLabel>Owner</FormLabel>
                      <Input value={ownerField} disabled />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Collection</FormLabel>
                      {getSelectCollectionComponent(collectionField, setCollectionField)}
                    </FormControl>
                    <FormControl>
                      <FormLabel>Origin</FormLabel>
                      {getSelectEntityComponent(originField, setOriginField)}
                    </FormControl>
                  </Flex>
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
                      rightIcon={<Icon name="check" />}
                      variant={"outline"}
                      onClick={() => {
                        performMapping();
                      }}
                    >
                      Apply
                    </Button>
                  </Flex>
                </ModalFooter>
              </ModalContent>
            </Modal>
           </>
        )
      }
    </>
  );
};

export default Import;
