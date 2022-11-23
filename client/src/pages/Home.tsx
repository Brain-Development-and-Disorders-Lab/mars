// React and Grommet
import React, { useEffect, useState } from "react";
import { Box, Button, Flex, Heading, Table, TableContainer, Text, Thead, Tr, Th, useToast, Stat, StatLabel, StatNumber, StatHelpText, Spacer, List, ListItem } from "@chakra-ui/react";

// Database and models
import { getData } from "src/database/functions";
import { CollectionModel, EntityModel } from "types";

// Navigation
import { useNavigate } from "react-router-dom";

// Custom components
import { Loading } from "src/components/Loading";
import { ChevronRightIcon, RepeatClockIcon } from "@chakra-ui/icons";

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
    <Box>
      <Flex m={"2"} p={"2"} direction={"row"}>
        <Heading size={"2xl"}>Dashboard</Heading>
      </Flex>

      <Flex m={"2"} p={"2"} direction={"row"} gap={"5"}>
        <Flex direction={"column"} w={"2xl"} gap={"5"}>
          <Flex
            direction={"column"}
            p={"4"}
            background={"#cce3de"}
            rounded={"xl"}
            gap={"1.5"}
          >
            {/* Collections listing */}
            <Heading color={"gray.700"}>Collections</Heading>

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
                      <Th><Heading color={"gray.600"} size={"sm"}>Collection Name</Heading></Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  {collectionData.map((collection) => {
                    return (
                      <Tr>
                        <Th>{collection.name}</Th>
                        <Th>
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
            <Heading color={"white"}>Entities</Heading>

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
                      <Th><Heading color={"white"} size={"sm"}>Entity Name</Heading></Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  {entityData.map((entity) => {
                    return (
                      <Tr>
                        <Th color={"white"}>{entity.name}</Th>
                        <Th>
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
