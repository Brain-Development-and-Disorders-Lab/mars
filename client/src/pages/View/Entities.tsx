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

  return isLoaded ? (
    <ContentContainer>
      <Flex
        p={"2"}
        pt={"4"}
        pb={"4"}
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
          href={"/create/entity/start"}
          colorScheme={"green"}
        >
          Create
        </Button>
      </Flex>

      <Flex
        m={"2"}
        p={"4"}
        direction={"row"}
        rounded={"2xl"}
        bg={"whitesmoke"}
        flexWrap={"wrap"}
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
                  <Th>
                    <Heading size={"sm"}>Owner</Heading>
                  </Th>
                  <Th>
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
                      <Td>
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
                      <Td>
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
    </ContentContainer>
  ) : (
    <Loading />
  );
};

export default Entities;
