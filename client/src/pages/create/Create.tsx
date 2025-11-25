// React
import React from "react";

// Existing and custom components
import {
  Button,
  Card,
  Flex,
  Heading,
  Separator,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Posthog
import { usePostHog } from "posthog-js/react";

const Create = () => {
  const posthog = usePostHog();
  const navigate = useNavigate();

  return (
    <Content>
      <Flex
        direction={"column"}
        gap={"4"}
        p={"1"}
        h={"100%"}
        justify={"center"}
        align={"center"}
      >
        <Flex
          direction={"row"}
          gap={"1"}
          w={"100%"}
          justify={"center"}
          align={"center"}
        >
          <Icon name={"add"} size={"sm"} />
          <Heading size={"lg"}>Create</Heading>
        </Flex>
        <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.600"}>
          Create a new Entity, Template, or Project to continue building your
          metadata catalog.
        </Text>
        <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
          {/* Entity card */}
          <Card.Root
            maxW={"340px"}
            h={"340px"}
            variant={"outline"}
            border={"1px solid"}
            borderColor={"gray.300"}
          >
            <Card.Header>
              <Flex gap={"1"} w={"100%"} justify={"center"} align={"center"}>
                <Icon name={"entity"} size={"sm"} />
                <Heading size={"md"}>Entity</Heading>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Stack separator={<Separator />} gap={"1"}>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Description
                  </Heading>
                  <Text fontSize={"sm"}>
                    Create an Entity to store metadata of a physical or digital
                    resource.
                  </Text>
                </Flex>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Fields
                  </Heading>
                  <Flex align={"center"} wrap={"wrap"} gap={"1"}>
                    <Text
                      fontSize={"sm"}
                      fontWeight={"semibold"}
                      color={"gray.600"}
                    >
                      Required:
                    </Text>
                    <Tag.Root>
                      <Tag.Label>Name</Tag.Label>
                    </Tag.Root>
                    <Tag.Root>
                      <Tag.Label>Created</Tag.Label>
                    </Tag.Root>
                  </Flex>

                  <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                    <Text
                      fontSize={"sm"}
                      fontWeight={"semibold"}
                      color={"gray.600"}
                    >
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
                <Button
                  id={"createEntityButton"}
                  rounded={"md"}
                  size={"xs"}
                  colorPalette={"green"}
                  onClick={() => {
                    posthog.capture("create_entity_click");
                    navigate("/create/entity");
                  }}
                >
                  Start
                  <Icon name={"a_right"} size={"xs"} />
                </Button>
              </Flex>
            </Card.Footer>
          </Card.Root>

          {/* Template card */}
          <Card.Root
            maxW={"340px"}
            h={"340px"}
            variant={"outline"}
            border={"1px solid"}
            borderColor={"gray.300"}
          >
            <Card.Header>
              <Flex gap={"1"} w={"100%"} justify={"center"} align={"center"}>
                <Icon name={"template"} size={"sm"} />
                <Heading size={"md"}>Template</Heading>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Stack separator={<Separator />} gap={"1"}>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Description
                  </Heading>
                  <Text fontSize={"sm"}>
                    Create a Template to reuse metadata structures across
                    Entities.
                  </Text>
                </Flex>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Fields
                  </Heading>
                  <Flex align={"center"} wrap={"wrap"} gap={"1"}>
                    <Text
                      fontSize={"sm"}
                      fontWeight={"semibold"}
                      color={"gray.600"}
                    >
                      Required:
                    </Text>
                    <Tag.Root>
                      <Tag.Label>Name</Tag.Label>
                    </Tag.Root>
                    <Tag.Root>
                      <Tag.Label>Description</Tag.Label>
                    </Tag.Root>
                    <Tag.Root>
                      <Tag.Label>Values</Tag.Label>
                    </Tag.Root>
                  </Flex>
                </Flex>
              </Stack>
            </Card.Body>
            <Card.Footer>
              <Flex w={"100%"} justify={"center"}>
                <Button
                  id={"createTemplateButton"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  onClick={() => {
                    posthog.capture("create_template_click");
                    navigate("/create/template");
                  }}
                >
                  Start
                  <Icon name={"a_right"} size={"xs"} />
                </Button>
              </Flex>
            </Card.Footer>
          </Card.Root>

          {/* Project card */}
          <Card.Root
            maxW={"340px"}
            h={"340px"}
            variant={"outline"}
            border={"1px solid"}
            borderColor={"gray.300"}
          >
            <Card.Header>
              <Flex gap={"1"} w={"100%"} justify={"center"} align={"center"}>
                <Icon name={"project"} size={"sm"} />
                <Heading size={"md"}>Project</Heading>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Stack separator={<Separator />} gap={"1"}>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Description
                  </Heading>
                  <Text fontSize={"sm"}>
                    Create a Project to organize and share Entities.
                  </Text>
                </Flex>
                <Flex p={"1"} gap={"2"} direction={"column"}>
                  <Heading size={"xs"} textTransform={"uppercase"}>
                    Fields
                  </Heading>
                  <Flex align={"center"} wrap={"wrap"} gap={"1"}>
                    <Text
                      fontSize={"sm"}
                      fontWeight={"semibold"}
                      color={"gray.600"}
                    >
                      Required:
                    </Text>
                    <Tag.Root>
                      <Tag.Label>Name</Tag.Label>
                    </Tag.Root>
                    <Tag.Root>
                      <Tag.Label>Description</Tag.Label>
                    </Tag.Root>
                  </Flex>
                </Flex>
              </Stack>
            </Card.Body>
            <Card.Footer>
              <Flex w={"100%"} justify={"center"}>
                <Button
                  id={"createProjectButton"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  onClick={() => {
                    posthog.capture("create_project_click");
                    navigate("/create/project");
                  }}
                >
                  Start
                  <Icon name={"a_right"} size={"xs"} />
                </Button>
              </Flex>
            </Card.Footer>
          </Card.Root>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Create;
