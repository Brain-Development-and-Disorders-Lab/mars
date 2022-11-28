// React and Grommet
import React, { useEffect, useState } from "react";
import { Box, Button, Flex, Heading, Table, TableContainer, Text, Thead, Tr, Th, useToast, Stat, StatLabel, StatNumber, StatHelpText, Spacer, List, ListItem } from "@chakra-ui/react";

// Database and models
import { getData } from "src/database/functions";
import { CollectionModel, EntityModel } from "types";

// Navigation
import { useNavigate, Link as RouterLink } from "react-router-dom";

// Custom components
import { Loading } from "src/components/Loading";
import { ChevronRightIcon, PlusSquareIcon, RepeatClockIcon, SearchIcon } from "@chakra-ui/icons";

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

  // Get all Entities
  useEffect(() => {
    const response = getData(`/entities`);

    // Handle the response from the database
    response.then((value) => {
      setEntityData(value);

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

      setIsLoaded(true);
    });
    return;
  }, []);

  // Get all Collections
  useEffect(() => {
    const response = getData(`/collections`);

    // Handle the response from the database
    response.then((value) => {
      setCollectionData(value);

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

      setIsLoaded(true);
    });
    return;
  }, []);

  return (
    isLoaded ?
    <Box m={"2"}>
      <Flex p={"2"} pt={"8"} pb={"8"} direction={"row"} justify={"space-between"} align={"center"}>
        <Heading size={"3xl"}>Dashboard</Heading>
        <Button
            as={RouterLink}
            to={"/search"}
            variant={"solid"}
            colorScheme={"teal"}
            px={2}
            py={2}
            mr={4}
            leftIcon={<SearchIcon />}
          >
          Search
        </Button>
      </Flex>

      <Flex p={"2"} direction={"row"} w={"full"} flexWrap={"wrap"} gap={"6"}>
        <Flex direction={"column"} gap={"6"} w={"2xl"} grow={"2"}>
          <Flex
            direction={"column"}
            p={"4"}
            background={"#cce3de"}
            rounded={"xl"}
            gap={"1.5"}
          >
            {/* Collections listing */}
            <Flex direction={"row"} justify={"space-between"} align={"center"}>
              <Heading color={"gray.700"}>Collections</Heading>
              <Button
                rightIcon={<PlusSquareIcon />}
                as={RouterLink}
                to={"/create/collection/start"}
              >
                Create
              </Button>
            </Flex>

            <Stat
              rounded={"md"}
              background={"#83c5be"}
              color={"white"}
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
                  {collectionData.slice(0, 3).map((collection) => {
                    return (
                      <Tr>
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
            background={"#61a5c2"}
            rounded={"xl"}
            gap={"1.5"}
          >
            <Flex direction={"row"} justify={"space-between"} align={"center"}>
              <Heading color={"white"}>Entities</Heading>
              <Button
                rightIcon={<PlusSquareIcon />}
                as={RouterLink}
                to={"/create/entity/start"}
              >
                Create
              </Button>
            </Flex>

            <Stat
              rounded={"md"}
              background={"#89c2d9"}
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
                <Table variant={"simple"}>
                  <Thead>
                    <Tr>
                      <Th pl={"0"}><Heading color={"white"} size={"sm"}>Newest Entities</Heading></Th>
                      <Th pr={"0"}>
                        <Flex justify={"right"}>
                          <Button
                            key={`view-entity-all`}
                            color="accent-4"
                            rightIcon={<ChevronRightIcon />}
                            onClick={() => navigate(`/entities`)}
                          >
                            View All
                          </Button>
                        </Flex>
                      </Th>
                    </Tr>
                  </Thead>
                  {entityData.slice(0, 3).map((entity) => {
                    return (
                      <Tr>
                        <Th pl={"0"} color={"white"}>{entity.name}</Th>
                        <Th pr={"0"}>
                          <Flex justify={"right"}>
                            <Button
                              key={`view-entity-${entity._id}`}
                              color="accent-4"
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
          background={"#ffe1a8"}
          rounded={"xl"}
          gap={"1.5"}
          grow={"1"} 
        >
          <Heading color={"gray.600"}>Recent Changes{" "}<RepeatClockIcon color={"gray.600"} w={8} h={8} /></Heading>
          <List>
            <ListItem><Text fontSize={"md"}>9:23 AM: <b>Henry</b> updated ...</Text></ListItem>
          </List>
        </Flex>
      </Flex>
    </Box>
    :
    <Loading />
  );
};

export default Home;
