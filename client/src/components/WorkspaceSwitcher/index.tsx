import React, { useEffect, useState } from "react";
import { Button, Dialog, Flex, Menu, ScrollArea, Spacer, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Navigation
import { useNavigate } from "react-router-dom";

// Custom types
import { IGenericItem } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { ignoreAbort } from "@lib/util";

// Hooks
import { usePermissions } from "@hooks/usePermissions";
import { useWorkspace } from "@hooks/useWorkspace";

// Authentication
import { auth } from "@lib/auth";

// Analytics
import { usePostHog } from "posthog-js/react";

const WorkspaceSwitcher = (props: { id?: string }) => {
  const navigate = useNavigate();
  const posthog = usePostHog();

  // Permissions
  const { globalPermissions } = usePermissions();

  // Dialog state for transition overlay
  const { open: transitionOpen, onOpen: onTransitionOpen, onClose: onTransitionClose } = useDisclosure();

  // Get contexts
  const { workspace, workspaces, activateWorkspace, refreshWorkspaces } = useWorkspace();

  // Switcher drop-down visibility state
  const [open, setOpen] = useState(false);

  // Switcher loading state
  const [isLoading, setIsLoading] = useState(false);

  // Derived label from workspaces list
  const label = workspaces.find((w) => w._id === workspace)?.name ?? "Select Workspace";

  // Present the transition overlay when loading
  useEffect(() => {
    if (isLoading) {
      onTransitionOpen();
    } else {
      onTransitionClose();
    }
  }, [isLoading]);

  // Refresh the Workspace list whenever the dropdown opens, to reflect recent changes
  useEffect(() => {
    if (open) {
      refreshWorkspaces().catch(ignoreAbort);
    }
  }, [open]);

  // Admin visibility
  const { data: session } = auth.useSession();
  const isAdmin = session?.user?.role === "admin";

  /**
   * Handle selecting a Workspace from the drop-down
   * @param selectedWorkspace Identifier and name of selected Workspace
   */
  const handleWorkspaceClick = async (selectedWorkspace: IGenericItem) => {
    if (workspace !== selectedWorkspace._id) {
      // Present the transition overlay and activate the selected Workspace
      setIsLoading(true);
      await activateWorkspace(selectedWorkspace._id).catch(ignoreAbort);

      // Close the transition overlay
      setOpen(false);
      setIsLoading(false);
    }

    // Navigate to the Dashboard
    navigate("/");
    setOpen(false);
  };

  /**
   * Handle click events within the `Update Workspace` button
   */
  const handleUpdateClick = () => {
    // Open the update Workspace dialog
    navigate(`/workspaces/${workspace}`);

    // Ensure `WorkspaceSwitcher` is closed
    setOpen(false);
  };

  /**
   * Handle click events within the `Create Workspace` button
   */
  const handleCreateClick = () => {
    if (globalPermissions.workspaces.create) {
      // Open the create Workspace dialog
      navigate("/create/workspace");

      // Ensure `WorkspaceSwitcher` is closed
      setOpen(false);
    }
  };

  /**
   * Handle click events within the `Profile` button
   */
  const handleProfileClick = () => {
    navigate("/profile");
    setOpen(false);
  };

  /**
   * Handle click events within the `Admin` button
   */
  const handleAdminClick = () => {
    navigate("/admin");
    setOpen(false);
  };

  /**
   * Handle click events within the `Logout` button
   */
  const handleLogoutClick = async () => {
    posthog.capture("client.auth.logout");
    posthog.reset();
    await auth.signOut();
    navigate("/login");
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
            bg={"transparent"}
            color={"nav.text"}
            border={"1px solid"}
            borderColor={"nav.textMuted"}
            _hover={{ bg: "nav.hoverBg" }}
            onClick={() => setOpen(!open)}
          >
            <Flex direction={"row"} gap={"1"} align={"center"} p={"1"} w={"100%"} ml={"0.5"}>
              <Icon name={"workspace"} size={"xs"} color={"nav.text"} />
              <Text fontSize={"xs"} fontWeight={"semibold"} mt={"0.5"}>
                {_.truncate(label, { length: 22 })}
              </Text>
              <Spacer />
              <Flex mr={"1"}>
                <Icon name={open ? "c_up" : "c_down"} size={"xs"} color={"nav.text"} />
              </Flex>
            </Flex>
          </Button>
        </Menu.Trigger>

        <Menu.Positioner w={"100%"} rounded={"md"}>
          <Menu.Content bg={"white"}>
            <Menu.ItemGroup>
              <Menu.ItemGroupLabel p={"0"}>
                <Flex direction={"row"} gap={"1"} p={"1"} align={"center"}>
                  <Icon name={"workspace"} size={"xs"} color={"gray.700"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                    Available Workspaces ({workspaces.length})
                  </Text>
                </Flex>
              </Menu.ItemGroupLabel>

              {/* Create a list of all Workspaces the user has access to */}
              {workspaces.length === 0 ? (
                <Menu.Item value={"no-workspaces"} disabled>
                  <Flex direction={"row"} gap={"2"} align={"center"} justify={"space-between"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      No Workspaces
                    </Text>
                  </Flex>
                </Menu.Item>
              ) : (
                <ScrollArea.Root maxH={"100px"}>
                  <ScrollArea.Viewport>
                    <ScrollArea.Content>
                      {workspaces.map((accessible) => {
                        return (
                          <Menu.Item
                            value={accessible.name}
                            onClick={() => {
                              if (workspace !== accessible._id) {
                                handleWorkspaceClick(accessible);
                              }
                            }}
                            key={"w_" + accessible._id}
                            cursor={workspace !== accessible._id ? "pointer" : undefined}
                          >
                            <Flex direction={"row"} gap={"2"} w={"100%"} align={"center"}>
                              <Tooltip
                                content={`${workspace === accessible._id ? "Active: " : "Switch to: "} ${accessible.name}`}
                                showArrow
                              >
                                <Text fontSize={"xs"}>{_.truncate(accessible.name, { length: 24 })}</Text>
                              </Tooltip>

                              <Spacer />

                              {workspace === accessible._id && (
                                <Flex gap={"1"} align={"center"}>
                                  <Icon name={"check"} color={"green"} />
                                </Flex>
                              )}
                            </Flex>
                          </Menu.Item>
                        );
                      })}
                    </ScrollArea.Content>
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar>
                    <ScrollArea.Thumb />
                  </ScrollArea.Scrollbar>
                </ScrollArea.Root>
              )}
            </Menu.ItemGroup>

            <Menu.Separator />

            <Menu.ItemGroup>
              {/* Option to create a new Workspace */}
              <Menu.Item
                value={"edit"}
                onClick={handleUpdateClick}
                disabled={workspaces.length === 0}
                cursor={"pointer"}
              >
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Icon name={"edit"} size={"xs"} />
                  <Text fontSize={"xs"}>Manage Workspace</Text>
                </Flex>
              </Menu.Item>
              <Tooltip
                content={"You do not have permission to create Workspaces"}
                disabled={globalPermissions.workspaces.create}
                showArrow
              >
                <Menu.Item
                  value={"create"}
                  onClick={handleCreateClick}
                  cursor={globalPermissions.workspaces.create ? "pointer" : "disabled"}
                  disabled={!globalPermissions.workspaces.create}
                >
                  <Flex direction={"row"} gap={"2"} align={"center"}>
                    <Icon name={"add"} size={"xs"} />
                    <Text fontSize={"xs"}>Create Workspace</Text>
                  </Flex>
                </Menu.Item>
              </Tooltip>
            </Menu.ItemGroup>

            <Menu.Separator />

            <Menu.ItemGroup>
              <Menu.Item value={"account"} onClick={handleProfileClick} cursor={"pointer"}>
                <Flex id={"accountSettingsItem"} direction={"row"} gap={"2"} align={"center"}>
                  <Icon name={"person"} size={"xs"} />
                  <Text fontSize={"xs"}>Manage Account</Text>
                </Flex>
              </Menu.Item>
              {isAdmin && (
                <Menu.Item
                  id={"navAdminButtonMobile"}
                  value={"admin"}
                  fontSize={"xs"}
                  onClick={handleAdminClick}
                  cursor={"pointer"}
                >
                  <Flex id={"accountSettingsItem"} direction={"row"} gap={"2"} align={"center"}>
                    <Icon name={"settings"} size={"xs"} />
                    <Text fontSize={"xs"}>Administration Tools</Text>
                  </Flex>
                </Menu.Item>
              )}
              <Menu.Item value={"logout"} onClick={() => handleLogoutClick()} cursor={"pointer"}>
                <Flex id={"accountLogoutItem"} direction={"row"} gap={"2"} align={"center"}>
                  <Icon name={"logout"} size={"xs"} />
                  <Text fontSize={"xs"}>Log Out</Text>
                </Flex>
              </Menu.Item>
            </Menu.ItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>

      <Dialog.Root open={transitionOpen} size={"full"} onExitComplete={onTransitionClose} motionPreset={"none"}>
        <Dialog.Trigger />
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content w={"100%"} h={"100%"} backdropFilter={"blur(1px)"} background={"rgba(255, 255, 255, 0.9)"}>
            <Flex direction={"column"} gap={"4"} w={"100%"} h={"100%"} align={"center"} justify={"center"}>
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
