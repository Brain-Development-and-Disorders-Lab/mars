// React
import React, { useEffect, useState } from "react";
import { Button, Flex, FormControl, FormLabel, Heading, Icon, Link, Modal, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Popover, PopoverArrow, PopoverBody, PopoverCloseButton, PopoverContent, PopoverHeader, PopoverTrigger, Select, Table, TableContainer, Tag, TagCloseButton, TagLabel, TagRightIcon, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast } from "@chakra-ui/react";
import { AddIcon, CheckIcon, ChevronRightIcon, CloseIcon, WarningIcon } from "@chakra-ui/icons";

// Navigation
import { useParams, useNavigate } from "react-router-dom";

// Database and models
import { getData, postData } from "@database/functions";
import { CollectionModel, EntityModel } from "@types";

// Custom components
import Linky from "@components/Linky";
import { Loading } from "@components/Loading";
import { PageContainer } from "@components/PageContainer";

import _ from "underscore";
import consola from "consola";
import { AiOutlineEdit, AiOutlineSave } from "react-icons/ai";

export const Collection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [editing, setEditing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [collectionData, setCollectionData] = useState({} as CollectionModel);
  const [allEntities, setAllEntities] = useState([] as { name: string; id: string }[]);
  const [selectedEntities, setSelectedEntities] = useState([] as string[]);

  useEffect(() => {
    // Populate Collection data
    getData(`/collections/${id}`).then((response) => {
      if(_.isEqual(response.status, "error")) {
        throw new Error(response.error);
      } else {
        setCollectionData(response);
        setIsLoaded(true);
      }
    }).catch(() => {
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
    getData(`/entities`).then((response) => {
      if(_.isEqual(response.status, "error")) {
        throw new Error(response.error);
      } else {
        setAllEntities(response.map((e: EntityModel) => {
          return { name: e.name, id: e._id };
        }));
        setIsLoaded(true);
      }
    }).catch(() => {
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

  /**
   * Callback function to add Entities to a Collection
   * @param {{ entities: string[], collection: string }} data List of Entities and a Collection to add the Entities to
   */
  const onAdd = (data: { entities: string[], collection: string }): void => {
    postData(`/collections/add`, data).then((response) => {
      consola.debug("Response:", response);
      navigate(`/collections/${id}`);
    });
  };

  /**
   * Callback function to remove the Entity from the Collection, and refresh the page
   * @param {{ entities: string, collection: string }} data ID of the Entity and Collection to remove the Entity from
   */
  const onRemove = (data: { entity: string, collection: string }): void => {
    postData(`/collections/remove`, data).then(() => {
      navigate(`/collections/${id}`);
    });
  };

  const handleEditClick = () => {
    setEditing(!editing);
  };

  return (
    isLoaded ? (
      <PageContainer>
        <Flex p={"2"} pt={"8"} pb={"8"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          <Heading size={"2xl"}>Collection:{" "}{collectionData.name}</Heading>
          {/* Buttons */}
          <Flex direction={"row"} p={"2"} gap={"2"}>
            <Button
              colorScheme={editing ? "green" : "gray"}
              rightIcon={editing ? <Icon as={AiOutlineSave} /> : <Icon as={AiOutlineEdit} />}
              onClick={handleEditClick}
            >
              {editing ? "Save" : "Edit"}
            </Button>
            <Popover>
              <PopoverTrigger>
                <Button
                  colorScheme={"red"}
                  rightIcon={<CloseIcon />}
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
                      rightIcon={<CheckIcon />}
                    >
                      Confirm
                    </Button>
                  </Flex>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Flex>
        </Flex>

        <Flex direction={"row"} p={"2"} wrap={"wrap"}>
          <Flex direction={"column"} p={"2"} gap={"2"} grow={"1"}>
            {/* Metadata table */}
            <Heading m={"0"}>
              Overview
            </Heading>

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
                        <Tag size={"md"} key={`warn-${collectionData._id}`} colorScheme={"orange"}>
                          <TagLabel>Not specified</TagLabel>
                          <TagRightIcon as={WarningIcon} />
                        </Tag>
                      ) : (
                        <Text><Link>{collectionData.owner}</Link></Text>
                      )}
                    </Td>
                  </Tr>
                  <Tr>
                    <Td>Description</Td>
                    <Td>
                      {_.isEqual(collectionData.description, "") ? (
                        <Tag size={"md"} key={`warn-${collectionData._id}`} colorScheme={"orange"}>
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
              <Heading m={"0"} alignSelf={"center"}>Entities</Heading>
              {editing &&
                <Button leftIcon={<AddIcon />} onClick={onOpen} colorScheme={"green"}>
                  Add
                </Button>
              }
            </Flex>

            {collectionData.entities && collectionData.entities.length > 0 ? (
              <TableContainer>
                <Table variant={"simple"} colorScheme={"gray"}>
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {collectionData.entities.map((entity) => {
                      return (
                        <Tr key={entity}>
                          <Th>
                            <Linky id={entity} type={"entities"} />
                          </Th>
                          <Th>
                            <Flex justify={"right"} gap={"6"}>
                              {!editing &&
                                <Button
                                  key={`view-collection-${entity}`}
                                  color="grey.400"
                                  rightIcon={<ChevronRightIcon />}
                                  onClick={() => navigate(`/entities/${entity}`)}
                                >
                                  View
                                </Button>
                              }

                              {editing &&
                                <Button
                                  key={`remove-${entity}`}
                                  rightIcon={<CloseIcon />}
                                  colorScheme={"red"}
                                  onClick={() => {
                                    if (id) {
                                      // Remove the entity from the collection
                                      onRemove({
                                        entity: entity,
                                        collection: id,
                                      });

                                      // Force the page to reload by setting the isLoaded state
                                      setIsLoaded(false);
                                    }
                                  }}
                                >
                                  Remove
                                </Button>
                              }
                            </Flex>
                          </Th>
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
                        <option key={entity.id} value={entity.id}>{entity.name}</option>
                      );
                    })
                  };
                </Select>
              </FormControl>

              <Flex direction={"row"} p={"2"} gap={"2"}>
                {selectedEntities.map((entity) => {
                  if (!_.isEqual(entity, "")) {
                    return (
                      <Tag key={`tag-${entity}`}>
                        <Linky id={entity} type={"entities"} />
                        <TagCloseButton onClick={() => {
                          setSelectedEntities(selectedEntities.filter((selected) => {
                            return !_.isEqual(entity, selected);
                          }));
                        }} />
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
                    onAdd({ entities: selectedEntities, collection: id });
                    setSelectedEntities([]);
                    onClose();

                    // Force the page to reload by setting the isLoaded state
                    setIsLoaded(false);
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
    )
  );
};

export default Collection;
