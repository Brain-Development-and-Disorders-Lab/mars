// React and Chakra UI components
import React, { useEffect, useState } from "react";
import {
  Flex,
  Spacer,
  Input,
  Button,
  VStack,
  Tag,
  IconButton,
  Text,
  Heading,
  Fieldset,
  Field,
} from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";
import { Content } from "@components/Container";
import { toaster } from "@components/Toast";
import MDEditor from "@uiw/react-md-editor";

// Custom types
import { IResponseMessage, WorkspaceModel } from "@types";

// GraphQL imports
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// Routing and navigation
import { useNavigate } from "react-router-dom";

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

  // Get contexts
  const { workspace, activateWorkspace } = useWorkspace();
  const { logout } = useAuthentication();

  // State for Workspace details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // State for Workspace collaborators
  const [collaborator, setCollaborator] = useState("");
  const [collaborators, setCollaborators] = useState([] as string[]);

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
          <Spacer />
          <Flex gap={"2"} align={"center"}>
            {workspace === "" && (
              <Button size={"sm"} onClick={() => logout()}>
                Logout
              </Button>
            )}
            {workspace !== "" && (
              <Button
                size={"sm"}
                colorPalette={"red"}
                onClick={() => handleCancelClick()}
              >
                Cancel
              </Button>
            )}
            <Button
              id={"modalWorkspaceCreateButton"}
              size={"sm"}
              colorPalette={"green"}
              onClick={() => handleCreateWorkspaceClick()}
              loading={createLoading}
              disabled={name === ""}
            >
              Create
            </Button>
          </Flex>
        </Flex>

        <Flex direction={"column"} p={"2"} gap={"2"} grow={"1"}>
          {workspace === "" ? (
            <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.400"}>
              Before you can get started using Metadatify, you must be invited
              as Collaborator on an existing Workspace or create a new Workspace
              below.
            </Text>
          ) : (
            <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.400"}>
              Workspaces can be used to organize Entities and Projects, as well
              as inviting collaborators to work together on experiments.
            </Text>
          )}
          <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.400"}>
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
              border={"1px"}
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
              border={"1px"}
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

          <Flex
            direction={"column"}
            p={"0"}
            gap={"2"}
            wrap={"wrap"}
            w={{ base: "100%", md: "40%" }}
          >
            {/* Workspace collaborators */}
            <Flex
              direction={"column"}
              h={"fit-content"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <Text fontSize={"sm"} fontWeight={"semibold"}>
                Collaborators
              </Text>
              <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.400"}>
                Add Collaborators by their ORCiD, and they will have access to
                this Workspace when they next sign into Metadatify.
              </Text>
              <Flex direction={"row"} gap={"2"} align={"center"}>
                <Fieldset.Root>
                  <Fieldset.Content>
                    <Field.Root>
                      <Input
                        placeholder={"ORCiD"}
                        rounded={"md"}
                        size={"sm"}
                        value={collaborator}
                        onChange={(event) =>
                          setCollaborator(event.target.value)
                        }
                      />
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
                <Spacer />
                <Button
                  colorPalette={"green"}
                  size={"sm"}
                  disabled={collaborator === ""}
                  onClick={() => {
                    // Prevent adding empty or duplicate collaborator
                    if (collaborator && !collaborators.includes(collaborator)) {
                      setCollaborators((collaborators) => [
                        ...collaborators,
                        collaborator,
                      ]);
                      setCollaborator("");
                    }
                  }}
                >
                  Add
                  <Icon name={"add"} />
                </Button>
              </Flex>
              <Flex
                w={"100%"}
                justify={collaborators.length === 0 ? "center" : ""}
                align={"center"}
                minH={collaborators.length > 0 ? "fit-content" : "200px"}
              >
                {collaborators.length === 0 ? (
                  <Text color={"gray.400"} fontWeight={"semibold"}>
                    No Collaborators
                  </Text>
                ) : (
                  <VStack w={"100%"}>
                    {collaborators.map((collaborator, index) => (
                      <Flex
                        key={index}
                        align={"center"}
                        gap={"2"}
                        py={"2"}
                        w={"100%"}
                      >
                        <Tag.Root colorPalette={"green"}>
                          <Tag.Label>{collaborator}</Tag.Label>
                        </Tag.Root>
                        <Spacer />
                        <IconButton
                          size={"sm"}
                          aria-label={"Remove collaborator"}
                          colorPalette={"red"}
                          onClick={() =>
                            setCollaborators((collaborators) =>
                              collaborators.filter(
                                (existing) => existing !== collaborator,
                              ),
                            )
                          }
                        >
                          <Icon name="delete" />
                        </IconButton>
                      </Flex>
                    ))}
                  </VStack>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default CreateWorkspace;
