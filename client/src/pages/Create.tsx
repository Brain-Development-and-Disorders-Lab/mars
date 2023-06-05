// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  StackDivider,
  Tag,
  TagCloseButton,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Attribute from "@components/Attribute";
import Error from "@components/Error";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Loading from "@components/Loading";
import Values from "@components/Values";

// Existing and custom types
import {
  IAttribute,
  AttributeModel,
  AttributeProps,
  CollectionModel,
  IEntity,
  EntityModel,
  IValue,
  ICollection,
} from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { checkAttributes, checkValues } from "src/functions";
import { getData, postData } from "@database/functions";
import _ from "lodash";
import { nanoid } from "nanoid";

const EntityPage = () => {
  // Used to manage what detail inputs are presented
  const [pageState, setPageState] = useState(
    "start" as "start" | "attributes" | "associations"
  );

  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [entities, setEntities] = useState([] as EntityModel[]);
  const [collections, setCollections] = useState([] as CollectionModel[]);
  const [attributes, setAttributes] = useState([] as AttributeModel[]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [created, setCreated] = useState("");
  const [owner, setOwner] = useState("");
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
    owner: owner,
    description: description,
    associations: {
      origins: selectedOrigins,
      products: selectedProducts,
    },
    collections: selectedCollections,
    attributes: selectedAttributes,
  };

  // Various validation error states
  const isNameError = name === "";
  const isOwnerError = owner === "";
  const isDateError = created === "";
  const isDetailsError = isNameError || isOwnerError || isDateError;

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
    setValidAttributes(checkAttributes(selectedAttributes));
  }, [selectedAttributes]);

  const isValidInput = (): boolean => {
    if (_.isEqual("start", pageState)) {
      return isDetailsError;
    } else if (_.isEqual("attributes", pageState)) {
      return !validAttributes;
    }
    return false;
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

  // Handle clicking "Cancel"
  const onCancel = () => {
    navigate("/");
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
          <Flex
            direction={"column"}
            justify={"center"}
            p={"2"}
            gap={"6"}
            maxW={"7xl"}
            wrap={"wrap"}
          >
            <Flex
              direction={"column"}
              w={["full", "4xl", "7xl"]}
              bg={"white"}
              p={"2"}
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
                        {!isNameError ? (
                          <FormHelperText>
                            A standardised name or ID for the Entity.
                          </FormHelperText>
                        ) : (
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
                        {!isOwnerError ? (
                          <FormHelperText>Owner of the Entity.</FormHelperText>
                        ) : (
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
                        {!isDateError ? (
                          <FormHelperText>
                            Date the Entity was created.
                          </FormHelperText>
                        ) : (
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
                          exist in this system, specify those associations here by
                          selecting the origin Entities.
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
                      {/* Drop-down to select existing Attributes */}
                      <FormControl maxW={"sm"}>
                        <Select
                          placeholder={"Add existing Attribute"}
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
                          onRemove={onRemoveAttribute}
                          onUpdate={onUpdateAttribute}
                        />
                      );
                    })}
                  </Flex>
                )}
              </Flex>
            </Flex>

            {/* Action buttons */}
            <Flex
              direction={"row"}
              flexWrap={"wrap"}
              gap={"6"}
              justify={"space-between"}
              alignSelf={"center"}
              align={"center"}
              w={["sm", "xl", "3xl"]}
              maxW={"7xl"}
              p={"4"}
              m={"4"}
              position={"fixed"}
              bottom={"0%"}
              bg={"white"}
              rounded={"md"}
            >
              <Flex gap={"4"}>
                <Button
                  colorScheme={"red"}
                  variant={"outline"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={onCancel}
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
                isDisabled={isValidInput() && !isSubmitting}
                isLoading={isSubmitting}
              >
                {_.isEqual("attributes", pageState) ? "Finish" : "Next"}
              </Button>
            </Flex>

            {/* Information modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Entities</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Text>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </Text>
                  <Text>
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco
                    laboris nisi ut aliquip ex ea commodo consequat.
                  </Text>
                  <Text>
                    Duis aute irure dolor in reprehenderit in voluptate velit
                    esse cillum dolore eu fugiat nulla pariatur.
                  </Text>
                  <Text>
                    Excepteur sint occaecat cupidatat non proident, sunt in
                    culpa qui officia deserunt mollit anim id est laborum.
                  </Text>
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

const CollectionPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [name, setName] = useState("");
  const [created, setCreated] = useState("");
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const isNameError = name === "";
  const isOwnerError = owner === "";
  const isDescriptionError = description === "";
  const isDetailsError = isNameError || isOwnerError || isDescriptionError;

  const collectionData: ICollection = {
    name: name,
    description: description,
    owner: owner,
    created: created,
    entities: [],
  };

  return (
    <Content>
      <Flex
        direction={"column"}
        justify={"center"}
        p={"2"}
        gap={"6"}
        maxW={"7xl"}
        wrap={"wrap"}
      >
        <Flex
          direction={"column"}
          w={["full", "4xl", "7xl"]}
          p={"2"}
          bg={"white"}
          rounded={"md"}
        >
          {/* Page header */}
          <Flex direction={"column"} p={"2"} pt={"4"} pb={"4"}>
            <Flex direction={"row"} align={"center"} justify={"space-between"}>
              <Heading fontWeight={"semibold"}>Create Collection</Heading>
              <Button
                rightIcon={<Icon name={"info"} />}
                variant={"outline"}
                onClick={onOpen}
              >
                Info
              </Button>
            </Flex>
          </Flex>

          {/* Data input */}
          <Flex
            direction={"row"}
            justify={"center"}
            gap={"6"}
            p={"2"}
            pb={"6"}
            mb={["12", "8"]}
          >
            <Flex
              direction={"column"}
              gap={"2"}
              w={["full", "4xl"]}
              maxW={"4xl"}
            >
              <Heading fontWeight={"semibold"} size={"lg"}>
                Details
              </Heading>
              <Text>Specify some basic details about this Collection.</Text>
              <Flex direction="row" gap={"4"} wrap={["wrap", "nowrap"]}>
                <FormControl isRequired isInvalid={isNameError}>
                  <FormLabel htmlFor="name" fontWeight={"normal"}>
                    Name
                  </FormLabel>
                  <Input
                    id="name"
                    name="name"
                    borderColor={"blackAlpha.300"}
                    focusBorderColor={"black"}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  {!isNameError ? (
                    <FormHelperText>
                      A name or ID for the Collection.
                    </FormHelperText>
                  ) : (
                    <FormErrorMessage>
                      A name or ID must be specified.
                    </FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isRequired isInvalid={isOwnerError}>
                  <FormLabel htmlFor="owner" fontWeight={"normal"}>
                    Owner
                  </FormLabel>
                  <Input
                    id="owner"
                    name="owner"
                    borderColor={"blackAlpha.300"}
                    focusBorderColor={"black"}
                    value={owner}
                    onChange={(event) => setOwner(event.target.value)}
                  />
                  {!isOwnerError ? (
                    <FormHelperText>Owner of the Collection.</FormHelperText>
                  ) : (
                    <FormErrorMessage>
                      An owner of the Collection is required.
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Flex>

              <Flex direction="row" gap={"4"} wrap={["wrap", "nowrap"]}>
                <FormControl>
                  <FormLabel htmlFor="date" fontWeight={"normal"}>
                    Created
                  </FormLabel>

                  <Input
                    placeholder="Select Date and Time"
                    size="md"
                    type="datetime-local"
                    value={created}
                    onChange={(event) => setCreated(event.target.value)}
                  />
                </FormControl>

                <FormControl isRequired isInvalid={isDescriptionError}>
                  <FormLabel htmlFor="description" fontWeight={"normal"}>
                    Description
                  </FormLabel>
                  <Textarea
                    id="description"
                    name="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                  {!isDescriptionError ? (
                    <FormHelperText>
                      A description of the Collection.
                    </FormHelperText>
                  ) : (
                    <FormErrorMessage>
                      A description must be provided.
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      {/* Action buttons */}
      <Flex
        direction={"row"}
        flexWrap={"wrap"}
        gap={"6"}
        justify={"space-between"}
        alignSelf={"center"}
        w={["sm", "xl", "3xl"]}
        maxW={"7xl"}
        p={"4"}
        m={"4"}
        position={"fixed"}
        bottom={"0%"}
        bg={"white"}
        rounded={"md"}
      >
        <Button
          colorScheme={"red"}
          rightIcon={<Icon name={"cross"} />}
          variant={"outline"}
          onClick={() => navigate("/")}
        >
          Cancel
        </Button>

        <Button
          colorScheme={"green"}
          rightIcon={<Icon name={"check"} />}
          onClick={() => {
            // Push the data
            setIsSubmitting(true);
            postData(`/collections/create`, collectionData).then(() => {
              setIsSubmitting(false);
              navigate("/collections");
            });
          }}
          isDisabled={isDetailsError && !isSubmitting}
        >
          Finish
        </Button>
      </Flex>

      {/* Information modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Collections</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Collections can be used to organize Entities. Any type of Entity
              can be included in a Collection. Entities can be added and removed
              from a Collection after it has been created.
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Content>
  );
};

const AttributePage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [values, setValues] = useState([] as IValue<any>[]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Various validation error states
  const isNameError = name === "";
  const isDescriptionError = description === "";
  const [isValueError, setIsValueError] = useState(false);
  const isDetailsError = isNameError || isDescriptionError || isValueError;

  const attributeData: IAttribute = {
    name: name,
    description: description,
    values: values,
  };

  // Check the Values for errors each time they update
  useEffect(() => {
    setIsValueError(checkValues(values, true) || values.length === 0);
  }, [values]);

  const onSubmit = () => {
    setIsSubmitting(true);

    // Push the data
    postData(`/attributes/create`, attributeData).then(() => {
      setIsSubmitting(false);
      navigate("/attributes");
    });
  };

  return (
    <Content>
      <Flex
        direction={"column"}
        justify={"center"}
        p={"2"}
        gap={"6"}
        maxW={"7xl"}
        wrap={"wrap"}
      >
        <Flex
          direction={"column"}
          w={"100%"}
          p={"2"}
          bg={"white"}
          rounded={"md"}
        >
          {/* Page header */}
          <Flex direction={"column"} p={"2"} pt={"4"} pb={"4"}>
            <Flex direction={"row"} align={"center"} justify={"space-between"}>
              <Heading fontWeight={"semibold"}>Create Attribute</Heading>
              <Button
                rightIcon={<Icon name={"info"} />}
                variant={"outline"}
                onClick={onOpen}
              >
                Info
              </Button>
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            justify={"center"}
            align={"center"}
            gap={"6"}
            p={"2"}
            pb={"6"}
            mb={["12", "8"]}
          >
            <Flex direction={"column"} w={"100%"}>
              <Heading fontWeight={"semibold"} size={"lg"}>
                Details
              </Heading>
              <Text>
                Specify some basic details about this template Attribute. The
                metadata associated with this template should be specified using
                Values.
              </Text>
            </Flex>

            <Flex
              direction={"row"}
              gap={"2"}
              w={"100%"}
              maxW={"4xl"}
              wrap={["wrap", "nowrap"]}
            >
              <Flex direction={"column"} gap={"4"} wrap={["wrap", "nowrap"]}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    placeholder={"Name"}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                  {!isNameError ? (
                    <FormHelperText>Name of the Attribute.</FormHelperText>
                  ) : (
                    <FormErrorMessage>
                      A name must be specified for the Attribute.
                    </FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={description}
                    placeholder={"Attribute Description"}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                  {!isDescriptionError ? (
                    <FormHelperText>
                      Description of the Attribute.
                    </FormHelperText>
                  ) : (
                    <FormErrorMessage>
                      A description should be provided for the Attribute.
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Flex>

              <Flex>
                <FormControl isRequired isInvalid={isValueError}>
                  <FormLabel>Values</FormLabel>
                  <Values
                    collection={values}
                    viewOnly={false}
                    setValues={setValues}
                  />
                </FormControl>
              </Flex>
            </Flex>
          </Flex>

          {/* Action buttons */}
          <Flex p={"2"} alignSelf={"center"} gap={"8"}>
            <Button
              colorScheme={"red"}
              variant={"outline"}
              rightIcon={<Icon name={"cross"} />}
              onClick={() => navigate("/")}
            >
              Cancel
            </Button>
            <Button
              colorScheme={"green"}
              rightIcon={<Icon name={"check"} />}
              onClick={onSubmit}
              isDisabled={isDetailsError && !isSubmitting}
            >
              Finish
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {/* Information modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Attributes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Individual pieces of metadata should be expressed as Values.
            </Text>
            <Text>There are five supported types of metadata:</Text>
            <List spacing={2}>
              <ListItem>
                <Flex gap={"2"} align={"center"}>
                  <Icon name={"p_date"} />
                  <Text>Date: Used to specify a point in time.</Text>
                </Flex>
              </ListItem>
              <ListItem>
                <Flex gap={"2"} align={"center"}>
                  <Icon name={"p_text"} />
                  <Text>Text: Used to specify text of variable length.</Text>
                </Flex>
              </ListItem>
              <ListItem>
                <Flex gap={"2"} align={"center"}>
                  <Icon name={"p_number"} />
                  <Text>Number: Used to specify a numerical value.</Text>
                </Flex>
              </ListItem>
              <ListItem>
                <Flex gap={"2"} align={"center"}>
                  <Icon name={"p_url"} />
                  <Text>URL: Used to specify a link.</Text>
                </Flex>
              </ListItem>
              <ListItem>
                <Flex gap={"2"} align={"center"}>
                  <Icon name={"entity"} />
                  <Text>
                    Entity: Used to specify a relation to another Entity.
                  </Text>
                </Flex>
              </ListItem>
            </List>
            <Text>Values can be specified using the buttons.</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Content>
  );
};

const Create = () => {
  const [createPage, setCreatePage] = useState(
    "default" as "default" | "entity" | "collection" | "attribute"
  );

  return (
    <>
      {/* Default landing page for creating metadata */}
      {_.isEqual(createPage, "default") && (
        <Content>
          <Flex
            direction={"column"}
            justify={"center"}
            p={"2"}
            gap={"6"}
            maxW={"7xl"}
            wrap={"wrap"}
          >
            <Flex
              direction={"column"}
              w={"100%"}
              p={"2"}
              bg={"white"}
              rounded={"md"}
            >
              {/* Page header */}
              <Flex direction={"column"} p={"4"} pt={"4"} pb={"4"}>
                <Flex
                  direction={"row"}
                  align={"center"}
                  justify={"space-between"}
                >
                  <Heading fontWeight={"semibold"}>Create</Heading>
                </Flex>
              </Flex>
              <Flex
                direction={"row"}
                justify={"center"}
                align={"center"}
                gap={"6"}
                p={"2"}
                pb={"6"}
                mb={["12", "8"]}
                wrap={"wrap"}
              >
                {/* Collection card */}
                <Card maxW={"sm"} h={"lg"} variant={"outline"}>
                  <CardHeader>
                    <Flex
                      gap={"4"}
                      w={"100%"}
                      justify={"center"}
                      align={"center"}
                    >
                      <Icon name={"collection"} size={"lg"} />
                      <Heading>Collection</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stack divider={<StackDivider />} spacing={"2"}>
                      <Flex
                        p={"2"}
                        gap={"4"}
                        align={"center"}
                        direction={"column"}
                      >
                        <Heading size={"xs"} textTransform={"uppercase"}>
                          Description
                        </Heading>
                        <Text>
                          Create a Collection to group and organize Entities.
                        </Text>
                      </Flex>
                      <Flex
                        p={"2"}
                        gap={"4"}
                        align={"center"}
                        direction={"column"}
                      >
                        <Heading size={"xs"} textTransform={"uppercase"}>
                          Details
                        </Heading>
                        <Flex gap={"2"}>
                          <Tag colorScheme={"red"}>Name</Tag>
                          <Tag colorScheme={"red"}>Description</Tag>
                        </Flex>
                      </Flex>
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Flex w={"100%"} justify={"center"}>
                      <Button
                        colorScheme={"green"}
                        rightIcon={<Icon name={"add"} />}
                        onClick={() => setCreatePage("collection")}
                      >
                        Create
                      </Button>
                    </Flex>
                  </CardFooter>
                </Card>

                {/* Entity card */}
                <Card maxW={"sm"} h={"lg"} variant={"outline"}>
                  <CardHeader>
                    <Flex
                      gap={"4"}
                      w={"100%"}
                      justify={"center"}
                      align={"center"}
                    >
                      <Icon name={"entity"} size={"lg"} />
                      <Heading>Entity</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stack divider={<StackDivider />} spacing={"2"}>
                      <Flex
                        p={"2"}
                        gap={"4"}
                        align={"center"}
                        direction={"column"}
                      >
                        <Heading size={"xs"} textTransform={"uppercase"}>
                          Description
                        </Heading>
                        <Text>
                          Create an Entity to group metadata about a physical or
                          digital resource.
                        </Text>
                      </Flex>
                      <Flex
                        p={"2"}
                        gap={"4"}
                        align={"center"}
                        direction={"column"}
                      >
                        <Heading size={"xs"} textTransform={"uppercase"}>
                          Details
                        </Heading>
                        <Flex gap={"2"} wrap={"wrap"}>
                          <Tag colorScheme={"red"}>Name</Tag>
                          <Tag colorScheme={"red"}>Owner</Tag>
                          <Tag colorScheme={"red"}>Created</Tag>
                          <Tag colorScheme={"teal"}>Description</Tag>
                          <Tag colorScheme={"teal"}>Origins</Tag>
                          <Tag colorScheme={"teal"}>Products</Tag>
                          <Tag colorScheme={"teal"}>Collections</Tag>
                          <Tag colorScheme={"teal"}>Attributes</Tag>
                        </Flex>
                      </Flex>
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Flex w={"100%"} justify={"center"}>
                      <Button
                        colorScheme={"green"}
                        rightIcon={<Icon name={"add"} />}
                        onClick={() => setCreatePage("entity")}
                      >
                        Create
                      </Button>
                    </Flex>
                  </CardFooter>
                </Card>

                {/* Attribute card */}
                <Card maxW={"sm"} h={"lg"} variant={"outline"}>
                  <CardHeader>
                    <Flex
                      gap={"4"}
                      w={"100%"}
                      justify={"center"}
                      align={"center"}
                    >
                      <Icon name={"attribute"} size={"lg"} />
                      <Heading>Attribute</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stack divider={<StackDivider />} spacing={"2"}>
                      <Flex
                        p={"2"}
                        gap={"4"}
                        align={"center"}
                        direction={"column"}
                      >
                        <Heading size={"xs"} textTransform={"uppercase"}>
                          Description
                        </Heading>
                        <Text>
                          Create a template Attribute to standardize reusable
                          components of metadata to be associated with Entities.
                        </Text>
                      </Flex>
                      <Flex
                        p={"2"}
                        gap={"4"}
                        align={"center"}
                        direction={"column"}
                      >
                        <Heading size={"xs"} textTransform={"uppercase"}>
                          Details
                        </Heading>
                        <Flex gap={"2"} wrap={"wrap"}>
                          <Tag colorScheme={"red"}>Name</Tag>
                          <Tag colorScheme={"red"}>Description</Tag>
                          <Tag colorScheme={"red"}>Values</Tag>
                        </Flex>
                      </Flex>
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Flex w={"100%"} justify={"center"}>
                      <Button
                        colorScheme={"green"}
                        rightIcon={<Icon name={"add"} />}
                        onClick={() => setCreatePage("attribute")}
                      >
                        Create
                      </Button>
                    </Flex>
                  </CardFooter>
                </Card>
              </Flex>
            </Flex>
          </Flex>
        </Content>
      )}

      {/* Create an Entity */}
      {_.isEqual(createPage, "entity") && <EntityPage />}

      {/* Create a Collection */}
      {_.isEqual(createPage, "collection") && <CollectionPage />}

      {/* Create an Attribute */}
      {_.isEqual(createPage, "attribute") && <AttributePage />}
    </>
  );
};

export default Create;
