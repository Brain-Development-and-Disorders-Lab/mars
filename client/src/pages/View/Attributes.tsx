import React, { useEffect, useState } from "react";
import {
  Button,
  Flex,
  Heading,
  Icon,
  Link,
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
import { ChevronRightIcon, AddIcon } from "@chakra-ui/icons";
import { BsGear } from "react-icons/bs";

// Custom components
import { Loading } from "@components/Loading";
import { WarningLabel } from "@components/Label";
import { ContentContainer } from "@components/ContentContainer";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "@database/functions";
import { AttributeModel } from "@types";

import _ from "underscore";

const Attributes = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoaded, setIsLoaded] = useState(false);
  const [attributesData, setAttributesData] = useState([] as AttributeModel[]);

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
          <Icon as={BsGear} w={"8"} h={"8"} />
          <Heading fontWeight={"semibold"}>Attributes</Heading>
        </Flex>
        <Button
          rightIcon={<AddIcon />}
          as={Link}
          href={"/create/attribute/start"}
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
        background={"whitesmoke"}
        flexWrap={"wrap"}
        gap={"6"}
      >
        {isLoaded && attributesData.length > 0 ? (
          <TableContainer w={"full"}>
            <Table variant={"simple"} colorScheme={"blackAlpha"}>
              <Thead>
                <Tr>
                  <Th>
                    <Heading size={"sm"}>Name</Heading>
                  </Th>
                  <Th>
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
                          <WarningLabel
                            key={`warn-${attribute._id}`}
                            text={"Not specified"}
                          />
                        ) : (
                          attribute.name
                        )}
                      </Td>
                      <Td>
                        {_.isEqual(attribute.description, "") ? (
                          <WarningLabel
                            key={`warn-${attribute._id}`}
                            text={"Not specified"}
                          />
                        ) : (
                          <Text noOfLines={2}>{attribute.description}</Text>
                        )}
                      </Td>
                      <Td>
                        <Flex justify={"right"}>
                          <Button
                            key={`view-attribute-${attribute._id}`}
                            colorScheme={"blackAlpha"}
                            rightIcon={<ChevronRightIcon />}
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
    </ContentContainer>
  ) : (
    <Loading />
  );
};

export default Attributes;
