// React
import React from "react";

// Existing and custom components
import { Button, CloseButton, Dialog, Flex, Heading, Separator, Stack, Tag, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Custom types
import { DialogCreateProps } from "@types";

// Hooks
import { usePermissions } from "@hooks/usePermissions";

// Posthog
import { usePostHog } from "posthog-js/react";

// Variables
import { STYLES } from "@variables";

// Information underlying each of the create cards and options
const CREATE_OPTIONS = [
  {
    type: "entity",
    permissionKey: "entities",
    label: "Entity",
    route: "/create/entity",
    event: "client.create.entity_click",
    description: "Create an Entity to store metadata of a physical or digital resource.",
    required: ["Name", "Created"],
    optional: ["Description", "Projects", "Relationships", "Attributes"],
  },
  {
    type: "project",
    permissionKey: "projects",
    label: "Project",
    route: "/create/project",
    event: "client.create.project_click",
    description: "Create a Project to organize and share Entities.",
    required: ["Name", "Description"],
    optional: ["Entities"],
  },
  {
    type: "template",
    permissionKey: "templates",
    label: "Template",
    route: "/create/template",
    event: "client.create.template_click",
    description: "Create a Template to reuse metadata structures across Entities.",
    required: ["Name", "Description", "Values"],
    optional: [],
  },
] as const;

const DialogCreate = (props: DialogCreateProps) => {
  const posthog = usePostHog();
  const navigate = useNavigate();

  // Permissions
  const { workspacePermissions } = usePermissions();

  return (
    <Dialog.Root
      open={props.open}
      onOpenChange={(details) => props.setOpen(details.open)}
      placement={"center"}
      size={"xl"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header
            p={"2"}
            fontWeight={"semibold"}
            fontSize={"sm"}
            roundedTop={"md"}
            bg={"entity.light"}
            color={"entity.dark"}
          >
            <Flex direction={"row"} align={"center"} gap={"1"} ml={"0.5"}>
              <Icon name={"add"} />
              <Text fontWeight={"semibold"} fontSize={"xs"}>
                Create
              </Text>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={() => props.setOpen(false)} colorPalette={"entity"} />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body>
            <Flex direction={"column"} gap={"4"} p={"1"}>
              <Flex direction={"row"} gap={"1"} w={"100%"} justify={"center"} align={"center"}>
                <Icon name={"add"} size={"sm"} />
                <Heading size={"lg"}>Create</Heading>
              </Flex>
              <Text
                fontSize={"sm"}
                fontWeight={"semibold"}
                color={STYLES.font.secondaryHeader.color}
                textAlign={"center"}
              >
                Create a new Entity, Project, or Template in this Workspace.
              </Text>

              <Flex direction={{ base: "column", md: "row" }} gap={"3"} align={"stretch"}>
                {CREATE_OPTIONS.map((option) => {
                  const colors = STYLES[option.type].color;
                  const canCreate = workspacePermissions[option.permissionKey].create;

                  return (
                    <Flex
                      key={option.type}
                      direction={"column"}
                      justify={"space-between"}
                      gap={"2"}
                      p={"3"}
                      flex={"1"}
                      minW={"0"}
                      border={STYLES.border.style}
                      borderColor={colors.border}
                      rounded={"md"}
                      transition={"border-color 0.15s ease, background-color 0.15s ease"}
                      _hover={{ borderColor: colors.default, bg: colors.light }}
                    >
                      <Flex direction={"column"} gap={"2"}>
                        <Flex gap={"1"} w={"100%"} justify={"center"} align={"center"}>
                          <Icon name={option.type} size={"sm"} color={colors.icon} />
                          <Heading size={"md"}>{option.label}</Heading>
                        </Flex>

                        <Stack separator={<Separator />} gap={"2"}>
                          <Flex p={"1"} gap={"2"} direction={"column"}>
                            <Heading size={"xs"} textTransform={"uppercase"}>
                              Description
                            </Heading>
                            <Text fontSize={"xs"}>{option.description}</Text>
                          </Flex>
                          <Flex p={"1"} gap={"2"} direction={"column"}>
                            <Heading size={"xs"} textTransform={"uppercase"}>
                              Fields
                            </Heading>
                            <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                              {option.required.map((field) => (
                                <Tag.Root key={field} colorPalette={option.type}>
                                  <Tag.Label>{field}</Tag.Label>
                                </Tag.Root>
                              ))}
                              {option.optional.map((field) => (
                                <Tag.Root key={field}>
                                  <Tag.Label>{field}</Tag.Label>
                                </Tag.Root>
                              ))}
                            </Flex>
                          </Flex>
                        </Stack>
                      </Flex>

                      <Flex w={"100%"} justify={"center"}>
                        <Tooltip content={"Insufficient permissions in this Workspace"} disabled={canCreate} showArrow>
                          <Button
                            id={`create${option.label}Button`}
                            rounded={"md"}
                            size={"xs"}
                            colorPalette={"green"}
                            disabled={!canCreate}
                            onClick={() => {
                              posthog.capture(option.event);
                              props.setOpen(false);
                              navigate(option.route);
                            }}
                          >
                            Start
                            <Icon name={"a_right"} size={"xs"} />
                          </Button>
                        </Tooltip>
                      </Flex>
                    </Flex>
                  );
                })}
              </Flex>
            </Flex>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default DialogCreate;
