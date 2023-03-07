import React, { useEffect, useState } from "react";
import {
  Button,
  Flex,
  Heading,
  Table,
  TableContainer,
  Text,
  Thead,
  Tr,
  Th,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spacer,
  List,
  ListItem,
  Tbody,
  Badge,
  Td,
} from "@chakra-ui/react";
import { AddIcon, ChevronRightIcon } from "@chakra-ui/icons";

import { getData } from "src/database/functions";
import { CollectionModel, EntityModel, UpdateModel } from "@types";
import { Loading } from "@components/Loading";
import { useNavigate } from "react-router-dom";
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
      setEntityData(value.reverse());
      setIsLoaded(true);
    });
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
      setCollectionData(value.reverse());
      setIsLoaded(true);
    });
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
      setUpdateData(value.reverse());
      setIsLoaded(true);
    });
  }, []);

  return isLoaded ? (
    <Flex m={"2"} align={"center"} justify={"center"}>
      <Flex
        p={"2"}
        pt={"0"}
        direction={"row"}
        w={"full"}
        maxW={"7xl"}
        wrap={"wrap"}
        gap={"6"}
      >
        <Flex direction={"column"} gap={"6"} w={"2xl"} grow={"2"}>
          <Flex
            direction={"column"}
            p={"4"}
            background={"whitesmoke"}
            rounded={"xl"}
            gap={"1.5"}
          >
            {/* Collections listing */}
            <Flex direction={"row"} justify={"space-between"} align={"center"}>
              <Heading fontWeight={"semibold"}>Collections</Heading>
              <Button
                key={`view-collection-all`}
                colorScheme={"blackAlpha"}
                rightIcon={<ChevronRightIcon />}
                onClick={() => navigate(`/collections`)}
              >
                View All
              </Button>
            </Flex>

            <Stat
              rounded={"md"}
              background={"white"}
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
                <Table variant={"simple"} colorScheme={"blackAlpha"}>
                  <Thead>
                    <Tr>
                      <Th>
                        <Heading fontWeight={"semibold"} size={"sm"}>
                          Newest Collections
                        </Heading>
                      </Th>
                      <Th>
                        <Flex justify={"right"}>
                          <Button
                            colorScheme={"green"}
                            leftIcon={<AddIcon />}
                            onClick={() => navigate("/create/collection/start")}
                          >
                            Create
                          </Button>
                        </Flex>
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {collectionData.slice(0, 5).map((collection) => {
                      return (
                        <Tr key={collection._id}>
                          <Td>{collection.name}</Td>
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
          </Flex>

          {/* Entities listing */}
          <Flex
            direction={"column"}
            p={"4"}
            background={"whitesmoke"}
            rounded={"xl"}
            gap={"1.5"}
          >
            <Flex direction={"row"} justify={"space-between"} align={"center"}>
              <Heading fontWeight={"semibold"}>Entities</Heading>
              <Button
                key={`view-entity-all`}
                colorScheme={"blackAlpha"}
                rightIcon={<ChevronRightIcon />}
                onClick={() => navigate(`/entities`)}
              >
                View All
              </Button>
            </Flex>

            <Stat
              rounded={"md"}
              background={"white"}
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
                <Table variant={"simple"} colorScheme={"blackAlpha"}>
                  <Thead>
                    <Tr>
                      <Th>
                        <Heading fontWeight={"semibold"} size={"sm"}>
                          Name
                        </Heading>
                      </Th>
                      <Th>
                        <Flex justify={"right"}>
                          <Button
                            colorScheme={"green"}
                            leftIcon={<AddIcon />}
                            onClick={() => navigate("/create/entity/start")}
                          >
                            Create
                          </Button>
                        </Flex>
                      </Th>
                    </Tr>
                  </Thead>

                  <Tbody>
                    {entityData.slice(0, 5).map((entity) => {
                      return (
                        <Tr key={entity._id}>
                          <Td>{entity.name}</Td>
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
          </Flex>
        </Flex>

        {/* Activity */}
        <Flex
          direction={"column"}
          p={"4"}
          gap={"1.5"}
          h={"fit-content"}
          background={"whitesmoke"}
          rounded={"xl"}
          grow={"1"}
        >
          <Heading fontWeight={"semibold"}>Activity</Heading>
          <List>
            {updateData.length > 0 ? (
              updateData.slice(0, 10).map((update) => {
                // Configure the badge
                let operationBadgeColor = "green";
                switch (update.type) {
                  case "create":
                    operationBadgeColor = "green";
                    break;
                  case "update":
                    operationBadgeColor = "blue";
                    break;
                  case "delete":
                    operationBadgeColor = "red";
                    break;
                }

                let typeBadgeColor = "yellow";
                switch (update.target.type) {
                  case "entities":
                    typeBadgeColor = "yellow";
                    break;
                  case "collections":
                    typeBadgeColor = "orange";
                    break;
                  case "attributes":
                    typeBadgeColor = "gray";
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
                      color={"white"}
                      background={"blackAlpha.500"}
                      rounded={"xl"}
                    >
                      <Text fontSize={"md"} as={"b"}>
                        {dayjs(update.timestamp).format("DD MMM HH:mm")}
                      </Text>
                      <Badge colorScheme={operationBadgeColor}>
                        {update.type}
                      </Badge>
                      <Badge colorScheme={typeBadgeColor}>
                        {update.target.type}
                      </Badge>

                      <Spacer />

                      <Text fontSize={"md"} as={"b"}>
                        {update.target.name}
                      </Text>
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
  ) : (
    <Loading />
  );
};

export default Home;
