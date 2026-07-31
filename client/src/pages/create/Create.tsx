// React
import React from "react";

// Existing and custom components
import { Button, Card, Flex, Heading, Separator, Stack, Tag, Text } from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Hooks
import { usePermissions } from "@hooks/usePermissions";

// Posthog
import { usePostHog } from "posthog-js/react";

// Variables
import { STYLES } from "@variables";

const Create = () => {
  const posthog = usePostHog();
  const navigate = useNavigate();

  // Permissions
  const { workspacePermissions } = usePermissions();

  return (
    <Content>
      <Flex direction={"column"} gap={"4"} p={"1"} h={"100%"} justify={"center"} align={"center"}>
        <Flex direction={"row"} gap={"1"} w={"100%"} justify={"center"} align={"center"}>
          <Icon name={"add"} size={"sm"} />
          <Heading size={"lg"}>Create</Heading>
        </Flex>
        <Text fontSize={"sm"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} textAlign={"center"}>
          Create a new Entity, Project, or Template in this Workspace.
        </Text>
        <Flex direction={"row"} gap={"2"} wrap={"wrap"} align={"center"} justify={"center"}>
          {/* Entity card */}
          <Card.Root
            maxW={"340px"}
            h={"380px"}
            variant={"outline"}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
          >
            <Card.Header>
              <Flex gap={"1"} w={"100%"} justify={"center"} align={"center"}>
                <Icon name={"entity"} size={"sm"} color={STYLES.entity.color.icon} />
                <Heading size={"md"}>Entity</Heading>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Stack separator={<Separator />} gap={"2"}>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Description
                  </Heading>
                  <Text fontSize={"sm"}>Create an Entity to store metadata of a physical or digital resource.</Text>
                </Flex>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Fields
                  </Heading>
                  <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                      Required:
                    </Text>
                    <Tag.Root colorPalette={"entity"}>
                      <Tag.Label>Name</Tag.Label>
                    </Tag.Root>
                    <Tag.Root colorPalette={"entity"}>
                      <Tag.Label>Created</Tag.Label>
                    </Tag.Root>
                  </Flex>

                  <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                      Optional:
                    </Text>
                    <Tag.Root>
                      <Tag.Label>Description</Tag.Label>
                    </Tag.Root>
                    <Tag.Root>
                      <Tag.Label>Projects</Tag.Label>
                    </Tag.Root>
                    <Tag.Root>
                      <Tag.Label>Relationships</Tag.Label>
                    </Tag.Root>
                    <Tag.Root>
                      <Tag.Label>Attributes</Tag.Label>
                    </Tag.Root>
                  </Flex>
                </Flex>
              </Stack>
            </Card.Body>
            <Card.Footer>
              <Flex w={"100%"} justify={"center"}>
                <Tooltip
                  content={"Insufficient permissions in this Workspace"}
                  disabled={workspacePermissions.entities.create}
                  showArrow
                >
                  <Button
                    id={"createEntityButton"}
                    rounded={"md"}
                    size={"xs"}
                    colorPalette={"green"}
                    disabled={!workspacePermissions.entities.create}
                    onClick={() => {
                      posthog.capture("client.create.entity_click");
                      navigate("/create/entity");
                    }}
                  >
                    Start
                    <Icon name={"a_right"} size={"xs"} />
                  </Button>
                </Tooltip>
              </Flex>
            </Card.Footer>
          </Card.Root>

          {/* Project card */}
          <Card.Root
            maxW={"340px"}
            h={"380px"}
            variant={"outline"}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
          >
            <Card.Header>
              <Flex gap={"1"} w={"100%"} justify={"center"} align={"center"}>
                <Icon name={"project"} size={"sm"} color={STYLES.project.color.icon} />
                <Heading size={"md"}>Project</Heading>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Stack separator={<Separator />} gap={"2"}>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Description
                  </Heading>
                  <Text fontSize={"sm"}>Create a Project to organize and share Entities.</Text>
                </Flex>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Fields
                  </Heading>
                  <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                      Required:
                    </Text>
                    <Tag.Root colorPalette={"project"}>
                      <Tag.Label>Name</Tag.Label>
                    </Tag.Root>
                    <Tag.Root colorPalette={"project"}>
                      <Tag.Label>Description</Tag.Label>
                    </Tag.Root>
                  </Flex>
                  <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                      Optional:
                    </Text>
                    <Tag.Root>
                      <Tag.Label>Entities</Tag.Label>
                    </Tag.Root>
                  </Flex>
                </Flex>
              </Stack>
            </Card.Body>
            <Card.Footer>
              <Flex w={"100%"} justify={"center"}>
                <Tooltip
                  content={"Insufficient permissions in this Workspace"}
                  disabled={workspacePermissions.projects.create}
                  showArrow
                >
                  <Button
                    id={"createProjectButton"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    disabled={!workspacePermissions.projects.create}
                    onClick={() => {
                      posthog.capture("client.create.project_click");
                      navigate("/create/project");
                    }}
                  >
                    Start
                    <Icon name={"a_right"} size={"xs"} />
                  </Button>
                </Tooltip>
              </Flex>
            </Card.Footer>
          </Card.Root>

          {/* Template card */}
          <Card.Root
            maxW={"340px"}
            h={"380px"}
            variant={"outline"}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
          >
            <Card.Header>
              <Flex gap={"1"} w={"100%"} justify={"center"} align={"center"}>
                <Icon name={"template"} size={"sm"} color={STYLES.template.color.icon} />
                <Heading size={"md"}>Template</Heading>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Stack separator={<Separator />} gap={"2"}>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Description
                  </Heading>
                  <Text fontSize={"sm"}>Create a Template to reuse metadata structures across Entities.</Text>
                </Flex>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Fields
                  </Heading>
                  <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                      Required:
                    </Text>
                    <Tag.Root colorPalette={"template"}>
                      <Tag.Label>Name</Tag.Label>
                    </Tag.Root>
                    <Tag.Root colorPalette={"template"}>
                      <Tag.Label>Description</Tag.Label>
                    </Tag.Root>
                    <Tag.Root colorPalette={"template"}>
                      <Tag.Label>Values</Tag.Label>
                    </Tag.Root>
                  </Flex>
                </Flex>
              </Stack>
            </Card.Body>
            <Card.Footer>
              <Flex w={"100%"} justify={"center"}>
                <Tooltip
                  content={"Insufficient permissions in this Workspace"}
                  disabled={workspacePermissions.projects.create}
                  showArrow
                >
                  <Button
                    id={"createTemplateButton"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    disabled={!workspacePermissions.templates.create}
                    onClick={() => {
                      posthog.capture("client.create.template_click");
                      navigate("/create/template");
                    }}
                  >
                    Start
                    <Icon name={"a_right"} size={"xs"} />
                  </Button>
                </Tooltip>
              </Flex>
            </Card.Footer>
          </Card.Root>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Create;
