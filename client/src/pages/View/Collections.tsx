import React, { useEffect, useState } from "react";
import { Button, Flex, Heading, Link, Table, TableContainer, Tag, TagLabel, TagRightIcon, Tbody, Text, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import { ChevronRightIcon, AddIcon, WarningIcon } from "@chakra-ui/icons";

import { Loading } from "src/components/Loading";
import _ from "underscore";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/database/functions";
import { CollectionModel } from "types";

const Collections = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [collectionsData, setCollectionsData] = useState(
    [] as CollectionModel[]
  );

  useEffect(() => {
    const response = getData(`/collections`);

    // Handle the response from the database
    response.then((value) => {
      setCollectionsData(value);

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
            <Heading size={"3xl"}>Collections</Heading>
            <Button
              rightIcon={<AddIcon />}
              as={Link}
              href={"/create/collection/start"}
              colorScheme={"green"}
            >
              Create
            </Button>
          </Flex>

          <Flex m={"2"} p={"4"} direction={"row"} rounded={"2xl"} background={"gray.300"} flexWrap={"wrap"} gap={"6"}>
            {isLoaded && collectionsData.length > 0 ? (
              <TableContainer w={"full"}>
                <Table variant={"simple"} colorScheme={"gray"}>
                  <Thead>
                    <Tr>
                      <Th pl={"0"}><Heading color={"gray.600"} size={"sm"}>Name</Heading></Th>
                      <Th><Heading color={"gray.600"} size={"sm"}>Owner</Heading></Th>
                      <Th><Heading color={"gray.600"} size={"sm"}>Description</Heading></Th>
                      <Th pr={"0"}></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {collectionsData.map((collection) => {
                      return (
                        <Tr key={collection._id}>
                          <Th pl={"0"}>{
                            _.isEqual(collection.name, "") ?
                              <Tag size={"md"} key={`warn-${collection._id}`} colorScheme={"orange"}>
                                <TagLabel>Not specified</TagLabel>
                                <TagRightIcon as={WarningIcon} />
                              </Tag>
                            :
                              <Text>{collection.name}</Text>
                          }</Th>
                          <Th pl={"0"}>{
                            _.isEqual(collection.owner, "") ?
                              <Tag size={"md"} key={`warn-${collection._id}`} colorScheme={"orange"}>
                                <TagLabel>Not specified</TagLabel>
                                <TagRightIcon as={WarningIcon} />
                              </Tag>
                            :
                              <Text>{collection.owner}</Text>
                          }</Th>
                          <Th pl={"0"}>{
                            _.isEqual(collection.description, "") ?
                              <Tag size={"md"} key={`warn-${collection._id}`} colorScheme={"orange"}>
                                <TagLabel>Not specified</TagLabel>
                                <TagRightIcon as={WarningIcon} />
                              </Tag>
                            :
                              <Text noOfLines={2}>{collection.description}</Text>
                          }</Th>
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
        </Flex>
      </Flex>
    :
      <Loading />
  );
};

export default Collections;
