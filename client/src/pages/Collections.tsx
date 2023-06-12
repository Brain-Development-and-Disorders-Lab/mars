// React
import React, { useEffect, useState } from "react";
import {
  Button,
  Flex,
  Heading,
  Table,
  TableContainer,
  Tag,
  TagLabel,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Error from "@components/Error";
import Loading from "@components/Loading";

// Database and models
import { CollectionModel } from "@types";

// Utility functions and types
import { getData } from "@database/functions";
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Collections = () => {
  const toast = useToast();
  const navigate = useNavigate();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const [collectionsData, setCollectionsData] = useState(
    [] as CollectionModel[]
  );

  useEffect(() => {
    getData(`/collections`)
      .then((value) => {
        setCollectionsData(value);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Collections data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  return (
    <Content vertical={isError || !isLoaded}>
      {isLoaded ? (
        isError ? (
          <Error />
        ) : (
          <Flex
            direction={"row"}
            p={"4"}
            rounded={"md"}
            bg={"white"}
            wrap={"wrap"}
            gap={"6"}
            justify={"center"}
          >
            <Flex
              w={"100%"}
              p={"4"}
              direction={"row"}
              justify={"space-between"}
              align={"center"}
            >
              <Flex align={"center"} gap={"4"}>
                <Icon name={"collection"} size={"lg"} />
                <Heading fontWeight={"semibold"}>Collections</Heading>
              </Flex>
            </Flex>
            {isLoaded && collectionsData.length > 0 ? (
              <TableContainer w={"full"}>
                <Table variant={"simple"} colorScheme={"blackAlpha"}>
                  <Thead>
                    <Tr>
                      <Th>
                        <Heading size={"sm"}>Name</Heading>
                      </Th>
                      <Th display={{ base: "none", sm: "table-cell" }}>
                        <Heading size={"sm"}>Description</Heading>
                      </Th>
                      <Th display={{ base: "none", sm: "table-cell" }}>
                        <Heading size={"sm"}>Owner</Heading>
                      </Th>
                      <Th display={{ base: "none", sm: "table-cell" }}>
                        <Heading size={"sm"}>Count</Heading>
                      </Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {collectionsData.reverse().map((collection) => {
                      return (
                        <Tr key={collection._id}>
                          <Td>
                            {_.isEqual(collection.name, "") ? (
                              <Tag
                                size={"md"}
                                key={`warn-${collection._id}`}
                                colorScheme={"orange"}
                              >
                                <TagLabel>Not specified</TagLabel>
                                <Icon name={"warning"} />
                              </Tag>
                            ) : (
                              <Text>{collection.name}</Text>
                            )}
                          </Td>
                          <Td display={{ base: "none", sm: "table-cell" }}>
                            {_.isEqual(collection.description, "") ? (
                              <Tag
                                size={"md"}
                                key={`warn-${collection._id}`}
                                colorScheme={"orange"}
                              >
                                <TagLabel>Not specified</TagLabel>
                                <Icon name={"warning"} />
                              </Tag>
                            ) : (
                              <Text noOfLines={2}>
                                {collection.description}
                              </Text>
                            )}
                          </Td>
                          <Td display={{ base: "none", sm: "table-cell" }}>
                            {_.isEqual(collection.owner, "") ? (
                              <Tag
                                size={"md"}
                                key={`warn-${collection._id}`}
                                colorScheme={"orange"}
                              >
                                <TagLabel>Not specified</TagLabel>
                                <Icon name={"warning"} />
                              </Tag>
                            ) : (
                              <Text>{collection.owner}</Text>
                            )}
                          </Td>
                          <Td display={{ base: "none", sm: "table-cell" }}>
                            {_.isEqual(collection.entities.length, 0) ? (
                              <Tag
                                size={"md"}
                                key={`warn-${collection._id}`}
                                colorScheme={"orange"}
                                gap={"2"}
                              >
                                <TagLabel>Empty</TagLabel>
                                <Icon name={"warning"} />
                              </Tag>
                            ) : (
                              <Text noOfLines={1}>
                                {collection.entities.length}
                              </Text>
                            )}
                          </Td>
                          <Td>
                            <Flex justify={"right"}>
                              <Button
                                key={`view-collection-${collection._id}`}
                                colorScheme={"blackAlpha"}
                                rightIcon={<Icon name={"c_right"} />}
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
        )
      ) : (
        <Loading />
      )}
    </Content>
  );
};

export default Collections;
