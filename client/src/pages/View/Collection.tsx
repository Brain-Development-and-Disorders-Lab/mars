// React
import React, { useEffect, useState } from "react";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
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
  Table,
  TableContainer,
  Tag,
  TagCloseButton,
  TagLabel,
  TagRightIcon,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  AddIcon,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  WarningIcon,
} from "@chakra-ui/icons";
import { AiOutlineEdit } from "react-icons/ai";

// Navigation
import { useParams, useNavigate } from "react-router-dom";

// Database and models
import { deleteData, getData, postData } from "@database/functions";
import { CollectionModel, EntityModel } from "@types";

// Custom components
import Linky from "@components/Linky";
import { Loading } from "@components/Loading";
import { PageContainer } from "@components/PageContainer";

import _ from "underscore";

export const Collection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [editing, setEditing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [collectionData, setCollectionData] = useState({} as CollectionModel);
  const [collectionEntities, setCollectionEntities] = useState([] as string[]);
  const [allEntities, setAllEntities] = useState(
    [] as { name: string; id: string }[]
  );
  const [selectedEntities, setSelectedEntities] = useState([] as string[]);

  useEffect(() => {
    // Populate Collection data
    getData(`/collections/${id}`)
      .then((response) => {
        if (_.isEqual(response.status, "error")) {
          throw new Error(response.error);
        } else {
          setCollectionData(response);
          setCollectionEntities(response.entities);
          setIsLoaded(true);
        }
      })
      .catch(() => {
        toast({
          title: "Database Error",
          description: "Error retrieving Collection data",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      });

    // Populate Entity data
    getData(`/entities`)
      .then((response) => {
        if (_.isEqual(response.status, "error")) {
          throw new Error(response.error);
        } else {
          setAllEntities(
            response.map((e: EntityModel) => {
              return { name: e.name, id: e._id };
            })
          );
          setIsLoaded(true);
        }
      })
      .catch(() => {
        toast({
          title: "Database Error",
          description: "Error retrieving Entity data",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
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
   * Callback function to remove the Entity from the Collection, and refresh the page
   * @param {{ collection: string, entity: string }} data ID of the Collection and the ID of the Entity to remove
   */
  const removeEntity = (id: string): void => {
    setCollectionEntities(
      collectionEntities.filter((entity) => {
        entity !== id;
      })
    );
  };

  /**
   * Handle the edit button being clicked
   */
  const handleEditClick = () => {
    if (editing) {
      const updateData: CollectionModel = {
        _id: collectionData._id,
        name: collectionData.name,
        description: collectionData.description,
        owner: collectionData.owner,
        created: collectionData.created,
        entities: collectionEntities,
      };

      // Update data
      postData(`/collections/update`, updateData)
        .then((response) => {
          if (_.isEqual(response.status, "success")) {
            setEditing(false);
            toast({
              title: "Saved!",
              status: "success",
              duration: 2000,
              position: "bottom-right",
              isClosable: true,
            });
            return;
          }
          throw new Error("Could not POST data");
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
        });
    } else {
      setEditing(true);
    }
  };

  // Delete the Entity when confirmed
  const handleDeleteClick = () => {
    // Update data
    deleteData(`/collections/${id}`)
      .then((response) => {
        if (_.isEqual(response.status, "success")) {
          setEditing(false);
          navigate("/collections");

          toast({
            title: "Deleted!",
            status: "success",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
          return;
        }
        throw new Error("Could not delete Entity");
      })
      .catch(() => {
        toast({
          title: "Error",
          description: `An error occurred when deleting Collection "${collectionData._id}"`,
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      });
  };

  return isLoaded ? (
    <PageContainer>
      <Flex
        p={"2"}
        pt={"8"}
        pb={"8"}
        direction={"row"}
        justify={"space-between"}
        align={"center"}
        wrap={"wrap"}
      >
        <Heading fontWeight={"semibold"}>{collectionData.name}</Heading>

        {/* Buttons */}
        <Flex direction={"row"} gap={"2"}>
          {editing &&
            <Popover>
              <PopoverTrigger>
                <Button colorScheme={"red"} rightIcon={<CloseIcon />}>
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
                      rightIcon={<CheckIcon />}
                      onClick={handleDeleteClick}
                    >
                      Confirm
                    </Button>
                  </Flex>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          }
          <Button
            colorScheme={editing ? "green" : "gray"}
            rightIcon={
              editing ? <Icon as={CheckIcon} /> : <Icon as={AiOutlineEdit} />
            }
            onClick={handleEditClick}
          >
            {editing ? "Done" : "Edit"}
          </Button>
        </Flex>
      </Flex>

      <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
        <Flex direction={"column"} p={"2"} gap={"2"} grow={"1"}>
          {/* Details */}
          <Heading fontWeight={"semibold"} size={"lg"}>Details</Heading>
          <TableContainer>
            <Table mt={"sm"} colorScheme={"gray"}>
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
                        <TagRightIcon as={WarningIcon} />
                      </Tag>
                    ) : (
                      <Text>
                        <Link>{collectionData.owner}</Link>
                      </Text>
                    )}
                  </Td>
                </Tr>
                <Tr>
                  <Td>Description</Td>
                  <Td>
                    {_.isEqual(collectionData.description, "") ? (
                      <Tag
                        size={"md"}
                        key={`warn-${collectionData._id}`}
                        colorScheme={"orange"}
                      >
                        <TagLabel>Not specified</TagLabel>
                        <TagRightIcon as={WarningIcon} />
                      </Tag>
                    ) : (
                      <Text>{collectionData.description}</Text>
                    )}
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Flex>

        <Flex direction={"column"} p={"2"} gap={"2"} grow={"2"}>
          {/* List of Entities in the Collection */}
          <Flex direction={"row"} justify={"space-between"}>
            <Heading fontWeight={"semibold"} size={"lg"}>
              Entities
            </Heading>
            {editing && (
              <Button
                leftIcon={<AddIcon />}
                onClick={onOpen}
                colorScheme={"green"}
              >
                Add
              </Button>
            )}
          </Flex>

          {collectionEntities && collectionEntities.length > 0 ? (
            <TableContainer>
              <Table colorScheme={"gray"}>
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {collectionEntities.map((entity) => {
                    return (
                      <Tr key={entity}>
                        <Td>
                          <Linky id={entity} type={"entities"} />
                        </Td>
                        <Td>
                          <Flex justify={"right"} gap={"6"}>
                            {!editing && (
                              <Button
                                key={`view-collection-${entity}`}
                                color="grey.400"
                                rightIcon={<ChevronRightIcon />}
                                onClick={() => navigate(`/entities/${entity}`)}
                              >
                                View
                              </Button>
                            )}

                            {editing && (
                              <Button
                                key={`remove-${entity}`}
                                rightIcon={<CloseIcon />}
                                colorScheme={"red"}
                                onClick={() => {
                                  if (id) {
                                    removeEntity(entity);
                                  }
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </Flex>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <Text>This Collection is empty.</Text>
          )}
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
                    setSelectedEntities([...selectedEntities, selectedEntity]);
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
    </PageContainer>
  ) : (
    <Loading />
  );
};

export default Collection;
