// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Card,
  CardBody,
  CardHeader,
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
import Error from "@components/Error";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Loading from "@components/Loading";

// Existing and custom types
import { CollectionHistory, CollectionModel, EntityModel } from "@types";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";

// Utility functions and libraries
import { deleteData, getData, postData } from "@database/functions";
import _ from "lodash";
import dayjs from "dayjs";
import DataTable from "@components/DataTable";

const Collection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const [collectionData, setCollectionData] = useState({} as CollectionModel);
  const [collectionEntities, setCollectionEntities] = useState([] as string[]);
  const [collectionDescription, setCollectionDescription] = useState("");
  const [collectionHistory, setCollectionHistory] = useState(
    [] as CollectionHistory[]
  );
  const [allEntities, setAllEntities] = useState(
    [] as { name: string; id: string }[]
  );
  const [selectedEntities, setSelectedEntities] = useState([] as string[]);

  useEffect(() => {
    // Populate Collection data
    getData(`/collections/${id}`)
      .then((response) => {
        setCollectionData(response);
        setCollectionEntities(response.entities);
        setCollectionDescription(response.description);
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
    onClose();
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
        setCollectionEntities(updateData.entities);
        setCollectionHistory(updateData.history);
        setIsLoaded(true);
      });
  };

  // const columnHelper = createColumnHelper<string>();
  const columns = [
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

  return (
    <Content vertical={isError || !isLoaded}>
      {isLoaded ? (
        isError ? (
          <Error />
        ) : (
          <Flex direction={"column"} gap={"4"}>
            <Flex
              gap={"4"}
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
                bg={"white"}
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
                  bg={"white"}
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
                  bg={"white"}
                  p={"4"}
                  rounded={"md"}
                >
                  <Button
                    rightIcon={<Icon name={"clock"} />}
                    onClick={onHistoryOpen}
                  >
                    History
                  </Button>
                </Flex>
              </Flex>
            </Flex>

            <Flex direction={"row"} gap={"4"} wrap={"wrap"}>
              <Flex
                direction={"column"}
                p={"4"}
                gap={"4"}
                grow={"1"}
                h={"fit-content"}
                bg={"white"}
                rounded={"md"}
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
                                <TagLabel>Not specified</TagLabel>
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

              <Flex
                direction={"column"}
                p={"4"}
                gap={"4"}
                grow={"2"}
                h={"fit-content"}
                bg={"white"}
                rounded={"md"}
              >
                <Flex direction={"row"} justify={"space-between"}>
                  {/* Entities in the Collection */}
                  <Heading fontWeight={"semibold"} size={"lg"}>
                    Entities
                  </Heading>
                  {editing && (
                    <Button
                      leftIcon={<Icon name={"add"} />}
                      onClick={onOpen}
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
                      columns={columns}
                      visibleColumns={{}}
                      viewOnly={!editing}
                      setData={setCollectionEntities}
                      hideSelection={!editing}
                    />
                  ) : (
                    <Text>This Collection is empty.</Text>
                  )}
                </Flex>
              </Flex>
            </Flex>

            <Modal isOpen={isOpen} onClose={onClose}>
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
                          <Card
                            w={"100%"}
                            key={`v_${collectionVersion.timestamp}`}
                          >
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
                                    {_.isEqual(
                                      collectionVersion.description,
                                      ""
                                    )
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
                                          <Linky
                                            type={"entities"}
                                            id={entity}
                                          />
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
        )
      ) : (
        <Loading />
      )}
    </Content>
  );
};

export default Collection;
