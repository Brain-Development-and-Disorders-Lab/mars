// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  CloseButton,
  Dialog,
  EmptyState,
  Field,
  Fieldset,
  Flex,
  Heading,
  IconButton,
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
import SearchSelect from "@components/SearchSelect";
import { UnsavedChangesModal } from "@components/WarningModal";
import { toaster } from "@components/Toast";
import MDEditor from "@uiw/react-md-editor";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

// Routing and navigation
import { useBlocker, useNavigate } from "react-router-dom";
import { gql, useMutation } from "@apollo/client";

// Custom types
import { IGenericItem, ResponseData } from "@types";
import { Cell } from "@tanstack/react-table";

// Authentication context
import { useAuthentication } from "@hooks/useAuthentication";

// Posthog
import { usePostHog } from "posthog-js/react";

const Project = () => {
  const posthog = usePostHog();
  const { token } = useAuthentication();

  // Information dialog state
  const [informationOpen, setInformationOpen] = useState(false);

  const [name, setName] = useState("");
  const [created, setCreated] = useState(
    dayjs(Date.now()).format("YYYY-MM-DDTHH:mm"),
  );
  const [owner] = useState(token.orcid);
  const [description, setDescription] = useState("");

  // Navigation and routing
  const navigate = useNavigate();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    // Check if this is during the `create` mutation
    if (isSubmitting) {
      return false;
    }

    // Default blocker condition
    return (
      (name !== "" || description !== "" || entities.length > 0) &&
      currentLocation.pathname !== nextLocation.pathname
    );
  });
  const { onClose: onBlockerClose } = useDisclosure();
  const cancelBlockerRef = useRef(null);

  const [entitiesOpen, setEntitiesOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState({} as IGenericItem);
  const [entities, setEntities] = useState([] as string[]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // GraphQL operations
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
      toaster.create({
        title: "Error",
        description: error.message,
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  }, [error]);

  // Capture event
  useEffect(() => {
    posthog?.capture("create_project_start");
  }, [posthog]);

  // Form validation
  const isNameError = name === "";
  const isOwnerError = owner === "";
  const isDescriptionError = description === "";
  const isDetailsError = isNameError || isOwnerError || isDescriptionError;

  // Define the columns for Entities listing
  const entitiesColumns = [
    {
      id: (info: Cell<string, string>) => info.row.original,
      cell: (info: Cell<string, string>) => (
        <Linky id={info.row.original} type={"entities"} size={"sm"} />
      ),
      header: "Name",
    },
    {
      id: "view",
      cell: (info: Cell<string, string>) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            <IconButton
              aria-label={"Remove entity"}
              colorPalette={"red"}
              onClick={() => removeEntity(info.row.original)}
              size={"sm"}
            >
              <Icon name={"delete"} />
            </IconButton>
          </Flex>
        );
      },
      header: "",
    },
  ];

  /**
   * Callback function to add Entities to a Project
   * @param {IGenericItem} entity Entity to add
   */
  const addEntities = (entity: IGenericItem): void => {
    if (!_.includes(entities, entity._id)) {
      setEntities([...entities, entity._id]);
    }
    setEntitiesOpen(false);
  };

  /**
   * Callback function to remove Entity from Project
   * @param {string} entity Entity identifier to remove
   */
  const removeEntity = (entity: string): void => {
    if (_.includes(entities, entity)) {
      setEntities([...entities.filter((e) => !_.isEqual(e, entity))]);
    }
  };

  return (
    <Content isLoaded={!loading}>
      <Flex direction={"column"}>
        {/* Page header */}
        <Flex
          direction={"row"}
          p={"2"}
          align={"center"}
          justify={"space-between"}
        >
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"project"} size={"md"} />
            <Heading size={"md"}>Create Project</Heading>
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
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
            >
              <Fieldset.Root invalid={isNameError}>
                <Fieldset.Content>
                  <Field.Root required>
                    <Field.Label>Name</Field.Label>
                    <Input
                      id={"name"}
                      name={"name"}
                      size={"sm"}
                      rounded={"md"}
                      placeholder={"Name"}
                      borderColor={"gray.300"}
                      focusRingColor={"black"}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                    {isNameError && (
                      <Field.ErrorText>
                        A name to identify the Project must be specified.
                      </Field.ErrorText>
                    )}
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Owner</Field.Label>
                    <Flex>
                      <ActorTag
                        orcid={owner}
                        fallback={"Unknown User"}
                        size={"md"}
                      />
                    </Flex>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Created</Field.Label>
                    <Input
                      size={"sm"}
                      rounded={"md"}
                      type={"datetime-local"}
                      value={created}
                      onChange={(event) =>
                        setCreated(
                          dayjs(event.target.value).format("YYYY-MM-DDTHH:mm"),
                        )
                      }
                    />
                    <Field.HelperText>
                      Specify a timestamp for the Project.
                    </Field.HelperText>
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
              {/* Project description */}
              <Fieldset.Root invalid={isDescriptionError}>
                <Fieldset.Content>
                  <Field.Root required>
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
                    {isDescriptionError && (
                      <Field.ErrorText>
                        A description must be provided.
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                </Fieldset.Content>
              </Fieldset.Root>
            </Flex>
          </Flex>
        </Flex>

        <Flex direction={"column"} px={"2"} gap={"2"} wrap={"wrap"}>
          <Flex justify={"space-between"} align={"center"}>
            <Text fontWeight={"bold"} fontSize={"sm"}>
              Entities
            </Text>
            <Button
              size={"sm"}
              rounded={"md"}
              colorPalette={"green"}
              onClick={() => setEntitiesOpen(true)}
            >
              Add Entity
              <Icon name={"add"} />
            </Button>
          </Flex>
          <Flex
            direction={"column"}
            p={"2"}
            gap={"2"}
            w={"100%"}
            rounded={"md"}
            border={"1px solid"}
            borderColor={"gray.300"}
            align={"center"}
            justify={"center"}
          >
            <Flex
              w={"100%"}
              justify={"center"}
              align={"center"}
              minH={entities.length > 0 ? "fit-content" : "200px"}
            >
              {entities && entities.length > 0 ? (
                <DataTable
                  data={entities}
                  columns={entitiesColumns}
                  visibleColumns={{}}
                  selectedRows={{}}
                  viewOnly={false}
                  showSelection={true}
                  showPagination
                  showItemCount
                />
              ) : (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon name={"entity"} size={"lg"} />
                    </EmptyState.Indicator>
                    <EmptyState.Description>No Entities</EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      {/* Place the action buttons at the bottom of the screen on desktop */}
      <Spacer />

      {/* Action buttons */}
      <Flex
        direction={"row"}
        wrap={"wrap"}
        gap={"6"}
        justify={"space-between"}
        w={"100%"}
        p={"2"}
      >
        <Button
          size={"sm"}
          rounded={"md"}
          colorPalette={"red"}
          variant={"solid"}
          onClick={() => navigate("/projects")}
        >
          Cancel
          <Icon name={"cross"} />
        </Button>

        <Button
          id={"finishCreateProjectButton"}
          size={"sm"}
          rounded={"md"}
          colorPalette={"green"}
          onClick={async () => {
            // Capture event
            posthog.capture("create_project_finish");

            // Push the data
            setIsSubmitting(true);

            // Execute the GraphQL mutation
            const response = await createProject({
              variables: {
                project: {
                  name: name,
                  owner: token.orcid,
                  archived: false,
                  description: description,
                  created: created,
                  entities: entities,
                  collaborators: [],
                },
              },
            });

            if (response.data?.createProject.success) {
              setIsSubmitting(false);
              navigate("/projects");
            }
            setIsSubmitting(false);
          }}
          disabled={isDetailsError && !isSubmitting}
        >
          Finish
          <Icon name={"check"} />
        </Button>
      </Flex>

      {/* Modal to add Entities */}
      <Dialog.Root
        open={entitiesOpen}
        onOpenChange={(event) => setEntitiesOpen(event.open)}
        placement={"center"}
        closeOnEscape
        closeOnInteractOutside
      >
        <Dialog.Trigger />
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {/* Heading and close button */}
            <Dialog.Header px={"2"} py={"4"} roundedTop={"md"} bg={"gray.100"}>
              <Flex direction={"row"} align={"center"} gap={"2"}>
                <Icon name={"add"} />
                Add Entity
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size={"sm"}
                  onClick={() => setEntitiesOpen(false)}
                  _hover={{ bg: "gray.200" }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p={"2"}>
              <Flex direction={"column"} gap={"2"}>
                <Text fontSize={"sm"}>
                  Select an Entity to add to the Project.
                </Text>

                <SearchSelect
                  id={"entitySearchSelect"}
                  resultType={"entity"}
                  value={selectedEntity}
                  onChange={setSelectedEntity}
                />
              </Flex>
            </Dialog.Body>

            <Dialog.Footer p={"2"} bg={"gray.100"} roundedBottom={"md"}>
              <Button
                colorPalette={"red"}
                size={"sm"}
                rounded={"md"}
                variant={"solid"}
                onClick={() => setEntitiesOpen(false)}
              >
                Cancel
                <Icon name={"cross"} />
              </Button>

              <Spacer />

              <Button
                id={"addEntityDoneButton"}
                colorPalette={"green"}
                size={"sm"}
                rounded={"md"}
                onClick={() => {
                  // Add the Origin to the Entity
                  addEntities(selectedEntity);
                }}
              >
                Done
                <Icon name={"check"} />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

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
                <Icon name={"project"} size={"sm"} />
                Projects
              </Flex>
            </Dialog.Header>
            <Dialog.Body p={"2"}>
              <Flex direction={"column"} gap={"2"}>
                <Text fontSize={"sm"}>
                  Projects can be used to organize and share Entities.
                </Text>
                <Text fontSize={"sm"}>
                  Any type of Entity can be included in a Project. Entities can
                  be added and removed from a Project after it has been created.
                </Text>

                <Heading size={"sm"}>Name</Heading>
                <Text fontSize={"sm"}>
                  Specify the name of a Project. This should be unique and will
                  act as a searchable identifier.
                </Text>

                <Heading size={"sm"}>Date Created or Started</Heading>
                <Text fontSize={"sm"}>
                  A timestamp assigned to the Project. For example, if this is a
                  set of Entities used in a specific experiment, this date could
                  represent when work on the experiment commenced. Otherwise,
                  this timestamp may simply represent when this Project was
                  created in Metadatify.
                </Text>

                <Heading size={"sm"}>Description</Heading>
                <Text fontSize={"sm"}>
                  A brief description of the Project contents.
                </Text>
              </Flex>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

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

export default Project;
