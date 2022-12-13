// React
import React, { useEffect, useState } from "react";
import { Button, Checkbox, CheckboxGroup, Flex, FormControl, FormHelperText, FormLabel, Heading, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Select, Stack, Tag, TagCloseButton, Text, Textarea, useDisclosure, useToast } from "@chakra-ui/react";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import { AddIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import Linky from "src/components/Linky";

import _ from "underscore";
import consola from "consola";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { AttributeModel, AttributeProps, CollectionModel, EntityModel, EntityStruct } from "types";

// Utility functions
import { getData, pseudoId } from "src/database/functions";
import Attribute from "src/components/Attribute";

export const Start = ({}) => {
  // Used to manage what detail inputs are presented
  const [pageState, setPageState] = useState("start" as "start" | "attributes" | "associations");

  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [entities, setEntities] = useState([] as EntityModel[]);
  const [collections, setCollections] = useState([] as CollectionModel[]);
  const [attributes, setAttributes] = useState([] as AttributeModel[]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [name, setName] = useState(pseudoId("entity"));
  const [created, setCreated] = useState(new Date());
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");
  const [origin, setOrigin] = useState({} as { name: string, id: string });
  const [selectedCollections, setSelectedCollections] = useState([] as string[]);
  const [selectedProducts, setSelectedProducts] = useState([] as { name: string, id: string }[]);
  const [selectedAttributes, setSelectedAttributes] = useState([] as AttributeModel[]);

  const entityState: EntityStruct = {
    name: name,
    created: created.toISOString(),
    owner: owner,
    description: description,
    associations: {
      origin: origin,
      products: selectedProducts,
    },
    collections: selectedCollections,
    attributes: attributes,
  };
  consola.debug("Initial Entity state:", entityState);

  useEffect(() => {
    // Get all Entities
    getData(`/entities`).then((response) => {
      if(_.isEqual(response.status, "error")) {
        setIsLoaded(false);
        throw new Error(response.error);
      } else {
        setEntities(response);
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

    // Get all Collections
    getData(`/collections`).then((response) => {
      if(_.isEqual(response.status, "error")) {
        setIsLoaded(false);
        throw new Error(response.error);
      } else {
        setCollections(response);
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

    // Get all Attributes
    getData(`/attributes`).then((response) => {
      if(_.isEqual(response.status, "error")) {
        setIsLoaded(false);
        throw new Error(response.error);
      } else {
        setAttributes(response);
        setIsLoaded(true);
      }
    }).catch(() => {
      toast({
        title: "Database Error",
        description: "Error retrieving Attribute data",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    });
  }, []);

  // Handle clicking "Next"
  const onNext = () => {
    if (_.isEqual("start", pageState)) {
      setPageState("associations");
    } else if (_.isEqual("associations", pageState)) {
      setPageState("attributes");
    }
  };

  // Handle clicking "Back"
  const onBack = () => {
    if (_.isEqual("associations", pageState)) {
      setPageState("start");
    } else if (_.isEqual("attributes", pageState)) {
      setPageState("associations");
    }
  };

  // Handle clicking "Cancel"
  const onCancel = () => {
    navigate("/entities");
  };

  // Removal callback
  const onRemoveAttribute = (identifier: string) => {
    // We need to filter the removed attribute from the total collection
    setSelectedAttributes(
      selectedAttributes.filter((attribute) => attribute._id !== identifier)
    );
  };

  // Used to receive data from a Attribute component
  const onUpdateAttribute = (data: AttributeProps) => {
    setSelectedAttributes([...(selectedAttributes.map((attribute) => {
      if (_.isEqual(attribute._id, data.identifier)) {
        return {
          _id: data.identifier,
          name: data.name,
          description: data.description,
          parameters: data.parameters,
        };
      }
      return attribute;
    }))]);
  };

  return (
    <Flex m={["0", "2"]} p={["2", "4"]} align={"center"} justify={"center"}>
      <Flex direction={"column"} maxW={"7xl"} w={["full", "4xl", "7xl"]} p={"4"}>
        <Flex direction={"column"} p={"2"} pt={"8"} pb={"8"} >
          <Flex direction={"row"} align={"center"} justify={"space-between"}>
            <Heading size={"2xl"}>Create Entity</Heading>
            <Button
              rightIcon={<InfoOutlineIcon />}
              variant={"outline"}
              onClick={onOpen}
            >
              Info
            </Button>
          </Flex>
        </Flex>

        {/* Main pages */}
        <Flex p={"2"} pb={"6"} direction={"row"} wrap={"wrap"} justify={"space-between"} gap={"6"}>
          {/* "Start" page */}
          {_.isEqual("start", pageState) &&
            <Flex direction={"column"} gap={"2"} maxW={"xl"} p={"2"} rounded={"2xl"}>
              <Heading size={"xl"} margin={"xs"}>
                Details
              </Heading>
              <Text>
                Specify some basic details about this Entity.
                Relations between Entities and membership to Collections can be specified on the following page.
                Finally, the metadata associated with this Entity should be specified using Attributes and corresponding Parameters.
              </Text>

              <Flex direction={"row"} gap={"2"} grow={"1"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"2"} wrap={"wrap"}>
                  <FormControl>
                    <FormLabel>Name</FormLabel>
                    <Input
                      name="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                    <FormHelperText>A standardised name or ID for the Entity.</FormHelperText>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Owner</FormLabel>
                    <Input
                      name="owner"
                      value={owner}
                      onChange={(event) => setOwner(event.target.value)}
                      required
                    />
                    <FormHelperText>Owner of the Entity.</FormHelperText>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Created</FormLabel>
                    <SingleDatepicker
                      id="owner"
                      name="owner"
                      propsConfigs={{
                        dateNavBtnProps: {
                          colorScheme: "gray"
                        },
                        dayOfMonthBtnProps: {
                          defaultBtnProps: {
                            borderColor: "blackAlpha.300",
                            _hover: {
                              background: "black",
                              color: "white",
                            }
                          },
                          selectedBtnProps: {
                            background: "black",
                            color: "white",
                          },
                          todayBtnProps: {
                            borderColor: "blackAlpha.300",
                            background: "gray.50",
                            color: "black",
                          }
                        },
                      }}
                      date={created}
                      onDateChange={setCreated}
                    />
                    <FormHelperText>Date the Entity was created.</FormHelperText>
                  </FormControl>
                </Flex>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                  <FormHelperText>A brief description of the new Entity. Most details should be inputted as Attributes with Parameters.</FormHelperText>
                </FormControl>
              </Flex>
            </Flex>}

          {/* "Associations" page */}
          {_.isEqual("associations", pageState) &&
            <Flex direction={"column"} gap={"2"} p={"2"} rounded={"2xl"}>
              <Heading size={"xl"} margin={"xs"}>
                Associations
              </Heading>
              <Text>
                Relations between Entities and membership to Collections can be specified on this page.
              </Text>
              <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                <Flex direction={"row"} gap={"2"}>
                  {/* Origin */}
                  <FormControl>
                    <FormLabel>Origin Entity</FormLabel>
                      <Select
                        placeholder={"Select Origin Entity"}
                        onChange={(event) => {
                          setOrigin({
                            id: event.target.value.toString(),
                            name: event.target.options[event.target.selectedIndex].text,
                          });
                        }}
                      >
                        {isLoaded &&
                          entities.map((entity) => {
                            return (
                              <option key={entity._id} value={entity._id}>{entity.name}</option>
                            );
                          })
                        };
                      </Select>
                    <FormHelperText>If the source of this Entity currently exists or did exist in this system, specify that association here by searching for the origin Entity.</FormHelperText>
                  </FormControl>

                  {/* Products */}
                  <FormControl>
                    <FormLabel>Linked Products</FormLabel>
                    <Select
                      title="Select Entity"
                      placeholder={"Select Entity"}
                      onChange={(event) => {
                        if (_.find(selectedProducts, (product) => { return _.isEqual(product.id, event.target.value) })) {
                          toast({
                            title: "Warning",
                            description: "Entity has already been selected.",
                            status: "warning",
                            duration: 2000,
                            position: "bottom-right",
                            isClosable: true,
                          });
                        } else if (!_.isEqual(event.target.value.toString(), "")) {
                          setSelectedProducts([
                            ...selectedProducts,
                            {
                              id: event.target.value.toString(),
                              name: event.target.options[event.target.selectedIndex].text,
                            },
                          ]);
                        }
                      }}
                    >
                      {isLoaded &&
                        entities.map((entity) => {
                          return (
                            <option key={entity._id} value={entity._id}>{entity.name}</option>
                          );
                        })
                      };
                    </Select>
                    <FormHelperText>If this Entity has any derivatives or Entities that have been created from it, specify those associations here by searching for the corresponding Entity.</FormHelperText>
                    <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                      {selectedProducts.map((product) => {
                        return (
                          <Tag key={`tag-${product.id}`}>
                            <Linky id={product.id} type={"entities"} />
                            <TagCloseButton onClick={() => {
                              setSelectedProducts(selectedProducts.filter((selected) => {
                                return !_.isEqual(product.id, selected.id);
                              }));
                            }} />
                        </Tag>
                        );
                      })}
                    </Flex>
                  </FormControl>
                </Flex>

                {/* Collections */}
                <FormControl>
                  <FormLabel>Collections</FormLabel>
                  <CheckboxGroup
                    value={selectedCollections}
                    onChange={(event: string[]) => {
                      if (event) {
                        setSelectedCollections([...event]);
                      }
                    }}
                  >
                    <Stack spacing={[1, 5]} direction={"column"}>
                      {collections.map((collection) => {
                        return(
                          <Checkbox key={collection._id} value={collection._id}>{collection.name}</Checkbox>
                        );
                      })}
                    </Stack>
                  </CheckboxGroup>
                  <FormHelperText>Specify the collections that this new Entity should be included with. The Entity will then show up underneath the specified collections.</FormHelperText>
                </FormControl>
              </Flex>
            </Flex>}

          {/* "Attributes" page */}
          {_.isEqual("attributes", pageState) &&
            <Flex direction={"column"} gap={"2"} p={"2"} rounded={"2xl"}>
              <Heading size={"xl"} margin={"xs"}>
                Attributes
              </Heading>
              <Text>
                The metadata associated with this Entity should be specified using Attributes and corresponding Parameters.
              </Text>

              <Flex direction={"row"} gap={"2"} align={"center"} wrap={"wrap"}>
                {/* Drop-down to select existing Attributes */}
                <FormControl maxW={"sm"}>
                  <Select
                    placeholder={"Add existing Attribute"}
                    onChange={(event) => {
                      if (!_.isEqual(event.target.value.toString(), "")) {
                        for (let attribute of attributes) {
                          if (_.isEqual(event.target.value.toString(), attribute._id)) {
                            setSelectedAttributes([
                              ...selectedAttributes,
                              {
                                _id:  pseudoId("attribute"),
                                name: attribute.name,
                                description: attribute.description,
                                parameters: attribute.parameters,
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
                          <option key={attribute._id} value={attribute._id}>{attribute.name}</option>
                        );
                      })
                    };
                  </Select>
                </FormControl>

                <Button
                  rightIcon={<AddIcon />}
                  colorScheme={"green"}
                  onClick={() => {
                    // Create an 'empty' Attribute and add the data structure to the 'selectedAttributes' collection
                    setSelectedAttributes([
                      ...selectedAttributes,
                      {
                        _id: pseudoId("attribute"),
                        name: "",
                        description: "",
                        parameters: [],
                      },
                    ]);
                  }}
                >
                  Create new Attribute
                </Button>
              </Flex>

              {/* Display all Attributes */}
              {selectedAttributes.map((attribute) => {
                return (
                  <Attribute
                    key={attribute._id}
                    identifier={attribute._id}
                    name={attribute.name}
                    description={attribute.description}
                    parameters={attribute.parameters}
                    onRemove={onRemoveAttribute}
                    onUpdate={onUpdateAttribute}
                  />
                );
              })}
            </Flex>}
        </Flex>

        {/* Action buttons */}
        <Flex p={"2"} direction={"row"} w={"full"} flexWrap={"wrap"} gap={"6"} justify={"space-between"}>
          <Flex gap={"4"}>
            <Button colorScheme={"red"} variant={"outline"} rightIcon={<CloseIcon />} onClick={onCancel}>
              Cancel
            </Button>
            {!_.isEqual("start", pageState) &&
              <Button colorScheme={"orange"} variant={"outline"} leftIcon={<ChevronLeftIcon />} onClick={onBack}>
                Back
              </Button>
            }
          </Flex>

          <Button colorScheme={"green"} rightIcon={_.isEqual("attributes", pageState) ? <CheckIcon /> : <ChevronRightIcon />} onClick={onNext}>
            {_.isEqual("attributes", pageState) ? "Finish" : "Next"}
          </Button>
        </Flex>
      </Flex>

      {/* Information modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Entities</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>
            <Text>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</Text>
            <Text>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</Text>
            <Text>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Start;
