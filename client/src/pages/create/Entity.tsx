// React
import React, { useEffect, useRef, useState } from "react";

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
  Spacer,
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
  Text,
  VStack,
  useBreakpoint,
  useDisclosure,
  useSteps,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import CounterSelect from "@components/CounterSelect";
import Icon from "@components/Icon";
import AttributeCard from "@components/AttributeCard";
import SearchSelect from "@components/SearchSelect";
import Relationships from "@components/Relationships";
import { Information } from "@components/Label";
import { UnsavedChangesModal } from "@components/WarningModal";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import {
  AttributeModel,
  AttributeCardProps,
  IGenericItem,
  ResponseData,
  IRelationship,
  RelationshipType,
} from "@types";

// Utility functions and libraries
import { isValidAttributes } from "src/util";
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import consola from "consola";

// Routing and navigation
import { useBlocker, useNavigate } from "react-router-dom";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";

// Authentication context
import { useAuthentication } from "@hooks/useAuthentication";

// Posthog
import { usePostHog } from "posthog-js/react";

const Entity = () => {
  const posthog = usePostHog();

  // Used to manage what detail inputs are presented
  const [pageState, setPageState] = useState(
    "start" as "start" | "attributes" | "relationships",
  );

  const pageSteps = [
    { title: "Start", description: "Basic information" },
    { title: "Relationships", description: "Relationships between Entities" },
    { title: "Attributes", description: "Specify metadata" },
  ];
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: pageSteps.length,
  });

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { token } = useAuthentication();

  // Navigation and routing
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    // Check if this is during the `create` mutation
    if (isSubmitting) {
      return false;
    }

    // Default blocker condition
    return name !== "" && currentLocation.pathname !== nextLocation.pathname;
  });
  const { onClose: onBlockerClose } = useDisclosure();
  const cancelBlockerRef = useRef(null);

  const [projects, setProjects] = useState([] as IGenericItem[]);
  const [templates, setTemplates] = useState([] as AttributeModel[]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [counter, setCounter] = useState("");
  const [useCounter, setUseCounter] = useState(false);
  const [isNameUnique, setIsNameUnique] = useState(true);
  const [created, setCreated] = useState(
    dayjs(Date.now()).format("YYYY-MM-DD"),
  );
  const [owner] = useState(token.orcid);
  const [description, setDescription] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([] as string[]);

  // Manage relationships
  const [selectedRelationshipTarget, setSelectedRelationshipTarget] = useState(
    {} as IGenericItem,
  );
  const [selectedRelationshipType, setSelectedRelationshipType] = useState(
    "general" as RelationshipType,
  );
  const [relationships, setRelationships] = useState([] as IRelationship[]);

  const [selectedAttributes, setSelectedAttributes] = useState(
    [] as AttributeModel[],
  );

  // Various validation error states
  const isNameError =
    (useCounter === false && name === "") ||
    (useCounter === true && counter === "");
  const isDateError = created === "";
  const validDetails = !isNameError && !isDateError;

  const [validAttributes, setValidAttributes] = useState(false);

  // GraphQL operations
  const CHECK_ENTITY_NAME = gql`
    query CheckEntityName($name: String) {
      entityNameExists(name: $name)
    }
  `;
  const [entityNameExists, { error: entityNameError }] =
    useLazyQuery(CHECK_ENTITY_NAME);

  const GET_CREATE_ENTITIES_DATA = gql`
    query GetCreateEntitiesData {
      projects {
        _id
        name
        description
      }
      templates {
        _id
        name
        description
        owner
        values {
          _id
          name
          data
          type
        }
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery(GET_CREATE_ENTITIES_DATA);

  const INCREMENT_COUNTER = gql`
    mutation IncrementCounter($_id: String) {
      incrementCounter(_id: $_id) {
        success
        message
        data
      }
    }
  `;
  const [incrementCounter, { error: incrementCounterError }] = useMutation<{
    incrementCounter: ResponseData<string>;
  }>(INCREMENT_COUNTER);

  const CREATE_ENTITY = gql`
    mutation CreateEntity($entity: EntityCreateInput) {
      createEntity(entity: $entity) {
        success
        message
        data
      }
    }
  `;
  const [createEntity, { loading: createLoading, error: createError }] =
    useMutation<{ createEntity: ResponseData<string> }>(CREATE_ENTITY);

  // Assign data
  useEffect(() => {
    if (data?.projects) {
      setProjects(data.projects);
    }
    if (data?.templates) {
      setTemplates(data.templates);
    }
  }, [data]);

  const checkEntityName = async (name: string) => {
    // Adjust the URL and HTTP client according to your setup
    const response = await entityNameExists({
      variables: {
        name: name,
      },
    });
    setIsNameUnique(!response.data.entityNameExists);
    if (entityNameError) {
      consola.error("Failed to check entity name:", entityNameError.cause);
    }
  };

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  // Capture event
  useEffect(() => {
    posthog?.capture("create_entity_start");
  }, [posthog]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        status: "error",
        description: error.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [error]);

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
      // Capture event
      posthog.capture("create_entity_relationships");

      setPageState("relationships");
      setActiveStep(1);
    } else if (_.isEqual("relationships", pageState)) {
      // Capture event
      posthog.capture("create_entity_attributes");

      setPageState("attributes");
      setActiveStep(2);
    } else if (_.isEqual("attributes", pageState)) {
      // Capture event
      posthog.capture("create_entity_finished");

      setIsSubmitting(true);

      // Steps to use the Counter if selected
      let generatedName = name;
      if (useCounter) {
        // Increment the Counter and substitute the name value
        const incrementResult = await incrementCounter({
          variables: {
            _id: counter,
          },
        });

        if (incrementCounterError) {
          // Raise an error and cancel the create operation
          toast({
            title: "Error",
            status: "error",
            description: incrementCounterError.message,
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });
          setIsSubmitting(false);
          return;
        }

        // Else, handle updating the name with the latest Counter value
        if (incrementResult.data?.incrementCounter) {
          generatedName = incrementResult.data.incrementCounter.data;
        }
      }

      // Execute the GraphQL operation
      const response = await createEntity({
        variables: {
          entity: {
            name: generatedName,
            owner: owner,
            created: created,
            archived: false,
            description: description,
            relationships: relationships,
            projects: selectedProjects,
            attributes: selectedAttributes,
            attachments: [],
          },
        },
      });

      if (response.data?.createEntity.success) {
        setIsSubmitting(false);
        navigate(`/entities`);
      }
    }
  };

  // Handle clicking "Back"
  const onPageBack = () => {
    if (_.isEqual("relationships", pageState)) {
      // Capture event
      posthog.capture("create_entity_start");

      setPageState("start");
      setActiveStep(0);
    } else if (_.isEqual("attributes", pageState)) {
      // Capture event
      posthog.capture("create_entity_relationships");

      setPageState("relationships");
      setActiveStep(1);
    }
  };

  const addRelationship = () => {
    // Create the `IRelationship` data structure
    const relationship: IRelationship = {
      source: {
        _id: "no_id",
        name: name,
      },
      target: {
        _id: selectedRelationshipTarget._id,
        name: selectedRelationshipTarget.name,
      },
      type: selectedRelationshipType,
    };

    setRelationships([...relationships, relationship]);

    // Reset the relationship modal state
    setSelectedRelationshipType("general");
    setSelectedRelationshipTarget({} as IGenericItem);
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
        if (_.isEqual(attribute._id, data._id)) {
          return {
            _id: data._id,
            name: data.name,
            owner: attribute.owner,
            timestamp: attribute.timestamp,
            archived: false,
            description: data.description,
            values: data.values,
          };
        }
        return attribute;
      }),
    ]);
  };

  return (
    <Content
      isLoaded={!loading && !createLoading}
      isError={!_.isUndefined(error) && !_.isUndefined(createError)}
    >
      <Flex direction={"column"}>
        {/* Page header */}
        <Flex
          direction={"row"}
          p={"2"}
          align={"center"}
          justify={"space-between"}
        >
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"entity"} size={"md"} />
            <Heading size={"md"}>Create Entity</Heading>
            <Spacer />
            <Button
              size={"sm"}
              rightIcon={<Icon name={"info"} />}
              variant={"outline"}
              onClick={onOpen}
            >
              Info
            </Button>
          </Flex>
        </Flex>

        {/* Main pages */}
        {/* Stepper progress indicator */}
        <Stepper index={activeStep} p={"2"} size={"sm"}>
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
                {breakpoint !== "base" && (
                  <StepDescription>{step.description}</StepDescription>
                )}
              </Box>

              <StepSeparator />
            </Step>
          ))}
        </Stepper>

        {/* "Start" page */}
        {_.isEqual("start", pageState) && (
          <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
            <Flex
              direction={"column"}
              w={{ base: "100%", md: "50%" }}
              p={"2"}
              pt={{ base: "0", lg: "2" }}
              gap={"2"}
              grow={"1"}
              rounded={"md"}
            >
              <Flex
                direction={"column"}
                p={"2"}
                gap={"2"}
                border={"1px"}
                borderColor={"gray.300"}
                rounded={"md"}
              >
                <FormControl
                  isRequired
                  isInvalid={isNameError || !isNameUnique}
                >
                  <FormLabel fontSize={"sm"}>Name</FormLabel>
                  <Flex gap={"2"} justify={"space-between"}>
                    {useCounter ? (
                      <CounterSelect
                        counter={counter}
                        setCounter={setCounter}
                        showCreate
                      />
                    ) : (
                      <Flex w={"100%"}>
                        <Input
                          name={"name"}
                          value={name}
                          placeholder={"Name"}
                          size={"sm"}
                          rounded={"md"}
                          onChange={(event) => {
                            setName(event.target.value);
                            checkEntityName(event.target.value);
                          }}
                        />
                      </Flex>
                    )}
                    <Flex>
                      <Button
                        size={"sm"}
                        onClick={() => {
                          setUseCounter(!useCounter);

                          // Reset the stored name and counter
                          setName("");
                          setCounter("");
                        }}
                        colorScheme={"blue"}
                      >
                        Use {useCounter ? "Text" : "Counter"}
                      </Button>
                    </Flex>
                  </Flex>
                  {(isNameError || !isNameUnique) && !useCounter && (
                    <FormErrorMessage fontSize={"sm"}>
                      A name or ID must be specified and unique.
                    </FormErrorMessage>
                  )}
                  {(isNameError || !isNameUnique) && useCounter && (
                    <FormErrorMessage fontSize={"sm"}>
                      A Counter must be selected or created.
                    </FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={isDateError}>
                  <FormLabel fontSize={"sm"}>Created</FormLabel>
                  <Input
                    placeholder={"Select Date and Time"}
                    size={"sm"}
                    rounded={"md"}
                    type={"date"}
                    value={created}
                    onChange={(event) => setCreated(event.target.value)}
                  />
                  {isDateError && (
                    <FormErrorMessage fontSize={"sm"}>
                      A created date must be specified.
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Flex>
            </Flex>

            <Flex
              direction={"column"}
              p={"2"}
              pl={{ base: "2", lg: "0" }}
              pt={{ base: "0", lg: "2" }}
              gap={"2"}
              grow={"1"}
              basis={"50%"}
              rounded={"md"}
            >
              <Flex
                direction={"column"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
              >
                {/* Description */}
                <FormControl>
                  <FormLabel fontSize={"sm"}>Description</FormLabel>
                  <MDEditor
                    height={150}
                    minHeight={100}
                    maxHeight={400}
                    style={{ width: "100%" }}
                    value={description}
                    preview={"edit"}
                    extraCommands={[]}
                    onChange={(value) => {
                      setDescription(value || "");
                    }}
                  />
                </FormControl>
              </Flex>
            </Flex>
          </Flex>
        )}

        {/* "Relationships" page */}
        {_.isEqual("relationships", pageState) && (
          <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
            <Flex
              direction={"column"}
              p={"2"}
              pt={{ base: "0", lg: "2" }}
              gap={"2"}
              grow={"1"}
              basis={"50%"}
              rounded={"md"}
            >
              {/* Relationships */}
              <Flex
                direction={"column"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
              >
                <FormControl>
                  <FormLabel fontSize={"sm"}>Relationships</FormLabel>
                  <Flex direction={"row"} gap={"2"} justify={"space-between"}>
                    <Flex direction={"row"} gap={"2"} align={"center"}>
                      <Flex>
                        <Select size={"sm"} rounded={"md"} isDisabled>
                          <option>{name}</option>
                        </Select>
                      </Flex>
                      <Flex>
                        <Select
                          size={"sm"}
                          rounded={"md"}
                          value={selectedRelationshipType}
                          onChange={(event) =>
                            setSelectedRelationshipType(
                              event.target.value as RelationshipType,
                            )
                          }
                        >
                          <option value={"general"}>General</option>
                          <option value={"parent"}>Parent</option>
                          <option value={"child"}>Child</option>
                        </Select>
                      </Flex>
                      <Flex>
                        <SearchSelect
                          id={"relationshipTargetSelect"}
                          resultType={"entity"}
                          value={selectedRelationshipTarget}
                          onChange={setSelectedRelationshipTarget}
                        />
                      </Flex>
                    </Flex>
                    <Button
                      rightIcon={<Icon name={"add"} />}
                      colorScheme={"green"}
                      size={"sm"}
                      isDisabled={_.isUndefined(selectedRelationshipTarget._id)}
                      onClick={() => addRelationship()}
                    >
                      Add
                    </Button>
                  </Flex>
                  <FormHelperText fontSize={"sm"}>
                    Create relationships between this Entity and other existing
                    Entities.
                  </FormHelperText>
                </FormControl>

                {relationships.length > 0 ? (
                  <Relationships
                    relationships={relationships}
                    setRelationships={setRelationships}
                    viewOnly={false}
                  />
                ) : (
                  <Flex
                    w={"100%"}
                    minH={"200px"}
                    align={"center"}
                    justify={"center"}
                  >
                    <Text
                      fontWeight={"semibold"}
                      fontSize={"sm"}
                      color={"gray.400"}
                    >
                      No Relationships
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>

            <Flex
              direction={"column"}
              p={"2"}
              pl={{ base: "2", sm: "0", md: "0", lg: "0" }}
              pt={{ base: "0", sm: "0", md: "0", lg: "2" }}
              gap={"2"}
              grow={"1"}
              basis={"50%"}
              rounded={"md"}
            >
              {/* Projects */}
              <Flex
                direction={"column"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
              >
                <FormControl>
                  <FormLabel fontSize={"sm"}>Projects</FormLabel>
                  <CheckboxGroup
                    size={"sm"}
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
                      {projects.length === 0 && (
                        <Text
                          fontWeight={"semibold"}
                          color={"gray.400"}
                          fontSize={"sm"}
                        >
                          No Projects.
                        </Text>
                      )}
                    </Stack>
                  </CheckboxGroup>
                  <FormHelperText fontSize={"sm"}>
                    Specify the Projects that this new Entity should be included
                    with. The Entity will then be contained within the specified
                    Projects.
                  </FormHelperText>
                </FormControl>
              </Flex>
            </Flex>
          </Flex>
        )}

        {/* "Attributes" page */}
        {_.isEqual("attributes", pageState) && (
          <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
            <Flex
              direction={"column"}
              p={"2"}
              w={"100%"}
              pt={{ base: "0", lg: "2" }}
              gap={"2"}
              rounded={"md"}
            >
              <Information
                text={
                  "Add Attributes containing metadata about this Entity. Attributes can be created from an existing Template or created manually."
                }
              />
              <Flex
                direction={"row"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
              >
                <Flex direction={"row"} gap={"2"} align={"center"} w={"100%"}>
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    Select Template:
                  </Text>
                  {/* Drop-down to select Templates */}
                  <FormControl maxW={"sm"}>
                    <Select
                      size={"sm"}
                      rounded={"md"}
                      placeholder={"Template"}
                      isDisabled={templates.length === 0}
                      onChange={(event) => {
                        if (!_.isEqual(event.target.value.toString(), "")) {
                          for (const template of templates) {
                            if (
                              _.isEqual(
                                event.target.value.toString(),
                                template._id,
                              )
                            ) {
                              setSelectedAttributes([
                                ...selectedAttributes,
                                {
                                  _id: `a-${nanoid(6)}`,
                                  name: template.name,
                                  timestamp: template.timestamp,
                                  owner: template.owner,
                                  archived: false,
                                  description: template.description,
                                  values: template.values,
                                },
                              ]);
                              break;
                            }
                          }
                        }
                      }}
                    >
                      {templates.map((template) => {
                        return (
                          <option key={template._id} value={template._id}>
                            {template.name}
                          </option>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Flex>

                <Button
                  size={"sm"}
                  rightIcon={<Icon name={"add"} />}
                  colorScheme={"green"}
                  onClick={() => {
                    // Create an 'empty' Attribute and add the data structure to 'selectedAttributes'
                    setSelectedAttributes([
                      ...selectedAttributes,
                      {
                        _id: `a-${nanoid(6)}`,
                        name: "",
                        timestamp: dayjs(Date.now()).toISOString(),
                        owner: owner,
                        archived: false,
                        description: "",
                        values: [],
                      },
                    ]);
                  }}
                >
                  Create
                </Button>
              </Flex>
            </Flex>

            <Flex
              w={"100%"}
              minH={selectedAttributes.length > 0 ? "fit-content" : "200px"}
              p={"2"}
              pt={"0"}
            >
              {/* Display all Attributes */}
              {selectedAttributes.length > 0 ? (
                <VStack gap={"2"} w={"100%"}>
                  {selectedAttributes.map((attribute) => {
                    return (
                      <AttributeCard
                        _id={attribute._id}
                        key={attribute._id}
                        name={attribute.name}
                        owner={attribute.owner}
                        archived={attribute.archived}
                        description={attribute.description}
                        values={attribute.values}
                        restrictDataValues={false}
                        onRemove={onRemoveAttributeCard}
                        onUpdate={onUpdateAttributeCard}
                      />
                    );
                  })}
                </VStack>
              ) : (
                <Flex w={"100%"} h={"100%"} align={"center"} justify={"center"}>
                  <Text
                    fontSize={"sm"}
                    fontWeight={"semibold"}
                    color={"gray.400"}
                  >
                    No Attributes
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>
        )}

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
                <Heading size={"md"}>Relationships</Heading>
                <Text>
                  Relations between Entities and membership to Projects can be
                  specified using Relationships.
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

      {/* Place the action buttons at the bottom of the screen on desktop */}
      <Spacer />

      {/* Action buttons */}
      <Flex
        direction={"row"}
        wrap={"wrap"}
        gap={"6"}
        justify={"space-between"}
        align={"center"}
        w={"100%"}
        p={"2"}
        shrink={"0"}
      >
        <Flex gap={"4"}>
          <Button
            size={"sm"}
            colorScheme={"red"}
            variant={"outline"}
            rightIcon={<Icon name={"cross"} />}
            onClick={() => navigate("/entities")}
          >
            Cancel
          </Button>
          {!_.isEqual("start", pageState) && (
            <Button
              size={"sm"}
              colorScheme={"orange"}
              variant={"outline"}
              rightIcon={<Icon name={"c_left"} />}
              onClick={onPageBack}
            >
              Back
            </Button>
          )}
        </Flex>

        <Button
          size={"sm"}
          colorScheme={_.isEqual("attributes", pageState) ? "green" : "blue"}
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
          {_.isEqual("attributes", pageState) ? "Finish" : "Continue"}
        </Button>
      </Flex>

      {/* Blocker warning message */}
      <UnsavedChangesModal
        blocker={blocker}
        cancelBlockerRef={cancelBlockerRef}
        onClose={onBlockerClose}
        callback={onBlockerClose}
      />
    </Content>
  );
};

export default Entity;
