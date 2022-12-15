// React
import React, { useEffect, useState } from "react";
import { Flex, Heading, Table, TableContainer, Th, Thead, Tr, Text, useToast, Button, Tbody, Link } from "@chakra-ui/react";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/database/functions";
import { EntityModel } from "types";

// Custom components
import { Loading } from "src/components/Loading";
import { ChevronRightIcon, AddIcon } from "@chakra-ui/icons";

const Entities = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoaded, setIsLoaded] = useState(false);
  const [entityData, setEntityData] = useState([] as EntityModel[]);

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

  return (
    isLoaded ? 
      <Flex m={"2"} align={"center"} justify={"center"}>
        <Flex p={"2"} pt={"0"} direction={"column"} w={"full"} maxW={"7xl"} wrap={"wrap"} gap={"6"}>
          <Flex p={"2"} pt={"8"} pb={"8"} direction={"row"} justify={"space-between"} align={"center"}>
            <Heading size={"3xl"}>Entities</Heading>
            <Button
              rightIcon={<AddIcon />}
              as={Link}
              href={"/create/entity/start"}
              colorScheme={"green"}
            >
              Create
            </Button>
          </Flex>

          <Flex m={"2"} p={"4"} direction={"row"} rounded={"2xl"} background={"blue.300"} flexWrap={"wrap"} gap={"6"}>
            {isLoaded && entityData.length > 0 ? (
              <TableContainer w={"full"}>
                <Table variant={"simple"} colorScheme={"blue"}>
                  <Thead>
                    <Tr>
                      <Th pl={"0"}><Heading color={"white"} size={"sm"}>Name</Heading></Th>
                      <Th><Heading color={"white"} size={"sm"}>Owner</Heading></Th>
                      <Th><Heading color={"white"} size={"sm"}>Description</Heading></Th>
                      <Th pr={"0"}></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {entityData.map((entity) => {
                      return (
                        <Tr key={entity._id}>
                          <Th pl={"0"} color={"white"}>{entity.name}</Th>
                          <Th color={"white"}>{entity.owner}</Th>
                          <Th><Text noOfLines={2} color={"white"}>{entity.description}</Text></Th>
                          <Th pr={"0"}>
                            <Flex justify={"right"}>
                              <Button
                                key={`view-entity-${entity._id}`}
                                color="grey.400"
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
      </Flex>
    :
      <Loading />
  );
};

export default Entities;
