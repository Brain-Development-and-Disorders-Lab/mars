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
import { gql } from "@apollo/client";
import { useLazyQuery, useQuery } from "@apollo/client/react";

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
  const [open, setOpen] = useState(false);

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
    // Don't fetch workspace if workspace is empty
    if (workspace === "" || _.isUndefined(workspace)) {
      setLabel("Select Workspace");
      return;
    }

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
      setOpen(false);
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
    setOpen(false);
  };

  /**
   * Handle click events within the `Create Workspace` button
   */
  const handleCreateClick = () => {
    // Open the create Workspace modal
    navigate("/create/workspace");

    // Ensure `WorkspaceSwitcher` is closed
    setOpen(false);
  };

  /**
   * Handle click events within the `Profile` button
   */
  const handleProfileClick = () => {
    navigate("/profile");
    setOpen(false);
  };

  return (
    <Flex id={props.id ? props.id : "workspaceSwitcher"} pos={"relative"}>
      <Menu.Root
        open={open}
        onEscapeKeyDown={() => setOpen(false)}
        onInteractOutside={() => setOpen(false)}
        size={"sm"}
      >
        <Menu.Trigger asChild>
          <Button
            h={"100%"}
            w={"100%"}
            p={"0"}
            size={"xs"}
            rounded={"md"}
            bg={"white"}
            variant={"surface"}
            onClick={() => setOpen(!open)}
          >
            <Flex
              direction={"row"}
              gap={"2"}
              align={"center"}
              p={"1"}
              w={"100%"}
            >
              <Icon name={"workspace"} size={"sm"} />
              <Text fontSize={"xs"} fontWeight={"semibold"} mt={"0.5"}>
                {_.truncate(label, { length: 18 })}
              </Text>
              <Spacer />
              <Icon name={"c_expand"} size={"sm"} />
            </Flex>
          </Button>
        </Menu.Trigger>

        <Menu.Positioner w={"100%"} rounded={"md"}>
          <Menu.Content bg={"white"}>
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
                        w={"100%"}
                        align={"center"}
                      >
                        <Tooltip content={accessible.name} showArrow>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            {_.truncate(accessible.name, { length: 24 })}
                          </Text>
                        </Tooltip>

                        <Spacer />

                        {workspace === accessible._id && (
                          <Flex gap={"1"} align={"center"}>
                            <Text color={"green.600"} fontWeight={"semibold"}>
                              Active
                            </Text>
                            <Icon name={"check"} color={"green.600"} />
                          </Flex>
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
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      No Workspaces
                    </Text>
                  </Flex>
                </Menu.Item>
              )}
            </Menu.ItemGroup>

            <Menu.Separator />

            <Menu.ItemGroup>
              {/* Option to create a new Workspace */}
              <Menu.Item
                value={"edit"}
                onClick={() => handleUpdateClick()}
                disabled={workspaces.length === 0}
              >
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Icon name={"edit"} size={"xs"} />
                  <Text fontSize={"xs"}>Edit workspace</Text>
                </Flex>
              </Menu.Item>
              <Menu.Item value={"create"} onClick={() => handleCreateClick()}>
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Icon name={"add"} size={"xs"} />
                  <Text fontSize={"xs"}>Create workspace</Text>
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
                  <Icon name={"person"} size={"xs"} />
                  <Text fontSize={"xs"}>Account settings</Text>
                </Flex>
              </Menu.Item>
              <Menu.Item value={"logout"} onClick={() => logout()}>
                <Flex
                  id={"accountLogoutItem"}
                  direction={"row"}
                  gap={"2"}
                  align={"center"}
                >
                  <Icon name={"logout"} size={"xs"} />
                  <Text fontSize={"xs"}>Log out</Text>
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
            w={"100%"}
            h={"100%"}
            backdropFilter={"blur(1px)"}
            background={"rgba(255, 255, 255, 0.9)"}
          >
            <Flex
              direction={"column"}
              gap={"4"}
              w={"100%"}
              h={"100%"}
              align={"center"}
              justify={"center"}
            >
              <Text fontWeight={"semibold"} color={"gray.700"}>
                Preparing Workspace...
              </Text>
              <Spinner size={"xl"} color={"gray.700"} />
            </Flex>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Flex>
  );
};

export default WorkspaceSwitcher;
