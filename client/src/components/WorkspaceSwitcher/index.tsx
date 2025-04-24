import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  Flex,
  Menu,
  Spacer,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// GraphQL resources
import { gql, useLazyQuery, useQuery } from "@apollo/client";

// Navigation
import { useNavigate } from "react-router-dom";

// Custom types
import { IGenericItem, WorkspaceModel } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Contexts
import { useWorkspace } from "@hooks/useWorkspace";
import { useAuthentication } from "@hooks/useAuthentication";

const WorkspaceSwitcher = (props: { id?: string }) => {
  const navigate = useNavigate();

  // Modal state for transition overlay
  const {
    open: transitionOpen,
    onOpen: onTransitionOpen,
    onClose: onTransitionClose,
  } = useDisclosure();

  // Store all Workspaces
  const [workspaces, setWorkspaces] = useState([] as WorkspaceModel[]);

  // Get contexts
  const { workspace, activateWorkspace } = useWorkspace();
  const { logout } = useAuthentication();

  // Switcher drop-down visibility state
  const [isOpen, setIsOpen] = useState(false);

  // Switcher loading state
  const [isLoading, setIsLoading] = useState(false);

  // Switcher label text
  const [label, setLabel] = useState("Select Workspace");

  // Queries (active and lazy) to retrieve all Workspaces
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
  const [getWorkspaces, { error: workspacesError }] = useLazyQuery<{
    workspaces: WorkspaceModel[];
  }>(GET_WORKSPACES, { fetchPolicy: "network-only" });

  // Query to get a Workspace
  const GET_WORKSPACE = gql`
    query GetWorkspace($_id: String) {
      workspace(_id: $_id) {
        _id
        name
      }
    }
  `;
  const [getWorkspace, { error: workspaceError }] = useLazyQuery<{
    workspace: WorkspaceModel;
  }>(GET_WORKSPACE, { fetchPolicy: "network-only" });

  /**
   * Async function to retrieve the name of the initially selected Workspace
   */
  const setInitialLabelValue = async () => {
    const workspaceResult = await getWorkspace({
      variables: {
        _id: workspace,
      },
    });

    if (_.isUndefined(workspaceResult.data) && !_.isUndefined(workspaceError)) {
      toaster.create({
        title: "Error",
        description: "Unable to get name of current Workspace",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (!_.isUndefined(workspaceResult.data)) {
      setLabel(workspaceResult.data.workspace.name);
    }
  };

  // Update the label value on first render
  useEffect(() => {
    setInitialLabelValue();
  }, [workspace]);

  // Present the transition overlay when loading
  useEffect(() => {
    if (isLoading) {
      onTransitionOpen();
    } else {
      onTransitionClose();
    }
  }, [isLoading]);

  /**
   * Utility function to update the list of Workspaces
   */
  const updateWorkspaces = async () => {
    // Presenting the transition overlay
    setIsLoading(true);

    // Refresh the list of Workspaces
    const resultWorkspaces = await getWorkspaces();
    if (resultWorkspaces.data?.workspaces) {
      setWorkspaces(resultWorkspaces.data.workspaces);
    }

    // Close the transition overlay
    setIsLoading(false);

    if (workspacesError) {
      toaster.create({
        title: "Error",
        description: "Unable to update list of Workspaces",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  // Manage data once retrieved
  useEffect(() => {
    if (data?.workspaces) {
      // Unpack all the Entity data
      setWorkspaces(data.workspaces);

      // If the User has no Workspaces, force them to create one
      if (data.workspaces.length === 0) {
        navigate("/create/workspace");
      }
    }

    if (error) {
      toaster.create({
        title: "Error",
        description: "Unable to retrieve Workspaces",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  }, [loading]);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  // When the label is updated, refresh the list of Workspaces
  useEffect(() => {
    updateWorkspaces();
  }, [label]);

  /**
   * Handle selecting a Workspace from the drop-down
   * @param selectedWorkspace Identifier and name of selected Workspace
   */
  const handleWorkspaceClick = async (selectedWorkspace: IGenericItem) => {
    if (workspace !== selectedWorkspace._id) {
      // Present the transition overlay and activate the selected Workspace
      setIsLoading(true);
      await activateWorkspace(selectedWorkspace._id);

      // Update the switcher visual state and close the transition overlay
      setLabel(selectedWorkspace.name);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  /**
   * Handle click events within the `Update Workspace` button
   */
  const handleUpdateClick = () => {
    // Open the update Workspace modal
    navigate(`/workspaces/${workspace}`);

    // Ensure `WorkspaceSwitcher` is closed
    setIsOpen(false);
  };

  /**
   * Handle click events within the `Create Workspace` button
   */
  const handleCreateClick = () => {
    // Open the create Workspace modal
    navigate("/create/workspace");

    // Ensure `WorkspaceSwitcher` is closed
    setIsOpen(false);
  };

  /**
   * Handle click events within the `Profile` button
   */
  const handleProfileClick = () => {
    navigate("/profile");
    setIsOpen(false);
  };

  return (
    <Flex id={props.id ? props.id : "workspaceSwitcher"} w={"100%"}>
      <Menu.Root open={isOpen}>
        <Menu.Trigger asChild>
          <Button
            h={"100%"}
            w={"100%"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.300"}
            color={"black"}
            bg={"white"}
            _hover={{ bg: "gray.300" }}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Flex
              direction={"row"}
              gap={"2"}
              align={"center"}
              p={"2"}
              w={"100%"}
            >
              <Icon name={"workspace"} />
              <Text fontSize={"sm"} fontWeight={"semibold"}>
                {_.truncate(label, { length: 14 })}
              </Text>
              <Spacer />
              <Icon name={"c_expand"} />
            </Flex>
          </Button>
        </Menu.Trigger>

        <Menu.Positioner>
          <Menu.Content bg={"white"} w={"100%"}>
            <Menu.ItemGroup>
              {/* Create a list of all Workspaces the user has access to */}
              {workspaces.length > 0 ? (
                workspaces.map((accessible) => {
                  return (
                    <Menu.Item
                      value={accessible.name}
                      onClick={() => handleWorkspaceClick(accessible)}
                      key={"w_" + accessible._id}
                    >
                      <Flex
                        direction={"row"}
                        gap={"2"}
                        align={"center"}
                        justify={"space-between"}
                      >
                        <Tooltip content={accessible.name} showArrow>
                          <Text fontSize={"sm"} fontWeight={"semibold"}>
                            {_.truncate(accessible.name, { length: 24 })}
                          </Text>
                        </Tooltip>
                        {workspace === accessible._id && (
                          <Icon name={"check"} color={"green.600"} />
                        )}
                      </Flex>
                    </Menu.Item>
                  );
                })
              ) : (
                <Menu.Item value={"no-workspaces"} disabled>
                  <Flex
                    direction={"row"}
                    gap={"2"}
                    align={"center"}
                    justify={"space-between"}
                  >
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      No Workspaces
                    </Text>
                  </Flex>
                </Menu.Item>
              )}
            </Menu.ItemGroup>

            <Menu.ItemGroup>
              {/* Option to create a new Workspace */}
              <Menu.Item
                value={"edit"}
                onClick={() => handleUpdateClick()}
                disabled={workspaces.length === 0}
              >
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Icon name={"edit"} />
                  <Text fontSize={"sm"}>Edit workspace</Text>
                </Flex>
              </Menu.Item>
              <Menu.Item value={"create"} onClick={() => handleCreateClick()}>
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Icon name={"add"} />
                  <Text fontSize={"sm"}>Create workspace</Text>
                </Flex>
              </Menu.Item>
            </Menu.ItemGroup>

            <Menu.Separator />

            <Menu.ItemGroup>
              <Menu.Item value={"account"} onClick={() => handleProfileClick()}>
                <Flex
                  id={"accountSettingsItem"}
                  direction={"row"}
                  gap={"2"}
                  align={"center"}
                >
                  <Icon name={"person"} />
                  <Text fontSize={"sm"}>Account settings</Text>
                </Flex>
              </Menu.Item>
              <Menu.Item value={"logout"} onClick={() => logout()}>
                <Flex
                  id={"accountLogoutItem"}
                  direction={"row"}
                  gap={"2"}
                  align={"center"}
                >
                  <Icon name={"b_right"} />
                  <Text fontSize={"sm"}>Log out</Text>
                </Flex>
              </Menu.Item>
            </Menu.ItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>

      <Dialog.Root
        open={transitionOpen}
        size={"full"}
        onExitComplete={onTransitionClose}
        motionPreset={"none"}
      >
        <Dialog.Trigger />
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
          // w={"100%"}
          // h={"100%"}
          // backdropFilter={"blur(2px)"}
          // background={"rgba(255, 255, 255, 0.85)"}
          >
            <Flex
              direction={"column"}
              gap={"4"}
              w={"100%"}
              h={"100%"}
              align={"center"}
              justify={"center"}
            >
              <Text fontWeight={"semibold"} color={"gray.600"}>
                Loading Workspace...
              </Text>
              <Spinner size={"lg"} color={"gray.600"} />
            </Flex>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Flex>
  );
};

export default WorkspaceSwitcher;
