// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, Dialog, Text, CloseButton, Switch } from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Existing and custom types
import { IResponseMessage, PermissionsDialogProps, UserGlobalPermissions, UserWorkspacePermissions } from "@types";

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
  const [featuresImport, setFeaturesImport] = useState(globalPermissions.features.import);
  const [featuresScan, setFeaturesScan] = useState(globalPermissions.features.scan);
  const [featuresAI, setFeaturesAI] = useState(globalPermissions.features.ai);
  const [featuresAPI, setFeaturesAPI] = useState(globalPermissions.features.api);
  const [workspaceCreate, setWorkspaceCreate] = useState(globalPermissions.workspaces.create);

  // Workspace-specific permissions for the specified user
  const [workspaceEdit, setWorkspaceEdit] = useState(workspacePermissions.administration.edit);
  const [workspaceInvite, setWorkspaceInvite] = useState(workspacePermissions.administration.invite);
  const [entitiesCreate, setEntitiesCreate] = useState(workspacePermissions.entities.create);
  const [entitiesEdit, setEntitiesEdit] = useState(workspacePermissions.entities.edit);
  const [entitiesArchive, setEntitiesArchive] = useState(workspacePermissions.entities.archive);
  const [projectsCreate, setProjectsCreate] = useState(workspacePermissions.projects.create);
  const [projectsEdit, setProjectsEdit] = useState(workspacePermissions.projects.edit);
  const [projectsArchive, setProjectsArchive] = useState(workspacePermissions.projects.archive);
  const [templatesCreate, setTemplatesCreate] = useState(workspacePermissions.templates.create);
  const [templatesEdit, setTemplatesEdit] = useState(workspacePermissions.templates.edit);
  const [templatesArchive, setTemplatesArchive] = useState(workspacePermissions.templates.archive);

  // If `isGlobal`, get the permissions of the User we are modifying
  const GET_USER_GLOBAL_PERMISSIONS = gql`
    query GetUserGlobalPermissions($_id: String) {
      userGlobalPermissions(_id: $_id) {
        features {
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
      setFeaturesImport(result.data.userGlobalPermissions.features.import);
      setFeaturesScan(result.data.userGlobalPermissions.features.scan);
      setFeaturesAI(result.data.userGlobalPermissions.features.ai);
      setFeaturesAPI(result.data.userGlobalPermissions.features.api);
    } else {
      toaster.create({
        title: "Could not retrieve User permissions",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  // If `isGlobal` is `false`, get the Workspace permissions of the User we are modifying
  const GET_USER_WORKSPACE_PERMISSIONS = gql`
    query GetUserWorkspacePermissions($_id: String, $workspace: String) {
      userWorkspacePermissions(_id: $_id, workspace: $workspace) {
        administration {
          edit
          invite
        }
        entities {
          create
          edit
          archive
        }
        projects {
          create
          edit
          archive
        }
        templates {
          create
          edit
          archive
        }
      }
    }
  `;

  const [getUserWorkspacePermissions] = useLazyQuery<{ userWorkspacePermissions: UserWorkspacePermissions }>(
    GET_USER_WORKSPACE_PERMISSIONS,
    {
      fetchPolicy: "network-only",
    },
  );

  const refreshUserWorkspacePermissionsState = async (_id: string) => {
    const result = await getUserWorkspacePermissions({
      variables: {
        _id: _id,
        // Workspace ID passed through request `Context`
      },
    });

    if (result.data) {
      setWorkspaceEdit(result.data.userWorkspacePermissions.administration.edit);
      setWorkspaceInvite(result.data.userWorkspacePermissions.administration.invite);
      setEntitiesCreate(result.data.userWorkspacePermissions.entities.create);
      setEntitiesEdit(result.data.userWorkspacePermissions.entities.edit);
      setEntitiesArchive(result.data.userWorkspacePermissions.entities.archive);
      setProjectsCreate(result.data.userWorkspacePermissions.projects.create);
      setProjectsEdit(result.data.userWorkspacePermissions.projects.edit);
      setProjectsArchive(result.data.userWorkspacePermissions.projects.archive);
      setTemplatesCreate(result.data.userWorkspacePermissions.templates.create);
      setTemplatesEdit(result.data.userWorkspacePermissions.templates.edit);
      setTemplatesArchive(result.data.userWorkspacePermissions.templates.archive);
    } else {
      toaster.create({
        title: "Could not retrieve User Workspace permissions",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  useEffect(() => {
    if (props.isGlobal) {
      refreshUserGlobalPermissionsState(props.user);
    } else {
      refreshUserWorkspacePermissionsState(props.user);
    }
  }, [props.user]);

  // Mutation to update User global permissions
  const SET_USER_GLOBAL_PERMISSIONS = gql`
    mutation UpdateSetGlobalPermissions($_id: String, $permissions: UserGlobalPermissionsInput) {
      setUserGlobalPermissions(_id: $_id, permissions: $permissions) {
        success
        message
      }
    }
  `;
  const [setUserGlobalPermissions, { loading: userSetGlobalPermissionsLoading, error: userSetGlobalPermissionsError }] =
    useMutation<{
      setUserGlobalPermissions: IResponseMessage;
    }>(SET_USER_GLOBAL_PERMISSIONS);

  // Mutation to update User Workspace permissions
  const SET_USER_WORKSPACE_PERMISSIONS = gql`
    mutation SetUserWorkspacePermissions(
      $_id: String
      $workspace: String
      $permissions: UserWorkspacePermissionsInput
    ) {
      setUserWorkspacePermissions(_id: $_id, workspace: $workspace, permissions: $permissions) {
        success
        message
      }
    }
  `;
  const [
    setUserWorkspacePermissions,
    { loading: userSetWorkspacePermissionsLoading, error: userSetWorkspacePermissionsError },
  ] = useMutation<{
    setUserWorkspacePermissions: IResponseMessage;
  }>(SET_USER_WORKSPACE_PERMISSIONS);

  /**
   * Utility function to execute GraphQL manipulations updating the User permissions
   */
  const applyPermissions = async () => {
    if (props.isGlobal) {
      // Execute GraphQL mutation
      const result = await setUserGlobalPermissions({
        fetchPolicy: "network-only",
        variables: {
          _id: props.user,
          permissions: {
            features: {
              import: featuresImport,
              scan: featuresScan,
              ai: featuresAI,
              api: featuresAPI,
            },
            workspaces: {
              create: workspaceCreate,
            },
          },
        },
      });

      if (userSetGlobalPermissionsError) {
        toaster.create({
          title: "Could not update User permissions",
          type: "error",
          duration: 2000,
          closable: true,
        });
      }

      if (result.data && result.data.setUserGlobalPermissions.success) {
        toaster.create({
          title: "Updated User permissions",
          type: "success",
          duration: 2000,
          closable: true,
        });

        // Close the dialog
        props.setOpen(false);
      }
    } else {
      // Execute GraphQL mutation
      const result = await setUserWorkspacePermissions({
        fetchPolicy: "network-only",
        variables: {
          _id: props.user,
          permissions: {
            administration: {
              edit: workspaceEdit,
              invite: workspaceInvite,
            },
            entities: {
              create: entitiesCreate,
              edit: entitiesEdit,
              archive: entitiesArchive,
            },
            projects: {
              create: projectsCreate,
              edit: projectsEdit,
              archive: projectsArchive,
            },
            templates: {
              create: templatesCreate,
              edit: templatesEdit,
              archive: templatesArchive,
            },
          },
        },
      });

      if (userSetWorkspacePermissionsError) {
        toaster.create({
          title: "Could not update User Workspace permissions",
          type: "error",
          duration: 2000,
          closable: true,
        });
      }

      if (result.data && result.data.setUserWorkspacePermissions.success) {
        toaster.create({
          title: "Updated User Workspace permissions",
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
                      checked={featuresImport}
                      onCheckedChange={(event) => setFeaturesImport(event.checked)}
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
                      checked={featuresScan}
                      onCheckedChange={(event) => setFeaturesScan(event.checked)}
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
                      checked={featuresAI}
                      onCheckedChange={(event) => setFeaturesAI(event.checked)}
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
                      checked={featuresAPI}
                      onCheckedChange={(event) => setFeaturesAPI(event.checked)}
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
                      <Switch.Root
                        checked={workspaceEdit}
                        onCheckedChange={(event) => setWorkspaceEdit(event.checked)}
                        colorPalette={"green"}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={"edit"} size={"xs"} />
                            <Text fontSize={"xs"}>Edit Workspace Details</Text>
                          </Flex>
                        </Switch.Label>
                      </Switch.Root>
                      <Switch.Root
                        checked={workspaceInvite}
                        onCheckedChange={(event) => setWorkspaceInvite(event.checked)}
                        colorPalette={"green"}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={"person"} size={"xs"} />
                            <Text fontSize={"xs"}>Invite Collaborators</Text>
                          </Flex>
                        </Switch.Label>
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
                      <Switch.Root
                        checked={entitiesCreate}
                        onCheckedChange={(event) => setEntitiesCreate(event.checked)}
                        colorPalette={"green"}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={"add"} size={"xs"} />
                            <Text fontSize={"xs"}>Create Entities</Text>
                          </Flex>
                        </Switch.Label>
                      </Switch.Root>

                      {/* Edit Entities */}
                      <Switch.Root
                        checked={entitiesEdit}
                        onCheckedChange={(event) => setEntitiesEdit(event.checked)}
                        colorPalette={"green"}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={"edit"} size={"xs"} />
                            <Text fontSize={"xs"}>Edit Entities</Text>
                          </Flex>
                        </Switch.Label>
                      </Switch.Root>

                      {/* Archive Entities */}
                      <Switch.Root
                        checked={entitiesArchive}
                        onCheckedChange={(event) => setEntitiesArchive(event.checked)}
                        colorPalette={"green"}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={"archive"} size={"xs"} />
                            <Text fontSize={"xs"}>Archive Entities</Text>
                          </Flex>
                        </Switch.Label>
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
                      {/* Create Projects */}
                      <Switch.Root
                        checked={projectsCreate}
                        onCheckedChange={(event) => setProjectsCreate(event.checked)}
                        colorPalette={"green"}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={"add"} size={"xs"} />
                            <Text fontSize={"xs"}>Create Projects</Text>
                          </Flex>
                        </Switch.Label>
                      </Switch.Root>

                      {/* Edit Projects */}
                      <Switch.Root
                        checked={projectsEdit}
                        onCheckedChange={(event) => setProjectsEdit(event.checked)}
                        colorPalette={"green"}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={"edit"} size={"xs"} />
                            <Text fontSize={"xs"}>Edit Projects</Text>
                          </Flex>
                        </Switch.Label>
                      </Switch.Root>

                      {/* Archive Projects */}
                      <Switch.Root
                        checked={projectsArchive}
                        onCheckedChange={(event) => setProjectsArchive(event.checked)}
                        colorPalette={"green"}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={"archive"} size={"xs"} />
                            <Text fontSize={"xs"}>Archive Projects</Text>
                          </Flex>
                        </Switch.Label>
                      </Switch.Root>
                    </Flex>

                    {/* Templates Permissions */}
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
                        Templates
                      </Text>
                      {/* Create Templates */}
                      <Switch.Root
                        checked={templatesCreate}
                        onCheckedChange={(event) => setTemplatesCreate(event.checked)}
                        colorPalette={"green"}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={"add"} size={"xs"} />
                            <Text fontSize={"xs"}>Create Templates</Text>
                          </Flex>
                        </Switch.Label>
                      </Switch.Root>

                      {/* Edit Templates */}
                      <Switch.Root
                        checked={templatesEdit}
                        onCheckedChange={(event) => setTemplatesEdit(event.checked)}
                        colorPalette={"green"}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={"edit"} size={"xs"} />
                            <Text fontSize={"xs"}>Edit Templates</Text>
                          </Flex>
                        </Switch.Label>
                      </Switch.Root>

                      {/* Archive Templates */}
                      <Switch.Root
                        checked={templatesArchive}
                        onCheckedChange={(event) => setTemplatesArchive(event.checked)}
                        colorPalette={"green"}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={"archive"} size={"xs"} />
                            <Text fontSize={"xs"}>Archive Templates</Text>
                          </Flex>
                        </Switch.Label>
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
                loading={userSetGlobalPermissionsLoading || userSetWorkspacePermissionsLoading}
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
