// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, Dialog, Text, CloseButton, Switch } from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Existing and custom types
import { IResponseMessage, PermissionsDialogProps, UserGlobalPermissions } from "@types";

// Hooks
import { usePermissions } from "@hooks/usePermissions";

// GraphQL
import { gql } from "@apollo/client";

// Variables
import { GLOBAL_STYLES } from "@variables";
import { useLazyQuery, useMutation } from "@apollo/client/react";

const PermissionsDialog = (props: PermissionsDialogProps) => {
  const { globalPermissions, workspacePermissions } = usePermissions();

  // Global permissions state for current user
  const [applicationImport, setApplicationImport] = useState(globalPermissions.application.import);
  const [applicationScan, setApplicationScan] = useState(globalPermissions.application.scan);
  const [applicationAI, setApplicationAI] = useState(globalPermissions.application.ai);
  const [applicationAPI, setApplicationAPI] = useState(globalPermissions.application.api);
  const [workspaceCreate, setWorkspaceCreate] = useState(globalPermissions.workspaces.create);

  // If `isGlobal`, get the permissions of the User we are modifying
  const GET_USER_GLOBAL_PERMISSIONS = gql`
    query GetUserGlobalPermissions($_id: String) {
      userGlobalPermissions(_id: $_id) {
        application {
          import
          scan
          ai
          api
        }
        workspaces {
          create
        }
      }
    }
  `;

  const [getUserGlobalPermissions] = useLazyQuery<{ userGlobalPermissions: UserGlobalPermissions }>(
    GET_USER_GLOBAL_PERMISSIONS,
    {
      fetchPolicy: "network-only",
    },
  );

  const refreshUserGlobalPermissionsState = async (_id: string) => {
    const result = await getUserGlobalPermissions({
      variables: {
        _id: _id,
      },
    });

    if (result.data) {
      setApplicationImport(result.data.userGlobalPermissions.application.import);
      setApplicationScan(result.data.userGlobalPermissions.application.scan);
      setApplicationAI(result.data.userGlobalPermissions.application.ai);
      setApplicationAPI(result.data.userGlobalPermissions.application.api);
    } else {
      toaster.create({
        title: "Could not retrieve User permissions",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  useEffect(() => {
    if (props.isGlobal) {
      refreshUserGlobalPermissionsState(props.user);
    }
  }, [props.user]);

  // Mutation to update User
  const UPDATE_USER_GLOBAL_PERMISSIONS = gql`
    mutation UpdateUserGlobalPermissions($_id: String, $permissions: UserGlobalPermissionsInput) {
      updateUserGlobalPermissions(_id: $_id, permissions: $permissions) {
        success
        message
      }
    }
  `;
  const [
    updateUserGlobalPermissions,
    { loading: userUpdateGlobalPermissionsLoading, error: userUpdateGlobalPermissionsError },
  ] = useMutation<{
    updateUserGlobalPermissions: IResponseMessage;
  }>(UPDATE_USER_GLOBAL_PERMISSIONS);

  /**
   * Utility function to execute GraphQL manipulations updating the User permissions
   */
  const applyPermissions = async () => {
    if (props.isGlobal) {
      // Execute GraphQL mutation
      const result = await updateUserGlobalPermissions({
        fetchPolicy: "network-only",
        variables: {
          _id: props.user,
          permissions: {
            application: {
              import: applicationImport,
              scan: applicationScan,
              ai: applicationAI,
              api: applicationAPI,
            },
            workspaces: {
              create: workspaceCreate,
            },
          },
        },
      });

      if (userUpdateGlobalPermissionsError) {
        toaster.create({
          title: "Could not update User permissions",
          type: "error",
          duration: 2000,
          closable: true,
        });
      }

      if (result.data && result.data.updateUserGlobalPermissions.success) {
        toaster.create({
          title: "Updated User permissions",
          type: "success",
          duration: 2000,
          closable: true,
        });

        // Close the dialog
        props.setOpen(false);
      }
    }
  };

  return (
    <Dialog.Root
      open={props.open}
      scrollBehavior={"inside"}
      placement={"center"}
      onOpenChange={(event) => props.setOpen(event.open)}
      size={"lg"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxH={"90vh"} display={"flex"} flexDirection={"column"} p={"0"}>
          <Dialog.Header
            p={"1"}
            flexShrink={0}
            bg={GLOBAL_STYLES.dialog.header.bg}
            borderBottom={"2px"}
            roundedTop={"md"}
          >
            <Flex direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
              <Flex align={"center"} gap={"1"} p={"1"} border={"2px"} rounded={"md"}>
                <Icon name={"settings"} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Edit {props.isGlobal ? "Global" : "Workspace"} Permissions
                </Text>
              </Flex>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={() => props.setOpen(false)} />
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body p={"0"} flex={"1"} overflow={"auto"}>
            <Flex direction={"column"} p={"2"} gap={"2"}>
              <ActorTag identifier={props.user} fallback={"Unknown User"} size={"md"} />
              {props.isGlobal && (
                <Text fontSize={"xs"} ml={"0.5"}>
                  Permissions defined for this User will across all Workspaces.
                </Text>
              )}
              {!props.isGlobal && (
                <Text fontSize={"xs"} ml={"0.5"}>
                  Permissions defined for this User will only apply to this Workspace.
                </Text>
              )}

              {/* Global Permissions */}
              {props.isGlobal && (
                <Flex direction={"row"} gap={"2"}>
                  {/* Application Permissions */}
                  <Flex
                    direction={"column"}
                    p={"2"}
                    gap={"2"}
                    rounded={"md"}
                    border={GLOBAL_STYLES.border.style}
                    borderColor={GLOBAL_STYLES.border.color}
                    w={"50%"}
                    h={"fit-content"}
                  >
                    <Text
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      color={GLOBAL_STYLES.font.secondaryHeader.color}
                      ml={"0.5"}
                    >
                      Application Permissions
                    </Text>
                    <Switch.Root
                      checked={applicationImport}
                      onCheckedChange={(event) => setApplicationImport(event.checked)}
                      colorPalette={"green"}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Label>
                        <Flex direction={"row"} gap={"1"} align={"center"}>
                          <Icon name={"upload"} size={"xs"} />
                          <Text fontSize={"xs"}>Import: Enable import of external files</Text>
                        </Flex>
                      </Switch.Label>
                    </Switch.Root>
                    <Switch.Root
                      checked={applicationScan}
                      onCheckedChange={(event) => setApplicationScan(event.checked)}
                      colorPalette={"green"}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Label>
                        <Flex direction={"row"} gap={"1"} align={"center"}>
                          <Icon name={"scan"} size={"xs"} />
                          <Text fontSize={"xs"}>Scan: Enable physical label scanning</Text>
                        </Flex>
                      </Switch.Label>
                    </Switch.Root>
                    <Switch.Root
                      checked={applicationAI}
                      onCheckedChange={(event) => setApplicationAI(event.checked)}
                      colorPalette={"green"}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Label>
                        <Flex direction={"row"} gap={"1"} align={"center"}>
                          <Icon name={"lightning"} size={"xs"} />
                          <Text fontSize={"xs"}>AI: Enable AI-assisted features</Text>
                        </Flex>
                      </Switch.Label>
                    </Switch.Root>
                    <Switch.Root
                      checked={applicationAPI}
                      onCheckedChange={(event) => setApplicationAPI(event.checked)}
                      colorPalette={"green"}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Label>
                        <Flex direction={"row"} gap={"1"} align={"center"}>
                          <Icon name={"key"} size={"xs"} />
                          <Text fontSize={"xs"}>API: Use API functionality</Text>
                        </Flex>
                      </Switch.Label>
                    </Switch.Root>
                  </Flex>
                </Flex>
              )}

              {/* Workspace Permissions */}
              {!props.isGlobal && (
                <React.Fragment>
                  <Flex direction={"row"} gap={"2"}>
                    {/* Workspace Permissions */}
                    <Flex
                      direction={"column"}
                      p={"2"}
                      gap={"2"}
                      rounded={"md"}
                      border={GLOBAL_STYLES.border.style}
                      borderColor={GLOBAL_STYLES.border.color}
                      w={"50%"}
                      h={"fit-content"}
                    >
                      <Text
                        fontSize={"xs"}
                        fontWeight={"semibold"}
                        color={GLOBAL_STYLES.font.secondaryHeader.color}
                        ml={"0.5"}
                      >
                        Workspace Permissions
                      </Text>
                      <Switch.Root checked={workspacePermissions.workspaces.edit} colorPalette={"green"}>
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label fontSize={"xs"}>Edit Workspace</Switch.Label>
                      </Switch.Root>
                      <Switch.Root checked={workspacePermissions.workspaces.invite} colorPalette={"green"}>
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label fontSize={"xs"}>Invite Collaborators</Switch.Label>
                      </Switch.Root>
                    </Flex>
                  </Flex>

                  <Flex direction={"row"} gap={"2"}>
                    {/* Entities Permissions */}
                    <Flex
                      direction={"column"}
                      p={"2"}
                      gap={"2"}
                      rounded={"md"}
                      border={GLOBAL_STYLES.border.style}
                      borderColor={GLOBAL_STYLES.border.color}
                      w={"50%"}
                    >
                      <Text
                        fontSize={"xs"}
                        fontWeight={"semibold"}
                        color={GLOBAL_STYLES.font.secondaryHeader.color}
                        ml={"0.5"}
                      >
                        Entities
                      </Text>
                      {/* Create Entities */}
                      <Switch.Root checked={workspacePermissions.entities.create} colorPalette={"green"}>
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label fontSize={"xs"}>Create Entities</Switch.Label>
                      </Switch.Root>

                      {/* Edit Entities */}
                      <Switch.Root checked={workspacePermissions.entities.edit} colorPalette={"green"}>
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label fontSize={"xs"}>Edit Entities</Switch.Label>
                      </Switch.Root>

                      {/* Archive Entities */}
                      <Switch.Root checked={workspacePermissions.entities.archive} colorPalette={"green"}>
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label fontSize={"xs"}>Archive Entities</Switch.Label>
                      </Switch.Root>
                    </Flex>

                    {/* Projects Permissions */}
                    <Flex
                      direction={"column"}
                      p={"2"}
                      gap={"2"}
                      rounded={"md"}
                      border={GLOBAL_STYLES.border.style}
                      borderColor={GLOBAL_STYLES.border.color}
                      w={"50%"}
                    >
                      <Text
                        fontSize={"xs"}
                        fontWeight={"semibold"}
                        color={GLOBAL_STYLES.font.secondaryHeader.color}
                        ml={"0.5"}
                      >
                        Projects
                      </Text>
                      {/* Create Entities */}
                      <Switch.Root checked={workspacePermissions.projects.create} colorPalette={"green"}>
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label fontSize={"xs"}>Create Projects</Switch.Label>
                      </Switch.Root>

                      {/* Edit Projects */}
                      <Switch.Root checked={workspacePermissions.projects.edit} colorPalette={"green"}>
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label fontSize={"xs"}>Edit Projects</Switch.Label>
                      </Switch.Root>

                      {/* Archive Projects */}
                      <Switch.Root checked={workspacePermissions.projects.archive} colorPalette={"green"}>
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label fontSize={"xs"}>Archive Projects</Switch.Label>
                      </Switch.Root>
                    </Flex>
                  </Flex>
                </React.Fragment>
              )}
            </Flex>
          </Dialog.Body>

          <Dialog.Footer
            p={"1"}
            flexShrink={0}
            bg={"gray.100"}
            roundedBottom={"md"}
            borderTop={"1px"}
            borderColor={"gray.200"}
          >
            <Flex direction={"row"} justify={"space-between"} gap={"4"} w={"100%"}>
              <Button
                colorPalette={"red"}
                size={"xs"}
                rounded={"md"}
                variant={"solid"}
                onClick={() => {
                  // Close the dialog
                  props.setOpen(false);
                }}
              >
                Cancel
                <Icon name={"cross"} size={"xs"} />
              </Button>

              <Button
                colorPalette={"green"}
                size={"xs"}
                rounded={"md"}
                loading={userUpdateGlobalPermissionsLoading}
                onClick={() => {
                  // Apply updated permissions
                  applyPermissions();
                }}
              >
                Done
                <Icon name={"check"} size={"xs"} />
              </Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default PermissionsDialog;
