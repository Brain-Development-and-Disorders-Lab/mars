// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Tag,
  TagCloseButton,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useSteps,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import AttributeCard from "@components/AttributeCard";

// Existing and custom types
import {
  AttributeModel,
  AttributeCardProps,
  EntityModel,
  IEntity,
  ProjectModel,
  Item,
} from "@types";

// Utility functions and libraries
import { request } from "@database/functions";
import { useToken } from "src/authentication/useToken";
import { isValidAttributes } from "src/util";
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import consola from "consola";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Entity = () => {
  // Used to manage what detail inputs are presented
  const [pageState, setPageState] = useState(
    "start" as "start" | "attributes" | "associations",
  );

  const pageSteps = [
    { title: "Start", description: "Basic information" },
    { title: "Associations", description: "Relations" },
    { title: "Attributes", description: "Specify metadata" },
  ];
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: pageSteps.length,
  });

  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [token, _useToken] = useToken();

  const [entities, setEntities] = useState([] as EntityModel[]);
  const [projects, setProjects] = useState([] as ProjectModel[]);
  const [attributes, setAttributes] = useState([] as AttributeModel[]);

  const [isLoaded, setIsLoaded] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [isNameUnique, setIsNameUnique] = useState(true);
  const [created, setCreated] = useState(
    dayjs(Date.now()).format("YYYY-MM-DDTHH:mm"),
  );
  const [owner, _setOwner] = useState(token.orcid);
  const [description, setDescription] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([] as string[]);
  const [selectedOrigins, setSelectedOrigins] = useState([] as Item[]);
  const [selectedProducts, setSelectedProducts] = useState([] as Item[]);
  const [selectedAttributes, setSelectedAttributes] = useState(
    [] as AttributeModel[],
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
    projects: selectedProjects,
    attributes: selectedAttributes,
    attachments: [],
    history: [],
  };

  // Various validation error states
  const isNameError = name === "";
  const isDateError = created === "";
  const validDetails = !isNameError && !isDateError;

  const [validAttributes, setValidAttributes] = useState(false);

  const checkEntityName = async (name: string) => {
    try {
      // Adjust the URL and HTTP client according to your setup
      const response = await request("GET", `/entities/byName/${name}`);
      setIsNameUnique(!response.data); // If data is null, the name is unique
    } catch (error) {
      consola.error("Failed to check entity name:", error);
      // Handle error appropriately
    }
  };

  /**
   * Utility function to retrieve all Entities
   */
  const getEntities = async () => {
    const response = await request<EntityModel[]>("GET", "/entities");
    if (response.success) {
      setEntities(response.data);
    } else {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Entities",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
    setIsLoaded(true);
  };

  /**
   * Utility function to get all Projects
   */
  const getProjects = async () => {
    const response = await request<ProjectModel[]>("GET", "/projects");
    if (response.success) {
      setProjects(response.data);
    } else {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Projects",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
    setIsLoaded(true);
  };

  /**
   * Utility function to get all Attributes
   */
  const getAttributes = async () => {
    const response = await request<AttributeModel[]>("GET", "/attributes");
    if (response.success) {
      setAttributes(response.data);
    } else {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Attributes",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    getEntities();
    getProjects();
    getAttributes();
  }, []);

  useEffect(() => {
    setValidAttributes(isValidAttributes(selectedAttributes));
  }, [selectedAttributes]);

  const isValidInput = (): boolean => {
    if (_.isEqual("start", pageState)) {
      return validDetails;
    } else if (_.isEqual("attributes", pageState)) {
      if (selectedAttributes.length > 0) {
        return validAttributes;
      }
      return true;
    }
    return true;
  };

  // Handle clicking "Next"
  const onPageNext = async () => {
    if (_.isEqual("start", pageState)) {
      setPageState("associations");
      setActiveStep(1);
    } else if (_.isEqual("associations", pageState)) {
      setPageState("attributes");
      setActiveStep(2);
    } else if (_.isEqual("attributes", pageState)) {
      setIsSubmitting(true);
      const response = await request<any>(
        "POST",
        "/entities/create",
        entityState,
      );
      if (response.success) {
        setIsSubmitting(false);
        navigate(`/entities`);
      } else {
        toast({
          title: "Error",
          status: "error",
          description: "Could not create new Entity",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
    }
  };

  // Handle clicking "Back"
  const onPageBack = () => {
    if (_.isEqual("associations", pageState)) {
      setPageState("start");
      setActiveStep(0);
    } else if (_.isEqual("attributes", pageState)) {
      setPageState("associations");
      setActiveStep(1);
    }
  };

  // Removal callback
  const onRemoveAttributeCard = (identifier: string) => {
    // We need to filter the removed attribute
    setSelectedAttributes(
      selectedAttributes.filter((attribute) => attribute._id !== identifier),
    );
  };

  // Used to receive data from a AttributeCard component
  const onUpdateAttributeCard = (data: AttributeCardProps) => {
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
    <Content>
      <Flex
        direction={"column"}
        alignSelf={"center"}
        gap={"6"}
        w={"100%"}
        h={"100%"}
        p={"4"}
        bg={"white"}
        maxW={"4xl"}
      >
        {/* Page header */}
        <Flex direction={"row"} align={"center"} justify={"space-between"}>
          <Heading fontWeight={"semibold"} size={"lg"}>
            Create a new Entity
          </Heading>
          <Button
            rightIcon={<Icon name={"info"} />}
            variant={"outline"}
            onClick={onOpen}
          >
            Info
          </Button>
        </Flex>

        {/* Main pages */}
        {/* Stepper progress indicator */}
        <Stepper index={activeStep}>
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

        {/* "Start" page */}
        {_.isEqual("start", pageState) && (
          <Flex direction={"column"} gap={"2"} grow={"1"}>
            <FormControl isRequired isInvalid={isNameError || !isNameUnique}>
              <FormLabel>Name</FormLabel>
              <Input
                name={"name"}
                value={name}
                placeholder={"Name"}
                w={["100%", "md"]}
                onChange={(event) => {
                  setName(event.target.value);
                  checkEntityName(event.target.value);
                }}
              />
              {(isNameError || !isNameUnique) && (
                <FormErrorMessage>
                  A name or ID must be specified and unique.
                </FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={isDateError}>
              <FormLabel>Created</FormLabel>
              <Input
                placeholder={"Select Date and Time"}
                type={"date"}
                value={created}
                w={["100%", "md"]}
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
                placeholder={"Description"}
                w={["100%", "lg"]}
                onChange={(event) => setDescription(event.target.value)}
              />
              <FormHelperText>
                A brief description of the new Entity. Most details should be
                inputted as Attributes with Values.
              </FormHelperText>
            </FormControl>
          </Flex>
        )}

        {/* "Associations" page */}
        {_.isEqual("associations", pageState) && (
          <Flex direction={"column"} gap={"4"} grow={"1"}>
            <Flex direction={"row"} gap={"4"} wrap={"wrap"}>
              {/* Origins */}
              <Flex
                gap={"2"}
                p={"2"}
                direction={"column"}
                rounded={"md"}
                border={"2px"}
                borderColor={"gray.200"}
              >
                <FormControl>
                  <FormLabel>Origins</FormLabel>
                  <Select
                    title="Select Entity"
                    placeholder={"Select Entity"}
                    onChange={(event) => {
                      if (
                        _.find(selectedOrigins, (product) => {
                          return _.isEqual(product._id, event.target.value);
                        })
                      ) {
                        toast({
                          title: "Warning",
                          description: "Origin has already been selected.",
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
                            _id: event.target.value.toString(),
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
                    If the sources of this Entity currently exist or did exist
                    in this system, specify those associations here by selecting
                    the origin Entities.
                  </FormHelperText>
                </FormControl>

                {/* List selected Origins */}
                <Flex
                  direction={"row"}
                  p={"2"}
                  w={"100%"}
                  gap={"2"}
                  wrap={"wrap"}
                >
                  {selectedOrigins.map((product) => {
                    return (
                      <Tag key={`tag-${product._id}`}>
                        <Linky id={product._id} type={"entities"} />
                        <TagCloseButton
                          onClick={() => {
                            setSelectedOrigins(
                              selectedOrigins.filter((selected) => {
                                return !_.isEqual(product._id, selected._id);
                              }),
                            );
                          }}
                        />
                      </Tag>
                    );
                  })}
                  {selectedOrigins.length === 0 && (
                    <Text>No Origins selected.</Text>
                  )}
                </Flex>
              </Flex>

              {/* Products */}
              <Flex
                gap={"2"}
                p={"2"}
                direction={"column"}
                rounded={"md"}
                border={"2px"}
                borderColor={"gray.200"}
              >
                <FormControl>
                  <FormLabel>Products</FormLabel>
                  <Select
                    title="Select Entity"
                    placeholder={"Select Entity"}
                    onChange={(event) => {
                      if (
                        _.find(selectedProducts, (product) => {
                          return _.isEqual(product._id, event.target.value);
                        })
                      ) {
                        toast({
                          title: "Warning",
                          description: "Entity has already been selected.",
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
                            _id: event.target.value.toString(),
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
                    If this Entity has any derivatives or Entities that have
                    been created from it, specify those associations here by
                    selecting the corresponding Entities.
                  </FormHelperText>
                </FormControl>

                <Flex
                  direction={"row"}
                  p={"2"}
                  w={"100%"}
                  gap={"2"}
                  wrap={"wrap"}
                >
                  {selectedProducts.map((product) => {
                    return (
                      <Tag key={`tag-${product._id}`}>
                        <Linky id={product._id} type={"entities"} />
                        <TagCloseButton
                          onClick={() => {
                            setSelectedProducts(
                              selectedProducts.filter((selected) => {
                                return !_.isEqual(product._id, selected._id);
                              }),
                            );
                          }}
                        />
                      </Tag>
                    );
                  })}
                  {selectedProducts.length === 0 && (
                    <Text>No Products selected.</Text>
                  )}
                </Flex>
              </Flex>
            </Flex>

            {/* Projects */}
            <Flex
              gap={"2"}
              p={"2"}
              direction={"column"}
              rounded={"md"}
              border={"2px"}
              borderColor={"gray.200"}
            >
              <FormControl>
                <FormLabel>Projects</FormLabel>
                <CheckboxGroup
                  value={selectedProjects}
                  onChange={(event: string[]) => {
                    if (event) {
                      setSelectedProjects([...event]);
                    }
                  }}
                >
                  <Stack spacing={[1, 5]} direction={"column"}>
                    {projects.map((project) => {
                      return (
                        <Checkbox key={project._id} value={project._id}>
                          {project.name}
                        </Checkbox>
                      );
                    })}
                    {projects.length === 0 && <Text>No Projects.</Text>}
                  </Stack>
                </CheckboxGroup>
                <FormHelperText>
                  Specify the Projects that this new Entity should be included
                  with. The Entity will then be contained within the specified
                  Projects.
                </FormHelperText>
              </FormControl>
            </Flex>
          </Flex>
        )}

        {/* "Attributes" page */}
        {_.isEqual("attributes", pageState) && (
          <Flex direction={"column"} gap={"4"} grow={"1"}>
            <Flex
              direction={"row"}
              gap={"2"}
              align={"center"}
              justify={"space-between"}
            >
              {/* Drop-down to select template Attributes */}
              <FormControl maxW={"sm"}>
                <Select
                  placeholder={"Template Attribute"}
                  onChange={(event) => {
                    if (!_.isEqual(event.target.value.toString(), "")) {
                      for (let attribute of attributes) {
                        if (
                          _.isEqual(
                            event.target.value.toString(),
                            attribute._id,
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
                        <option key={attribute._id} value={attribute._id}>
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
            <VStack gap={"2"} w={"100%"}>
              {selectedAttributes.map((attribute) => {
                return (
                  <AttributeCard
                    key={attribute._id}
                    identifier={attribute._id}
                    name={attribute.name}
                    description={attribute.description}
                    values={attribute.values}
                    restrictDataValues={false}
                    onRemove={onRemoveAttributeCard}
                    onUpdate={onUpdateAttributeCard}
                  />
                );
              })}
            </VStack>
          </Flex>
        )}

        {/* Action buttons */}
        <Flex
          direction={"row"}
          wrap={"wrap"}
          gap={"6"}
          justify={"space-between"}
          align={"center"}
          w={"100%"}
          p={"4"}
          shrink={"0"}
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
                onClick={onPageBack}
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
            onClick={onPageNext}
            isDisabled={!isValidInput() || isNameError}
            isLoading={isSubmitting}
          >
            {_.isEqual("attributes", pageState) ? "Finish" : "Next"}
          </Button>
        </Flex>

        {/* Information modal */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
            <ModalHeader p={"2"}>Entities</ModalHeader>
            <ModalCloseButton />
            <ModalBody p={"2"}>
              <Flex direction={"column"} gap={"4"} p={"2"}>
                <Heading size={"md"}>Overview</Heading>
                <Text>
                  Specify some basic details about this Entity. Relations
                  between Entities and membership to Projects can be specified
                  on the following page. Finally, the metadata associated with
                  this Entity should be specified using Attributes and
                  corresponding Values.
                </Text>
                <Heading size={"md"}>Associations</Heading>
                <Text>
                  Relations between Entities and membership to Projects can be
                  specified using Associations.
                </Text>
                <Heading size={"md"}>Attributes</Heading>
                <Text>
                  The metadata associated with this Entity should be specified
                  using Attributes and corresponding Values.
                </Text>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Flex>
    </Content>
  );
};

export default Entity;
