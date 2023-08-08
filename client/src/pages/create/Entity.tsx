// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Checkbox, CheckboxGroup, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Select, Stack, Tag, TagCloseButton, Text, Textarea, useDisclosure, useToast } from "@chakra-ui/react";
import { Content } from "@components/Container";
import Error from "@components/Error";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Attribute from "@components/Attribute";
import Loading from "@components/Loading";

// Existing and custom types
import { AttributeModel, AttributeProps, CollectionModel, EntityModel, IEntity } from "@types";

// Utility functions and libraries
import { getData, postData } from "@database/functions";
import { useToken } from "src/authentication/useToken";
import { isValidAttributes } from "src/util";
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Entity = () => {
  // Used to manage what detail inputs are presented
  const [pageState, setPageState] = useState(
    "start" as "start" | "attributes" | "associations"
  );

  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [token, _useToken] = useToken();

  const [entities, setEntities] = useState([] as EntityModel[]);
  const [collections, setCollections] = useState([] as CollectionModel[]);
  const [attributes, setAttributes] = useState([] as AttributeModel[]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [created, setCreated] = useState(
    dayjs(Date.now()).format("YYYY-MM-DDTHH:mm")
  );
  const [owner, setOwner] = useState(token.username);
  const [description, setDescription] = useState("");
  const [selectedCollections, setSelectedCollections] = useState(
    [] as string[]
  );
  const [selectedOrigins, setSelectedOrigins] = useState(
    [] as { name: string; id: string }[]
  );
  const [selectedProducts, setSelectedProducts] = useState(
    [] as { name: string; id: string }[]
  );
  const [selectedAttributes, setSelectedAttributes] = useState(
    [] as AttributeModel[]
  );

  const entityState: IEntity = {
    name: name,
    created: created,
    deleted: false,
    locked: false,
    owner: owner,
    description: description,
    associations: {
      origins: selectedOrigins,
      products: selectedProducts,
    },
    collections: selectedCollections,
    attributes: selectedAttributes,
    attachments: [],
    history: [],
  };

  // Various validation error states
  const isNameError = name === "";
  const isOwnerError = owner === "";
  const isDateError = created === "";
  const validDetails = !isNameError && !isOwnerError && !isDateError;

  const [validAttributes, setValidAttributes] = useState(false);

  useEffect(() => {
    // Get all Entities
    getData(`/entities`)
      .then((response) => {
        setEntities(response);
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
      })
      .finally(() => {
        setIsLoaded(true);
      });

    // Get all Collections
    getData(`/collections`)
      .then((response) => {
        setCollections(response);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Collections data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });

    // Get all Attributes
    getData(`/attributes`)
      .then((response) => {
        setAttributes(response);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Attributes data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  useEffect(() => {
    setValidAttributes(isValidAttributes(selectedAttributes));
  }, [selectedAttributes]);

  const isValidInput = (): boolean => {
    if (_.isEqual("start", pageState)) {
      return validDetails;
    } else if (_.isEqual("attributes", pageState)) {
      if (attributes.length > 0) {
        return validAttributes;
      }
      return true;
    }
    return true;
  };

  // Handle clicking "Next"
  const onNext = () => {
    if (_.isEqual("start", pageState)) {
      setPageState("associations");
    } else if (_.isEqual("associations", pageState)) {
      setPageState("attributes");
    } else if (_.isEqual("attributes", pageState)) {
      setIsSubmitting(true);
      postData(`/entities/create`, entityState)
        .then(() => {
          setIsSubmitting(false);
          navigate(`/entities`);
        })
        .catch((_error) => {
          toast({
            title: "Error",
            status: "error",
            description: "Could not create new Entity.",
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });
        });
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

  // Removal callback
  const onRemoveAttribute = (identifier: string) => {
    // We need to filter the removed attribute from the total collection
    setSelectedAttributes(
      selectedAttributes.filter((attribute) => attribute._id !== identifier)
    );
  };

  // Used to receive data from a Attribute component
  const onUpdateAttribute = (data: AttributeProps) => {
    setSelectedAttributes([
      ...selectedAttributes.map((attribute) => {
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
    <Content vertical={isError || !isLoaded}>
      {isLoaded ? (
        isError ? (
          <Error />
        ) : (
          <Flex direction={"column"} justify={"center"} gap={"6"} wrap={"wrap"}>
            <Flex
              direction={"column"}
              w={"100%"}
              bg={"white"}
              p={"4"}
              rounded={"md"}
            >
              {/* Page header */}
              <Flex direction={"column"} p={"2"} pt={"4"} pb={"4"}>
                <Flex
                  direction={"row"}
                  align={"center"}
                  justify={"space-between"}
                >
                  <Heading fontWeight={"semibold"}>Create Entity</Heading>
                  <Button
                    rightIcon={<Icon name={"info"} />}
                    variant={"outline"}
                    onClick={onOpen}
                  >
                    Info
                  </Button>
                </Flex>
              </Flex>

              {/* Main pages */}
              <Flex
                direction={"row"}
                justify={"center"}
                gap={"6"}
                p={"2"}
                pb={"6"}
                mb={["12", "8"]}
              >
                {/* "Start" page */}
                {_.isEqual("start", pageState) && (
                  <Flex direction={"column"} gap={"2"} maxW={"4xl"} p={"1"}>
                    <Heading fontWeight={"semibold"} size={"lg"}>
                      Details
                    </Heading>
                    <Text>
                      Specify some basic details about this Entity. Relations
                      between Entities and membership to Collections can be
                      specified on the following page. Finally, the metadata
                      associated with this Entity should be specified using
                      Attributes and corresponding Values.
                    </Text>

                    <Flex direction={"row"} gap={"2"} wrap={["wrap", "nowrap"]}>
                      <FormControl isRequired isInvalid={isNameError}>
                        <FormLabel>Name</FormLabel>
                        <Input
                          name="name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                        />
                        {isNameError && (
                          <FormErrorMessage>
                            A name or ID must be specified.
                          </FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl isRequired isInvalid={isOwnerError}>
                        <FormLabel>Owner</FormLabel>
                        <Input
                          name="owner"
                          value={owner}
                          onChange={(event) => setOwner(event.target.value)}
                        />
                        {isOwnerError && (
                          <FormErrorMessage>
                            An owner of the Entity is required.
                          </FormErrorMessage>
                        )}
                      </FormControl>
                    </Flex>

                    <Flex direction={"row"} gap={"2"} wrap={["wrap", "nowrap"]}>
                      <FormControl isRequired isInvalid={isDateError}>
                        <FormLabel>Created</FormLabel>
                        <Input
                          placeholder="Select Date and Time"
                          size="md"
                          type="datetime-local"
                          value={created}
                          onChange={(event) => setCreated(event.target.value)}
                        />
                        {isDateError && (
                          <FormErrorMessage>
                            A created date must be specified.
                          </FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        <Textarea
                          value={description}
                          onChange={(event) =>
                            setDescription(event.target.value)
                          }
                        />
                        <FormHelperText>
                          A brief description of the new Entity. Most details
                          should be inputted as Attributes with Values.
                        </FormHelperText>
                      </FormControl>
                    </Flex>
                  </Flex>
                )}

                {/* "Associations" page */}
                {_.isEqual("associations", pageState) && (
                  <Flex direction={"column"} gap={"2"} maxW={"4xl"} p={"1"}>
                    <Heading fontWeight={"semibold"} size={"lg"}>
                      Associations
                    </Heading>
                    <Text>
                      Relations between Entities and membership to Collections
                      can be specified on this page.
                    </Text>

                    <Flex direction={"row"} gap={"2"} wrap={["wrap", "nowrap"]}>
                      {/* Origin */}
                      <FormControl>
                        <FormLabel>Origin Entities</FormLabel>
                        <Select
                          title="Select Entity"
                          placeholder={"Select Entity"}
                          onChange={(event) => {
                            if (
                              _.find(selectedOrigins, (product) => {
                                return _.isEqual(
                                  product.id,
                                  event.target.value
                                );
                              })
                            ) {
                              toast({
                                title: "Warning",
                                description:
                                  "Origin has already been selected.",
                                status: "warning",
                                duration: 2000,
                                position: "bottom-right",
                                isClosable: true,
                              });
                            } else if (
                              !_.isEqual(event.target.value.toString(), "")
                            ) {
                              setSelectedOrigins([
                                ...selectedOrigins,
                                {
                                  id: event.target.value.toString(),
                                  name: event.target.options[
                                    event.target.selectedIndex
                                  ].text,
                                },
                              ]);
                            }
                          }}
                        >
                          {isLoaded &&
                            entities.map((entity) => {
                              return (
                                <option key={entity._id} value={entity._id}>
                                  {entity.name}
                                </option>
                              );
                            })}
                        </Select>
                        <FormHelperText>
                          If the sources of this Entity currently exist or did
                          exist in this system, specify those associations here
                          by selecting the origin Entities.
                        </FormHelperText>
                        <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                          {selectedOrigins.map((product) => {
                            return (
                              <Tag key={`tag-${product.id}`}>
                                <Linky id={product.id} type={"entities"} />
                                <TagCloseButton
                                  onClick={() => {
                                    setSelectedOrigins(
                                      selectedOrigins.filter((selected) => {
                                        return !_.isEqual(
                                          product.id,
                                          selected.id
                                        );
                                      })
                                    );
                                  }}
                                />
                              </Tag>
                            );
                          })}
                        </Flex>
                      </FormControl>

                      {/* Products */}
                      <FormControl>
                        <FormLabel>Linked Products</FormLabel>
                        <Select
                          title="Select Entity"
                          placeholder={"Select Entity"}
                          onChange={(event) => {
                            if (
                              _.find(selectedProducts, (product) => {
                                return _.isEqual(
                                  product.id,
                                  event.target.value
                                );
                              })
                            ) {
                              toast({
                                title: "Warning",
                                description:
                                  "Entity has already been selected.",
                                status: "warning",
                                duration: 2000,
                                position: "bottom-right",
                                isClosable: true,
                              });
                            } else if (
                              !_.isEqual(event.target.value.toString(), "")
                            ) {
                              setSelectedProducts([
                                ...selectedProducts,
                                {
                                  id: event.target.value.toString(),
                                  name: event.target.options[
                                    event.target.selectedIndex
                                  ].text,
                                },
                              ]);
                            }
                          }}
                        >
                          {isLoaded &&
                            entities.map((entity) => {
                              return (
                                <option key={entity._id} value={entity._id}>
                                  {entity.name}
                                </option>
                              );
                            })}
                          ;
                        </Select>
                        <FormHelperText>
                          If this Entity has any derivatives or Entities that
                          have been created from it, specify those associations
                          here by selecting the corresponding Entities.
                        </FormHelperText>
                        <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                          {selectedProducts.map((product) => {
                            return (
                              <Tag key={`tag-${product.id}`}>
                                <Linky id={product.id} type={"entities"} />
                                <TagCloseButton
                                  onClick={() => {
                                    setSelectedProducts(
                                      selectedProducts.filter((selected) => {
                                        return !_.isEqual(
                                          product.id,
                                          selected.id
                                        );
                                      })
                                    );
                                  }}
                                />
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
                            return (
                              <Checkbox
                                key={collection._id}
                                value={collection._id}
                              >
                                {collection.name}
                              </Checkbox>
                            );
                          })}
                        </Stack>
                      </CheckboxGroup>
                      <FormHelperText>
                        Specify the collections that this new Entity should be
                        included with. The Entity will then show up underneath
                        the specified collections.
                      </FormHelperText>
                    </FormControl>
                  </Flex>
                )}

                {/* "Attributes" page */}
                {_.isEqual("attributes", pageState) && (
                  <Flex direction={"column"} gap={"2"} maxW={"4xl"} p={"1"}>
                    <Heading fontWeight={"semibold"} size={"lg"}>
                      Attributes
                    </Heading>
                    <Text>
                      The metadata associated with this Entity should be
                      specified using Attributes and corresponding Values.
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
                                  setSelectedAttributes([
                                    ...selectedAttributes,
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
                          // Create an 'empty' Attribute and add the data structure to the 'selectedAttributes' collection
                          setSelectedAttributes([
                            ...selectedAttributes,
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
                    {selectedAttributes.map((attribute) => {
                      return (
                        <Attribute
                          key={attribute._id}
                          identifier={attribute._id}
                          name={attribute.name}
                          description={attribute.description}
                          values={attribute.values}
                          restrictDataValues={false}
                          onRemove={onRemoveAttribute}
                          onUpdate={onUpdateAttribute}
                        />
                      );
                    })}
                  </Flex>
                )}
              </Flex>

              {/* Action buttons */}
              <Flex
                direction={"row"}
                flexWrap={"wrap"}
                gap={"6"}
                justify={"space-between"}
                alignSelf={"center"}
                align={"center"}
                w={"100%"}
                p={"4"}
              >
                <Flex gap={"4"}>
                  <Button
                    colorScheme={"red"}
                    variant={"outline"}
                    rightIcon={<Icon name={"cross"} />}
                    onClick={() => navigate("/entities")}
                  >
                    Cancel
                  </Button>
                  {!_.isEqual("start", pageState) && (
                    <Button
                      colorScheme={"orange"}
                      variant={"outline"}
                      leftIcon={<Icon name={"c_left"} />}
                      onClick={onBack}
                    >
                      Back
                    </Button>
                  )}
                </Flex>

                <Button
                  colorScheme={"green"}
                  rightIcon={
                    _.isEqual("attributes", pageState) ? (
                      <Icon name={"check"} />
                    ) : (
                      <Icon name={"c_right"} />
                    )
                  }
                  onClick={onNext}
                  isDisabled={!isValidInput() && !isSubmitting}
                  isLoading={isSubmitting}
                >
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
                  <Flex direction={"column"} gap={"4"} p={"2"}>
                    <Text>Information about creating Entities.</Text>
                  </Flex>
                </ModalBody>
              </ModalContent>
            </Modal>
          </Flex>
        )
      ) : (
        <Loading />
      )}
    </Content>
  );
};

export default Entity;
