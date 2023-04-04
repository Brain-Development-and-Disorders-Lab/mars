// React
import React, { useEffect, useState } from "react";
import {
  Flex,
  Heading,
  Table,
  TableContainer,
  Th,
  Thead,
  Tr,
  Text,
  useToast,
  Button,
  Tbody,
  Link,
  Tag,
  TagLabel,
  TagRightIcon,
  Td,
  Icon,
} from "@chakra-ui/react";
import { ChevronRightIcon, AddIcon, WarningIcon } from "@chakra-ui/icons";
import { BsBox } from "react-icons/bs";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "@database/functions";
import { EntityModel } from "@types";

// Utility libraries
import _ from "underscore";

// Custom components
import { ContentContainer } from "@components/ContentContainer";
import { Loading } from "@components/Loading";
import { Error } from "@components/Error";

const Entities = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const [entityData, setEntityData] = useState([] as EntityModel[]);

  useEffect(() => {
    getData(`/entities`)
      .then((value) => {
        setEntityData(value);
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
              direction={"row"}
              justify={"space-between"}
              align={"center"}
            >
              <Flex align={"center"} gap={"4"}>
                <Icon as={BsBox} w={"8"} h={"8"} />
                <Heading fontWeight={"semibold"}>Entities</Heading>
              </Flex>
              <Button
                rightIcon={<AddIcon />}
                as={Link}
                onClick={() => navigate("/create/entity/start")}
                colorScheme={"green"}
              >
                Create
              </Button>
            </Flex>

            <Flex
              direction={"row"}
              p={"4"}
              rounded={"2xl"}
              bg={"whitesmoke"}
              wrap={"wrap"}
              gap={"6"}
            >
              {isLoaded && entityData.length > 0 ? (
                <TableContainer w={"full"}>
                  <Table variant={"simple"} colorScheme={"blackAlpha"}>
                    <Thead>
                      <Tr>
                        <Th>
                          <Heading size={"sm"}>Name</Heading>
                        </Th>
                        <Th display={{ base: "none", sm: "table-cell" }}>
                          <Heading size={"sm"}>Owner</Heading>
                        </Th>
                        <Th display={{ base: "none", sm: "table-cell" }}>
                          <Heading size={"sm"}>Description</Heading>
                        </Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {entityData.reverse().map((entity) => {
                        return (
                          <Tr key={entity._id}>
                            <Td>{entity.name}</Td>
                            <Td display={{ base: "none", sm: "table-cell" }}>
                              {_.isEqual(entity.owner, "") ? (
                                <Tag
                                  size={"md"}
                                  key={`warn-${entity._id}`}
                                  colorScheme={"orange"}
                                >
                                  <TagLabel>Not specified</TagLabel>
                                  <TagRightIcon as={WarningIcon} />
                                </Tag>
                              ) : (
                                entity.owner
                              )}
                            </Td>
                            <Td display={{ base: "none", sm: "table-cell" }}>
                              <Text noOfLines={2}>
                                {_.isEqual(entity.description, "") ? (
                                  <Tag
                                    size={"md"}
                                    key={`warn-${entity._id}`}
                                    colorScheme={"orange"}
                                  >
                                    <TagLabel>Not specified</TagLabel>
                                    <TagRightIcon as={WarningIcon} />
                                  </Tag>
                                ) : (
                                  entity.description
                                )}
                              </Text>
                            </Td>
                            <Td>
                              <Flex justify={"right"}>
                                <Button
                                  key={`view-entity-${entity._id}`}
                                  colorScheme={"blackAlpha"}
                                  rightIcon={<ChevronRightIcon />}
                                  onClick={() => navigate(`/entities/${entity._id}`)}
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
        )
      ) : (
        <Loading />
      )}
    </ContentContainer>
  );
};

export default Entities;
