// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Existing and custom components
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  CloseButton,
  Dialog,
  EmptyState,
  Field,
  Fieldset,
  Flex,
  Heading,
  Input,
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
  ISelectOption,
  ResponseData,
  IRelationship,
  RelationshipType,
} from "@types";

// Utility functions and libraries
import { isValidAttributes, createSelectOptions } from "src/util";
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import consola from "consola";

// Routing and navigation
import { useBlocker, useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";

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

  // Templates
  const [templates, setTemplates] = useState([] as AttributeModel[]);

  // Templates collection for Select component
  const templatesCollection = useMemo(() => {
    const items = createSelectOptions<AttributeModel>(templates, "_id", "name");
    return createListCollection<ISelectOption>({
      items: items || [],
    });
  }, [templates]);

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

  // Selected template value for the Select component
  const [selectedTemplateValue, setSelectedTemplateValue] = useState<string[]>(
    [],
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
  const [entityNameExists, { error: entityNameError }] = useLazyQuery<{
    entityNameExists: boolean;
  }>(CHECK_ENTITY_NAME);

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
  const { loading, error, data, refetch } = useQuery<{
    projects: IGenericItem[];
    templates: AttributeModel[];
  }>(GET_CREATE_ENTITIES_DATA);

  const GET_COUNTER_CURRENT = gql`
    query GetCounterCurrent($_id: String) {
      currentCounterValue(_id: $_id) {
        success
        message
        data
      }
    }
  `;
  const [currentCounterValue, { error: currentCounterValueError }] =
    useLazyQuery<{
      currentCounterValue: ResponseData<string>;
    }>(GET_COUNTER_CURRENT);

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
    setIsNameUnique(!response.data?.entityNameExists);
    if (entityNameError) {
      consola.error("Failed to check entity name:", entityNameError.message);
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
        // Get the current value of the Counter and substitute the name value
        const currentCounterValueResult = await currentCounterValue({
          variables: {
            _id: counter,
          },
        });

        if (currentCounterValueError) {
          // Raise an error and cancel the create operation
          toaster.create({
            title: "Error",
            type: "error",
            description: currentCounterValueError.message,
            duration: 4000,
            closable: true,
          });
          setIsSubmitting(false);
          return;
        }

        // Else, handle updating the name with the current Counter value
        if (currentCounterValueResult.data?.currentCounterValue) {
          generatedName =
            currentCounterValueResult.data.currentCounterValue.data;

          // Increment the Counter value
          await incrementCounter({
            variables: {
              _id: counter,
            },
          });

          if (incrementCounterError) {
            toaster.create({
              title: "Error",
              type: "error",
              description: incrementCounterError.message,
              duration: 4000,
              closable: true,
            });
          }
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
          p={"1"}
          align={"center"}
          justify={"space-between"}
        >
          <Flex align={"center"} gap={"1"} w={"100%"}>
            <Icon name={"entity"} size={"sm"} />
            <Heading size={"sm"}>Create Entity</Heading>
            <Spacer />
            <Button
              size={"xs"}
              rounded={"md"}
              variant={"outline"}
              onClick={() => setInformationOpen(true)}
            >
              Info
              <Icon name={"info"} size={"xs"} />
            </Button>
          </Flex>
        </Flex>

        {/* Main pages */}
        {/* Stepper progress indicator */}
        <Steps.Root
          step={pageStep}
          colorPalette={"green"}
          onStepChange={(event) => setPageStep(event.step)}
          count={pageSteps.length}
          px={"1"}
          mb={"1"}
          size={"sm"}
        >
          <Steps.List>
            {pageSteps.map((step, index) => (
              <Steps.Item key={index} index={index} title={step.title}>
                <Steps.Indicator />
                <Steps.Title fontSize={"sm"}>{step.title}</Steps.Title>
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
              p={"1"}
              gap={"1"}
              grow={"1"}
              rounded={"md"}
            >
              <Flex
                direction={"column"}
                p={"1"}
                gap={"1"}
                border={"1px solid"}
                borderColor={"gray.300"}
                rounded={"md"}
              >
                <Fieldset.Root invalid={isNameError || !isNameUnique} gap={"1"}>
                  <Fieldset.Content mt={"1"}>
                    <Field.Root required gap={"1"}>
                      <Field.Label
                        fontSize={"xs"}
                        fontWeight={"semibold"}
                        ml={"0.5"}
                      >
                        Entity Name
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Flex gap={"1"} justify={"space-between"}>
                        {useCounter ? (
                          <CounterSelect
                            counter={counter}
                            setCounter={setCounter}
                            showCreate
                          />
                        ) : (
                          <Flex w={"100%"}>
                            <Input
                              data-testid={"create-entity-name"}
                              name={"name"}
                              value={name}
                              placeholder={"Name"}
                              size={"xs"}
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
                            size={"xs"}
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
                            <Icon
                              name={useCounter ? "text" : "counter"}
                              size={"xs"}
                            />
                          </Button>
                        </Flex>
                      </Flex>
                      {(isNameError || !isNameUnique) && !useCounter && (
                        <Field.ErrorText fontSize={"xs"}>
                          A name or ID must be specified and unique.
                        </Field.ErrorText>
                      )}
                      {(isNameError || !isNameUnique) && useCounter && (
                        <Field.ErrorText fontSize={"xs"}>
                          A Counter must be selected or created.
                        </Field.ErrorText>
                      )}
                    </Field.Root>

                    <Field.Root invalid={isDateError} required gap={"1"}>
                      <Field.Label
                        fontSize={"xs"}
                        fontWeight={"semibold"}
                        ml={"0.5"}
                      >
                        Entity Created
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        placeholder={"Select Date and Time"}
                        size={"xs"}
                        rounded={"md"}
                        type={"date"}
                        value={created}
                        onChange={(event) => setCreated(event.target.value)}
                      />
                      {isDateError && (
                        <Field.ErrorText fontSize={"xs"}>
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
              p={"1"}
              pl={{ base: "1", lg: "0" }}
              pt={{ base: "0", lg: "1" }}
              gap={"1"}
              grow={"1"}
              basis={"50%"}
              rounded={"md"}
            >
              <Flex
                direction={"column"}
                p={"1"}
                gap={"1"}
                rounded={"md"}
                border={"1px solid"}
                borderColor={"gray.300"}
              >
                {/* Description */}
                <Fieldset.Root gap={"0"}>
                  <Fieldset.Content gap={"0"}>
                    <Field.Root gap={"1"}>
                      <Field.Label
                        fontSize={"xs"}
                        fontWeight={"semibold"}
                        ml={"0.5"}
                      >
                        Entity Description
                      </Field.Label>
                      <Box data-testid={"create-entity-description"}>
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
                      </Box>
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
              p={"1"}
              gap={"1"}
              grow={"1"}
              basis={"50%"}
              rounded={"md"}
            >
              {/* Relationships */}
              <Flex
                direction={"column"}
                p={"1"}
                gap={"1"}
                rounded={"md"}
                border={"1px solid"}
                borderColor={"gray.300"}
              >
                <Heading size={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                  Entity Relationships
                </Heading>
                <Text
                  fontSize={"xs"}
                  ml={"0.5"}
                  fontWeight={"semibold"}
                  color={"gray.500"}
                >
                  Specify the relationships between this Entity and other
                  Entities.
                </Text>
                <Flex
                  direction={"row"}
                  gap={"1"}
                  justify={"space-between"}
                  align={"end"}
                >
                  <Flex direction={"column"} gap={"1"} w={"33%"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                      Source
                    </Text>
                    <Input
                      size={"xs"}
                      rounded={"md"}
                      value={name}
                      readOnly
                      disabled
                    />
                  </Flex>
                  <Flex direction={"column"} gap={"1"} w={"33%"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                      Type
                    </Text>
                    <Select.Root
                      key={"select-relationship-type"}
                      size={"xs"}
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
                        <Select.Trigger
                          data-testid={"select-relationship-type"}
                        >
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
                    <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                      Target
                    </Text>
                    <SearchSelect
                      resultType={"entity"}
                      value={selectedRelationshipTarget}
                      onChange={setSelectedRelationshipTarget}
                    />
                  </Flex>
                  <Button
                    data-testid={"create-entity-add-relationship"}
                    colorPalette={"green"}
                    size={"xs"}
                    rounded={"md"}
                    disabled={_.isUndefined(selectedRelationshipTarget._id)}
                    onClick={() => addRelationship()}
                  >
                    Add
                    <Icon name={"add"} size={"xs"} />
                  </Button>
                </Flex>

                {relationships.length > 0 ? (
                  <Flex direction={"column"} gap={"1"}>
                    <Heading size={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                      Relationships
                    </Heading>
                    <Relationships
                      relationships={relationships}
                      setRelationships={setRelationships}
                      viewOnly={false}
                    />
                  </Flex>
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
              p={"1"}
              pl={{ base: "1", sm: "0", md: "0", lg: "0" }}
              pt={{ base: "0", sm: "0", md: "0", lg: "1" }}
              gap={"1"}
              grow={"1"}
              basis={"50%"}
              rounded={"md"}
            >
              {/* Projects */}
              <Flex
                direction={"column"}
                p={"1"}
                gap={"1"}
                rounded={"md"}
                border={"1px solid"}
                borderColor={"gray.300"}
              >
                <Fieldset.Root>
                  <CheckboxGroup
                    value={selectedProjects}
                    onValueChange={(event: string[]) => {
                      if (event) {
                        setSelectedProjects([...event]);
                      }
                    }}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                      Linked Projects
                    </Text>
                    <Text
                      fontSize={"xs"}
                      ml={"0.5"}
                      fontWeight={"semibold"}
                      color={"gray.500"}
                    >
                      Specify the Projects that this new Entity should be
                      included with. The Entity will then be contained within
                      the specified Projects.
                    </Text>
                    <Fieldset.Content gap={"1"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Available Projects
                      </Text>
                      <Stack gap={"1"} direction={"column"} ml={"0.5"}>
                        {projects &&
                          projects.length > 0 &&
                          projects.map((project) => {
                            return (
                              <Checkbox.Root
                                key={project._id}
                                value={project._id}
                                size={"xs"}
                                colorPalette={"blue"}
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
              p={"1"}
              w={"100%"}
              gap={"1"}
              rounded={"md"}
            >
              <Heading size={"sm"} fontWeight={"semibold"} ml={"0.5"}>
                Entity Attributes
              </Heading>
              <Information
                text={
                  "Add Attributes containing metadata about this Entity. Attributes can use an existing Template or be created manually."
                }
              />
              <Flex
                direction={"row"}
                p={"1"}
                gap={"1"}
                align={"end"}
                rounded={"md"}
                border={"1px solid"}
                borderColor={"gray.300"}
              >
                <Flex direction={"row"} gap={"1"} align={"center"} w={"100%"}>
                  {/* Drop-down to select Templates */}
                  <Fieldset.Root maxW={"sm"}>
                    <Fieldset.Content>
                      <Field.Root>
                        <Select.Root
                          key={"select-template"}
                          size={"xs"}
                          collection={templatesCollection}
                          disabled={templatesCollection.items.length === 0}
                          rounded={"md"}
                          value={selectedTemplateValue}
                          onValueChange={(details) => {
                            const selectedTemplateId = details.value[0];
                            if (
                              selectedTemplateId &&
                              !_.isEqual(selectedTemplateId, "")
                            ) {
                              for (const template of templates) {
                                if (
                                  _.isEqual(selectedTemplateId, template._id)
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
                                  // Reset the select after adding the template
                                  setSelectedTemplateValue([]);
                                  break;
                                }
                              }
                            }
                          }}
                        >
                          <Select.HiddenSelect />
                          <Select.Label fontSize={"xs"} ml={"0.5"}>
                            Use Template ({templatesCollection.items.length}{" "}
                            available)
                          </Select.Label>
                          <Select.Control>
                            <Select.Trigger
                              data-testid={"select-template-trigger"}
                            >
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
                                {templatesCollection.items &&
                                  templatesCollection.items.length > 0 &&
                                  templatesCollection.items.map(
                                    (template: ISelectOption) => (
                                      <Select.Item
                                        item={template}
                                        key={template.value}
                                        fontSize={"xs"}
                                      >
                                        {template.label}
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
                  data-testid={"create-entity-new-attribute"}
                  size={"xs"}
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
                  Create new Attribute
                  <Icon name={"add"} size={"xs"} />
                </Button>
              </Flex>
            </Flex>

            <Flex
              w={"100%"}
              minH={selectedAttributes.length > 0 ? "fit-content" : "200px"}
              p={"1"}
              pt={"0"}
            >
              {/* Display all Attributes */}
              {selectedAttributes.length > 0 ? (
                <Stack
                  gap={"1"}
                  w={"100%"}
                  data-testid={"create-entity-attributes"}
                >
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
              <Dialog.Header
                p={"2"}
                fontWeight={"semibold"}
                roundedTop={"md"}
                bg={"blue.300"}
              >
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"entity"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Entities
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"2xs"}
                    top={"6px"}
                    onClick={() => setInformationOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"1"} gap={"1"}>
                <Flex direction={"column"} gap={"1"}>
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    bg={"gray.100"}
                    p={"1"}
                    rounded={"md"}
                  >
                    <Heading size={"xs"}>Overview</Heading>
                    <Text fontSize={"xs"}>
                      Entities are the core objects in Metadatify. They can be
                      used to represent any type of object, such as a dataset, a
                      sample, a protocol, or a software tool.
                    </Text>
                  </Flex>
                  <Flex direction={"column"} gap={"1"} ml={"0.5"}>
                    <Heading size={"xs"}>Page 1: Start</Heading>
                    <Text fontSize={"xs"}>
                      Specify some basic details about this Entity. Relations
                      between Entities and membership to Projects can be
                      specified on the following page. Finally, the metadata
                      associated with this Entity should be specified using
                      Attributes and corresponding Values.
                    </Text>
                    <Heading size={"xs"}>Page 2: Relationships</Heading>
                    <Text fontSize={"xs"}>
                      Relations between Entities and membership to Projects can
                      be specified using Relationships.
                    </Text>
                    <Heading size={"xs"}>Page 3: Attributes</Heading>
                    <Text fontSize={"xs"}>
                      The metadata associated with this Entity should be
                      specified using Attributes and corresponding Values.
                    </Text>
                  </Flex>
                </Flex>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </Flex>

      <Spacer />

      {/* Action buttons */}
      <Flex
        direction={"row"}
        wrap={"wrap"}
        gap={"2"}
        justify={"space-between"}
        align={"center"}
        w={"100%"}
        p={"1"}
        shrink={"0"}
      >
        <Flex gap={"2"}>
          <Button
            data-testid={"create-entity-cancel"}
            size={"xs"}
            rounded={"md"}
            colorPalette={"red"}
            variant={"solid"}
            onClick={() => navigate("/entities")}
          >
            Cancel
            <Icon name={"cross"} size={"xs"} />
          </Button>
          {!_.isEqual("start", pageState) && (
            <Button
              data-testid={"create-entity-back"}
              size={"xs"}
              rounded={"md"}
              colorPalette={"orange"}
              variant={"solid"}
              onClick={onPageBack}
            >
              Back
              <Icon name={"c_left"} size={"xs"} />
            </Button>
          )}
        </Flex>

        <Button
          data-testid={
            _.isEqual("attributes", pageState)
              ? "create-entity-finish"
              : "create-entity-continue"
          }
          size={"xs"}
          rounded={"md"}
          colorPalette={_.isEqual("attributes", pageState) ? "green" : "blue"}
          onClick={onPageNext}
          disabled={!isValidInput() || isNameError}
          loading={isSubmitting}
        >
          {_.isEqual("attributes", pageState) ? "Finish" : "Continue"}
          {_.isEqual("attributes", pageState) ? (
            <Icon name={"check"} size={"xs"} />
          ) : (
            <Icon name={"c_right"} size={"xs"} />
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
