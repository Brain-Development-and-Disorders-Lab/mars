import React, { useEffect, useState } from "react";
import { Flex, Heading, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useToast } from "@chakra-ui/react";

// Custom components
import ParameterGroup from "@components/ParameterGroup";
import { Loading } from "@components/Loading";
import { PageContainer } from "@components/PageContainer";

// Navigation
import { useParams } from "react-router-dom";

// Database and models
import { getData } from "@database/functions";
import { AttributeModel } from "@types";

import _ from "underscore";

export const Attribute = () => {
  const { id } = useParams();
  const toast = useToast();

  const [isLoaded, setIsLoaded] = useState(false);
  const [attributeData, setAttributeData] = useState({} as AttributeModel);

  useEffect(() => {
    // Populate Attribute data
    getData(`/attributes/${id}`).then((response) => {
      if(_.isEqual(response.status, "error")) {
        throw new Error(response.error);
      } else {
        setAttributeData(response);
        setIsLoaded(true);
      }
    }).catch(() => {
      toast({
        title: "Database Error",
        description: "Error retrieving Entity data",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    });
  }, [id, isLoaded]);

  return (
    isLoaded ? (
      <PageContainer>
         <Flex p={"2"} pt={"8"} pb={"8"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          <Heading size={"2xl"}>Attribute:{" "}{attributeData.name}</Heading>
        </Flex>

        <Flex direction={"column"} p={"2"} gap={"2"}>
          {/* Metadata table */}
          <Heading m={"0"}>
            Metadata
          </Heading>

          <TableContainer background={"gray.50"} rounded={"2xl"} p={"4"}>
            <Table mt={"sm"} colorScheme={"gray"}>
              <Thead>
                <Tr>
                  <Th>Field</Th>
                  <Th>Value</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>Description</Td>
                  <Td><Text>{attributeData.description}</Text></Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Flex>
        <Flex direction={"column"} p={"2"} gap={"2"}>
          <Heading m={"0"}>
            Parameters
          </Heading>

          {attributeData.parameters && attributeData.parameters.length > 0 ?
            <ParameterGroup parameters={attributeData.parameters} viewOnly />
          :
            <Text>No parameters.</Text>
          }
        </Flex>
      </PageContainer>
    ) : (
      <Loading />
    )
  );
};

export default Attribute;
