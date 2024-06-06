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

// Utility functions and libraries
import _ from "lodash";

const Create = () => {
  const navigate = useNavigate();

  return (
    <Content>
      <Flex
        direction={"row"}
        h={"100%"}
        align={"center"}
        justify={"center"}
        gap={"6"}
        p={"2"}
        wrap={"wrap"}
      >
        {/* Project card */}
        <Card
          maxW={"sm"}
          h={"lg"}
          variant={"outline"}
          border={"2px"}
          borderColor={"gray.200"}
        >
          <CardHeader>
            <Flex gap={"4"} w={"100%"} justify={"center"} align={"center"}>
              <Icon name={"project"} size={"lg"} />
              <Heading size={"lg"}>Project</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing={"2"}>
              <Flex p={"2"} gap={"4"} direction={"column"}>
                <Heading size={"xs"} textTransform={"uppercase"}>
                  Description
                </Heading>
                <Text>Create a Project to organize and share Entities.</Text>
              </Flex>
              <Flex p={"2"} gap={"4"} direction={"column"}>
                <Heading size={"xs"} textTransform={"uppercase"}>
                  Fields
                </Heading>
                <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                  <Text
                    fontSize={"xs"}
                    fontWeight={"semibold"}
                    color={"gray.600"}
                  >
                    Required:
                  </Text>
                  <Tag colorScheme={"red"}>Name</Tag>
                  <Tag colorScheme={"red"}>Description</Tag>
                </Flex>
              </Flex>
            </Stack>
          </CardBody>
          <CardFooter>
            <Flex w={"100%"} justify={"center"}>
              <Button
                colorScheme={"green"}
                rightIcon={<Icon name={"add"} />}
                onClick={() => navigate("/create/project")}
              >
                Create
              </Button>
            </Flex>
          </CardFooter>
        </Card>

        {/* Entity card */}
        <Card
          maxW={"sm"}
          h={"lg"}
          variant={"outline"}
          border={"2px"}
          borderColor={"gray.200"}
        >
          <CardHeader>
            <Flex gap={"4"} w={"100%"} justify={"center"} align={"center"}>
              <Icon name={"entity"} size={"lg"} />
              <Heading size={"lg"}>Entity</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing={"2"}>
              <Flex p={"2"} gap={"4"} direction={"column"}>
                <Heading size={"xs"} textTransform={"uppercase"}>
                  Description
                </Heading>
                <Text>
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
                    fontSize={"xs"}
                    fontWeight={"semibold"}
                    color={"gray.600"}
                  >
                    Required:
                  </Text>
                  <Tag colorScheme={"red"}>Name</Tag>
                  <Tag colorScheme={"red"}>Created</Tag>
                </Flex>

                <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                  <Text
                    fontSize={"xs"}
                    fontWeight={"semibold"}
                    color={"gray.600"}
                  >
                    Optional:
                  </Text>
                  <Tag colorScheme={"teal"}>Description</Tag>
                  <Tag colorScheme={"teal"}>Projects</Tag>
                  <Tag colorScheme={"teal"}>Origins</Tag>
                  <Tag colorScheme={"teal"}>Products</Tag>
                  <Tag colorScheme={"teal"}>Attributes</Tag>
                </Flex>
              </Flex>
            </Stack>
          </CardBody>
          <CardFooter>
            <Flex w={"100%"} justify={"center"}>
              <Button
                colorScheme={"green"}
                rightIcon={<Icon name={"add"} />}
                onClick={() => navigate("/create/entity")}
              >
                Create
              </Button>
            </Flex>
          </CardFooter>
        </Card>

        {/* Attribute card */}
        <Card
          maxW={"sm"}
          h={"lg"}
          variant={"outline"}
          border={"2px"}
          borderColor={"gray.200"}
        >
          <CardHeader>
            <Flex gap={"4"} w={"100%"} justify={"center"} align={"center"}>
              <Icon name={"attribute"} size={"lg"} />
              <Heading size={"lg"}>Template Attribute</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing={"2"}>
              <Flex p={"2"} gap={"4"} direction={"column"}>
                <Heading size={"xs"} textTransform={"uppercase"}>
                  Description
                </Heading>
                <Text>
                  Create template Attributes to reuse metadata structures across
                  Entities.
                </Text>
              </Flex>
              <Flex p={"2"} gap={"4"} direction={"column"}>
                <Heading size={"xs"} textTransform={"uppercase"}>
                  Fields
                </Heading>
                <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                  <Text
                    fontSize={"xs"}
                    fontWeight={"semibold"}
                    color={"gray.600"}
                  >
                    Required:
                  </Text>
                  <Tag colorScheme={"red"}>Name</Tag>
                  <Tag colorScheme={"red"}>Description</Tag>
                  <Tag colorScheme={"red"}>Values</Tag>
                </Flex>
              </Flex>
            </Stack>
          </CardBody>
          <CardFooter>
            <Flex w={"100%"} justify={"center"}>
              <Button
                colorScheme={"green"}
                rightIcon={<Icon name={"add"} />}
                onClick={() => navigate("/create/attribute")}
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
