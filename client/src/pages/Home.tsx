import React, { useEffect, useState } from "react";
import { Button, Flex, Heading, Table, TableContainer, Text, Thead, Tr, Th, useToast, Stat, StatLabel, StatNumber, StatHelpText, Spacer, List, ListItem, Tbody, Link, Badge } from "@chakra-ui/react";
import { AddIcon, ChevronRightIcon, RepeatClockIcon } from "@chakra-ui/icons";
import { getData } from "src/database/functions";
import { CollectionModel, EntityModel, UpdateModel } from "@types";
import { useNavigate } from "react-router-dom";
import { Loading } from "@components/Loading";
import dayjs from "dayjs";

const Home = () => {
  // Enable navigation
  const navigate = useNavigate();

  // Toast to show errors
  const toast = useToast();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);

  // Page data
  const [entityData, setEntityData] = useState([] as EntityModel[]);
  const [collectionData, setCollectionData] = useState([] as CollectionModel[]);
  const [updateData, setUpdateData] = useState([] as UpdateModel[]);

  // Get all Entities
  useEffect(() => {
    getData(`/entities`).then((value) => {
      if (value["error"] !== undefined) {
        toast({
          title: "Database Error",
          description: value["error"],
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
      setEntityData(value);
      setIsLoaded(true);
    });
    return;
  }, []);

  // Get all Collections
  useEffect(() => {
    getData(`/collections`).then((value) => {
      if (value["error"] !== undefined) {
        toast({
          title: "Database Error",
          description: value["error"],
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
      setCollectionData(value);
      setIsLoaded(true);
    });
    return;
  }, []);

  // Get all Updates
  useEffect(() => {
    getData(`/updates`).then((value) => {
      // Check the contents of the response
      if (value["error"] !== undefined) {
        toast({
          title: "Database Error",
          description: value["error"],
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
      setUpdateData(value);
      setIsLoaded(true);
    });
    return;
  }, []);

  return (
    isLoaded ?
      <Flex m={"2"} align={"center"} justify={"center"}>
        <Flex p={"2"} pt={"0"} direction={"row"} w={"full"} maxW={"7xl"} wrap={"wrap"} gap={"6"}>
          <Flex direction={"column"} gap={"6"} w={"2xl"} grow={"2"}>
            <Flex
              direction={"column"}
              p={"4"}
              background={"gray.300"}
              rounded={"xl"}
              gap={"1.5"}
            >
              {/* Collections listing */}
              <Flex direction={"row"} justify={"space-between"} align={"center"}>
                <Heading color={"gray.700"}>Collections</Heading>
                <Button
                  leftIcon={<AddIcon />}
                  as={Link}
                  href={"/create/collection/start"}
                  colorScheme={"green"}
                >
                  Create
                </Button>
              </Flex>

              <Stat
                rounded={"md"}
                background={"gray.200"}
                p={"2"}
                maxW={"fit-content"}
              >
                <StatLabel>Total Collections</StatLabel>
                <StatNumber>{collectionData.length}</StatNumber>
                <StatHelpText>Updated just now.</StatHelpText>
              </Stat>

              <Spacer />

              {isLoaded && collectionData.length > 0 ? (
                <TableContainer>
                  <Table variant={"simple"}>
                    <Thead>
                      <Tr>
                        <Th pl={"0"}><Heading color={"gray.600"} size={"sm"}>Newest Collections</Heading></Th>
                        <Th pr={"0"}>
                          <Flex justify={"right"}>
                            <Button
                              key={`view-collection-all`}
                              color="accent-4"
                              rightIcon={<ChevronRightIcon />}
                              onClick={() => navigate(`/collections`)}
                            >
                              View All
                            </Button>
                          </Flex>
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {collectionData.slice(0, 3).map((collection) => {
                        return (
                          <Tr key={collection._id}>
                            <Th pl={"0"}>{collection.name}</Th>
                            <Th pr={"0"}>
                              <Flex justify={"right"}>
                                <Button
                                  key={`view-collection-${collection._id}`}
                                  color="grey.400"
                                  rightIcon={<ChevronRightIcon />}
                                  onClick={() => navigate(`/collections/${collection._id}`)}
                                >
                                  View
                                </Button>
                              </Flex>
                            </Th>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : (
                <Text>There are no Collections to display.</Text>
              )}
            </Flex>

            {/* Entities listing */}
            <Flex
              direction={"column"}
              p={"4"}
              background={"blue.300"}
              rounded={"xl"}
              gap={"1.5"}
            >
              <Flex direction={"row"} justify={"space-between"} align={"center"}>
                <Heading color={"white"}>Entities</Heading>
                <Button
                  leftIcon={<AddIcon />}
                  as={Link}
                  href={"/create/entity/start"}
                  colorScheme={"green"}
                >
                  Create
                </Button>
              </Flex>

              <Stat
                rounded={"md"}
                background={"blue.200"}
                color={"white"}
                p={"2"}
                maxW={"fit-content"}
              >
                <StatLabel>Total Entities</StatLabel>
                <StatNumber>{entityData.length}</StatNumber>
                <StatHelpText>Updated just now.</StatHelpText>
              </Stat>

              <Spacer />

              {isLoaded && entityData.length > 0 ? (
                <TableContainer>
                  <Table variant={"simple"} colorScheme={"blue"}>
                    <Thead>
                      <Tr>
                        <Th pl={"0"}><Heading color={"white"} size={"sm"}>Newest Entities</Heading></Th>
                        <Th pr={"0"}>
                          <Flex justify={"right"}>
                            <Button
                              key={`view-entity-all`}
                              rightIcon={<ChevronRightIcon />}
                              onClick={() => navigate(`/entities`)}
                            >
                              View All
                            </Button>
                          </Flex>
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {entityData.slice(0, 3).map((entity) => {
                        return (
                          <Tr key={entity._id}>
                            <Th pl={"0"} color={"white"}>{entity.name}</Th>
                            <Th pr={"0"}>
                              <Flex justify={"right"}>
                                <Button
                                  key={`view-entity-${entity._id}`}
                                  rightIcon={<ChevronRightIcon />}
                                  onClick={() => navigate(`/entities/${entity._id}`)}
                                >
                                  View
                                </Button>
                              </Flex>
                            </Th>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : (
                <Text>There are no Entities to display.</Text>
              )}
            </Flex>
          </Flex>

          {/* Recent changes */}
          <Flex
            direction={"column"}
            p={"4"}
            background={"teal"}
            color={"white"}
            rounded={"xl"}
            gap={"1.5"}
            grow={"1"} 
          >
            <Heading>Recent Changes{" "}<RepeatClockIcon w={8} h={8} /></Heading>
            <List>
              {updateData.length > 0 ?
                updateData.reverse().map((update, index) => {
                  if (index < 10) {
                    // Configure the badge
                    let badgeColor = "green";
                    switch (update.operation.type) {
                      case "add":
                        badgeColor = "green";
                        break;
                      case "modify":
                        badgeColor = "blue";
                        break;
                      case "remove":
                        badgeColor = "red";
                        break;
                    }

                    return (
                      <ListItem key={`update-${update._id}`}>
                        <Flex direction={"row"} p={"2"} gap={"2"} mt={"2"} mb={"2"} align={"center"} color={"gray.400"} background={"white"} rounded={"xl"}>
                          <Text fontSize={"md"} as={"b"} >{dayjs(update.operation.timestamp).format("DD MMM")}</Text>
                          <Text>{update.targets.primary.name}</Text>
                          {update.targets.secondary &&
                            <Text>{update.targets.secondary.name}</Text>
                          }
                          <Spacer />
                          <Badge colorScheme={badgeColor}>{update.operation.type}</Badge>
                        </Flex>
                      </ListItem>
                    );
                  }
                  return;
                })
              :
                <Text fontSize={"md"}>No updates yet.</Text>
              }
            </List>
          </Flex>
        </Flex>
      </Flex>
    :
      <Loading />
  );
};

export default Home;
