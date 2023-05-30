import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  Icon,
  Stack,
  StackDivider,
  Tag,
  Text,
} from "@chakra-ui/react";
import { ContentContainer } from "@components/ContentContainer";
import { BsBox, BsGear, BsGrid, BsPlusLg } from "react-icons/bs";

import _ from "lodash";

import {Start as EntityStart} from "@pages/Create/Entity";
import {Start as CollectionStart} from "@pages/Create/Collection";
import {Start as AttributeStart} from "@pages/Create/Attribute";

export const Create = ({}) => {
  const [createPage, setCreatePage] = useState("default" as "default" | "entity" | "collection" | "attribute");

  return (
    <>
      {/* Default landing page for creating metadata */}
      {_.isEqual(createPage, "default") &&
        <ContentContainer>
          <Flex
            direction={"column"}
            justify={"center"}
            p={"2"}
            gap={"6"}
            maxW={"7xl"}
            wrap={"wrap"}
          >
            <Flex direction={"column"} w={"100%"} p={"2"} bg={"white"} rounded={"md"}>
              {/* Page header */}
              <Flex direction={"column"} p={"4"} pt={"4"} pb={"4"}>
                <Flex direction={"row"} align={"center"} justify={"space-between"}>
                  <Heading fontWeight={"semibold"}>Create</Heading>
                </Flex>
              </Flex>
              <Flex
                direction={"row"}
                justify={"center"}
                align={"center"}
                gap={"6"}
                p={"2"}
                pb={"6"}
                mb={["12", "8"]}
                wrap={"wrap"}
              >
                {/* Entity card */}
                <Card maxW={"sm"} h={"lg"} variant={"outline"}>
                  <CardHeader>
                    <Flex gap={"4"} w={"100%"} justify={"center"} align={"center"}>
                      <Icon as={BsBox} w={"8"} h={"8"} />
                      <Heading>Entity</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stack divider={<StackDivider />} spacing={"2"}>
                      <Flex p={"2"} gap={"4"} align={"center"} direction={"column"}>
                        <Heading size={"xs"} textTransform={"uppercase"}>Description</Heading>
                        <Text>Create an Entity to group metadata about a physical or digital resource.</Text>
                      </Flex>
                      <Flex p={"2"} gap={"4"} align={"center"} direction={"column"}>
                        <Heading size={"xs"} textTransform={"uppercase"}>Details</Heading>
                        <Flex gap={"2"} wrap={"wrap"}>
                          <Tag colorScheme={"red"}>Name</Tag>
                          <Tag colorScheme={"red"}>Owner</Tag>
                          <Tag colorScheme={"red"}>Created</Tag>
                          <Tag colorScheme={"teal"}>Description</Tag>
                          <Tag colorScheme={"teal"}>Origin Entity</Tag>
                          <Tag colorScheme={"teal"}>Linked Products</Tag>
                          <Tag colorScheme={"teal"}>Collections</Tag>
                          <Tag colorScheme={"teal"}>Attributes</Tag>
                        </Flex>
                      </Flex>
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Flex w={"100%"} justify={"center"}>
                      <Button colorScheme={"green"} rightIcon={<Icon as={BsPlusLg} />} onClick={() => setCreatePage("entity")}>Create</Button>
                    </Flex>
                  </CardFooter>
                </Card>

                {/* Collection card */}
                <Card maxW={"sm"} h={"lg"} variant={"outline"}>
                  <CardHeader>
                    <Flex gap={"4"} w={"100%"} justify={"center"} align={"center"}>
                      <Icon as={BsGrid} w={"8"} h={"8"} />
                      <Heading>Collection</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stack divider={<StackDivider />} spacing={"2"}>
                      <Flex p={"2"} gap={"4"} align={"center"} direction={"column"}>
                        <Heading size={"xs"} textTransform={"uppercase"}>Description</Heading>
                        <Text>Create a Collection to group and organize Entities.</Text>
                      </Flex>
                      <Flex p={"2"} gap={"4"} align={"center"} direction={"column"}>
                        <Heading size={"xs"} textTransform={"uppercase"}>Details</Heading>
                        <Flex gap={"2"}>
                          <Tag colorScheme={"red"}>Name</Tag>
                          <Tag colorScheme={"red"}>Description</Tag>
                          <Tag colorScheme={"teal"}>Entities</Tag>
                        </Flex>
                      </Flex>
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Flex w={"100%"} justify={"center"}>
                      <Button colorScheme={"green"} rightIcon={<Icon as={BsPlusLg} />} onClick={() => setCreatePage("collection")}>Create</Button>
                    </Flex>
                  </CardFooter>
                </Card>

                {/* Attribute card */}
                <Card maxW={"sm"} h={"lg"} variant={"outline"}>
                  <CardHeader>
                    <Flex gap={"4"} w={"100%"} justify={"center"} align={"center"}>
                      <Icon as={BsGear} w={"8"} h={"8"} />
                      <Heading>Attribute</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stack divider={<StackDivider />} spacing={"2"}>
                      <Flex p={"2"} gap={"4"} align={"center"} direction={"column"}>
                        <Heading size={"xs"} textTransform={"uppercase"}>Description</Heading>
                        <Text>Create a template Attribute to standardize reusable components of metadata to be associated with Entities.</Text>
                      </Flex>
                      <Flex p={"2"} gap={"4"} align={"center"} direction={"column"}>
                        <Heading size={"xs"} textTransform={"uppercase"}>Details</Heading>
                        <Flex gap={"2"} wrap={"wrap"}>
                          <Tag colorScheme={"red"}>Name</Tag>
                          <Tag colorScheme={"red"}>Description</Tag>
                          <Tag colorScheme={"red"}>Parameters</Tag>
                        </Flex>
                      </Flex>
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Flex w={"100%"} justify={"center"}>
                      <Button colorScheme={"green"} rightIcon={<Icon as={BsPlusLg} />} onClick={() => setCreatePage("attribute")}>Create</Button>
                    </Flex>
                  </CardFooter>
                </Card>
              </Flex>
            </Flex>
          </Flex>
        </ContentContainer>
      }

      {/* Create an Entity */}
      {_.isEqual(createPage, "entity") &&
        <EntityStart />
      }

      {/* Create a Collection */}
      {_.isEqual(createPage, "collection") &&
        <CollectionStart />
      }

      {/* Create an Attribute */}
      {_.isEqual(createPage, "attribute") &&
        <AttributeStart />
      }
    </>
  );
};
export default Create;
