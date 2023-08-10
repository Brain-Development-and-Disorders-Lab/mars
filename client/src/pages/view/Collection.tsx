// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Link,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Select,
  Spacer,
  Stack,
  Table,
  TableContainer,
  Tag,
  TagCloseButton,
  TagLabel,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Linky from "@components/Linky";

// Existing and custom types
import { CollectionHistory, CollectionModel, EntityModel } from "@types";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";

// Utility functions and libraries
import { deleteData, getData, postData } from "@database/functions";
import _ from "lodash";
import dayjs from "dayjs";
import DataTable from "@components/DataTable";
import FileSaver from "file-saver";
import slugify from "slugify";

const Collection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Add Entities
  const {
    isOpen: isEntitiesOpen,
    onOpen: onEntitiesOpen,
    onClose: onEntitiesClose,
  } = useDisclosure();

  // Add Collections
  const {
    isOpen: isCollectionsOpen,
    onOpen: onCollectionsOpen,
    onClose: onCollectionsClose,
  } = useDisclosure();

  // History drawer
  const {
    isOpen: isHistoryOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose,
  } = useDisclosure();

  // Page state
  const [editing, setEditing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [exportAll, setExportAll] = useState(false);

  const [collectionData, setCollectionData] = useState({} as CollectionModel);
  const [collectionEntities, setCollectionEntities] = useState([] as string[]);
  const [collectionCollections, setCollectionCollections] = useState(
    [] as string[]
  );
  const [collectionDescription, setCollectionDescription] = useState("");
  const [collectionHistory, setCollectionHistory] = useState(
    [] as CollectionHistory[]
  );

  // Entities that can be added
  const [allEntities, setAllEntities] = useState(
    [] as { name: string; id: string }[]
  );
  const [selectedEntities, setSelectedEntities] = useState([] as string[]);

  // Collections that can be added
  const [allCollections, setAllCollections] = useState(
    [] as { name: string; id: string }[]
  );
  const [selectedCollections, setSelectedCollections] = useState(
    [] as string[]
  );

  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();
  const [exportFields, setExportFields] = useState([] as string[]);

  useEffect(() => {
    // Populate Collection data
    getData(`/collections/${id}`)
      .then((response) => {
        setCollectionData(response);
        setCollectionDescription(response.description);
        setCollectionCollections(response.collections);
        setCollectionEntities(response.entities);
        setCollectionHistory(response.history);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not retrieve Collection data.",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });

    // Populate Entity data
    getData(`/entities`)
      .then((response) => {
        setAllEntities(
          response.map((e: EntityModel) => {
            return { name: e.name, id: e._id };
          })
        );
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not retrieve Entity data.",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });

    // Populate all Collection data
    getData(`/collections`)
      .then((response) => {
        setAllCollections(
          response.map((e: CollectionModel) => {
            return { name: e.name, id: e._id };
          })
        );
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not retrieve Collections data.",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, [id, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      // Update the state of editable data fields
      setCollectionEntities(collectionData.entities);
    }
  }, [isLoaded]);

  /**
   * Callback function to add Entities to a Collection
   * @param {string[]} entities List of Entities to add
   */
  const addEntities = (entities: string[]): void => {
    setCollectionEntities([
      ...collectionEntities,
      ...entities.filter((entity) => !_.isEqual("", entity)),
    ]);
    setSelectedEntities([]);
    onEntitiesClose();
  };

  /**
   * Callback function to add Collections to a Collection
   * @param {string[]} collections List of Collections to add
   */
  const addCollections = (collections: string[]): void => {
    console.info(collectionCollections);
    setCollectionCollections([
      ...collectionCollections,
      ...collections.filter((collection) => !_.isEqual("", collection)),
    ]);
    setSelectedCollections([]);
    onCollectionsClose();
  };

  /**
   * Handle the edit button being clicked
   */
  const handleEditClick = () => {
    if (editing) {
      const updateData: CollectionModel = {
        _id: collectionData._id,
        type: collectionData.type,
        name: collectionData.name,
        description: collectionDescription,
        owner: collectionData.owner,
        created: collectionData.created,
        collections: collectionCollections,
        entities: collectionEntities,
        history: collectionHistory,
      };

      // Update data
      postData(`/collections/update`, updateData)
        .then((_response) => {
          toast({
            title: "Saved!",
            status: "success",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "An error occurred when saving updates.",
            status: "error",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        })
        .finally(() => {
          setEditing(false);
        });
    } else {
      setEditing(true);
    }
  };

  // Delete the Collection when confirmed
  const handleDeleteClick = () => {
    // Update data
    deleteData(`/collections/${id}`)
      .then((_response) => {
        toast({
          title: "Deleted!",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: `An error occurred when deleting Collection "${collectionData.name}".`,
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        setEditing(false);
        navigate("/collections");
      });
  };

  /**
   * Restore a Collection from an earlier point in time
   * @param {CollectionHistory} collectionVersion historical Collection data to restore
   */
  const handleRestoreFromHistoryClick = (
    collectionVersion: CollectionHistory
  ) => {
    const updateData: CollectionModel = {
      _id: collectionData._id,
      type: collectionData.type,
      name: collectionData.name,
      created: collectionData.created,
      owner: collectionData.owner,
      description: collectionVersion.description,
      collections: collectionVersion.collections,
      entities: collectionVersion.entities,
      history: collectionData.history,
    };

    setIsLoaded(false);

    // Update data
    postData(`/collections/update`, updateData)
      .then((_response) => {
        toast({
          title: "Saved!",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "An error occurred when saving updates.",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        // Close the drawer
        onHistoryClose();

        // Apply updated state
        setCollectionData(updateData);
        setCollectionDescription(updateData.description);
        setCollectionCollections(updateData.collections);
        setCollectionEntities(updateData.entities);
        setCollectionHistory(updateData.history);
        setIsLoaded(true);
      });
  };

  // Handle clicking the "Export" button
  const handleExportClick = () => {
    setCollectionData(collectionData);
    onExportOpen();
  };

  // Handle clicking the "Download" button
  const handleDownloadClick = (format: "json" | "csv" | "txt") => {
    // Send POST data to generate file
    postData(`/collections/export`, {
      id: id,
      fields: exportAll ? allExportFields : exportFields,
      format: format,
    })
      .then((response) => {
        let responseData = response;

        // Clean the response data if required
        if (_.isEqual(format, "json")) {
          responseData = JSON.stringify(responseData, null, "  ");
        }

        FileSaver.saveAs(
          new Blob([responseData]),
          slugify(`${collectionData.name.replace(" ", "")}_export.${format}`)
        );

        // Close the "Export" modal
        onExportClose();

        // Reset the export state
        setExportFields([]);

        toast({
          title: "Info",
          description: `Generated ${format.toUpperCase()} file.`,
          status: "info",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .catch((_error) => {
        toast({
          title: "Error",
          description: "An error occurred when exporting this Collection.",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      });
  };

  // A list of all fields that can be exported, generated when the interface is opened
  const allExportFields = ["name", "created", "owner", "description"];

  // Handle checkbox selection on the export modal
  const handleExportCheck = (field: string, checkState: boolean) => {
    if (_.isEqual(checkState, true)) {
      // If checked after click, add field to exportFields
      if (!exportFields.includes(field)) {
        const updatedFields = [...exportFields, field];
        setExportFields(updatedFields);
      }
    } else {
      // If unchecked after click, remove the field from exportFields
      if (exportFields.includes(field)) {
        const updatedFields = exportFields.filter((existingField) => {
          if (!_.isEqual(existingField, field)) {
            return existingField;
          }
          return;
        });
        setExportFields(updatedFields);
      }
    }
  };

  // Define the columns for Entities listing
  const entitiesColumns = [
    {
      id: (info: any) => info.row.original,
      cell: (info: any) => <Linky id={info.row.original} type={"entities"} />,
      header: "Name",
    },
    {
      id: "view",
      cell: (info: any) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            <Button
              key={`view-entity-${info.row.original}`}
              colorScheme={"blackAlpha"}
              rightIcon={<Icon name={"c_right"} />}
              onClick={() => navigate(`/entities/${info.row.original}`)}
            >
              View
            </Button>
          </Flex>
        );
      },
      header: "",
    },
  ];

  // Define the columns for Collections listing
  const collectionsColumns = [
    {
      id: (info: any) => info.row.original,
      cell: (info: any) => (
        <Linky id={info.row.original} type={"collections"} />
      ),
      header: "Name",
    },
    {
      id: "view",
      cell: (info: any) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            <Button
              key={`view-entity-${info.row.original}`}
              colorScheme={"blackAlpha"}
              rightIcon={<Icon name={"c_right"} />}
              onClick={() => navigate(`/collections/${info.row.original}`)}
            >
              View
            </Button>
          </Flex>
        );
      },
      header: "",
    },
  ];

  return (
    <Content isError={isError} isLoaded={isLoaded}>
      <Flex direction={"column"} gap={"4"}>
        <Flex
          gap={"4"}
          p={"4"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
          wrap={"wrap"}
        >
          <Flex
            align={"center"}
            gap={"4"}
            shadow={"lg"}
            p={"2"}
            border={"2px"}
            rounded={"md"}
          >
            <Icon
              name={
                _.isEqual(collectionData.type, "collection")
                  ? "collection"
                  : "project"
              }
              size={"lg"}
            />
            <Heading fontWeight={"semibold"}>{collectionData.name}</Heading>
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"4"}>
            <Flex
              direction={"row"}
              gap={"4"}
              wrap={"wrap"}
              p={"4"}
              rounded={"md"}
            >
              {editing && (
                <Popover>
                  <PopoverTrigger>
                    <Button
                      colorScheme={"red"}
                      rightIcon={<Icon name={"delete"} />}
                    >
                      Delete
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>Confirmation</PopoverHeader>
                    <PopoverBody>
                      Are you sure you want to delete this Collection?
                      <Flex direction={"row"} p={"2"} justify={"center"}>
                        <Button
                          colorScheme={"green"}
                          rightIcon={<Icon name={"check"} />}
                          onClick={handleDeleteClick}
                        >
                          Confirm
                        </Button>
                      </Flex>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              )}
              <Button
                colorScheme={editing ? "green" : "gray"}
                rightIcon={
                  editing ? <Icon name={"check"} /> : <Icon name={"edit"} />
                }
                onClick={handleEditClick}
              >
                {editing ? "Done" : "Edit"}
              </Button>
            </Flex>

            <Flex
              direction={"row"}
              gap={"4"}
              wrap={"wrap"}
              p={"4"}
              rounded={"md"}
            >
              <Button
                rightIcon={<Icon name={"clock"} />}
                onClick={onHistoryOpen}
              >
                History
              </Button>
              <Button
                onClick={handleExportClick}
                rightIcon={<Icon name={"download"} />}
                colorScheme={"blue"}
                isDisabled={editing}
              >
                Export
              </Button>
            </Flex>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"4"} p={"4"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            p={"4"}
            gap={"4"}
            grow={"1"}
            h={"fit-content"}
            bg={"white"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.100"}
          >
            {/* Details */}
            <Flex gap={"2"} grow={"1"} direction={"column"} minH={"32"}>
              <Heading fontWeight={"semibold"} size={"lg"}>
                Details
              </Heading>
              <TableContainer>
                <Table variant={"simple"} colorScheme={"blackAlpha"}>
                  <Thead>
                    <Tr>
                      <Th>Field</Th>
                      <Th>Value</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>Owner</Td>
                      <Td>
                        {_.isEqual(collectionData.owner, "") ? (
                          <Tag
                            size={"md"}
                            key={`warn-${collectionData._id}`}
                            colorScheme={"orange"}
                          >
                            <TagLabel>Not Specified</TagLabel>
                            <Icon name={"warning"} />
                          </Tag>
                        ) : (
                          <Text>
                            <Link>{collectionData.owner}</Link>
                          </Text>
                        )}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Type</Td>
                      <Td>
                        <Tag
                          size={"md"}
                          key={`type-${collectionData._id}`}
                          colorScheme={"blue"}
                        >
                          <TagLabel>{collectionData.type}</TagLabel>
                        </Tag>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Description</Td>
                      <Td>
                        <Textarea
                          value={collectionDescription}
                          onChange={(event) => {
                            setCollectionDescription(event.target.value);
                          }}
                          disabled={!editing}
                        />
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </Flex>
          </Flex>

          {/* Display Entities and Collections */}
          <Flex direction={"column"} gap={"4"} grow={"2"}>
            <Flex
              direction={"column"}
              p={"4"}
              gap={"4"}
              h={"fit-content"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.100"}
            >
              <Flex direction={"row"} justify={"space-between"}>
                {/* Entities in the Collection */}
                <Heading fontWeight={"semibold"} size={"lg"}>
                  Entities
                </Heading>
                {editing && (
                  <Button
                    leftIcon={<Icon name={"add"} />}
                    onClick={onEntitiesOpen}
                    colorScheme={"green"}
                  >
                    Add
                  </Button>
                )}
              </Flex>
              <Flex gap={"2"} grow={"1"} direction={"column"} minH={"32"}>
                {collectionEntities && collectionEntities.length > 0 ? (
                  <DataTable
                    data={collectionEntities}
                    columns={entitiesColumns}
                    visibleColumns={{}}
                    viewOnly={!editing}
                    hideSelection={!editing}
                  />
                ) : (
                  <Text>No Entities.</Text>
                )}
              </Flex>
            </Flex>

            <Flex
              direction={"column"}
              p={"4"}
              gap={"4"}
              h={"fit-content"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.100"}
            >
              <Flex direction={"row"} justify={"space-between"}>
                {/* Entities in the Collection */}
                <Heading fontWeight={"semibold"} size={"lg"}>
                  Collections
                </Heading>
                {editing && (
                  <Button
                    leftIcon={<Icon name={"add"} />}
                    onClick={onCollectionsOpen}
                    colorScheme={"green"}
                  >
                    Add
                  </Button>
                )}
              </Flex>
              <Flex gap={"2"} grow={"1"} direction={"column"} minH={"32"}>
                {collectionCollections && collectionCollections.length > 0 ? (
                  <DataTable
                    data={collectionCollections}
                    setData={setCollectionCollections}
                    columns={collectionsColumns}
                    visibleColumns={{}}
                    viewOnly={!editing}
                    hideSelection={!editing}
                  />
                ) : (
                  <Text>No Collections.</Text>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Modal to add Entities */}
        <Modal isOpen={isEntitiesOpen} onClose={onEntitiesClose}>
          <ModalOverlay />
          <ModalContent p={"4"}>
            {/* Heading and close button */}
            <ModalHeader>Add Entities</ModalHeader>
            <ModalCloseButton />

            {/* Select component for Entities */}
            <Flex direction={"column"} p={"2"} gap={"2"}>
              <FormControl>
                <FormLabel>Add Entities</FormLabel>
                <Select
                  title="Select Entity"
                  placeholder={"Select Entity"}
                  onChange={(event) => {
                    const selectedEntity = event.target.value.toString();
                    if (selectedEntities.includes(selectedEntity)) {
                      toast({
                        title: "Warning",
                        description: "Entity has already been selected.",
                        status: "warning",
                        duration: 2000,
                        position: "bottom-right",
                        isClosable: true,
                      });
                    } else {
                      setSelectedEntities((selectedEntities) => [
                        ...selectedEntities,
                        selectedEntity,
                      ]);
                    }
                  }}
                >
                  {isLoaded &&
                    allEntities.map((entity) => {
                      return (
                        <option key={entity.id} value={entity.id}>
                          {entity.name}
                        </option>
                      );
                    })}
                  ;
                </Select>
              </FormControl>

              <Flex direction={"row"} p={"2"} gap={"2"}>
                {selectedEntities.map((entity) => {
                  if (!_.isEqual(entity, "")) {
                    return (
                      <Tag key={`tag-${entity}`}>
                        <Linky id={entity} type={"entities"} />
                        <TagCloseButton
                          onClick={() => {
                            setSelectedEntities(
                              selectedEntities.filter((selected) => {
                                return !_.isEqual(entity, selected);
                              })
                            );
                          }}
                        />
                      </Tag>
                    );
                  } else {
                    return null;
                  }
                })}
              </Flex>
            </Flex>

            {/* "Done" button */}
            <Flex direction={"row"} p={"md"} justify={"center"}>
              <Button
                colorScheme={"green"}
                onClick={() => {
                  if (id) {
                    // Add the Entities to the Collection
                    addEntities(selectedEntities);
                  }
                }}
              >
                Done
              </Button>
            </Flex>
          </ModalContent>
        </Modal>

        {/* Modal to add Collections */}
        <Modal isOpen={isCollectionsOpen} onClose={onCollectionsClose}>
          <ModalOverlay />
          <ModalContent p={"4"}>
            {/* Heading and close button */}
            <ModalHeader>Add Collections</ModalHeader>
            <ModalCloseButton />

            {/* Select component for Entities */}
            <Flex direction={"column"} p={"2"} gap={"2"}>
              <FormControl>
                <FormLabel>Add Collections</FormLabel>
                <Select
                  title="Select Collection"
                  placeholder={"Select Collection"}
                  onChange={(event) => {
                    const selectedCollection = event.target.value.toString();
                    if (selectedCollections.includes(selectedCollection)) {
                      toast({
                        title: "Warning",
                        description: "Collection has already been selected.",
                        status: "warning",
                        duration: 2000,
                        position: "bottom-right",
                        isClosable: true,
                      });
                    } else {
                      setSelectedCollections([
                        ...selectedCollections,
                        selectedCollection,
                      ]);
                    }
                  }}
                >
                  {isLoaded &&
                    allCollections.map((collection) => {
                      return (
                        <option key={collection.id} value={collection.id}>
                          {collection.name}
                        </option>
                      );
                    })}
                  ;
                </Select>
              </FormControl>

              <Flex direction={"row"} p={"2"} gap={"2"}>
                {selectedCollections.map((collection) => {
                  if (!_.isEqual(collection, "")) {
                    return (
                      <Tag key={`tag-${collection}`}>
                        <Linky id={collection} type={"collections"} />
                        <TagCloseButton
                          onClick={() => {
                            setSelectedCollections(
                              selectedCollections.filter((selected) => {
                                return !_.isEqual(collection, selected);
                              })
                            );
                          }}
                        />
                      </Tag>
                    );
                  } else {
                    return null;
                  }
                })}
              </Flex>
            </Flex>

            {/* "Done" button */}
            <Flex direction={"row"} p={"md"} justify={"center"}>
              <Button
                colorScheme={"green"}
                onClick={() => {
                  if (id) {
                    // Add the Collections to the Collection
                    addCollections(selectedCollections);
                  }
                }}
              >
                Done
              </Button>
            </Flex>
          </ModalContent>
        </Modal>

        <Modal
          isOpen={isExportOpen}
          onClose={onExportClose}
          size={"2xl"}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"4"} gap={"4"} w={["sm", "lg", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Export Entity</ModalHeader>
            <ModalCloseButton />

            {/* Selection content */}
            <Flex direction={"row"} gap={"4"}>
              <Flex direction={"column"} p={"2"} gap={"2"}>
                <FormControl>
                  <FormLabel>Details</FormLabel>
                  {isLoaded ? (
                    <CheckboxGroup>
                      <Stack spacing={2} direction={"column"}>
                        <Checkbox disabled defaultChecked>
                          Name: {collectionData.name}
                        </Checkbox>
                        <Checkbox
                          isChecked={
                            exportAll || _.includes(exportFields, "created")
                          }
                          onChange={(event) =>
                            handleExportCheck("created", event.target.checked)
                          }
                        >
                          Created:{" "}
                          {dayjs(collectionData.created).format("DD MMM YYYY")}
                        </Checkbox>
                        <Checkbox
                          isChecked={
                            exportAll || _.includes(exportFields, "owner")
                          }
                          onChange={(event) =>
                            handleExportCheck("owner", event.target.checked)
                          }
                        >
                          Owner: {collectionData.owner}
                        </Checkbox>
                        <Checkbox
                          isChecked={
                            exportAll || _.includes(exportFields, "description")
                          }
                          onChange={(event) =>
                            handleExportCheck(
                              "description",
                              event.target.checked
                            )
                          }
                          disabled={_.isEqual(collectionDescription, "")}
                        >
                          <Text noOfLines={1}>
                            Description:{" "}
                            {_.isEqual(collectionDescription, "")
                              ? "No description"
                              : collectionDescription}
                          </Text>
                        </Checkbox>
                      </Stack>
                    </CheckboxGroup>
                  ) : (
                    <Text>Loading details</Text>
                  )}
                </FormControl>
                <FormControl>
                  <FormLabel>Collections</FormLabel>
                  {isLoaded && collectionCollections.length > 0 ? (
                    <Stack spacing={2} direction={"column"}>
                      {collectionCollections.map((collection) => {
                        allExportFields.push(`collection_${collection}`);
                        return (
                          <Checkbox
                            key={collection}
                            isChecked={
                              exportAll ||
                              _.includes(
                                exportFields,
                                `collection_${collection}`
                              )
                            }
                            onChange={(event) =>
                              handleExportCheck(
                                `collection_${collection}`,
                                event.target.checked
                              )
                            }
                          >
                            Collection:{" "}
                            {<Linky id={collection} type={"collections"} />}
                          </Checkbox>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Text>No Collections</Text>
                  )}
                </FormControl>
              </Flex>

              <Flex direction={"column"} p={"2"} gap={"2"}>
                <FormControl>
                  <FormLabel>Entities</FormLabel>
                  {isLoaded && collectionEntities.length > 0 ? (
                    <Stack spacing={2} direction={"column"}>
                      {collectionEntities.map((entity) => {
                        allExportFields.push(`entity_${entity}`);
                        return (
                          <Checkbox
                            key={entity}
                            isChecked={
                              exportAll ||
                              _.includes(exportFields, `entity_${entity}`)
                            }
                            onChange={(event) =>
                              handleExportCheck(
                                `entity_${entity}`,
                                event.target.checked
                              )
                            }
                          >
                            Entity: <Linky type={"entities"} id={entity} />
                          </Checkbox>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Text>No Entities.</Text>
                  )}
                </FormControl>
              </Flex>
            </Flex>

            {/* "Download" buttons */}
            <Flex
              direction={"row"}
              p={"md"}
              gap={"4"}
              justify={"center"}
              align={"center"}
            >
              <Checkbox
                onChange={(event) => setExportAll(event.target.checked)}
              >
                Select All
              </Checkbox>

              <Spacer />

              <Text>Download as:</Text>
              <Button
                colorScheme={"blue"}
                onClick={() => handleDownloadClick(`json`)}
                rightIcon={<Icon name={"download"} />}
              >
                JSON
              </Button>
              <Button
                colorScheme={"blue"}
                onClick={() => handleDownloadClick(`csv`)}
                rightIcon={<Icon name={"download"} />}
              >
                CSV
              </Button>
              <Button
                colorScheme={"blue"}
                onClick={() => handleDownloadClick(`txt`)}
                rightIcon={<Icon name={"download"} />}
              >
                TXT
              </Button>
            </Flex>
          </ModalContent>
        </Modal>

        <Drawer
          isOpen={isHistoryOpen}
          placement={"right"}
          onClose={onHistoryClose}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Version History</DrawerHeader>

            <DrawerBody>
              <VStack spacing={"4"}>
                {collectionHistory && collectionHistory.length > 0 ? (
                  collectionHistory.map((collectionVersion) => {
                    return (
                      <Card w={"100%"} key={`v_${collectionVersion.timestamp}`}>
                        <CardHeader>
                          <Flex align={"center"}>
                            <Text fontStyle={"italic"}>
                              {dayjs(collectionVersion.timestamp).fromNow()}
                            </Text>
                            <Spacer />
                            <Button
                              colorScheme={"orange"}
                              rightIcon={<Icon name={"rewind"} />}
                              onClick={() => {
                                handleRestoreFromHistoryClick(
                                  collectionVersion
                                );
                              }}
                            >
                              Restore
                            </Button>
                          </Flex>
                        </CardHeader>
                        <CardBody>
                          <VStack gap={"1"} align={"baseline"}>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"bold"}>Description:</Text>
                              <Text noOfLines={2}>
                                {_.isEqual(collectionVersion.description, "")
                                  ? "None"
                                  : collectionVersion.description}
                              </Text>
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"bold"}>Products:</Text>
                              {collectionVersion.entities.length > 0 ? (
                                collectionVersion.entities.map((entity) => {
                                  return (
                                    <Tag
                                      key={`v_p_${collectionVersion.timestamp}_${entity}`}
                                    >
                                      <Linky type={"entities"} id={entity} />
                                    </Tag>
                                  );
                                })
                              ) : (
                                <Text>None</Text>
                              )}
                            </Flex>
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })
                ) : (
                  <Text>No previous versions.</Text>
                )}
              </VStack>
            </DrawerBody>

            <DrawerFooter>
              <Button
                colorScheme={"red"}
                onClick={onHistoryClose}
                rightIcon={<Icon name={"cross"} />}
              >
                Close
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Flex>
    </Content>
  );
};

export default Collection;
