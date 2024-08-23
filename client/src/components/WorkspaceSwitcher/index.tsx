import React, { useEffect, useState } from "react";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Tag,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import Icon from "@components/Icon";

// GraphQL resources
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";

// Custom types
import { IAuth, ResponseMessage, WorkspaceModel } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { useToken } from "src/authentication/useToken";
import _ from "lodash";

const WorkspaceSwitcher = () => {
  const navigate = useNavigate();

  const toast = useToast();
  const [workspaces, setWorkspaces] = useState([] as WorkspaceModel[]);

  // Access token to set the active Workspace
  const [token, setToken] = useToken();
  const [workspaceIdentifier, setWorkspaceIdentifier] = useState(
    token.workspace,
  );
  const [workspace, setWorkspace] = useState({} as WorkspaceModel);

  // State for Workspace details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // State for Workspace collaborators
  const [collaborator, setCollaborator] = useState("");
  const [collaborators, setCollaborators] = useState([] as string[]);

  const [isOpen, setIsOpen] = useState(false);
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  // Query to retrieve Workspaces
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
  const { loading, error, data, refetch } = useQuery<{
    workspaces: WorkspaceModel[];
  }>(GET_WORKSPACES, { fetchPolicy: "network-only" });

  // Query to get a Workspace
  const GET_WORKSPACE = gql`
    query GetWorkspace($_id: String) {
      workspace(_id: $_id) {
        _id
        owner
        name
      }
    }
  `;
  const [getWorkspace, { error: workspaceError }] = useLazyQuery<{
    workspace: WorkspaceModel;
  }>(GET_WORKSPACE);

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
    useMutation<{ createWorkspace: ResponseMessage }>(CREATE_WORKSPACE);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.workspaces) {
      // Unpack all the Entity data
      setWorkspaces(data.workspaces);
    }

    if (error) {
      toast({
        title: "Error",
        description: "Unable to retrieve Workspaces",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [loading]);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  useEffect(() => {
    const updateWorkspace = async () => {
      // When the `workspaceIdentifier` value changes, retrieve updated model
      const result = await getWorkspace({
        variables: {
          _id: workspaceIdentifier,
        },
      });

      if (result.data?.workspace) {
        setWorkspace(result.data.workspace);

        // Clone the existing token and update with selected Workspace ID
        const updatedToken: IAuth = _.cloneDeep(token);
        updatedToken.workspace = workspaceIdentifier;
        setToken(updatedToken);

        // Only reload on valid and updated Workspace
        if (workspace._id) {
          navigate(0);
        }
      }

      if (workspaceError) {
        toast({
          title: "Error",
          description: "Unable to retrieve Workspaces",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      }
    };

    if (workspaceIdentifier !== "") {
      updateWorkspace();
    } else {
      onCreateOpen();
    }
  }, [workspaceIdentifier]);

  const performLogout = () => {
    // Invalidate the token and refresh the page
    setToken({
      name: token.name,
      orcid: token.orcid,
      token: "",
      workspace: "",
    });
    navigate(0);
  };

  /**
   * Handle selecting a Workspace from the drop-down
   * @param _id Identifier of selected Workspace
   */
  const handleWorkspaceClick = (_id: string) => {
    setWorkspaceIdentifier(_id);
    setIsOpen(false);
  };

  /**
   * Handle click events within the `Create Workspace` button
   */
  const handleCreateClick = () => {
    // Open the create Workspace modal
    onCreateOpen();

    // Ensure `WorkspaceSwitcher` is closed
    setIsOpen(false);
  };

  /**
   * Create the Workspace using GraphQL query
   */
  const handleCreateWorkspaceClick = async () => {
    const result = await createWorkspace({
      variables: {
        workspace: {
          name: name,
          description: description,
          owner: token.orcid,
          collaborators: collaborators,
          entities: [],
          projects: [],
          attributes: [],
          activity: [],
        },
      },
    });

    if (result.data?.createWorkspace.success) {
      // Navigate back to the Dashboard
      onCreateClose();
      navigate("/");
    }

    if (createError) {
      toast({
        title: "Error",
        description: "Unable to retrieve Workspaces",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  return (
    <Flex>
      <Menu isOpen={isOpen}>
        <MenuButton
          h={"100%"}
          w={"100%"}
          rounded={"md"}
          border={"1px"}
          borderColor={"gray.200"}
          bg={"white"}
          _hover={{ bg: "gray.300" }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Flex
            direction={"row"}
            align={"center"}
            gap={"2"}
            p={"2"}
            ml={"2"}
            mr={"2"}
          >
            <Text
              fontSize={"sm"}
              fontWeight={"semibold"}
              w={"100%"}
              align={"center"}
            >
              {_.truncate(workspace.name, { length: 15 })}
            </Text>
            <Icon name={isOpen ? "c_up" : "c_down"} />
          </Flex>
        </MenuButton>

        <MenuList bg={"white"}>
          <MenuGroup>
            {/* Create a list of all Workspaces the user has access to */}
            {workspaces.map((workspace) => {
              return (
                <MenuItem
                  key={workspace._id}
                  onClick={() => handleWorkspaceClick(workspace._id)}
                >
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    {workspace.name}
                  </Text>
                </MenuItem>
              );
            })}
          </MenuGroup>

          <MenuDivider />

          <MenuGroup>
            {/* Option to create a new Workspace */}
            <Flex
              direction={"row"}
              align={"center"}
              justify={"center"}
              gap={"2"}
              w={"100%"}
            >
              <Button
                size={"sm"}
                colorScheme={"green"}
                onClick={() => handleCreateClick()}
                leftIcon={<Icon size={"sm"} name={"add"} />}
              >
                Create Workspace
              </Button>
            </Flex>
          </MenuGroup>
        </MenuList>
      </Menu>

      <Modal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        size={"full"}
        closeOnEsc={workspaceIdentifier !== ""}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader p={"2"}>
            <Flex align={"center"} gap={"2"} w={"100%"}>
              <Icon name={"workspace"} size={"md"} />
              <Heading size={"md"}>Create Workspace</Heading>
              <Spacer />
            </Flex>
          </ModalHeader>
          <ModalBody p={"2"}>
            <Flex gap={"2"} direction={"column"}>
              {workspaceIdentifier === "" ? (
                <Text
                  fontSize={"sm"}
                  fontWeight={"semibold"}
                  color={"gray.400"}
                >
                  Before you can get started using Storacuity, you must be
                  invited as Collaborator on an existing Workspace or create a
                  new Workspace below.
                </Text>
              ) : (
                <Text
                  fontSize={"sm"}
                  fontWeight={"semibold"}
                  color={"gray.400"}
                >
                  Workspaces can be used to organize Entities and Projects, as
                  well as inviting collaborators to work together on
                  experiments.
                </Text>
              )}
              <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.400"}>
                Use the Workspace switcher in the navigation bar to view all
                Workspaces and switch the active Workspace.
              </Text>

              <Flex direction={"row"} gap={"2"}>
                {/* Workspace name */}
                <Flex
                  direction={"column"}
                  p={"0"}
                  gap={"2"}
                  grow={"1"}
                  basis={"50%"}
                >
                  <Flex
                    direction={"column"}
                    p={"2"}
                    gap={"2"}
                    rounded={"md"}
                    border={"1px"}
                    borderColor={"gray.200"}
                  >
                    <FormControl isRequired>
                      <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                        Name
                      </FormLabel>
                      <Input
                        size={"sm"}
                        rounded={"md"}
                        placeholder={"Name"}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </FormControl>
                  </Flex>
                  <Flex
                    direction={"column"}
                    p={"2"}
                    gap={"2"}
                    rounded={"md"}
                    border={"1px"}
                    borderColor={"gray.200"}
                  >
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      Collaborators
                    </Text>
                    <Text
                      fontSize={"sm"}
                      fontWeight={"semibold"}
                      color={"gray.400"}
                    >
                      Add Collaborators by their ORCiD, and they will have
                      access to this Workspace when they next sign into
                      Storacuity.
                    </Text>
                    <Flex direction={"row"} gap={"2"} align={"center"}>
                      <FormControl>
                        <Input
                          placeholder={"ORCiD"}
                          rounded={"md"}
                          size={"sm"}
                          value={collaborator}
                          onChange={(event) =>
                            setCollaborator(event.target.value)
                          }
                        />
                      </FormControl>
                      <Spacer />
                      <Button
                        colorScheme={"green"}
                        rightIcon={<Icon name={"add"} />}
                        size={"sm"}
                        isDisabled={collaborator === ""}
                        onClick={() => {
                          // Prevent adding empty or duplicate collaborator
                          if (
                            collaborator &&
                            !collaborators.includes(collaborator)
                          ) {
                            setCollaborators((collaborators) => [
                              ...collaborators,
                              collaborator,
                            ]);
                            setCollaborator("");
                          }
                        }}
                      >
                        Add
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
                              <Tag colorScheme={"green"}>{collaborator}</Tag>
                              <Spacer />
                              <IconButton
                                size={"sm"}
                                aria-label={"Remove collaborator"}
                                icon={<Icon name="delete" />}
                                colorScheme={"red"}
                                onClick={() =>
                                  setCollaborators((collaborators) =>
                                    collaborators.filter(
                                      (existing) => existing !== collaborator,
                                    ),
                                  )
                                }
                              />
                            </Flex>
                          ))}
                        </VStack>
                      )}
                    </Flex>
                  </Flex>
                </Flex>

                {/* Workspace description */}
                <Flex
                  direction={"column"}
                  p={"0"}
                  gap={"2"}
                  grow={"1"}
                  basis={"50%"}
                >
                  <Flex
                    direction={"column"}
                    p={"2"}
                    gap={"2"}
                    rounded={"md"}
                    border={"1px"}
                    borderColor={"gray.200"}
                  >
                    <FormControl>
                      <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                        Description
                      </FormLabel>
                      <Textarea
                        size={"sm"}
                        rounded={"md"}
                        placeholder={"Description"}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                      />
                    </FormControl>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </ModalBody>

          <ModalFooter p={"2"}>
            {workspaceIdentifier === "" && (
              <Button size={"sm"} onClick={() => performLogout()}>
                Logout
              </Button>
            )}
            {workspaceIdentifier !== "" && (
              <Button
                size={"sm"}
                colorScheme={"red"}
                onClick={() => onCreateClose()}
              >
                Cancel
              </Button>
            )}
            <Spacer />
            <Button
              size={"sm"}
              colorScheme={"green"}
              onClick={() => handleCreateWorkspaceClick()}
              isLoading={createLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default WorkspaceSwitcher;
