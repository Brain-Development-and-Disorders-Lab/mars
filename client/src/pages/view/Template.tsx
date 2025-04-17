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
import TimestampTag from "@components/TimestampTag";
import VisibilityTag from "@components/VisibilityTag";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import { AttributeModel, GenericValueType, IValue } from "@types";

// Utility functions and libraries
import _ from "lodash";
import slugify from "slugify";
import FileSaver from "file-saver";

// Routing and navigation
import { useParams } from "react-router-dom";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

const Template = () => {
  const { id } = useParams();
  const toast = useToast();

  const [editing, setEditing] = useState(false);

  const [template, setTemplate] = useState({} as AttributeModel);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateArchived, setTemplateArchived] = useState(false);
  const [templateValues, setTemplateValues] = useState(
    [] as IValue<GenericValueType>[],
  );

  // State for dialog confirming if user should archive
  const archiveDialogRef = useRef();
  const {
    isOpen: isArchiveDialogOpen,
    onOpen: onArchiveDialogOpen,
    onClose: onArchiveDialogClose,
  } = useDisclosure();

  // GraphQL operations
  const GET_TEMPLATE = gql`
    query GetTemplate($_id: String) {
      template(_id: $_id) {
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
  const { loading, error, data, refetch } = useQuery(GET_TEMPLATE, {
    variables: {
      _id: id,
    },
    fetchPolicy: "network-only",
  });

  // Query to get Template export contents
  const GET_TEMPLATE_EXPORT = gql`
    query GetTemplateExport($_id: String) {
      exportTemplate(_id: $_id)
    }
  `;
  const [exportTemplate, { error: exportError }] =
    useLazyQuery(GET_TEMPLATE_EXPORT);

  // Mutation to update Template
  const UPDATE_TEMPLATE = gql`
    mutation UpdateTemplate($template: AttributeInput) {
      updateTemplate(template: $template) {
        success
        message
      }
    }
  `;
  const [updateTemplate, { loading: updateLoading }] =
    useMutation(UPDATE_TEMPLATE);

  // Mutation to archive Template
  const ARCHIVE_TEMPLATE = gql`
    mutation ArchiveTemplate($_id: String, $state: Boolean) {
      archiveTemplate(_id: $_id, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveTemplate, { loading: archiveLoading }] =
    useMutation(ARCHIVE_TEMPLATE);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.template) {
      // Unpack all the Entity data
      setTemplate(data.template);
      setTemplateName(data.template.name);
      setTemplateArchived(data.template.archived);
      setTemplateDescription(data.template.description || "");
      setTemplateValues(data.template.values);
    }
  }, [loading]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        status: "error",
        description: "Unable to retrieve Template information",
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

  // Archive the Template when confirmed
  const handleArchiveClick = async () => {
    const response = await archiveTemplate({
      variables: {
        _id: template._id,
        state: true,
      },
    });

    if (response.data.archiveTemplate.success) {
      toast({
        title: "Archived Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setTemplateArchived(true);
      onArchiveDialogClose();
    } else {
      toast({
        title: "Error",
        description: "An error occurred while archiving Template",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    setEditing(false);
  };

  // Restore the Template
  const handleRestoreFromArchiveClick = async () => {
    const response = await archiveTemplate({
      variables: {
        _id: template._id,
        state: false,
      },
    });

    if (response.data.archiveTemplate.success) {
      toast({
        title: "Restored Template successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setTemplateArchived(false);
      onArchiveDialogClose();
    } else {
      toast({
        title: "Error",
        description: "An error occurred while restoring Template",
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
      const response = await updateTemplate({
        variables: {
          template: {
            _id: template._id,
            name: templateName,
            description: templateDescription,
            values: templateValues,
          },
        },
      });
      if (response.data.updateTemplate.success) {
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

  /**
   * Handle the export button being clicked
   */
  const handleDownloadClick = async () => {
    // Send query to generate data
    const response = await exportTemplate({
      variables: {
        _id: id,
      },
    });

    if (response.data.exportTemplate) {
      FileSaver.saveAs(
        new Blob([response.data.exportTemplate]),
        slugify(`${templateName.replace(" ", "")}_export.json`),
      );

      toast({
        title: "Info",
        description: `Generated JSON file`,
        status: "info",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    if (exportError) {
      toast({
        title: "Error",
        description: "An error occurred exporting this Project",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
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
            <Icon name={"template"} size={"md"} />
            <Heading fontWeight={"semibold"} size={"md"}>
              {template.name}
            </Heading>
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
            {/* Actions Menu */}
            <Menu id={"actionsMenu"}>
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
                  onClick={handleDownloadClick}
                  isDisabled={editing || templateArchived}
                >
                  Export
                </MenuItem>
                <MenuItem
                  onClick={onArchiveDialogOpen}
                  icon={<Icon name={"archive"} />}
                  isDisabled={templateArchived}
                >
                  Archive
                </MenuItem>
              </MenuList>
            </Menu>

            {templateArchived ? (
              <Button
                id={"restoreTemplateButton"}
                onClick={handleRestoreFromArchiveClick}
                size={"sm"}
                colorScheme={"orange"}
                rightIcon={<Icon name={"rewind"} />}
              >
                Restore
              </Button>
            ) : (
              <Button
                id={"editTemplateButton"}
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

            {/* Archive Dialog */}
            <Dialog
              dialogRef={archiveDialogRef}
              header={"Archive Template"}
              rightButtonAction={handleArchiveClick}
              isOpen={isArchiveDialogOpen}
              onOpen={onArchiveDialogOpen}
              onClose={onArchiveDialogClose}
            >
              <Text>
                Are you sure you want to archive this Template? It can be
                restored any time from the Workspace archives.
              </Text>
            </Dialog>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"2"} p={"2"} wrap={"wrap"}>
          {/* Overview and "Description" field */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"}>
            {/* Overview */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              bg={"gray.100"}
              rounded={"md"}
              grow={"1"}
            >
              <Flex direction={"row"} gap={"2"}>
                <Flex direction={"column"} gap={"1"} grow={"1"}>
                  <Text fontWeight={"bold"} fontSize={"sm"}>
                    Name
                  </Text>
                  <Input
                    id={"attributeNameInput"}
                    size={"sm"}
                    value={templateName}
                    onChange={(event) => {
                      setTemplateName(event.target.value);
                    }}
                    isReadOnly={!editing}
                    bg={"white"}
                    rounded={"md"}
                    border={"1px"}
                    borderColor={"gray.300"}
                  />
                </Flex>

                <TimestampTag
                  timestamp={template.timestamp}
                  description={"Created"}
                />
              </Flex>

              <Flex gap={"2"} direction={"row"}>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"sm"}>
                    Visibility
                  </Text>
                  <VisibilityTag isPublic={false} isInherited />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"sm"}>
                    Owner
                  </Text>
                  <ActorTag orcid={template.owner} fallback={"No Owner"} />
                </Flex>
              </Flex>
            </Flex>

            {/* Description */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"1"}
              border={"1px"}
              borderColor={"gray.300"}
              rounded={"md"}
              basis={"40%"}
              grow={"1"}
            >
              <Text fontWeight={"bold"} fontSize={"sm"}>
                Description
              </Text>
              <MDEditor
                height={150}
                minHeight={100}
                maxHeight={400}
                id={"attributeDescriptionInput"}
                style={{ width: "100%" }}
                value={templateDescription}
                preview={editing ? "edit" : "preview"}
                extraCommands={[]}
                onChange={(value) => {
                  setTemplateDescription(value || "");
                }}
              />
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
              values={templateValues}
              setValues={setTemplateValues}
            />
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Template;
