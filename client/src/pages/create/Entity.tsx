// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Dialog,
  EmptyState,
  Field,
  Fieldset,
  Flex,
  Heading,
  IconButton,
  Input,
  ListCollection,
  Portal,
  Select,
  Spacer,
  Stack,
  Steps,
  Text,
  createListCollection,
  useDisclosure,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import CounterSelect from "@components/CounterSelect";
import Icon from "@components/Icon";
import AttributeCard from "@components/AttributeCard";
import SearchSelect from "@components/SearchSelect";
import Relationships from "@components/Relationships";
import { Information } from "@components/Label";
import { UnsavedChangesModal } from "@components/WarningModal";
import { toaster } from "@components/Toast";
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

  // Page steps
  const pageSteps = [
    { title: "Start", description: "Basic information" },
    { title: "Relationships", description: "Relationships between Entities" },
    { title: "Attributes", description: "Specify metadata" },
  ];
  const [pageStep, setPageStep] = useState(0);

  const [informationOpen, setInformationOpen] = useState(false);
  const { token } = useAuthentication();

  // Navigation and routing
  const navigate = useNavigate();
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

  // Projects
  const [projects, setProjects] = useState([] as IGenericItem[]);

  // Templates collection
  const [templatesCollection, setTemplatesCollection] = useState(
    {} as ListCollection<AttributeModel>,
  );

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
  const selectRelationshipTypeRef = useRef(null);
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
      setTemplatesCollection(
        createListCollection<AttributeModel>({ items: data.templates }),
      );
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
      toaster.create({
        title: "Error",
        type: "error",
        description: error.message,
        duration: 4000,
        closable: true,
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
      setPageStep(1);
    } else if (_.isEqual("relationships", pageState)) {
      // Capture event
      posthog.capture("create_entity_attributes");

      setPageState("attributes");
      setPageStep(2);
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
          toaster.create({
            title: "Error",
            type: "error",
            description: incrementCounterError.message,
            duration: 4000,
            closable: true,
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
      setPageStep(0);
    } else if (_.isEqual("attributes", pageState)) {
      // Capture event
      posthog.capture("create_entity_relationships");

      setPageState("relationships");
      setPageStep(1);
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
              rounded={"md"}
              variant={"outline"}
              onClick={() => setInformationOpen(true)}
            >
              Info
              <Icon name={"info"} />
            </Button>
          </Flex>
        </Flex>

        {/* Main pages */}
        {/* Stepper progress indicator */}
        <Steps.Root
          step={pageStep}
          colorPalette={"blue"}
          onStepChange={(event) => setPageStep(event.step)}
          count={pageSteps.length}
          px={"2"}
        >
          <Steps.List>
            {pageSteps.map((step, index) => (
              <Steps.Item key={index} index={index} title={step.title}>
                <Steps.Indicator />
                <Steps.Title>{step.title}</Steps.Title>
                <Steps.Separator />
              </Steps.Item>
            ))}
          </Steps.List>
        </Steps.Root>

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
                border={"1px solid"}
                borderColor={"gray.300"}
                rounded={"md"}
              >
                <Fieldset.Root invalid={isNameError || !isNameUnique}>
                  <Fieldset.Content>
                    <Field.Root required>
                      <Field.Label>
                        Name
                        <Field.RequiredIndicator />
                      </Field.Label>
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
                              minW={"240px"}
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
                            rounded={"md"}
                            onClick={() => {
                              setUseCounter(!useCounter);

                              // Reset the stored name and counter
                              setName("");
                              setCounter("");
                            }}
                            colorPalette={"blue"}
                          >
                            Use {useCounter ? "Text" : "Counter"}
                          </Button>
                        </Flex>
                      </Flex>
                      {(isNameError || !isNameUnique) && !useCounter && (
                        <Field.ErrorText>
                          A name or ID must be specified and unique.
                        </Field.ErrorText>
                      )}
                      {(isNameError || !isNameUnique) && useCounter && (
                        <Field.ErrorText>
                          A Counter must be selected or created.
                        </Field.ErrorText>
                      )}
                    </Field.Root>

                    <Field.Root invalid={isDateError} required>
                      <Field.Label>
                        Created
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        placeholder={"Select Date and Time"}
                        size={"sm"}
                        rounded={"md"}
                        type={"date"}
                        value={created}
                        onChange={(event) => setCreated(event.target.value)}
                      />
                      {isDateError && (
                        <Field.ErrorText>
                          A created date must be specified.
                        </Field.ErrorText>
                      )}
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
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
                border={"1px solid"}
                borderColor={"gray.300"}
              >
                {/* Description */}
                <Fieldset.Root>
                  <Fieldset.Content>
                    <Field.Root>
                      <Field.Label>Description</Field.Label>
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
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
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
                border={"1px solid"}
                borderColor={"gray.300"}
              >
                <Flex
                  direction={"row"}
                  gap={"2"}
                  justify={"space-between"}
                  p={"2"}
                  align={"end"}
                >
                  <Flex direction={"column"} gap={"1"} w={"33%"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      Source
                    </Text>
                    <Input
                      size={"sm"}
                      rounded={"md"}
                      value={name}
                      readOnly
                      disabled
                    />
                  </Flex>
                  <Flex direction={"column"} gap={"1"} w={"33%"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      Type
                    </Text>
                    <Select.Root
                      key={"select-relationship-type"}
                      size={"sm"}
                      collection={createListCollection({
                        items: ["General", "Parent", "Child"],
                      })}
                      onValueChange={(details) => {
                        setSelectedRelationshipType(
                          details.items[0].toLowerCase() as RelationshipType,
                        );
                      }}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText
                            placeholder={"Select Relationship Type"}
                          />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal container={selectRelationshipTypeRef}>
                        <Select.Positioner>
                          <Select.Content>
                            {createListCollection({
                              items: ["General", "Parent", "Child"],
                            }).items.map((relationship) => (
                              <Select.Item
                                item={relationship}
                                key={relationship}
                              >
                                {relationship}
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Flex>
                  <Flex direction={"column"} gap={"1"} w={"33%"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      Target
                    </Text>
                    <SearchSelect
                      resultType={"entity"}
                      value={selectedRelationshipTarget}
                      onChange={setSelectedRelationshipTarget}
                    />
                  </Flex>
                  <Button
                    colorPalette={"green"}
                    size={"sm"}
                    rounded={"md"}
                    disabled={_.isUndefined(selectedRelationshipTarget._id)}
                    onClick={() => addRelationship()}
                  >
                    Add
                    <Icon name={"add"} />
                  </Button>
                </Flex>

                {relationships.length > 0 ? (
                  <Relationships
                    relationships={relationships}
                    setRelationships={setRelationships}
                    viewOnly={false}
                  />
                ) : (
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"graph"} size={"lg"} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>
                        No Relationships
                      </EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
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
                border={"1px solid"}
                borderColor={"gray.300"}
              >
                <Fieldset.Root>
                  <CheckboxGroup
                    size={"sm"}
                    value={selectedProjects}
                    onValueChange={(event: string[]) => {
                      if (event) {
                        setSelectedProjects([...event]);
                      }
                    }}
                  >
                    <Fieldset.Legend>Projects</Fieldset.Legend>
                    <Fieldset.Content>
                      <Stack gap={[1, 5]} direction={"column"}>
                        {projects.map((project) => {
                          return (
                            <Checkbox.Root
                              key={project._id}
                              value={project._id}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label>{project.name}</Checkbox.Label>
                            </Checkbox.Root>
                          );
                        })}
                        {projects.length === 0 && (
                          <EmptyState.Root>
                            <EmptyState.Content>
                              <EmptyState.Indicator>
                                <Icon name={"project"} size={"lg"} />
                              </EmptyState.Indicator>
                              <EmptyState.Description>
                                No Projects
                              </EmptyState.Description>
                            </EmptyState.Content>
                          </EmptyState.Root>
                        )}
                      </Stack>

                      <Fieldset.HelperText>
                        Specify the Projects that this new Entity should be
                        included with. The Entity will then be contained within
                        the specified Projects.
                      </Fieldset.HelperText>
                    </Fieldset.Content>
                  </CheckboxGroup>
                </Fieldset.Root>
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
                border={"1px solid"}
                borderColor={"gray.300"}
              >
                <Flex direction={"row"} gap={"2"} align={"center"} w={"100%"}>
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    Select Template:
                  </Text>
                  {/* Drop-down to select Templates */}
                  <Fieldset.Root maxW={"sm"}>
                    <Fieldset.Content>
                      <Field.Root>
                        <Select.Root
                          key={"select-template"}
                          size={"sm"}
                          collection={templatesCollection}
                          onValueChange={(details) => {
                            const selectedTemplate = details.items[0];
                            if (!_.isEqual(selectedTemplate._id, "")) {
                              for (const template of templatesCollection.items) {
                                if (
                                  _.isEqual(selectedTemplate._id, template._id)
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
                          disabled={templatesCollection.items.length === 0}
                        >
                          <Select.HiddenSelect />
                          <Select.Control>
                            <Select.Trigger>
                              <Select.ValueText
                                placeholder={"Select Template"}
                              />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                              <Select.Indicator />
                            </Select.IndicatorGroup>
                          </Select.Control>
                          <Portal>
                            <Select.Positioner>
                              <Select.Content>
                                {templatesCollection.items.map(
                                  (template: AttributeModel) => (
                                    <Select.Item
                                      item={template}
                                      key={template._id}
                                    >
                                      {template.name}
                                      <Select.ItemIndicator />
                                    </Select.Item>
                                  ),
                                )}
                              </Select.Content>
                            </Select.Positioner>
                          </Portal>
                        </Select.Root>
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>

                <Button
                  size={"sm"}
                  rounded={"md"}
                  colorPalette={"green"}
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
                  <Icon name={"add"} />
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
                <Stack gap={"2"} w={"100%"}>
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
                </Stack>
              ) : (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon name={"attribute"} size={"lg"} />
                    </EmptyState.Indicator>
                    <EmptyState.Description>
                      No Attributes
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Flex>
          </Flex>
        )}

        {/* Information modal */}
        <Dialog.Root
          open={informationOpen}
          onOpenChange={(event) => setInformationOpen(event.open)}
          placement={"center"}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Trigger />
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.CloseTrigger asChild>
                <IconButton
                  bg={"white"}
                  _hover={{ bg: "gray.200" }}
                  variant={"subtle"}
                  color={"black"}
                  onClick={() => setInformationOpen(false)}
                >
                  <Icon name={"close"} />
                </IconButton>
              </Dialog.CloseTrigger>
              <Dialog.Header
                p={"2"}
                mt={"2"}
                fontWeight={"semibold"}
                fontSize={"md"}
              >
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Icon name={"entity"} size={"sm"} />
                  Entities
                </Flex>
              </Dialog.Header>
              <Dialog.Body p={"2"}>
                <Flex direction={"column"} gap={"2"}>
                  <Heading size={"sm"}>1. Start</Heading>
                  <Text>
                    Specify some basic details about this Entity. Relations
                    between Entities and membership to Projects can be specified
                    on the following page. Finally, the metadata associated with
                    this Entity should be specified using Attributes and
                    corresponding Values.
                  </Text>
                  <Heading size={"sm"}>2. Relationships</Heading>
                  <Text>
                    Relations between Entities and membership to Projects can be
                    specified using Relationships.
                  </Text>
                  <Heading size={"sm"}>3. Attributes</Heading>
                  <Text>
                    The metadata associated with this Entity should be specified
                    using Attributes and corresponding Values.
                  </Text>
                </Flex>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
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
            rounded={"md"}
            colorPalette={"red"}
            variant={"outline"}
            onClick={() => navigate("/entities")}
          >
            Cancel
            <Icon name={"cross"} />
          </Button>
          {!_.isEqual("start", pageState) && (
            <Button
              size={"sm"}
              colorPalette={"orange"}
              variant={"outline"}
              onClick={onPageBack}
            >
              Back
              <Icon name={"c_left"} />
            </Button>
          )}
        </Flex>

        <Button
          size={"sm"}
          rounded={"md"}
          colorPalette={_.isEqual("attributes", pageState) ? "green" : "blue"}
          onClick={onPageNext}
          disabled={!isValidInput() || isNameError}
          loading={isSubmitting}
        >
          {_.isEqual("attributes", pageState) ? "Finish" : "Continue"}
          {_.isEqual("attributes", pageState) ? (
            <Icon name={"check"} />
          ) : (
            <Icon name={"c_right"} />
          )}
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
