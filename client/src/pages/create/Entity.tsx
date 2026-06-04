// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Checkbox,
  CheckboxGroup,
  CloseButton,
  Dialog,
  EmptyState,
  Field,
  Flex,
  Heading,
  Input,
  Spacer,
  Stack,
  Steps,
  Tag,
  Text,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import CounterSelect from "@components/CounterSelect";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import ActorTag from "@components/ActorTag";
import AddAttributeDialog from "@components/AddAttributeDialog";
import Relationships from "@components/Relationships";
import AddRelationshipsDialog from "@components/AddRelationshipDialog";
import ViewAttributeDialog from "@components/ViewAttributeDialog";
import Linky from "@components/Linky";
import { UnsavedChangesDialog } from "@components/UnsavedChangesDialog";
import { toaster } from "@components/Toast";

// Existing and custom types
import { AttributeModel, IGenericItem, IRelationship, ResponseData } from "@types";

// TanStack table
import { createColumnHelper } from "@tanstack/react-table";

// Utility functions and libraries
import { isValidAttributes, removeTypename } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";

// Routing and navigation
import { useBlocker, useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";

// Authentication
import { auth } from "@lib/auth";

// Posthog
import { usePostHog } from "posthog-js/react";

// Variables
import { GLOBAL_STYLES } from "@variables";

const Entity = () => {
  const posthog = usePostHog();

  const [pageState, setPageState] = useState("start" as "start" | "attributes" | "relationships");
  const pageSteps = [
    { title: "Start", description: "Basic information" },
    { title: "Relationships", description: "Relationships between Entities" },
    { title: "Attributes", description: "Specify metadata" },
  ];
  const [pageStep, setPageStep] = useState(0);
  const [informationOpen, setInformationOpen] = useState(false);

  const navigate = useNavigate();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (isSubmitting) return false;
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
  const [created, setCreated] = useState(dayjs(Date.now()).format("YYYY-MM-DD"));
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([] as string[]);

  const [relationships, setRelationships] = useState([] as IRelationship[]);
  const [addRelationshipsOpen, setAddRelationshipsOpen] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState([] as AttributeModel[]);
  const [addAttributesOpen, setAddAttributesOpen] = useState(false);

  const getUser = async () => {
    const sessionResponse = await auth.getSession();
    if (sessionResponse.error || !sessionResponse.data) {
      toaster.create({
        title: "Error",
        description: "Session expired, please login again",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else {
      setOwner(sessionResponse.data.user.id);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  const isNameError = (useCounter === false && name === "") || (useCounter === true && counter === "");
  const isDateError = created === "";
  const validDetails = !isNameError && !isDateError;
  const [validAttributes, setValidAttributes] = useState(false);

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
  const { loading, error, data } = useQuery<{
    projects: IGenericItem[];
    templates: AttributeModel[];
  }>(GET_CREATE_ENTITIES_DATA, { fetchPolicy: "network-only" });

  const GET_COUNTER_CURRENT = gql`
    query GetCounterCurrent($_id: String) {
      currentCounterValue(_id: $_id) {
        success
        message
        data
      }
    }
  `;
  const [currentCounterValue, { error: currentCounterValueError }] = useLazyQuery<{
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
  const [createEntity, { loading: createLoading, error: createError }] = useMutation<{
    createEntity: ResponseData<string>;
  }>(CREATE_ENTITY);

  useEffect(() => {
    if (data?.projects) setProjects(data.projects);
    if (data?.templates) setTemplates(data.templates);
  }, [data]);

  useEffect(() => {
    posthog?.capture("client.create.entity_start");
  }, [posthog]);

  useEffect(() => {
    if (error) {
      toaster.create({ title: "Error", type: "error", description: error.message, duration: 4000, closable: true });
    }
  }, [error]);

  useEffect(() => {
    setValidAttributes(isValidAttributes(selectedAttributes));
  }, [selectedAttributes]);

  const isValidInput = (): boolean => {
    if (_.isEqual("start", pageState)) return validDetails;
    if (_.isEqual("attributes", pageState)) {
      if (selectedAttributes.length > 0) return validAttributes;
      return true;
    }
    return true;
  };

  const onPageNext = async () => {
    if (_.isEqual("start", pageState)) {
      posthog.capture("client.create.entity_relationships");
      setPageState("relationships");
      setPageStep(1);
    } else if (_.isEqual("relationships", pageState)) {
      posthog.capture("client.create.entity_attributes");
      setPageState("attributes");
      setPageStep(2);
    } else if (_.isEqual("attributes", pageState)) {
      posthog.capture("client.create.entity_finished");
      setIsSubmitting(true);

      let generatedName = name;
      if (useCounter) {
        const currentCounterValueResult = await currentCounterValue({ variables: { _id: counter } });
        if (currentCounterValueError) {
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
        if (currentCounterValueResult.data?.currentCounterValue) {
          generatedName = currentCounterValueResult.data.currentCounterValue.data;
          await incrementCounter({ variables: { _id: counter } });
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

      const response = await createEntity({
        variables: {
          entity: removeTypename({
            name: generatedName,
            owner,
            created,
            archived: false,
            description,
            relationships,
            projects: selectedProjects,
            attributes: selectedAttributes,
            attachments: [],
          }),
        },
      });

      if (response.data?.createEntity.success) {
        setIsSubmitting(false);
        navigate(`/entities`);
      }
    }
  };

  const onPageBack = () => {
    if (_.isEqual("relationships", pageState)) {
      posthog.capture("client.create.entity_start");
      setPageState("start");
      setPageStep(0);
    } else if (_.isEqual("attributes", pageState)) {
      posthog.capture("client.create.entity_relationships");
      setPageState("relationships");
      setPageStep(1);
    }
  };

  const removeAttribute = (id: string) => {
    setSelectedAttributes(selectedAttributes.filter((a) => a._id !== id));
  };

  const onAttributeUpdate = (updated: AttributeModel) => {
    setSelectedAttributes(
      selectedAttributes.map((a) =>
        _.isEqual(a._id, updated._id)
          ? { ...a, name: updated.name, description: updated.description, values: updated.values }
          : a,
      ),
    );
  };

  /** Returns true if the attribute ID corresponds to a known template (template IDs are used as a prefix). */
  const isKnownTemplate = (id: string): boolean =>
    templates.some((t) => _.startsWith(id, t._id) || _.isEqual(id, t._id));

  const attributeColumnHelper = createColumnHelper<AttributeModel>();
  const attributeTableColumns = [
    attributeColumnHelper.accessor("name", {
      cell: (info) => {
        const attribute = info.row.original;
        const [viewAttributeDialogOpen, setViewAttributeDialogOpen] = useState(false);
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 16} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 16 })}
              </Text>
            </Tooltip>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Button
                size="2xs"
                variant="subtle"
                rounded="md"
                colorPalette="gray"
                aria-label={"View Attribute"}
                onClick={() => setViewAttributeDialogOpen(true)}
              >
                Edit
                <Icon name={"edit"} size={"xs"} />
              </Button>
              <Button
                size="2xs"
                rounded="md"
                variant="subtle"
                colorPalette="red"
                aria-label={"Delete Attribute"}
                onClick={() => removeAttribute(attribute._id)}
              >
                Delete
                <Icon name={"delete"} size={"xs"} />
              </Button>
              <ViewAttributeDialog
                open={viewAttributeDialogOpen}
                setOpen={setViewAttributeDialogOpen}
                attribute={attribute}
                editing={true}
                isTemplate={isKnownTemplate(attribute._id)}
                onAttributeUpdate={onAttributeUpdate}
                removeCallback={() => removeAttribute(attribute._id)}
              />
            </Flex>
          </Flex>
        );
      },
      header: "Name",
      meta: { minWidth: 240 },
    }),
    attributeColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>Empty</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Tooltip content={info.getValue()} disabled={info.getValue().length < 32} showArrow>
            <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 32 })}</Text>
          </Tooltip>
        );
      },
      header: "Description",
    }),
    attributeColumnHelper.accessor("values", {
      cell: (info) => {
        const values = info.row.original.values;
        if (values.length === 0) {
          return (
            <Text fontSize={"xs"} color={"gray.500"}>
              No values
            </Text>
          );
        }
        const valueNames = values.map((v) => v.name).join(", ");
        return (
          <Tooltip content={valueNames} showArrow disabled={valueNames.length <= 50}>
            <Text fontSize={"xs"}>{valueNames.length > 50 ? `${valueNames.substring(0, 50)}...` : valueNames}</Text>
          </Tooltip>
        );
      },
      header: "Values",
    }),
  ];

  return (
    <Content isLoaded={!loading && !createLoading} isError={!_.isUndefined(error) && !_.isUndefined(createError)}>
      <Flex direction={"column"} gap={"2"}>
        {/* Page header */}
        <Flex direction={"row"} p={"1"} align={"center"} gap={"1"} ml={"0.5"}>
          <Icon name={"entity"} size={"sm"} color={GLOBAL_STYLES.entity.color.icon} />
          <Heading size={"md"}>Create Entity</Heading>
          <Spacer />
          <Button size={"xs"} rounded={"md"} variant={"outline"} onClick={() => setInformationOpen(true)}>
            Info
            <Icon name={"info"} size={"xs"} />
          </Button>
        </Flex>

        {/* Stepper */}
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
                <Steps.Title fontSize={"xs"} fontWeight={"semibold"}>
                  {step.title}
                </Steps.Title>
                <Steps.Separator />
              </Steps.Item>
            ))}
          </Steps.List>
        </Steps.Root>

        {/* Start page */}
        {_.isEqual("start", pageState) && (
          <Flex direction={"row"} gap={"2"} p={"1"} wrap={"wrap"}>
            <Flex
              direction={"column"}
              flex={{ base: "0 0 100%", md: "1" }}
              h={"fit-content"}
              p={"2"}
              gap={"2"}
              bg={GLOBAL_STYLES.card.bg}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
              rounded={"md"}
            >
              <Field.Root required gap={"1"}>
                <Field.Label
                  fontSize={"xs"}
                  fontWeight={"semibold"}
                  color={GLOBAL_STYLES.font.secondaryHeader.color}
                  ml={"0.5"}
                >
                  Name
                  <Field.RequiredIndicator />
                </Field.Label>
                <Flex gap={"2"} w={"100%"}>
                  {useCounter ? (
                    <CounterSelect counter={counter} setCounter={setCounter} showCreate />
                  ) : (
                    <Input
                      data-testid={"create-entity-name"}
                      name={"name"}
                      value={name}
                      placeholder={"Name"}
                      size={"xs"}
                      rounded={"md"}
                      bg={"white"}
                      onChange={(event) => setName(event.target.value)}
                    />
                  )}
                  <Button
                    size={"xs"}
                    rounded={"md"}
                    variant={"solid"}
                    colorPalette={"blue"}
                    onClick={() => {
                      setUseCounter(!useCounter);
                      setName("");
                      setCounter("");
                    }}
                  >
                    {useCounter ? "Use Text" : "Use Counter"}
                    <Icon name={useCounter ? "text" : "counter"} size={"xs"} />
                  </Button>
                </Flex>
                {isNameError && !useCounter && (
                  <Field.ErrorText fontSize={"xs"}>A name or ID must be specified.</Field.ErrorText>
                )}
                {isNameError && useCounter && (
                  <Field.ErrorText fontSize={"xs"}>A Counter must be selected or created.</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root required gap={"1"}>
                <Field.Label
                  fontSize={"xs"}
                  fontWeight={"semibold"}
                  color={GLOBAL_STYLES.font.secondaryHeader.color}
                  ml={"0.5"}
                >
                  Created
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  size={"xs"}
                  rounded={"md"}
                  type={"date"}
                  bg={"white"}
                  value={created}
                  onChange={(event) => setCreated(event.target.value)}
                />
                {isDateError && <Field.ErrorText fontSize={"xs"}>A created date must be specified.</Field.ErrorText>}
              </Field.Root>

              <Field.Root gap={"1"}>
                <Field.Label
                  fontSize={"xs"}
                  fontWeight={"semibold"}
                  color={GLOBAL_STYLES.font.secondaryHeader.color}
                  ml={"0.5"}
                >
                  Owner
                </Field.Label>
                <ActorTag size={"md"} identifier={owner} fallback={"Unknown User"} />
              </Field.Root>
            </Flex>

            <Flex
              direction={"column"}
              flex={{ base: "0 0 100%", md: "1" }}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={GLOBAL_STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Description
              </Text>
              <Textarea
                data-testid={"create-entity-description"}
                value={description}
                size={"xs"}
                h={"100%"}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Flex>
          </Flex>
        )}

        {/* Relationships page */}
        {_.isEqual("relationships", pageState) && (
          <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
            <Flex direction={"column"} p={"1"} gap={"1"} flex={{ base: "0 0 100%", md: "1" }}>
              <Flex
                direction={"column"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={GLOBAL_STYLES.border.style}
                borderColor={GLOBAL_STYLES.border.color}
              >
                <Flex direction={"row"} justify={"space-between"} align={"center"}>
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Icon size={"xs"} name={"graph"} color={GLOBAL_STYLES.font.secondaryHeader.color} />
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                      Relationships
                    </Text>
                  </Flex>
                  <Button
                    variant={"solid"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={() => setAddRelationshipsOpen(true)}
                  >
                    Add
                    <Icon name={"add"} size={"xs"} />
                  </Button>
                </Flex>
                <Relationships relationships={relationships} setRelationships={setRelationships} viewOnly={false} />
                <AddRelationshipsDialog
                  open={addRelationshipsOpen}
                  onClose={() => setAddRelationshipsOpen(false)}
                  sourceName={name}
                  existingRelationships={relationships}
                  onAdd={(added) => setRelationships([...relationships, ...added])}
                />
              </Flex>
            </Flex>

            <Flex direction={"column"} p={"1"} gap={"1"} flex={{ base: "0 0 100%", md: "1" }}>
              <Flex
                direction={"column"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={GLOBAL_STYLES.border.style}
                borderColor={GLOBAL_STYLES.border.color}
              >
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon size={"xs"} name={"project"} color={GLOBAL_STYLES.project.color.icon} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                    Projects
                  </Text>
                </Flex>
                <CheckboxGroup
                  value={selectedProjects}
                  onValueChange={(event: string[]) => {
                    if (event) setSelectedProjects([...event]);
                  }}
                >
                  <Stack gap={"1"} direction={"column"}>
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <Checkbox.Root key={project._id} value={project._id} size={"xs"} colorPalette={"blue"}>
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Linky id={project._id} type={"projects"} />
                          </Checkbox.Label>
                        </Checkbox.Root>
                      ))
                    ) : (
                      <EmptyState.Root>
                        <EmptyState.Content>
                          <EmptyState.Indicator>
                            <Icon name={"project"} size={"lg"} color={GLOBAL_STYLES.project.color.default} />
                          </EmptyState.Indicator>
                          <EmptyState.Description>No Projects</EmptyState.Description>
                        </EmptyState.Content>
                      </EmptyState.Root>
                    )}
                  </Stack>
                </CheckboxGroup>
              </Flex>
            </Flex>
          </Flex>
        )}

        {/* Attributes page */}
        {_.isEqual("attributes", pageState) && (
          <Flex direction={"column"} gap={"2"} p={"1"}>
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              bg={GLOBAL_STYLES.card.bg}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
            >
              <Flex direction={"row"} justify={"space-between"} align={"center"}>
                <Flex direction={"row"} gap={"0.5"} align={"center"}>
                  <Icon name={"attribute"} size={"xs"} color={GLOBAL_STYLES.template.color.icon} />
                  <Text
                    fontSize={"xs"}
                    fontWeight={"semibold"}
                    color={GLOBAL_STYLES.font.secondaryHeader.color}
                    ml={"0.5"}
                  >
                    Attributes
                  </Text>
                </Flex>
                <Button
                  data-testid={"create-entity-add-attribute"}
                  variant={"solid"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  onClick={() => setAddAttributesOpen(true)}
                >
                  Add
                  <Icon name={"add"} size={"xs"} />
                </Button>
              </Flex>
            </Flex>

            <Flex
              w={"100%"}
              justify={"center"}
              align={"center"}
              minH={selectedAttributes.length > 0 ? "fit-content" : "120px"}
              data-testid={"create-entity-attributes"}
            >
              {selectedAttributes.length > 0 ? (
                <DataTable
                  data={selectedAttributes}
                  columns={attributeTableColumns}
                  visibleColumns={{}}
                  selectedRows={{}}
                  viewOnly={false}
                  showPagination
                  showSelection
                />
              ) : (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon name={"attribute"} size={"lg"} />
                    </EmptyState.Indicator>
                    <EmptyState.Description>No Attributes</EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Flex>

            <AddAttributeDialog
              open={addAttributesOpen}
              onClose={() => setAddAttributesOpen(false)}
              owner={owner}
              templates={templates}
              entityName={name}
              entityDescription={description}
              onAdd={(attribute) => setSelectedAttributes([...selectedAttributes, attribute])}
            />
          </Flex>
        )}

        {/* Information dialog */}
        <Dialog.Root
          open={informationOpen}
          onOpenChange={(event) => setInformationOpen(event.open)}
          size={"lg"}
          placement={"center"}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Trigger />
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header p={"2"} fontWeight={"semibold"} roundedTop={"md"} bg={GLOBAL_STYLES.dialog.header.bg}>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"entity"} size={"xs"} color={GLOBAL_STYLES.entity.color.icon} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Entities
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size={"2xs"} top={"6px"} onClick={() => setInformationOpen(false)} />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"2"} gap={"0"}>
                <Flex direction={"column"} gap={"2"}>
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    bg={GLOBAL_STYLES.card.bg}
                    p={"2"}
                    rounded={"md"}
                    border={GLOBAL_STYLES.border.style}
                    borderColor={GLOBAL_STYLES.border.color}
                  >
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Icon name={"info"} size={"xs"} color={"gray.500"} />
                      <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                        What is an Entity?
                      </Text>
                    </Flex>
                    <Text fontSize={"xs"} color={GLOBAL_STYLES.font.secondaryHeader.color} lineHeight={"tall"}>
                      Entities represent the things you want to track: samples, datasets, protocols, instruments, and so
                      on. Each Entity stores structured metadata through Attributes, and can be linked to other Entities
                      or organised into Projects.
                    </Text>
                  </Flex>

                  <Flex direction={"column"} gap={"2"}>
                    <Text
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      color={GLOBAL_STYLES.font.secondaryHeader.color}
                      ml={"0.5"}
                    >
                      Creation Steps
                    </Text>
                    <Flex direction={"column"} gap={"2"}>
                      <Flex
                        direction={"row"}
                        gap={"2"}
                        align={"start"}
                        p={"2"}
                        rounded={"md"}
                        bg={"blue.50"}
                        border={"1px solid"}
                        borderColor={"blue.100"}
                      >
                        <Flex
                          w={"18px"}
                          h={"18px"}
                          rounded={"full"}
                          bg={"blue.500"}
                          align={"center"}
                          justify={"center"}
                          shrink={"0"}
                          mt={"0.5"}
                        >
                          <Text fontSize={"xs"} color={"white"} fontWeight={"bold"} lineHeight={"1"}>
                            1
                          </Text>
                        </Flex>
                        <Flex direction={"column"} gap={"0.5"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            Start - Basic Details
                          </Text>
                          <Text fontSize={"xs"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                            Set the Entity's name, description, and visibility.
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex
                        direction={"row"}
                        gap={"2"}
                        align={"start"}
                        p={"2"}
                        rounded={"md"}
                        bg={"orange.50"}
                        border={"1px solid"}
                        borderColor={"orange.100"}
                      >
                        <Flex
                          w={"18px"}
                          h={"18px"}
                          rounded={"full"}
                          bg={"orange.400"}
                          align={"center"}
                          justify={"center"}
                          shrink={"0"}
                          mt={"0.5"}
                        >
                          <Text fontSize={"xs"} color={"white"} fontWeight={"bold"} lineHeight={"1"}>
                            2
                          </Text>
                        </Flex>
                        <Flex direction={"column"} gap={"0.5"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            Relationships - Link to Other Entities
                          </Text>
                          <Text fontSize={"xs"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                            Define how this Entity relates to others and assign it to Projects.
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex
                        direction={"row"}
                        gap={"2"}
                        align={"start"}
                        p={"2"}
                        rounded={"md"}
                        bg={"green.50"}
                        border={"1px solid"}
                        borderColor={"green.100"}
                      >
                        <Flex
                          w={"18px"}
                          h={"18px"}
                          rounded={"full"}
                          bg={"green.500"}
                          align={"center"}
                          justify={"center"}
                          shrink={"0"}
                          mt={"0.5"}
                        >
                          <Text fontSize={"xs"} color={"white"} fontWeight={"bold"} lineHeight={"1"}>
                            3
                          </Text>
                        </Flex>
                        <Flex direction={"column"} gap={"0.5"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            Attributes - Attach Metadata
                          </Text>
                          <Text fontSize={"xs"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                            Select Attribute Templates and add Values to describe this Entity's metadata.
                          </Text>
                        </Flex>
                      </Flex>
                    </Flex>
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
          data-testid={_.isEqual("attributes", pageState) ? "create-entity-finish" : "create-entity-continue"}
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

      <UnsavedChangesDialog
        blocker={blocker}
        cancelBlockerRef={cancelBlockerRef}
        onClose={onBlockerClose}
        callback={onBlockerClose}
      />
    </Content>
  );
};

export default Entity;
