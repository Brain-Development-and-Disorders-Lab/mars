import React, { useEffect, useState } from "react";
import { Box, Button, Flex, Heading, Table, TableContainer, Tbody, Text, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import { ChevronRightIcon, AddIcon } from "@chakra-ui/icons";
import { Loading } from "src/components/Loading";

// Navigation
import { useNavigate, Link as RouterLink } from "react-router-dom";

// Database and models
import { getData } from "src/database/functions";
import { AttributeModel } from "types";

import _ from "underscore";
import { WarningLabel } from "src/components/Label";

const Attributes = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoaded, setIsLoaded] = useState(false);
  const [attributesData, setAttributesData] = useState(
    [] as AttributeModel[]
  );

  useEffect(() => {
    const response = getData(`/attributes`);

    // Handle the response from the database
    response.then((value) => {
      setAttributesData(value);

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
      <Box m={"2"}>
        <Flex p={"2"} pt={"8"} pb={"8"} direction={"row"} justify={"space-between"} align={"center"}>
          <Heading size={"3xl"}>Attributes</Heading>
          <Button
            rightIcon={<AddIcon />}
            as={RouterLink}
            to={"/create/attribute/start"}
            colorScheme={"green"}
          >
            Create
          </Button>
        </Flex>

        <Flex m={"2"} p={"4"} direction={"row"} rounded={"2xl"} background={"teal.300"} flexWrap={"wrap"} gap={"6"}>
          {isLoaded && attributesData.length > 0 ? (
            <TableContainer w={"full"}>
              <Table variant={"simple"} colorScheme={"teal"}>
                <Thead>
                  <Tr>
                    <Th pl={"0"}><Heading color={"white"} size={"sm"}>Name</Heading></Th>
                    <Th><Heading color={"white"} size={"sm"}>Description</Heading></Th>
                    <Th pr={"0"}></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {attributesData.map((attribute) => {
                    return (
                      <Tr key={attribute._id}>
                        <Th pl={"0"} color={"white"}>{
                          _.isEqual(attribute.name, "") ?
                            <WarningLabel key={`warn-${attribute._id}`} text={"Not specified"} />
                          :
                            attribute.name
                        }</Th>
                        <Th color={"white"}>{
                          _.isEqual(attribute.description, "") ?
                            <WarningLabel key={`warn-${attribute._id}`} text={"Not specified"} />
                          :
                            <Text noOfLines={2}>{attribute.description}</Text>
                        }</Th>
                        <Th pr={"0"}>
                          <Flex justify={"right"}>
                            <Button
                              key={`view-attribute-${attribute._id}`}
                              color="grey.400"
                              rightIcon={<ChevronRightIcon />}
                              onClick={() => navigate(`/attributes/${attribute._id}`)}
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
            <Text>There are no Attributes to display.</Text>
          )}
        </Flex>
      </Box>
    :
      <Loading />
  );
};

export default Attributes;
