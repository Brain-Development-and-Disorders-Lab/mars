import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Flex,
  Heading,
  Icon,
  Link,
  Table,
  TableContainer,
  Tag,
  TagLabel,
  TagRightIcon,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { ChevronRightIcon, AddIcon, WarningIcon } from "@chakra-ui/icons";
import { BsGrid } from "react-icons/bs";

// Custom components
import { Error } from "@components/Error";
import { Loading } from "@components/Loading";
import { ContentContainer } from "@components/ContentContainer";

// Database and models
import { getData } from "@database/functions";
import { CollectionModel } from "@types";

import _ from "lodash";

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
      });;
  }, []);

  return (
    <ContentContainer vertical={isError || !isLoaded}>
      {isLoaded ? (
        isError ? (
          <Error />
        ) : (
          <Flex
            direction={"column"}
            justify={"center"}
            p={"4"}
            gap={"6"}
            maxW={"7xl"}
            wrap={"wrap"}
          >
            <Flex
              p={"4"}
              direction={"row"}
              rounded={"md"}
              bg={"white"}
              flexWrap={"wrap"}
              gap={"6"}
            >
              <Flex
                w={"100%"}
                p={"4"}
                direction={"row"}
                justify={"space-between"}
                align={"center"}
              >
                <Flex align={"center"} gap={"4"}>
                  <Icon as={BsGrid} w={"8"} h={"8"} />
                  <Heading fontWeight={"semibold"}>Collections</Heading>
                </Flex>
                <Button
                  rightIcon={<AddIcon />}
                  as={Link}
                  onClick={() => navigate("/create/collection/start")}
                  colorScheme={"green"}
                >
                  Create
                </Button>
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
                                  <TagRightIcon as={WarningIcon} />
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
                                  <TagRightIcon as={WarningIcon} />
                                </Tag>
                              ) : (
                                <Text noOfLines={2}>{collection.description}</Text>
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
                                  <TagRightIcon as={WarningIcon} />
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
                                >
                                  <TagLabel>Empty</TagLabel>
                                  <TagRightIcon as={WarningIcon} />
                                </Tag>
                              ) : (
                                <Text noOfLines={1}>{collection.entities.length}</Text>
                              )}
                            </Td>
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
          </Flex>
        )
      ) : (
        <Loading />
      )}
    </ContentContainer>
  );
};

export default Collections;
