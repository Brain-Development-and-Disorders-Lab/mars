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
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";
import AlertDialog from "@components/AlertDialog";
import ActorTag from "@components/ActorTag";
import TimestampTag from "@components/TimestampTag";
import { toaster } from "@components/Toast";
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
    open: archiveDialogOpen,
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
      toaster.create({
        title: "Error",
        type: "error",
        description: "Unable to retrieve Template information",
        duration: 4000,
        closable: true,
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
      toaster.create({
        title: "Archived Successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setTemplateArchived(true);
      onArchiveDialogClose();
    } else {
      toaster.create({
        title: "Error",
        description: "An error occurred while archiving Template",
        type: "error",
        duration: 2000,
        closable: true,
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
      toaster.create({
        title: "Restored Template successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setTemplateArchived(false);
      onArchiveDialogClose();
    } else {
      toaster.create({
        title: "Error",
        description: "An error occurred while restoring Template",
        type: "error",
        duration: 2000,
        closable: true,
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
        toaster.create({
          title: "Updated Successfully",
          type: "success",
          duration: 2000,
          closable: true,
        });
      } else {
        toaster.create({
          title: "Error",
          description: "An error occurred when saving updates.",
          type: "error",
          duration: 2000,
          closable: true,
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

      toaster.create({
        title: "Info",
        description: `Generated JSON file`,
        type: "info",
        duration: 2000,
        closable: true,
      });
    }

    if (exportError) {
      toaster.create({
        title: "Error",
        description: "An error occurred exporting this Project",
        type: "error",
        duration: 2000,
        closable: true,
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
              <MenuButton as={Button} size={"sm"} colorPalette={"yellow"}>
                Actions
                <Icon name={"lightning"} />
              </MenuButton>
              <MenuList>
                <MenuItem
                  icon={<Icon name={"download"} />}
                  onClick={handleDownloadClick}
                  disabled={editing || templateArchived}
                >
                  Export
                </MenuItem>
                <MenuItem
                  onClick={onArchiveDialogOpen}
                  icon={<Icon name={"archive"} />}
                  disabled={templateArchived}
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
                colorPalette={"orange"}
              >
                Restore
                <Icon name={"rewind"} />
              </Button>
            ) : (
              <Button
                id={"editTemplateButton"}
                size={"sm"}
                colorPalette={editing ? "green" : "blue"}
                onClick={handleEditClick}
              >
                {editing ? "Done" : "Edit"}
                {editing ? <Icon name={"check"} /> : <Icon name={"edit"} />}
              </Button>
            )}

            {/* Archive Dialog */}
            <AlertDialog
              dialogRef={archiveDialogRef}
              header={"Archive Template"}
              rightButtonAction={handleArchiveClick}
              open={archiveDialogOpen}
              onOpen={onArchiveDialogOpen}
              onClose={onArchiveDialogClose}
            >
              <Text>
                Are you sure you want to archive this Template? It can be
                restored any time from the Workspace archives.
              </Text>
            </AlertDialog>
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
