// React
import React from "react";

// Existing and custom components
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
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
        <Card
          maxW={"sm"}
          h={"md"}
          variant={"outline"}
          border={"1px"}
          borderColor={"gray.300"}
        >
          <CardHeader>
            <Flex gap={"2"} w={"100%"} justify={"center"} align={"center"}>
              <Icon name={"entity"} size={"md"} />
              <Heading size={"md"}>Entity</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing={"2"}>
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
                  <Tag>Name</Tag>
                  <Tag>Created</Tag>
                </Flex>

                <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                  <Text
                    fontSize={"sm"}
                    fontWeight={"semibold"}
                    color={"gray.600"}
                  >
                    Optional:
                  </Text>
                  <Tag>Description</Tag>
                  <Tag>Projects</Tag>
                  <Tag>Origins</Tag>
                  <Tag>Products</Tag>
                  <Tag>Attributes</Tag>
                </Flex>
              </Flex>
            </Stack>
          </CardBody>
          <CardFooter>
            <Flex w={"100%"} justify={"center"}>
              <Button
                id={"createEntityButton"}
                size={"sm"}
                colorScheme={"green"}
                rightIcon={<Icon name={"add"} />}
                onClick={() => {
                  posthog.capture("create_entity_click");
                  navigate("/create/entity");
                }}
              >
                Create
              </Button>
            </Flex>
          </CardFooter>
        </Card>

        {/* Template card */}
        <Card
          maxW={"sm"}
          h={"md"}
          variant={"outline"}
          border={"1px"}
          borderColor={"gray.300"}
        >
          <CardHeader>
            <Flex gap={"4"} w={"100%"} justify={"center"} align={"center"}>
              <Icon name={"template"} size={"md"} />
              <Heading size={"md"}>Template</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing={"2"}>
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
                  <Tag>Name</Tag>
                  <Tag>Description</Tag>
                  <Tag>Values</Tag>
                </Flex>
              </Flex>
            </Stack>
          </CardBody>
          <CardFooter>
            <Flex w={"100%"} justify={"center"}>
              <Button
                id={"createTemplateButton"}
                size={"sm"}
                colorScheme={"green"}
                rightIcon={<Icon name={"add"} />}
                onClick={() => {
                  posthog.capture("create_template_click");
                  navigate("/create/template");
                }}
              >
                Create
              </Button>
            </Flex>
          </CardFooter>
        </Card>

        {/* Project card */}
        <Card
          maxW={"sm"}
          h={"md"}
          variant={"outline"}
          border={"1px"}
          borderColor={"gray.300"}
        >
          <CardHeader>
            <Flex gap={"2"} w={"100%"} justify={"center"} align={"center"}>
              <Icon name={"project"} size={"md"} />
              <Heading size={"md"}>Project</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing={"2"}>
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
                  <Tag>Name</Tag>
                  <Tag>Description</Tag>
                </Flex>
              </Flex>
            </Stack>
          </CardBody>
          <CardFooter>
            <Flex w={"100%"} justify={"center"}>
              <Button
                id={"createProjectButton"}
                size={"sm"}
                colorScheme={"green"}
                rightIcon={<Icon name={"add"} />}
                onClick={() => {
                  posthog.capture("create_project_click");
                  navigate("/create/project");
                }}
              >
                Create
              </Button>
            </Flex>
          </CardFooter>
        </Card>
      </Flex>
    </Content>
  );
};

export default Create;
