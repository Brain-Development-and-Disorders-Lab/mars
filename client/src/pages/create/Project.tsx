// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  CloseButton,
  Dialog,
  EmptyState,
  Field,
  Flex,
  Heading,
  Input,
  Spacer,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import ActorTag from "@components/ActorTag";
import DataTable from "@components/DataTable";
import Linky from "@components/Linky";
import MultiEntitySelect from "@components/MultiEntitySelect";
import { UnsavedChangesDialog } from "@components/UnsavedChangesDialog";
import { toaster } from "@components/Toast";
import RichTextEditor from "@components/RichTextEditor";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

// Routing and navigation
import { useBlocker, useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

// Custom types
import { IGenericItem, ResponseData } from "@types";
import { Cell } from "@tanstack/react-table";

// Authentication
import { auth } from "@lib/auth";

// Posthog
import { usePostHog } from "posthog-js/react";

// Variables
import { GLOBAL_STYLES } from "@variables";

const Project = () => {
  const posthog = usePostHog();

  const [informationOpen, setInformationOpen] = useState(false);
  const [name, setName] = useState("");
  const [created, setCreated] = useState(dayjs(Date.now()).format("YYYY-MM-DDTHH:mm"));
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");

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

  const navigate = useNavigate();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (isSubmitting) return false;
    return (
      (name !== "" || description !== "" || entities.length > 0) && currentLocation.pathname !== nextLocation.pathname
    );
  });
  const { onClose: onBlockerClose } = useDisclosure();
  const cancelBlockerRef = useRef(null);

  const [entitiesOpen, setEntitiesOpen] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([] as IGenericItem[]);
  const [entities, setEntities] = useState([] as string[]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CREATE_PROJECT = gql`
    mutation CreateProject($project: ProjectCreateInput) {
      createProject(project: $project) {
        success
        message
      }
    }
  `;
  const [createProject, { loading, error }] = useMutation<{
    createProject: ResponseData<string>;
  }>(CREATE_PROJECT);

  useEffect(() => {
    if (error) {
      toaster.create({ title: "Error", description: error.message, type: "error", duration: 2000, closable: true });
    }
  }, [error]);

  useEffect(() => {
    posthog?.capture("create_project_start");
  }, [posthog]);

  const isNameError = name === "";
  const isOwnerError = owner === "";
  const isDescriptionError = description === "";
  const isDetailsError = isNameError || isOwnerError || isDescriptionError;

  const entitiesColumns = [
    {
      id: (info: Cell<string, string>) => info.row.original,
      cell: (info: Cell<string, string>) => (
        <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
          <Linky id={info.row.original} type={"entities"} size={"xs"} />
          <Button
            size="2xs"
            variant="subtle"
            colorPalette="red"
            aria-label={"Remove entity"}
            onClick={() => removeEntity(info.row.original)}
          >
            Remove
            <Icon name={"delete"} size={"xs"} />
          </Button>
        </Flex>
      ),
      header: "Name",
    },
  ];

  const addEntities = (): void => {
    const newIds = selectedEntities.map((e) => e._id).filter((id) => !entities.includes(id));
    setEntities([...entities, ...newIds]);
    setSelectedEntities([]);
    setEntitiesOpen(false);
  };

  const removeEntity = (entity: string): void => {
    if (_.includes(entities, entity)) {
      setEntities([...entities.filter((e) => !_.isEqual(e, entity))]);
    }
  };

  return (
    <Content isLoaded={!loading}>
      <Flex direction={"column"}>
        {/* Page header */}
        <Flex direction={"row"} p={"1"} align={"center"} gap={"1"} ml={"0.5"}>
          <Icon name={"project"} size={"sm"} color={GLOBAL_STYLES.project.iconColor} />
          <Heading size={"md"}>Create Project</Heading>
          <Spacer />
          <Button size={"xs"} rounded={"md"} variant={"outline"} onClick={() => setInformationOpen(true)}>
            Info
            <Icon name={"info"} size={"xs"} />
          </Button>
        </Flex>

        <Flex direction={"row"} gap={"2"} p={"1"} wrap={"wrap"}>
          {/* Details */}
          <Flex
            direction={"column"}
            flex={{ base: "0 0 100%", md: "1" }}
            p={"2"}
            gap={"2"}
            bg={"gray.50"}
            border={GLOBAL_STYLES.border.style}
            borderColor={GLOBAL_STYLES.border.color}
            rounded={"md"}
          >
            <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
              Details
            </Text>

            <Field.Root required gap={"1"}>
              <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                Project Name
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                data-testid={"create-project-name"}
                name={"name"}
                size={"xs"}
                rounded={"md"}
                placeholder={"Name"}
                bg={"white"}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {isNameError && (
                <Field.ErrorText fontSize={"xs"}>A name to identify the Project must be specified.</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root gap={"1"}>
              <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                Project Owner
              </Field.Label>
              <Flex>
                <ActorTag identifier={owner} fallback={"Unknown User"} size={"sm"} />
              </Flex>
            </Field.Root>

            <Field.Root gap={"1"}>
              <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                Project Created
              </Field.Label>
              <Input
                size={"xs"}
                rounded={"md"}
                type={"datetime-local"}
                bg={"white"}
                value={created}
                onChange={(event) => setCreated(dayjs(event.target.value).format("YYYY-MM-DDTHH:mm"))}
              />
            </Field.Root>
          </Flex>

          {/* Description */}
          <Flex
            direction={"column"}
            flex={{ base: "0 0 100%", md: "1" }}
            p={"2"}
            gap={"2"}
            bg={"gray.50"}
            rounded={"md"}
            border={GLOBAL_STYLES.border.style}
            borderColor={GLOBAL_STYLES.border.color}
          >
            <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
              Description
            </Text>
            <Field.Root required gap={"1"} h={"100%"}>
              <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                Project Description
                <Field.RequiredIndicator />
              </Field.Label>
              <RichTextEditor
                data-testid={"create-entity-description"}
                value={description}
                onChange={(value) => setDescription(value)}
                h={"100%"}
              />
            </Field.Root>
          </Flex>
        </Flex>

        {/* Entities */}
        <Flex direction={"column"} p={"1"} gap={"1"}>
          <Flex
            direction={"column"}
            p={"2"}
            gap={"2"}
            bg={"gray.50"}
            rounded={"md"}
            border={GLOBAL_STYLES.border.style}
            borderColor={GLOBAL_STYLES.border.color}
          >
            <Flex justify={"space-between"} align={"center"}>
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                Entities
              </Text>
              <Button size={"xs"} rounded={"md"} colorPalette={"green"} onClick={() => setEntitiesOpen(true)}>
                Add Entity
                <Icon name={"add"} size={"xs"} />
              </Button>
            </Flex>
            <Flex w={"100%"} justify={"center"} align={"center"} minH={entities.length > 0 ? "fit-content" : "120px"}>
              {entities.length > 0 ? (
                <DataTable
                  data={entities}
                  columns={entitiesColumns}
                  visibleColumns={{}}
                  selectedRows={{}}
                  viewOnly={false}
                  showSelection={true}
                  showPagination
                />
              ) : (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon name={"entity"} size={"lg"} color={GLOBAL_STYLES.entity.defaultColor} />
                    </EmptyState.Indicator>
                    <EmptyState.Description>No Entities</EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      <Spacer />

      {/* Action buttons */}
      <Flex direction={"row"} wrap={"wrap"} gap={"1"} justify={"space-between"} w={"100%"} p={"1"}>
        <Button
          data-testid={"create-project-cancel"}
          size={"xs"}
          rounded={"md"}
          colorPalette={"red"}
          variant={"solid"}
          onClick={() => navigate("/projects")}
        >
          Cancel
          <Icon name={"cross"} size={"xs"} />
        </Button>

        <Button
          id={"finishCreateProjectButton"}
          data-testid={"create-project-finish"}
          size={"xs"}
          rounded={"md"}
          colorPalette={"green"}
          onClick={async () => {
            posthog.capture("create_project_finish");
            setIsSubmitting(true);
            const response = await createProject({
              variables: {
                project: { name, owner, archived: false, description, created, entities, collaborators: [] },
              },
            });
            if (response.data?.createProject.success) {
              navigate("/projects");
            }
            setIsSubmitting(false);
          }}
          disabled={isDetailsError && !isSubmitting}
        >
          Finish
          <Icon name={"check"} size={"xs"} />
        </Button>
      </Flex>

      {/* Add Entities dialog */}
      <Dialog.Root
        open={entitiesOpen}
        onOpenChange={(event) => {
          if (!event.open) setSelectedEntities([]);
          setEntitiesOpen(event.open);
        }}
        placement={"center"}
        closeOnEscape
        closeOnInteractOutside
      >
        <Dialog.Trigger />
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content gap={"0"} w={["md", "lg", "xl"]}>
            <Dialog.Header p={"2"} roundedTop={"md"} bg={GLOBAL_STYLES.dialog.headerColor}>
              <Flex direction={"row"} align={"center"} gap={"1"}>
                <Icon name={"entity"} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Add Entities to Project
                </Text>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size={"2xs"}
                  top={"6px"}
                  onClick={() => {
                    setSelectedEntities([]);
                    setEntitiesOpen(false);
                  }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p={"2"}>
              <MultiEntitySelect
                projectEntities={entities}
                selectedEntities={selectedEntities}
                setSelectedEntities={setSelectedEntities}
              />
            </Dialog.Body>
            <Dialog.Footer p={"2"} bg={GLOBAL_STYLES.dialog.footerColor} roundedBottom={"md"}>
              <Button
                colorPalette={"red"}
                size={"xs"}
                rounded={"md"}
                variant={"solid"}
                onClick={() => {
                  setSelectedEntities([]);
                  setEntitiesOpen(false);
                }}
              >
                Cancel
                <Icon name={"cross"} size={"xs"} />
              </Button>
              <Spacer />
              <Button
                id={"addEntityDoneButton"}
                colorPalette={"green"}
                size={"xs"}
                rounded={"md"}
                disabled={selectedEntities.length === 0}
                onClick={addEntities}
              >
                Add {selectedEntities.length} {selectedEntities.length === 1 ? "Entity" : "Entities"}
                <Icon name={"check"} size={"xs"} />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Information modialogdal */}
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
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={() => setInformationOpen(false)} />
            </Dialog.CloseTrigger>
            <Dialog.Header
              p={"2"}
              fontWeight={"semibold"}
              fontSize={"xs"}
              bg={GLOBAL_STYLES.dialog.headerColor}
              roundedTop={"md"}
            >
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Icon name={"project"} size={"xs"} color={GLOBAL_STYLES.project.iconColor} />
                Projects
              </Flex>
            </Dialog.Header>
            <Dialog.Body p={"2"}>
              <Flex direction={"column"} gap={"2"}>
                <Flex
                  direction={"column"}
                  gap={"1"}
                  bg={"gray.50"}
                  p={"2"}
                  rounded={"md"}
                  border={GLOBAL_STYLES.border.style}
                  borderColor={GLOBAL_STYLES.border.color}
                >
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Icon name={"info"} size={"xs"} color={"gray.500"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                      What is a Project?
                    </Text>
                  </Flex>
                  <Text fontSize={"xs"} color={"gray.600"} lineHeight={"tall"}>
                    Projects group Entities together. Use them to represent an experiment, study, or any collection of
                    related work. Entities can be added or removed from a Project at any time.
                  </Text>
                </Flex>

                <Flex direction={"column"} gap={"1.5"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                    Fields
                  </Text>
                  <Flex direction={"column"} gap={"1"}>
                    <Flex
                      direction={"column"}
                      gap={"0.5"}
                      p={"2"}
                      rounded={"md"}
                      bg={"blue.50"}
                      border={"1px solid"}
                      borderColor={"blue.100"}
                    >
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Name
                      </Text>
                      <Text fontSize={"xs"} color={"gray.600"}>
                        A unique, searchable identifier for this Project. Choose something descriptive and memorable.
                      </Text>
                    </Flex>
                    <Flex
                      direction={"column"}
                      gap={"0.5"}
                      p={"2"}
                      rounded={"md"}
                      bg={"orange.50"}
                      border={"1px solid"}
                      borderColor={"orange.100"}
                    >
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Created
                      </Text>
                      <Text fontSize={"xs"} color={"gray.600"}>
                        A timestamp for the Project. This could mark when an experiment started, or simply when the
                        Project was added to Metadatify.
                      </Text>
                    </Flex>
                    <Flex
                      direction={"column"}
                      gap={"0.5"}
                      p={"2"}
                      rounded={"md"}
                      bg={"gray.50"}
                      border={GLOBAL_STYLES.border.style}
                      borderColor={GLOBAL_STYLES.border.color}
                    >
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Description
                      </Text>
                      <Text fontSize={"xs"} color={"gray.600"}>
                        A brief summary of what this Project contains or represents.
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <UnsavedChangesDialog
        blocker={blocker}
        cancelBlockerRef={cancelBlockerRef}
        onClose={onBlockerClose}
        callback={onBlockerClose}
      />
    </Content>
  );
};

export default Project;
