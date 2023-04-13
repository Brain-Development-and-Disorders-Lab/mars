import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Flex,
  Heading,
  Icon,
  Table,
  TableContainer,
  Text,
  Thead,
  Tr,
  Th,
  useToast,
  Spacer,
  List,
  ListItem,
  Tbody,
  Td,
} from "@chakra-ui/react";
import { AddIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { BsBox, BsClockHistory, BsFolder, BsPencil, BsPlusLg, BsTrash } from "react-icons/bs";

import { ContentContainer } from "@components/ContentContainer";
import { Loading } from "@components/Loading";
import { Error } from "@components/Error";

import { getData } from "src/database/functions";
import { CollectionModel, EntityModel, UpdateModel } from "@types";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Linky from "@components/Linky";
dayjs.extend(relativeTime);

const Dashboard = () => {
  // Enable navigation
  const navigate = useNavigate();

  // Toast to show errors
  const toast = useToast();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  // Page data
  const [entityData, setEntityData] = useState([] as EntityModel[]);
  const [collectionData, setCollectionData] = useState([] as CollectionModel[]);
  const [updateData, setUpdateData] = useState([] as UpdateModel[]);

  // Get all Entities
  useEffect(() => {
    getData(`/entities`)
      .then((result) => {
        setEntityData(result.reverse());
      }).catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Entities data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      }).finally(() => {
        setIsLoaded(true);
      });
  }, []);

  // Get all Collections
  useEffect(() => {
    getData(`/collections`).then((value) => {
      setCollectionData(value.reverse());
      setIsLoaded(true);
    }).catch((_error) => {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Collections data.",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }).finally(() => {
      setIsLoaded(true);
    });
  }, []);

  // Get all Updates
  useEffect(() => {
    getData(`/updates`).then((value) => {
      setUpdateData(value.reverse());
      setIsLoaded(true);
    }).catch((_error) => {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Updates data.",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }).finally(() => {
      setIsLoaded(true);
    });
  }, []);

  return (
    <ContentContainer vertical={isError || !isLoaded}>
      {isLoaded ? (
        isError ? (
          <Error />
        ) : (
          <Flex
            direction={"row"}
            justify={"center"}
            p={["1", "2"]}
            gap={"6"}
            maxW={"7xl"}
            wrap={"wrap"}
          >
            <Flex direction={"column"} gap={"6"} grow={"2"}>
              <Flex direction={"row"} justify={"space-between"} align={"center"}>
                <Flex align={"center"} gap={"4"} p={"2"}>
                  <Icon as={BsFolder} w={"8"} h={"8"} />
                  <Heading fontWeight={"semibold"}>Collections</Heading>
                </Flex>
                <Button
                  colorScheme={"green"}
                  leftIcon={<AddIcon />}
                  onClick={() => navigate("/create/collection/start")}
                >
                  Create
                </Button>
              </Flex>

              <Flex
                direction={"column"}
                p={"4"}
                background={"white"}
                rounded={"md"}
                gap={"2"}
              >
                {/* Collections listing */}
                {isLoaded && collectionData.length > 0 ? (
                  <TableContainer>
                    <Table variant={"simple"} colorScheme={"blackAlpha"}>
                      <Thead>
                        <Tr>
                          <Th>
                            <Heading fontWeight={"semibold"} size={"sm"}>
                              Name
                            </Heading>
                          </Th>
                          <Th>
                            <Heading fontWeight={"semibold"} size={"sm"}>
                              Description
                            </Heading>
                          </Th>
                          <Th></Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {collectionData.slice(0, 5).map((collection) => {
                          return (
                            <Tr key={collection._id}>
                              <Td>{collection.name}</Td>
                              <Td><Text noOfLines={1}>{collection.description}</Text></Td>
                              <Td>
                                <Flex justify={"right"}>
                                  <Button
                                    key={`view-collection-${collection._id}`}
                                    colorScheme={"blackAlpha"}
                                    rightIcon={<ChevronRightIcon />}
                                    onClick={() =>
                                      navigate(`/collections/${collection._id}`)
                                    }
                                  >
                                    View
                                  </Button>
                                </Flex>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Text>There are no Collections to display.</Text>
                )}

                <Spacer />

                <Flex justify={"right"}>
                  <Button
                    key={`view-collection-all`}
                    colorScheme={"blackAlpha"}
                    rightIcon={<ChevronRightIcon />}
                    onClick={() => navigate(`/collections`)}
                  >
                    View All
                  </Button>
                </Flex>
              </Flex>

              <Spacer />

              <Flex direction={"row"} justify={"space-between"} align={"center"}>
                <Flex align={"center"} gap={"4"} p={"2"}>
                  <Icon as={BsBox} w={"8"} h={"8"} />
                  <Heading fontWeight={"semibold"}>Entities</Heading>
                </Flex>
                <Button
                  colorScheme={"green"}
                  leftIcon={<AddIcon />}
                  onClick={() => navigate("/create/entity/start")}
                >
                  Create
                </Button>
              </Flex>

              <Flex
                direction={"column"}
                p={"4"}
                background={"white"}
                rounded={"md"}
                gap={"2"}
              >
                {/* Entities listing */}
                {isLoaded && entityData.length > 0 ? (
                  <TableContainer>
                    <Table variant={"simple"} colorScheme={"blackAlpha"}>
                      <Thead>
                        <Tr>
                          <Th>
                            <Heading fontWeight={"semibold"} size={"sm"}>
                              Name
                            </Heading>
                          </Th>
                          <Th>
                            <Heading fontWeight={"semibold"} size={"sm"}>
                              Description
                            </Heading>
                          </Th>
                          <Th></Th>
                        </Tr>
                      </Thead>

                      <Tbody>
                        {entityData.slice(0, 5).map((entity) => {
                          return (
                            <Tr key={entity._id}>
                              <Td>{entity.name}</Td>
                              <Td><Text noOfLines={1}>{entity.description}</Text></Td>
                              <Td>
                                <Flex justify={"right"}>
                                  <Button
                                    key={`view-entity-${entity._id}`}
                                    colorScheme={"blackAlpha"}
                                    rightIcon={<ChevronRightIcon />}
                                    onClick={() =>
                                      navigate(`/entities/${entity._id}`)
                                    }
                                  >
                                    View
                                  </Button>
                                </Flex>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Text>There are no Entities to display.</Text>
                )}

                <Spacer />

                <Flex justify={"right"}>
                  <Button
                    key={`view-entity-all`}
                    colorScheme={"blackAlpha"}
                    rightIcon={<ChevronRightIcon />}
                    onClick={() => navigate(`/entities`)}
                  >
                    View All
                  </Button>
                </Flex>
              </Flex>
            </Flex>

            {/* Activity Feed */}
            <Flex maxW={"lg"} direction={"column"} gap={"6"} >
              <Flex align={"center"} gap={"4"} p={"2"}>
                <Icon as={BsClockHistory} w={"8"} h={"8"} />
                <Heading fontWeight={"semibold"}>Activity Feed</Heading>
              </Flex>

              <Flex
                background={"white"}
                direction={"column"}
                rounded={"md"}
                h={"fit-content"}
                p={"4"}
                gap={"2"}
              >
                <List>
                  {updateData.length > 0 ? (
                    updateData.slice(0, 10).map((update) => {
                      // Configure the badge
                      const iconSize = "3";
                      const iconColor = "white";
                      let operationBadgeColor = "green.400";
                      let operationIcon = <Icon as={BsBox} w={iconSize} h={iconSize} color={iconColor} />;

                      switch (update.type) {
                        case "create":
                          operationBadgeColor = "green.400";
                          operationIcon = <Icon as={BsPlusLg} w={iconSize} h={iconSize} color={iconColor} />;
                          break;
                        case "update":
                          operationBadgeColor = "blue.400";
                          operationIcon = <Icon as={BsPencil} w={iconSize} h={iconSize} color={iconColor} />;
                          break;
                        case "delete":
                          operationBadgeColor = "red.400";
                          operationIcon = <Icon as={BsTrash} w={iconSize} h={iconSize} color={iconColor} />;
                          break;
                      }

                      return (
                        <ListItem key={`update-${update._id}`}>
                          <Flex
                            direction={"row"}
                            p={"2"}
                            gap={"2"}
                            mt={"2"}
                            mb={"2"}
                            align={"center"}
                            background={"white"}
                            rounded={"md"}
                            border={"2px"}
                            borderColor={"gray.100"}
                          >
                            <Flex rounded={"full"} bg={operationBadgeColor} p={"1.5"}>
                              {operationIcon}
                            </Flex>

                            <Text>{update.details}</Text>

                            <Linky id={update.target.id} type={update.target.type} fallback={update.target.name} />

                            <Spacer />

                            <Text color={"gray.400"}>{dayjs(update.timestamp).fromNow()}</Text>
                          </Flex>
                        </ListItem>
                      );
                    })
                  ) : (
                    <Text fontSize={"md"}>No recent activity to show.</Text>
                  )}
                </List>
              </Flex>
            </Flex>
          </Flex>
        )
      ) : (
        <Loading />
      )}
    </ContentContainer>
  );
};

export default Dashboard;
