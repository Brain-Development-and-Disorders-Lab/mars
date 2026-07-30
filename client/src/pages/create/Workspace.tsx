// React and Chakra UI components
import React, { useEffect, useRef, useState } from "react";
import { Flex, Spacer, Input, Button, Text, Heading, Fieldset, Field, useDisclosure, Textarea } from "@chakra-ui/react";

// Custom components
import ActorTag from "@components/ActorTag";
import Icon from "@components/Icon";
import Collaborators from "@components/Collaborators";
import { Content } from "@components/Container";
import { toaster } from "@components/Toast";
import { UnsavedChangesDialog } from "@components/UnsavedChangesDialog";

// Custom types
import { IResponseMessage, WorkspaceModel } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery, useMutation } from "@apollo/client/react";

// Routing and navigation
import { useBlocker, useNavigate } from "react-router-dom";

// Contexts
import { useWorkspace } from "@hooks/useWorkspace";

// Authentication
import { auth } from "@lib/auth";

// Utility imports
import { ignoreAbort } from "@lib/util";

// Posthog
import { usePostHog } from "posthog-js/react";

// Variables
import { STYLES } from "@variables";

const CreateWorkspace = () => {
  const posthog = usePostHog();

  // Access token to set the active Workspace
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

  // Get contexts
  const { workspace, activateWorkspace } = useWorkspace();

  // State for Workspace details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");

  // State for Workspace collaborators
  const [collaborators, setCollaborators] = useState([] as string[]);

  // State for submitting the form
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication and user
  /**
   * Helper function to get user information
   */
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

  // Query to create a Workspace
  const CREATE_WORKSPACE = gql`
    mutation CreateWorkspace($workspace: WorkspaceCreateInput) {
      createWorkspace(workspace: $workspace) {
        success
        message
      }
    }
  `;
  const [createWorkspace, { loading: createLoading, error: createError }] = useMutation<{
    createWorkspace: IResponseMessage;
  }>(CREATE_WORKSPACE);

  // Query to retrieve all Workspaces
  const GET_WORKSPACES = gql`
    query GetWorkspaces {
      workspaces {
        _id
        owner
        name
        description
      }
    }
  `;
  const [getWorkspaces, { error: workspacesError }] = useLazyQuery<{
    workspaces: WorkspaceModel[];
  }>(GET_WORKSPACES, { fetchPolicy: "network-only" });

  // Capture event
  useEffect(() => {
    posthog?.capture("client.create.workspace_start");
  }, [posthog]);

  /**
   * Create the Workspace using GraphQL query
   */
  const handleCreateWorkspaceClick = async () => {
    // Capture event
    posthog?.capture("client.create.workspace_finish");

    // Set submitting state
    setIsSubmitting(true);

    const result = await createWorkspace({
      variables: {
        workspace: {
          name: name,
          description: description,
          owner: owner,
          public: false,
          collaborators: collaborators,
          entities: [],
          projects: [],
          templates: [],
          activity: [],
        },
      },
    });

    if (result.data?.createWorkspace.success) {
      // Update to use the new Workspace identifier
      const workspaces = await getWorkspaces().catch(ignoreAbort);
      if (workspaces?.data?.workspaces && workspaces.data.workspaces.length > 0) {
        // Get the latest created Workspace
        const created = workspaces.data.workspaces[workspaces.data.workspaces.length - 1];

        // Update the stored Workspace identifier and collection of Workspaces
        navigate("/");
        activateWorkspace(created._id);

        // Reset dialog state
        setName("");
        setDescription("");
        setCollaborators([]);

        toaster.create({
          title: "Success",
          description: "Workspace created successfully",
          type: "success",
          duration: 4000,
          closable: true,
        });
      }
    }

    if (createError || workspacesError) {
      toaster.create({
        title: "Error",
        description: "Unable to retrieve Workspaces",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  /**
   * Handle clicking the "Cancel" button when creating a Workspace
   */
  const handleCancelClick = () => {
    // Capture event
    posthog?.capture("client.create.workspace_cancel");

    navigate("/");
  };

  return (
    <Content>
      <Flex direction={"column"} p={"1"} rounded={"md"} bg={"white"} wrap={"wrap"} gap={"1"} minW="0" maxW="100%">
        {/* Page header */}
        <Flex w={"100%"} minW="0" direction={"row"} justify={"space-between"} align={"center"} ml={"0.5"}>
          <Flex align={"center"} gap={"1"} w={"100%"} pt={"1"} minW="0">
            <Icon name={"workspace"} size={"sm"} />
            <Heading size={"md"}>Create Workspace</Heading>
          </Flex>
        </Flex>

        <Flex direction={"column"} p={"1"} gap={"1"} grow={"1"}>
          {workspace === "" ? (
            <Text fontSize={"xs"}>
              Before you can get started using Metadatify, you must be invited as Collaborator on an existing Workspace
              or create a new Workspace below.
            </Text>
          ) : (
            <Text fontSize={"xs"}>
              Workspaces can be used to organize Entities and Projects, as well as inviting collaborators to work
              together.
            </Text>
          )}
          <Text fontSize={"xs"}>
            Use the Workspace switcher in the navigation bar to view all Workspaces and switch the active Workspace.
          </Text>
        </Flex>

        <Flex direction={"column"} gap={"2"} wrap={"wrap"}>
          <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
            <Flex
              direction={"column"}
              flex={{ base: "0 0 100%", md: "1" }}
              h={"fit-content"}
              p={"2"}
              gap={"2"}
              bg={STYLES.card.bg}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              rounded={"md"}
            >
              <Fieldset.Root>
                <Fieldset.Content>
                  <Field.Root required gap={"1"}>
                    <Field.Label
                      fontWeight={"semibold"}
                      fontSize={"xs"}
                      color={STYLES.font.secondaryHeader.color}
                      ml={"0.5"}
                    >
                      Name
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      id={"dialogWorkspaceName"}
                      data-testid={"create-workspace-name"}
                      size={"xs"}
                      rounded={"md"}
                      placeholder={"Name"}
                      value={name}
                      bg={"white"}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </Field.Root>
                </Fieldset.Content>
              </Fieldset.Root>

              <Flex direction={"column"} gap={"2"}>
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                  Owner
                </Text>
                <ActorTag identifier={owner} fallback={"Unknown User"} size={"sm"} />
              </Flex>
            </Flex>

            {/* Workspace description */}
            <Flex
              direction={"column"}
              flex={{ base: "0 0 100%", md: "1" }}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Description
              </Text>
              <Textarea
                data-testid={"create-workspace-description"}
                id={"dialogWorkspaceDescription"}
                value={description}
                size={"xs"}
                h={"100%"}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Flex>
          </Flex>

          {/* Workspace collaborators */}
          <Collaborators
            editing={true}
            currentUser={owner}
            owner={owner}
            collaborators={collaborators}
            setCollaborators={setCollaborators}
          />
        </Flex>
      </Flex>

      {/* Place the action buttons at the bottom of the screen on desktop */}
      <Spacer />

      <Flex p={"1"} gap={"1"} align={"center"} w={"100%"} justify={"space-between"}>
        {workspace === "" && (
          <Button size={"xs"} colorPalette={"orange"} rounded={"md"} onClick={() => auth.signOut()}>
            Log out
            <Icon name={"logout"} size={"xs"} />
          </Button>
        )}
        {workspace !== "" && (
          <Button size={"xs"} rounded={"md"} colorPalette={"red"} onClick={() => handleCancelClick()}>
            Cancel
            <Icon name={"cross"} size={"xs"} />
          </Button>
        )}
        <Button
          id={"dialogWorkspaceCreateButton"}
          data-testid={"create-workspace-button"}
          size={"xs"}
          rounded={"md"}
          colorPalette={"green"}
          onClick={() => handleCreateWorkspaceClick()}
          loading={createLoading}
          disabled={name === ""}
        >
          Create
          <Icon name={"check"} size={"xs"} />
        </Button>
      </Flex>

      {/* Blocker warning message */}
      <UnsavedChangesDialog
        blocker={blocker}
        cancelBlockerRef={cancelBlockerRef}
        onClose={onBlockerClose}
        callback={onBlockerClose}
      />
    </Content>
  );
};

export default CreateWorkspace;
