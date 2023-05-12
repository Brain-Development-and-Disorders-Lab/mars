import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Flex,
  Heading,
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Table,
  TableContainer,
  Tag,
  TagLabel,
  TagRightIcon,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { BsCheckLg, BsExclamationTriangle, BsPencil, BsPuzzle, BsTrash } from "react-icons/bs";

// Custom components
import { Error } from "@components/Error";
import ParameterGroup from "@components/ParameterGroup";
import { Loading } from "@components/Loading";
import { ContentContainer } from "@components/ContentContainer";

// Database and models
import { deleteData, getData, postData } from "@database/functions";
import { AttributeModel, Parameters } from "@types";

import _ from "lodash";

export const Attribute = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [editing, setEditing] = useState(false);

  const [attributeData, setAttributeData] = useState({} as AttributeModel);
  const [attributeDescription, setAttributeDescription] = useState("");
  const [attributeParameters, setAttributeParameters] = useState([] as Parameters[]);

  useEffect(() => {
    // Populate Attribute data
    getData(`/attributes/${id}`)
      .then((response) => {
        setAttributeData(response);
        setAttributeDescription(response.description);
        setAttributeParameters(response.parameters);
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

  // Delete the Attribute when confirmed
  const handleDeleteClick = () => {
    // Update data
    deleteData(`/attributes/${id}`)
      .then((_response) => {
        toast({
          title: "Deleted!",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      }).catch(() => {
        toast({
          title: "Error",
          description: `An error occurred when deleting Attribute "${attributeData.name}".`,
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      }).finally(() => {
        setEditing(false);
        navigate("/attributes");
      });
  };

  /**
   * Handle the edit button being clicked
   */
  const handleEditClick = () => {
    if (editing) {
      const updateData: AttributeModel = {
        _id: attributeData._id,
        name: attributeData.name,
        description: attributeDescription,
        parameters: attributeParameters,
      };

      // Update data
      postData(`/attributes/update`, updateData)
        .then((_response) => {
          toast({
            title: "Saved!",
            status: "success",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        }).catch(() => {
          toast({
            title: "Error",
            description: "An error occurred when saving updates.",
            status: "error",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        }).finally(() => {
          setEditing(false);
        });
    } else {
      setEditing(true);
    }
  };

  return (
  <ContentContainer vertical={isError || !isLoaded}>
    {isLoaded ? (
      isError ? (
        <Error />
      ) : (
        <Flex direction={"column"}>
          <Flex
            p={"2"}
            gap={"4"}
            direction={"row"}
            justify={"space-between"}
            align={"center"}
            wrap={"wrap"}
          >
            <Flex align={"center"} gap={"4"} shadow={"lg"} p={"2"} border={"2px"} rounded={"md"} bg={"white"}>
              <Icon as={BsPuzzle} w={"8"} h={"8"} />
              <Heading fontWeight={"semibold"}>{attributeData.name}</Heading>
            </Flex>

            {/* Buttons */}
            <Flex direction={"row"} gap={"4"} wrap={"wrap"} bg={"white"} p={"4"} rounded={"md"}>
              {editing &&
                <Popover>
                  <PopoverTrigger>
                    <Button colorScheme={"red"} rightIcon={<Icon as={BsTrash} />}>
                      Delete
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>Confirmation</PopoverHeader>
                    <PopoverBody>
                      Are you sure you want to delete this Attribute? It will not be removed from any existing Entities.
                      <Flex direction={"row"} p={"2"} justify={"center"}>
                        <Button
                          colorScheme={"green"}
                          rightIcon={<Icon as={BsCheckLg} />}
                          onClick={handleDeleteClick}
                        >
                          Confirm
                        </Button>
                      </Flex>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              }
              <Button
                colorScheme={editing ? "green" : "gray"}
                rightIcon={
                  editing ? <Icon as={BsCheckLg} /> : <Icon as={BsPencil} />
                }
                onClick={handleEditClick}
              >
                {editing ? "Done" : "Edit"}
              </Button>
            </Flex>
          </Flex>

          <Flex direction={"row"} gap={"4"} p={"2"} wrap={"wrap"}>
            <Flex
              direction={"column"}
              p={"4"}
              gap={"2"}
              grow={"1"}
              h={"fit-content"}
              bg={"white"}
              rounded={"md"}
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
                        {_.isEqual(attributeData.description, "") ? (
                          <Tag
                            size={"md"}
                            key={`warn-${attributeData._id}`}
                            colorScheme={"orange"}
                          >
                            <TagLabel>Not specified</TagLabel>
                            <TagRightIcon as={BsExclamationTriangle} />
                          </Tag>
                        ) : (
                          editing ? (
                            <Textarea
                              value={attributeDescription}
                              onChange={(event) => {
                                setAttributeDescription(event.target.value);
                              }}
                              disabled={!editing}
                            />
                          ) : (
                            <Text>{attributeDescription}</Text>
                          )
                        )}
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
              bg={"white"}
              rounded={"md"}
            >
              <Heading fontWeight={"semibold"} size={"lg"}>Parameters</Heading>

              {attributeData.parameters && attributeData.parameters.length > 0 ? (
                <ParameterGroup parameters={attributeParameters} viewOnly={!editing} setParameters={setAttributeParameters} />
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
