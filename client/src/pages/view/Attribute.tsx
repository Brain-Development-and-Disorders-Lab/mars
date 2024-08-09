// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Tag,
  TagLabel,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";
import Dialog from "@components/Dialog";

// Existing and custom types
import { AttributeModel, IValue } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Routing and navigation
import { useNavigate, useParams } from "react-router-dom";
import { gql, useMutation, useQuery } from "@apollo/client";

const Attribute = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);

  const [attributeData, setAttributeData] = useState({} as AttributeModel);
  const [attributeDescription, setAttributeDescription] = useState("");
  const [attributeValues, setAttributeValues] = useState([] as IValue<any>[]);

  // State for dialog confirming if user should delete
  const deleteDialogRef = useRef();
  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onDeleteDialogOpen,
    onClose: onDeleteDialogClose,
  } = useDisclosure();

  // GraphQL operations
  const GET_ATTRIBUTE = gql`
    query GetAttribute($_id: String) {
      attribute(_id: $_id) {
        _id
        name
        description
        values {
          _id
          name
          type
          data
        }
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery(GET_ATTRIBUTE, {
    variables: {
      _id: id,
    },
    fetchPolicy: "network-only",
  });

  // Mutation to update Attribute
  const UPDATE_ATTRIBUTE = gql`
    mutation UpdateAttribute($attribute: AttributeInput) {
      updateAttribute(attribute: $attribute) {
        success
        message
      }
    }
  `;
  const [updateAttribute, { loading: updateLoading }] =
    useMutation(UPDATE_ATTRIBUTE);

  // Mutation to delete Attribute
  const DELETE_ATTRIBUTE = gql`
    mutation DeleteAttribute($_id: String) {
      deleteAttribute(_id: $_id) {
        success
        message
      }
    }
  `;
  const [deleteAttribute, { loading: deleteLoading }] =
    useMutation(DELETE_ATTRIBUTE);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.attribute) {
      // Unpack all the Entity data
      setAttributeData(data.attribute);
      setAttributeDescription(data.attribute.description || "");
      setAttributeValues(data.attribute.values);
    }
  }, [loading]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        status: "error",
        description: error.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [error]);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  // Delete the Attribute when confirmed
  const handleDeleteClick = async () => {
    const response = await deleteAttribute({
      variables: {
        _id: attributeData._id,
      },
    });
    if (response.data.deleteAttribute.success) {
      toast({
        title: "Deleted Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      navigate("/attributes");
    } else {
      toast({
        title: "Error",
        description: "An error occurred when deleting Attribute",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
    setEditing(false);
  };

  /**
   * Handle the edit button being clicked
   */
  const handleEditClick = async () => {
    if (editing) {
      const response = await updateAttribute({
        variables: {
          attribute: {
            _id: attributeData._id,
            name: attributeData.name,
            description: attributeDescription,
            values: attributeValues,
          },
        },
      });
      if (response.data.updateAttribute.success) {
        toast({
          title: "Updated Successfully",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      } else {
        toast({
          title: "Error",
          description: "An error occurred when saving updates.",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      }
      setEditing(false);
    } else {
      setEditing(true);
    }
  };

  return (
    <Content
      isError={!_.isUndefined(error)}
      isLoaded={!loading && !updateLoading && !deleteLoading}
    >
      <Flex direction={"column"}>
        <Flex
          gap={"2"}
          p={"2"}
          pb={{ base: "2", lg: "0" }}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
          wrap={"wrap"}
        >
          <Flex
            align={"center"}
            gap={"2"}
            p={"2"}
            border={"2px"}
            rounded={"md"}
          >
            <Icon name={"attribute"} size={"md"} />
            <Heading fontWeight={"semibold"} size={"md"}>
              {attributeData.name}
            </Heading>
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
            <Button
              size={"sm"}
              colorScheme={editing ? "green" : "blue"}
              rightIcon={
                editing ? <Icon name={"check"} /> : <Icon name={"edit"} />
              }
              onClick={handleEditClick}
            >
              {editing ? "Done" : "Edit"}
            </Button>

            {/* Delete Dialog */}
            <Dialog
              dialogRef={deleteDialogRef}
              header={"Delete Entity"}
              rightButtonAction={handleDeleteClick}
              isOpen={isDeleteDialogOpen}
              onOpen={onDeleteDialogOpen}
              onClose={onDeleteDialogClose}
            >
              <Text>
                Are you sure you want to delete this Attribute? It will not be
                removed from any existing Entities
              </Text>
            </Dialog>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            p={"2"}
            pt={{ base: "0", lg: "2" }}
            gap={"2"}
            grow={"1"}
            rounded={"md"}
          >
            <Flex
              direction={"column"}
              p={"2"}
              border={"1px"}
              borderColor={"gray.200"}
              rounded={"md"}
            >
              {/* Attribute Overview */}
              <Flex gap={"2"} grow={"1"} direction={"column"} minH={"32"}>
                {/* Details */}
                <Flex direction={"row"} gap={"2"}>
                  <Text fontWeight={"semibold"}>Value Count</Text>
                  <Tag colorScheme={"purple"}>
                    <TagLabel>{attributeValues.length}</TagLabel>
                  </Tag>
                </Flex>
                <Text fontWeight={"semibold"}>Description</Text>
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
                    isReadOnly={!editing}
                    bg={"white"}
                    border={"1px"}
                    borderColor={"gray.200"}
                  />
                )}
              </Flex>
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            p={"2"}
            pt={{ base: "0", lg: "2" }}
            gap={"2"}
            grow={"1"}
          >
            <Flex
              p={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.200"}
            >
              <Values
                viewOnly={!editing}
                values={attributeValues}
                setValues={setAttributeValues}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Attribute;
