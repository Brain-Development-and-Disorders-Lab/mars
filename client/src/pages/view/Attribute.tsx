// React
import React, { useContext, useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
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
import { useParams } from "react-router-dom";
import { gql, useMutation, useQuery } from "@apollo/client";

// Workspace context
import { WorkspaceContext } from "../../Context";

const Attribute = () => {
  const { id } = useParams();
  const toast = useToast();

  const [editing, setEditing] = useState(false);

  const [attributeData, setAttributeData] = useState({} as AttributeModel);
  const [attributeDescription, setAttributeDescription] = useState("");
  const [attributeArchived, setAttributeArchived] = useState(false);
  const [attributeValues, setAttributeValues] = useState([] as IValue<any>[]);

  // State for dialog confirming if user should archive
  const archiveDialogRef = useRef();
  const {
    isOpen: isArchiveDialogOpen,
    onOpen: onArchiveDialogOpen,
    onClose: onArchiveDialogClose,
  } = useDisclosure();

  // GraphQL operations
  const GET_ATTRIBUTE = gql`
    query GetAttribute($_id: String) {
      attribute(_id: $_id) {
        _id
        name
        archived
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

  // Mutation to archive Attribute
  const ARCHIVE_ATTRIBUTE = gql`
    mutation ArchiveAttribute($_id: String, $state: Boolean) {
      archiveAttribute(_id: $_id, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveAttribute, { loading: archiveLoading }] =
    useMutation(ARCHIVE_ATTRIBUTE);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.attribute) {
      // Unpack all the Entity data
      setAttributeData(data.attribute);
      setAttributeArchived(data.attribute.archived);
      setAttributeDescription(data.attribute.description || "");
      setAttributeValues(data.attribute.values);
    }
  }, [loading]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        status: "error",
        description: "Unable to retrieve Attribute information",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [error]);

  const { workspace, workspaceLoading } = useContext(WorkspaceContext);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

  // Archive the Attribute when confirmed
  const handleArchiveClick = async () => {
    const response = await archiveAttribute({
      variables: {
        _id: attributeData._id,
        state: true,
      },
    });

    if (response.data.archiveAttribute.success) {
      toast({
        title: "Archived Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setAttributeArchived(true);
      onArchiveDialogClose();
    } else {
      toast({
        title: "Error",
        description: "An error occurred while archiving Attribute",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    setEditing(false);
  };

  // Restore the Attribute
  const handleRestoreFromArchiveClick = async () => {
    const response = await archiveAttribute({
      variables: {
        _id: attributeData._id,
        state: false,
      },
    });

    if (response.data.archiveAttribute.success) {
      toast({
        title: "Restored Attribute successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setAttributeArchived(false);
      onArchiveDialogClose();
    } else {
      toast({
        title: "Error",
        description: "An error occurred while restoring Attribute",
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
      isLoaded={
        !loading && !updateLoading && !archiveLoading && !workspaceLoading
      }
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
            {attributeArchived ? (
              <Button
                onClick={handleRestoreFromArchiveClick}
                size={"sm"}
                colorScheme={"orange"}
                rightIcon={<Icon name={"rewind"} />}
              >
                Restore
              </Button>
            ) : (
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
            )}

            {/* Actions Menu */}
            <Menu>
              <MenuButton
                as={Button}
                size={"sm"}
                colorScheme={"blue"}
                rightIcon={<Icon name={"c_down"} />}
              >
                Actions
              </MenuButton>
              <MenuList>
                <MenuItem icon={<Icon name={"clock"} />}>History</MenuItem>
                <MenuItem
                  icon={<Icon name={"download"} />}
                  isDisabled={editing || attributeArchived}
                >
                  Export
                </MenuItem>
                <MenuItem
                  onClick={onArchiveDialogOpen}
                  icon={<Icon name={"archive"} />}
                  isDisabled={attributeArchived}
                >
                  Archive
                </MenuItem>
              </MenuList>
            </Menu>

            {/* Archive Dialog */}
            <Dialog
              dialogRef={archiveDialogRef}
              header={"Archive Attribute"}
              rightButtonAction={handleArchiveClick}
              isOpen={isArchiveDialogOpen}
              onOpen={onArchiveDialogOpen}
              onClose={onArchiveDialogClose}
            >
              <Text>
                Are you sure you want to archive this Attribute? It can be
                restored any time from the Workspace archive
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
