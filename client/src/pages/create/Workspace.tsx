// React and Chakra UI components
import React, { useEffect, useRef, useState } from "react";
import {
  Flex,
  Spacer,
  Input,
  Button,
  Text,
  Heading,
  Fieldset,
  Field,
  useDisclosure,
} from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";
import Collaborators from "@components/Collaborators";
import { Content } from "@components/Container";
import { toaster } from "@components/Toast";
import { UnsavedChangesModal } from "@components/WarningModal";
import MDEditor from "@uiw/react-md-editor";

// Custom types
import { IResponseMessage, WorkspaceModel } from "@types";

// GraphQL imports
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// Routing and navigation
import { useBlocker, useNavigate } from "react-router-dom";

// Contexts
import { useWorkspace } from "@hooks/useWorkspace";
import { useAuthentication } from "@hooks/useAuthentication";

// Posthog
import { usePostHog } from "posthog-js/react";

const CreateWorkspace = () => {
  const posthog = usePostHog();

  // Access token to set the active Workspace
  const { token } = useAuthentication();
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
  const { logout } = useAuthentication();

  // State for Workspace details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // State for Workspace collaborators
  const [collaborators, setCollaborators] = useState([] as string[]);

  // State for submitting the form
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query to create a Workspace
  const CREATE_WORKSPACE = gql`
    mutation CreateWorkspace($workspace: WorkspaceCreateInput) {
      createWorkspace(workspace: $workspace) {
        success
        message
      }
    }
  `;
  const [createWorkspace, { loading: createLoading, error: createError }] =
    useMutation<{ createWorkspace: IResponseMessage }>(CREATE_WORKSPACE);

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
    posthog?.capture("create_workspace_start");
  }, [posthog]);

  /**
   * Create the Workspace using GraphQL query
   */
  const handleCreateWorkspaceClick = async () => {
    // Capture event
    posthog?.capture("create_workspace_finish");

    // Set submitting state
    setIsSubmitting(true);

    const result = await createWorkspace({
      variables: {
        workspace: {
          name: name,
          description: description,
          owner: token.orcid,
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
      const workspaces = await getWorkspaces();
      if (
        workspaces.data?.workspaces &&
        workspaces.data.workspaces.length > 0
      ) {
        // Get the latest created Workspace
        const created =
          workspaces.data.workspaces[workspaces.data.workspaces.length - 1];

        // Update the stored Workspace identifier and collection of Workspaces
        navigate("/");
        activateWorkspace(created._id);

        // Reset modal state
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
    posthog?.capture("create_workspace_cancel");

    navigate("/");
  };

  return (
    <Content>
      <Flex direction={"column"}>
        {/* Page header */}
        <Flex
          direction={"row"}
          p={"2"}
          align={"center"}
          justify={"space-between"}
        >
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"workspace"} size={"md"} />
            <Heading size={"md"}>Create Workspace</Heading>
          </Flex>
        </Flex>

        <Flex direction={"column"} p={"2"} gap={"2"} grow={"1"}>
          {workspace === "" ? (
            <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.500"}>
              Before you can get started using Metadatify, you must be invited
              as Collaborator on an existing Workspace or create a new Workspace
              below.
            </Text>
          ) : (
            <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.500"}>
              Workspaces can be used to organize Entities and Projects, as well
              as inviting collaborators to work together on experiments.
            </Text>
          )}
          <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.500"}>
            Use the Workspace switcher in the navigation bar to view all
            Workspaces and switch the active Workspace.
          </Text>
        </Flex>

        <Flex direction={"row"} p={"2"} gap={"2"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            p={"0"}
            gap={"2"}
            w={{ base: "100%", md: "50%" }}
          >
            {/* Workspace name */}
            <Flex
              direction={"column"}
              h={"fit-content"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
            >
              <Fieldset.Root>
                <Fieldset.Content>
                  <Field.Root required>
                    <Field.Label>
                      Name
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      id={"modalWorkspaceName"}
                      size={"sm"}
                      rounded={"md"}
                      placeholder={"Name"}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </Field.Root>
                </Fieldset.Content>
              </Fieldset.Root>
            </Flex>

            {/* Workspace description */}
            <Flex
              direction={"column"}
              h={"fit-content"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
            >
              <Fieldset.Root>
                <Fieldset.Content>
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <MDEditor
                      height={150}
                      minHeight={100}
                      maxHeight={400}
                      id={"modalWorkspaceDescription"}
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

          {/* Workspace collaborators */}
          <Collaborators
            editing={true}
            projectCollaborators={collaborators}
            setProjectCollaborators={setCollaborators}
          />
        </Flex>
      </Flex>

      {/* Place the action buttons at the bottom of the screen on desktop */}
      <Spacer />

      <Flex
        p={"2"}
        gap={"2"}
        align={"center"}
        w={"100%"}
        justify={"space-between"}
      >
        {workspace === "" && (
          <Button
            size={"sm"}
            colorPalette={"orange"}
            rounded={"md"}
            onClick={() => logout()}
          >
            Log out
            <Icon name={"logout"} />
          </Button>
        )}
        {workspace !== "" && (
          <Button
            size={"sm"}
            rounded={"md"}
            colorPalette={"red"}
            onClick={() => handleCancelClick()}
          >
            Cancel
            <Icon name={"cross"} />
          </Button>
        )}
        <Button
          id={"modalWorkspaceCreateButton"}
          size={"sm"}
          rounded={"md"}
          colorPalette={"green"}
          onClick={() => handleCreateWorkspaceClick()}
          loading={createLoading}
          disabled={name === ""}
        >
          Create
          <Icon name={"check"} />
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

export default CreateWorkspace;
