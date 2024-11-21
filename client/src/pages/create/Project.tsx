// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import ActorTag from "@components/ActorTag";
import DataTable from "@components/DataTable";
import Linky from "@components/Linky";
import SearchSelect from "@components/SearchSelect";
import MDEditor from "@uiw/react-md-editor";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

// Routing and navigation
import { useBlocker, useNavigate } from "react-router-dom";
import { gql, useMutation } from "@apollo/client";

// Custom types
import { IGenericItem, ResponseData } from "@types";

// Authentication context
import { useAuthentication } from "@hooks/useAuthentication";

// Posthog
import { usePostHog } from "posthog-js/react";

const Project = () => {
  const posthog = usePostHog();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { token } = useAuthentication();

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

  const {
    isOpen: isEntitiesOpen,
    onOpen: onEntitiesOpen,
    onClose: onEntitiesClose,
  } = useDisclosure();
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
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
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
      id: (info: any) => info.row.original,
      cell: (info: any) => (
        <Linky id={info.row.original} type={"entities"} size={"sm"} />
      ),
      header: "Name",
    },
    {
      id: "view",
      cell: (info: any) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            <IconButton
              icon={<Icon name={"delete"} />}
              aria-label={"Remove entity"}
              colorScheme={"red"}
              onClick={() => removeEntity(info.row.original)}
              size={"sm"}
            />
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
    onEntitiesClose();
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
              rightIcon={<Icon name={"info"} />}
              variant={"outline"}
              onClick={onOpen}
            >
              Info
            </Button>
          </Flex>
        </Flex>

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
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <FormControl isRequired isInvalid={isNameError}>
                <FormLabel htmlFor={"name"} fontSize={"sm"}>
                  Name
                </FormLabel>
                <Input
                  id={"name"}
                  name={"name"}
                  size={"sm"}
                  rounded={"md"}
                  placeholder={"Name"}
                  borderColor={"gray.300"}
                  focusBorderColor={"black"}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                {isNameError && (
                  <FormErrorMessage>
                    A name to identify the Project must be specified.
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel
                  htmlFor={"owner"}
                  fontWeight={"semibold"}
                  fontSize={"sm"}
                >
                  Owner
                </FormLabel>
                <Flex>
                  <ActorTag orcid={owner} fallback={"Unknown User"} />
                </Flex>
              </FormControl>

              <FormControl>
                <FormLabel
                  htmlFor="date"
                  fontWeight={"semibold"}
                  fontSize={"sm"}
                >
                  Created
                </FormLabel>
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
                <FormHelperText fontSize={"xs"}>
                  Specify a timestamp for the Project.
                </FormHelperText>
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
              {/* Project description */}
              <FormControl isRequired isInvalid={isDescriptionError}>
                <FormLabel htmlFor="description" fontSize={"sm"}>
                  Description
                </FormLabel>
                <MDEditor
                  style={{ width: "100%" }}
                  value={description}
                  preview={"edit"}
                  extraCommands={[]}
                  onChange={(value) => {
                    setDescription(value || "");
                  }}
                />
                {isDescriptionError && (
                  <FormErrorMessage>
                    A description must be provided.
                  </FormErrorMessage>
                )}
              </FormControl>
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
              colorScheme={"green"}
              rightIcon={<Icon name={"add"} />}
              onClick={() => onEntitiesOpen()}
            >
              Add Entity
            </Button>
          </Flex>
          <Flex
            direction={"column"}
            p={"2"}
            gap={"2"}
            w={"100%"}
            rounded={"md"}
            border={"1px"}
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
                <Flex w={"100%"} justify={"center"} align={"center"}>
                  <Text
                    color={"gray.400"}
                    fontWeight={"semibold"}
                    fontSize={"sm"}
                  >
                    No Entities
                  </Text>
                </Flex>
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
          colorScheme={"red"}
          rightIcon={<Icon name={"cross"} />}
          variant={"outline"}
          onClick={() => navigate("/projects")}
        >
          Cancel
        </Button>

        <Button
          id={"finishCreateProjectButton"}
          size={"sm"}
          colorScheme={"green"}
          rightIcon={<Icon name={"check"} />}
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
          isDisabled={isDetailsError && !isSubmitting}
        >
          Finish
        </Button>
      </Flex>

      {/* Modal to add Entities */}
      <Modal isOpen={isEntitiesOpen} onClose={onEntitiesClose} isCentered>
        <ModalOverlay />
        <ModalContent p={"2"} gap={"0"} w={["md", "lg", "xl"]}>
          {/* Heading and close button */}
          <ModalHeader p={"2"}>Add Entity</ModalHeader>
          <ModalCloseButton />

          <ModalBody p={"2"}>
            <SearchSelect
              id={"entitySearchSelect"}
              resultType={"entity"}
              value={selectedEntity}
              onChange={setSelectedEntity}
            />
          </ModalBody>

          <ModalFooter p={"2"}>
            <Button
              colorScheme={"red"}
              size={"sm"}
              variant={"outline"}
              rightIcon={<Icon name={"cross"} />}
              onClick={onEntitiesClose}
            >
              Cancel
            </Button>

            <Spacer />

            <Button
              id={"addEntityDoneButton"}
              colorScheme={"green"}
              size={"sm"}
              rightIcon={<Icon name={"check"} />}
              onClick={() => {
                // Add the Origin to the Entity
                addEntities(selectedEntity);
              }}
            >
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Information modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent px={"2"} gap={"0"} w={["xl", "2xl"]}>
          <ModalHeader p={"2"}>Projects</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={"0"}>
            <Flex direction={"column"} gap={"2"} p={"2"}>
              <Text fontSize={"sm"}>
                Projects can be used to organize and share Entities.
              </Text>
              <Text fontSize={"sm"}>
                Any type of Entity can be included in a Project. Entities can be
                added and removed from a Project after it has been created.
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
                represent when work on the experiment commenced. Otherwise, this
                timestamp may simply represent when this Project was created in
                Metadatify.
              </Text>

              <Heading size={"sm"}>Description</Heading>
              <Text fontSize={"sm"}>
                A brief description of the Project contents.
              </Text>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Blocker warning message */}
      <AlertDialog
        isOpen={blocker.state === "blocked"}
        leastDestructiveRef={cancelBlockerRef}
        onClose={onBlockerClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent p={"2"}>
            <AlertDialogHeader p={"2"}>
              <Flex w={"100%"} direction={"row"} gap={"2"} align={"center"}>
                <Icon name={"warning"} />
                <Text fontWeight={"semibold"}>Unsaved Changes</Text>
              </Flex>
            </AlertDialogHeader>

            <AlertDialogBody p={"2"}>
              <Text fontSize={"sm"}>
                Are you sure you want to leave this page? You will lose any
                unsaved changes.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter p={"2"}>
              <Flex w={"100%"} justify={"space-between"}>
                <Button
                  size={"sm"}
                  colorScheme={"red"}
                  rightIcon={<Icon name={"cross"} />}
                  ref={cancelBlockerRef}
                  onClick={() => {
                    blocker.reset?.();
                    onBlockerClose();
                  }}
                >
                  Cancel
                </Button>

                <Button
                  size={"sm"}
                  rightIcon={<Icon name={"check"} />}
                  colorScheme={"green"}
                  onClick={() => blocker.proceed?.()}
                  ml={3}
                >
                  Continue
                </Button>
              </Flex>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Content>
  );
};

export default Project;
