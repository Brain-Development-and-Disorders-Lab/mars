// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import Error from "@components/Error";
import Icon from "@components/Icon";
import Loading from "@components/Loading";
import { Warning } from "@components/Label";
import { Content } from "@components/Container";

// Existing and custom types
import { AttributeModel } from "@types";

// Utility functions and libraries
import { getData } from "@database/functions";
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Attributes = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const [attributesData, setAttributesData] = useState([] as AttributeModel[]);

  useEffect(() => {
    getData(`/attributes`)
      .then((value) => {
        setAttributesData(value);
        setIsLoaded(true);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Attributes data.",
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
                <Icon name={"attribute"} size={"lg"} />
                <Heading fontWeight={"semibold"}>Attributes</Heading>
              </Flex>
            </Flex>
            {isLoaded && attributesData.length > 0 ? (
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
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {attributesData.reverse().map((attribute) => {
                      return (
                        <Tr key={attribute._id}>
                          <Td>
                            {_.isEqual(attribute.name, "") ? (
                              <Warning
                                key={`warn-${attribute._id}`}
                                text={"Not specified"}
                              />
                            ) : (
                              attribute.name
                            )}
                          </Td>
                          <Td display={{ base: "none", sm: "table-cell" }}>
                            {_.isEqual(attribute.description, "") ? (
                              <Warning
                                key={`warn-${attribute._id}`}
                                text={"Not specified"}
                              />
                            ) : (
                              <Text noOfLines={2}>
                                {attribute.description}
                              </Text>
                            )}
                          </Td>
                          <Td>
                            <Flex justify={"right"}>
                              <Button
                                key={`view-attribute-${attribute._id}`}
                                colorScheme={"blackAlpha"}
                                rightIcon={<Icon name={"c_right"} />}
                                onClick={() =>
                                  navigate(`/attributes/${attribute._id}`)
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
              <Text>There are no Attributes to display.</Text>
            )}
          </Flex>
        )
      ) : (
        <Loading />
      )}
    </Content>
  );
};

export default Attributes;
