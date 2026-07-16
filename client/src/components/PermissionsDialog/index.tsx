// React
import React from "react";

// Existing and custom components
import { Button, Flex, Dialog, Text, CloseButton, Switch } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Existing and custom types
import { PermissionsDialogProps } from "@types";

// Utility functions and libraries
// import _ from "lodash";

// Hooks
import { usePermissions } from "@hooks/usePermissions";

// Variables
import { GLOBAL_STYLES } from "@variables";

const PermissionsDialog = (props: PermissionsDialogProps) => {
  const { workspacePermissions } = usePermissions();

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
                  Edit Collaborator Permissions: {props.user}
                </Text>
              </Flex>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={() => props.setOpen(false)} />
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body p={"0"} flex={"1"} overflow={"auto"}>
            <Flex direction={"column"} p={"2"} gap={"2"}>
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
                onClick={() => {
                  // Close the dialog
                  props.setOpen(false);
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
