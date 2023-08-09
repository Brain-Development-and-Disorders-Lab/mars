// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
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
  Tbody,
  Td,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";

// Existing and custom types
import { AttributeModel, IValue } from "@types";

// Utility functions and libraries
import { deleteData, getData, postData } from "@database/functions";
import _ from "lodash";

// Routing and navigation
import { useNavigate, useParams } from "react-router-dom";

const Attribute = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [editing, setEditing] = useState(false);

  const [attributeData, setAttributeData] = useState({} as AttributeModel);
  const [attributeDescription, setAttributeDescription] = useState("");
  const [attributeValues, setAttributeValues] = useState([] as IValue<any>[]);

  useEffect(() => {
    // Populate Attribute data
    getData(`/attributes/${id}`)
      .then((response) => {
        setAttributeData(response);
        setAttributeDescription(response.description);
        setAttributeValues(response.values);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Attribute data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
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
      })
      .catch(() => {
        toast({
          title: "Error",
          description: `An error occurred when deleting Attribute "${attributeData.name}".`,
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
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
        values: attributeValues,
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
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "An error occurred when saving updates.",
            status: "error",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        })
        .finally(() => {
          setEditing(false);
        });
    } else {
      setEditing(true);
    }
  };

  return (
    <Content isError={isError} isLoaded={isLoaded}>
      <Flex direction={"column"} gap={"4"}>
        <Flex
          gap={"4"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
          wrap={"wrap"}
        >
          <Flex
            align={"center"}
            gap={"4"}
            shadow={"lg"}
            p={"2"}
            border={"2px"}
            rounded={"md"}
            bg={"white"}
          >
            <Icon name={"attribute"} size={"lg"} />
            <Heading fontWeight={"semibold"}>
              Attribute: {attributeData.name}
            </Heading>
          </Flex>

          {/* Buttons */}
          <Flex
            direction={"row"}
            gap={"4"}
            wrap={"wrap"}
            bg={"white"}
            p={"4"}
            rounded={"md"}
          >
            {editing && (
              <Popover>
                <PopoverTrigger>
                  <Button
                    colorScheme={"red"}
                    rightIcon={<Icon name={"delete"} />}
                  >
                    Delete
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverHeader>Confirmation</PopoverHeader>
                  <PopoverBody>
                    Are you sure you want to delete this Attribute? It will not
                    be removed from any existing Entities.
                    <Flex direction={"row"} p={"2"} justify={"center"}>
                      <Button
                        colorScheme={"green"}
                        rightIcon={<Icon name={"check"} />}
                        onClick={handleDeleteClick}
                      >
                        Confirm
                      </Button>
                    </Flex>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            )}
            <Button
              colorScheme={editing ? "green" : "gray"}
              rightIcon={
                editing ? <Icon name={"check"} /> : <Icon name={"edit"} />
              }
              onClick={handleEditClick}
            >
              {editing ? "Done" : "Edit"}
            </Button>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"4"} wrap={"wrap"}>
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
            <Heading fontWeight={"semibold"} size={"lg"}>
              Details
            </Heading>

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
                          <TagLabel>Not Specified</TagLabel>
                          <Icon name={"warning"} />
                        </Tag>
                      ) : (
                        <Textarea
                          value={attributeDescription}
                          onChange={(event) => {
                            setAttributeDescription(event.target.value);
                          }}
                          disabled={!editing}
                        />
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
            <Heading fontWeight={"semibold"} size={"lg"}>
              Values
            </Heading>

            {attributeData.values && (
              <Values
                collection={attributeValues}
                viewOnly={!editing}
                setValues={setAttributeValues}
              />
            )}
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Attribute;
