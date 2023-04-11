import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Flex,
  Heading,
  Icon,
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
import { BsGear } from "react-icons/bs";

// Custom components
import { Error } from "@components/Error";
import ParameterGroup from "@components/ParameterGroup";
import { Loading } from "@components/Loading";
import { ContentContainer } from "@components/ContentContainer";

// Database and models
import { getData } from "@database/functions";
import { AttributeModel } from "@types";

import _ from "lodash";

export const Attribute = () => {
  const { id } = useParams();
  const toast = useToast();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [attributeData, setAttributeData] = useState({} as AttributeModel);

  useEffect(() => {
    // Populate Attribute data
    getData(`/attributes/${id}`)
      .then((response) => {
        setAttributeData(response);
      }).catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Attribute data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      }).finally(() => {
        setIsLoaded(true);
      });
  }, [id, isLoaded]);

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
            p={"2"}
            pt={"8"}
            pb={"8"}
            direction={"row"}
            justify={"space-between"}
            align={"center"}
            wrap={"wrap"}
          >
            <Flex align={"center"} gap={"4"} shadow={"lg"} p={"2"} border={"2px"} rounded={"10px"}>
              <Icon as={BsGear} w={"8"} h={"8"} />
              <Heading fontWeight={"semibold"}>{attributeData.name}</Heading>
            </Flex>
          </Flex>

          <Flex direction={"row"} gap={"4"} wrap={"wrap"}>
            <Flex
              direction={"column"}
              p={"4"}
              gap={"2"}
              grow={"1"}
              h={"fit-content"}
              bg={"whitesmoke"}
              rounded={"10px"}
            >
              {/* Details */}
              <Heading fontWeight={"semibold"} size={"lg"}>Details</Heading>

              <TableContainer>
                <Table variant={"simple"} colorScheme={"blackAlpha"}>
                  <Thead>
                    <Tr>
                      <Th>Field</Th>
                      <Th>Value</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>Description</Td>
                      <Td>
                        <Text>{attributeData.description}</Text>
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </Flex>
            <Flex
              direction={"column"}
              p={"4"}
              gap={"2"}
              grow={"1"}
              h={"fit-content"}
              bg={"whitesmoke"}
              rounded={"10px"}
            >
              <Heading fontWeight={"semibold"} size={"lg"}>Parameters</Heading>

              {attributeData.parameters && attributeData.parameters.length > 0 ? (
                <ParameterGroup parameters={attributeData.parameters} viewOnly />
              ) : (
                <Text>No parameters.</Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      )
    ) : (
      <Loading />
    )}
  </ContentContainer>
  );
};

export default Attribute;
