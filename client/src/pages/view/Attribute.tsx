// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";
import Dialog from "@components/Dialog";
import ActorTag from "@components/ActorTag";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import { AttributeModel, IValue } from "@types";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

// Routing and navigation
import { useParams } from "react-router-dom";
import { gql, useMutation, useQuery } from "@apollo/client";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

const Attribute = () => {
  const { id } = useParams();
  const toast = useToast();

  const [editing, setEditing] = useState(false);

  const [attributeData, setAttributeData] = useState({} as AttributeModel);
  const [attributeName, setAttributeName] = useState("");
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
        timestamp
        owner
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
      setAttributeName(data.attribute.name);
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

  const { workspace } = useWorkspace();

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
            name: attributeName,
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
      isLoaded={!loading && !updateLoading && !archiveLoading}
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
                id={"restoreAttributeButton"}
                onClick={handleRestoreFromArchiveClick}
                size={"sm"}
                colorScheme={"orange"}
                rightIcon={<Icon name={"rewind"} />}
              >
                Restore
              </Button>
            ) : (
              <Button
                id={"editAttributeButton"}
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
                colorScheme={"yellow"}
                rightIcon={<Icon name={"lightning"} />}
              >
                Actions
              </MenuButton>
              <MenuList>
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

        <Flex direction={"column"} gap={"2"} p={"2"}>
          <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
            <Flex
              direction={"row"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              bg={"gray.100"}
              grow={"1"}
              h={"fit-content"}
            >
              {/* "Name" field */}
              <Flex gap={"2"} direction={"column"} w={"100%"}>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"}>Name</Text>
                  <Flex>
                    <Input
                      size={"sm"}
                      value={attributeName}
                      onChange={(event) => {
                        setAttributeName(event.target.value || "");
                      }}
                      isReadOnly={!editing}
                      rounded={"md"}
                      border={"1px"}
                      borderColor={"gray.300"}
                      bg={"white"}
                    />
                  </Flex>
                </Flex>

                {/* "Created" and "Owner" fields */}
                <Flex direction={"row"} gap={"2"}>
                  <Flex direction={"column"} gap={"1"}>
                    <Text fontWeight={"bold"}>Owner</Text>
                    <Flex>
                      <ActorTag
                        orcid={attributeData.owner}
                        fallback={"Unknown User"}
                      />
                    </Flex>
                  </Flex>
                  <Flex direction={"column"} gap={"1"}>
                    <Text fontWeight={"bold"}>Created</Text>
                    <Flex align={"center"} gap={"1"}>
                      <Icon name={"v_date"} size={"sm"} />
                      <Text fontSize={"sm"}>
                        {dayjs(attributeData.timestamp).format("DD MMM YYYY")}
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>

            <Flex
              direction={"row"}
              p={"2"}
              gap={"2"}
              basis={"50%"}
              grow={"1"}
              border={"1px"}
              borderColor={"gray.300"}
              rounded={"md"}
            >
              {/* "Description" field */}
              <Flex gap={"2"} direction={"column"} w={"100%"}>
                <Text fontWeight={"bold"}>Description</Text>
                <Flex>
                  <MDEditor
                    style={{ width: "100%" }}
                    value={attributeDescription}
                    preview={editing ? "edit" : "preview"}
                    extraCommands={[]}
                    onChange={(value) => {
                      setAttributeDescription(value || "");
                    }}
                  />
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          <Flex
            p={"2"}
            pb={"0"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.300"}
          >
            <Values
              viewOnly={!editing}
              values={attributeValues}
              setValues={setAttributeValues}
            />
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Attribute;
