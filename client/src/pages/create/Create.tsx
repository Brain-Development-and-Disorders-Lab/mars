// React
import React from "react";

// Existing and custom components
import {
  Button,
  Card,
  Flex,
  Heading,
  Stack,
  StackDivider,
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
        direction={"row"}
        h={"100%"}
        align={"center"}
        justify={"center"}
        gap={"2"}
        p={"2"}
        wrap={"wrap"}
      >
        {/* Entity card */}
        <Card.Root
          maxW={"sm"}
          h={"md"}
          variant={"outline"}
          border={"1px"}
          borderColor={"gray.300"}
        >
          <Card.Header>
            <Flex gap={"2"} w={"100%"} justify={"center"} align={"center"}>
              <Icon name={"entity"} size={"md"} />
              <Heading size={"md"}>Entity</Heading>
            </Flex>
          </Card.Header>
          <Card.Body>
            <Stack separator={<StackDivider />} gap={"2"}>
              <Flex p={"2"} gap={"4"} direction={"column"}>
                <Heading size={"xs"} textTransform={"uppercase"}>
                  Description
                </Heading>
                <Text fontSize={"sm"}>
                  Create an Entity to store metadata of a physical or digital
                  resource.
                </Text>
              </Flex>
              <Flex p={"2"} gap={"4"} direction={"column"}>
                <Heading size={"xs"} textTransform={"uppercase"}>
                  Fields
                </Heading>
                <Flex align={"center"} wrap={"wrap"} gap={"2"}>
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
                    <Tag.Label>Origins</Tag.Label>
                  </Tag.Root>
                  <Tag.Root>
                    <Tag.Label>Products</Tag.Label>
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
                size={"sm"}
                colorPalette={"green"}
                onClick={() => {
                  posthog.capture("create_entity_click");
                  navigate("/create/entity");
                }}
              >
                Create
                <Icon name={"add"} />
              </Button>
            </Flex>
          </Card.Footer>
        </Card.Root>

        {/* Template card */}
        <Card.Root
          maxW={"sm"}
          h={"md"}
          variant={"outline"}
          border={"1px"}
          borderColor={"gray.300"}
        >
          <Card.Header>
            <Flex gap={"4"} w={"100%"} justify={"center"} align={"center"}>
              <Icon name={"template"} size={"md"} />
              <Heading size={"md"}>Template</Heading>
            </Flex>
          </Card.Header>
          <Card.Body>
            <Stack separator={<StackDivider />} gap={"2"}>
              <Flex p={"2"} gap={"4"} direction={"column"}>
                <Heading size={"xs"} textTransform={"uppercase"}>
                  Description
                </Heading>
                <Text fontSize={"sm"}>
                  Create a Template to reuse metadata structures across
                  Entities.
                </Text>
              </Flex>
              <Flex p={"2"} gap={"4"} direction={"column"}>
                <Heading size={"xs"} textTransform={"uppercase"}>
                  Fields
                </Heading>
                <Flex align={"center"} wrap={"wrap"} gap={"2"}>
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
                size={"sm"}
                colorPalette={"green"}
                onClick={() => {
                  posthog.capture("create_template_click");
                  navigate("/create/template");
                }}
              >
                Create
                <Icon name={"add"} />
              </Button>
            </Flex>
          </Card.Footer>
        </Card.Root>

        {/* Project card */}
        <Card.Root
          maxW={"sm"}
          h={"md"}
          variant={"outline"}
          border={"1px"}
          borderColor={"gray.300"}
        >
          <Card.Header>
            <Flex gap={"2"} w={"100%"} justify={"center"} align={"center"}>
              <Icon name={"project"} size={"md"} />
              <Heading size={"md"}>Project</Heading>
            </Flex>
          </Card.Header>
          <Card.Body>
            <Stack separator={<StackDivider />} gap={"2"}>
              <Flex p={"2"} gap={"4"} direction={"column"}>
                <Heading size={"xs"} textTransform={"uppercase"}>
                  Description
                </Heading>
                <Text fontSize={"sm"}>
                  Create a Project to organize and share Entities.
                </Text>
              </Flex>
              <Flex p={"2"} gap={"4"} direction={"column"}>
                <Heading size={"xs"} textTransform={"uppercase"}>
                  Fields
                </Heading>
                <Flex align={"center"} wrap={"wrap"} gap={"2"}>
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
                size={"sm"}
                colorPalette={"green"}
                onClick={() => {
                  posthog.capture("create_project_click");
                  navigate("/create/project");
                }}
              >
                Create
                <Icon name={"add"} />
              </Button>
            </Flex>
          </Card.Footer>
        </Card.Root>
      </Flex>
    </Content>
  );
};

export default Create;
