// React
import React, { useEffect, useMemo, useState } from "react";

// Existing and custom components
import {
  Breadcrumb,
  Button,
  EmptyState,
  Flex,
  Heading,
  Input,
  Menu,
  SkeletonText,
  Tag,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Content } from "@components/Container";
import HistoryDrawer from "@components/HistoryDrawer";
import Icon from "@components/Icon";
import Values from "@components/Values";
import AlertDialog from "@components/AlertDialog";
import ActorTag from "@components/ActorTag";
import DataTable from "@components/DataTable";
import Linky from "@components/Linky";
import TimestampTag from "@components/TimestampTag";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import VisibilityTag from "@components/VisibilityTag";
import ExportDialog from "@components/ExportDialog";
import SaveDialog from "@components/SaveDialog";

// Existing and custom types
import { AttributeHistory, AttributeModel, AttributeUsage, IValue, ResponseData, WorkspaceModel } from "@types";

// Utility functions and libraries
import { removeTypename } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";

// Routing and navigation
import { useNavigate, useParams } from "react-router-dom";

// GraphQL imports
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

// Hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { usePermissions } from "@hooks/usePermissions";
import { useWorkspace } from "@hooks/useWorkspace";

// Variables
import { STYLES } from "@variables";

const Template = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Permissions
  const { workspacePermissions } = usePermissions();

  // Workspace information
  const { workspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceIsPublic, setWorkspaceIsPublic] = useState(false);

  // Breakpoint
  const { isBreakpointActive } = useBreakpoint();

  const [editing, setEditing] = useState(false);

  const [template, setTemplate] = useState({} as AttributeModel);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateArchived, setTemplateArchived] = useState(false);
  const [templateValues, setTemplateValues] = useState<IValue[]>([]);
  const [templateUsage, setTemplateUsage] = useState<AttributeUsage[]>([]);
  const [templateHistory, setTemplateHistory] = useState<AttributeHistory[]>([]);

  const [exportOpen, setExportOpen] = useState(false);

  // State for dialog confirming if user should archive
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  // Save message dialog
  const [saveMessageOpen, setSaveMessageOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // History drawer
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<AttributeHistory | null>(null);

  // Computed values that use preview data when in preview mode
  const displayTemplateArchived = useMemo(() => {
    return previewVersion ? previewVersion.archived : templateArchived;
  }, [previewVersion, templateArchived]);

  const displayTemplateName = useMemo(() => {
    return previewVersion ? previewVersion.name : templateName;
  }, [previewVersion, templateName]);

  const displayTemplateDescription = useMemo(() => {
    return previewVersion ? previewVersion.description || "" : templateDescription;
  }, [previewVersion, templateDescription]);

  const displayTemplateValues = useMemo(() => {
    return previewVersion ? previewVersion.values : templateValues;
  }, [previewVersion, templateValues]);

  // GraphQL operations
  const GET_TEMPLATE = gql`
    query GetTemplate($_id: String, $workspace: String) {
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
        history {
          author
          message
          timestamp
          version
          _id
          name
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
      workspace(_id: $workspace) {
        _id
        name
        isPublic
      }
    }
  `;
  const { loading, error, data } = useQuery<{
    template: AttributeModel;
    workspace: WorkspaceModel;
  }>(GET_TEMPLATE, {
    variables: {
      _id: id,
      workspace: workspace,
    },
    fetchPolicy: "no-cache",
  });

  const GET_TEMPLATE_USAGE = gql`
    query GetTemplateUsage($_id: String) {
      templateUsage(_id: $_id) {
        entity
        modifications
      }
    }
  `;
  const {
    loading: usageLoading,
    error: usageError,
    data: usageData,
  } = useQuery<{
    templateUsage: AttributeUsage[];
  }>(GET_TEMPLATE_USAGE, {
    variables: {
      _id: id,
    },
    fetchPolicy: "no-cache",
  });

  // Mutation to update Template
  const UPDATE_TEMPLATE = gql`
    mutation UpdateTemplate($template: AttributeInput, $message: String) {
      updateTemplate(template: $template, message: $message) {
        success
        message
      }
    }
  `;
  const [updateTemplate, { loading: updateLoading }] = useMutation<{
    updateTemplate: ResponseData<string>;
  }>(UPDATE_TEMPLATE, {
    refetchQueries: ["GetTemplate"],
    awaitRefetchQueries: true,
  });

  // Mutation to archive Template
  const ARCHIVE_TEMPLATE = gql`
    mutation ArchiveTemplate($_id: String, $state: Boolean) {
      archiveTemplate(_id: $_id, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveTemplate, { loading: archiveLoading }] = useMutation<{
    archiveTemplate: ResponseData<string>;
  }>(ARCHIVE_TEMPLATE, {
    refetchQueries: ["GetTemplate"],
    awaitRefetchQueries: true,
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.template) {
      setTemplate(data.template);
      setTemplateName(data.template.name);
      setTemplateArchived(data.template.archived);
      setTemplateDescription(data.template.description || "");
      setTemplateValues(data.template.values);
      setTemplateHistory(data.template.history || []);
    }

    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
      setWorkspaceIsPublic(data.workspace.isPublic);
    }

    if (usageData?.templateUsage) {
      setTemplateUsage(usageData.templateUsage);
    }
  }, [loading, usageLoading]);

  useEffect(() => {
    if (error || usageError) {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Unable to retrieve Template information",
        duration: 4000,
        closable: true,
      });
    }
  }, [error]);

  // Archive the Template when confirmed
  const handleArchiveClick = async () => {
    const response = await archiveTemplate({
      variables: {
        _id: template._id,
        state: true,
      },
    });

    if (!response.data?.archiveTemplate || !response.data.archiveTemplate.success) {
      toaster.create({
        title: "Error",
        description: "An error occurred while archiving Template",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (response.data.archiveTemplate.success) {
      toaster.create({
        title: "Archived Successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setTemplateArchived(true);
      setArchiveDialogOpen(false);
    }

    setEditing(false);
  };

  // Restore the Template from archive
  const handleRestoreFromArchiveClick = async () => {
    const response = await archiveTemplate({
      variables: {
        _id: template._id,
        state: false,
      },
    });

    if (!response.data?.archiveTemplate || !response.data.archiveTemplate.success) {
      toaster.create({
        title: "Error",
        description: "An error occurred while restoring Template",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (response.data.archiveTemplate.success) {
      toaster.create({
        title: "Restored Template successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setTemplateArchived(false);
      setArchiveDialogOpen(false);
    }

    setEditing(false);
  };

  /**
   * Handle the edit button being clicked
   */
  const handleEditClick = () => {
    if (previewVersion) return;
    if (editing) {
      setSaveMessageOpen(true);
    } else {
      setEditing(true);
    }
  };

  /**
   * Handle the "Done" button within the save message dialog
   */
  const handleSaveMessageDoneClick = async () => {
    try {
      const response = await updateTemplate({
        variables: {
          template: removeTypename({
            _id: template._id,
            name: templateName,
            description: templateDescription,
            values: templateValues,
          }),
          message: saveMessage,
        },
      });

      if (!response.data?.updateTemplate || !response.data.updateTemplate.success) {
        toaster.create({
          title: "Error",
          description: "An error occurred when saving Template updates",
          type: "error",
          duration: 2000,
          closable: true,
        });
        setEditing(true);
      } else if (response.data.updateTemplate.success) {
        toaster.create({
          title: "Updated Successfully",
          type: "success",
          duration: 2000,
          closable: true,
        });
        setEditing(false);
      }
    } catch {
      toaster.create({
        title: "Error",
        description: "An error occurred when saving Template updates",
        type: "error",
        duration: 2000,
        closable: true,
      });
      setEditing(true);
    }

    setSaveMessageOpen(false);
    setSaveMessage("");
  };

  const handleCancelClick = () => {
    setEditing(false);
    setTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setTemplateValues(template.values);
  };

  /**
   * Restore a Template from an earlier point in time
   */
  const handleRestoreFromHistoryClick = async (templateVersion: AttributeHistory) => {
    try {
      const restorePayload = removeTypename({
        _id: template._id,
        name: templateVersion.name,
        archived: templateVersion.archived,
        owner: templateVersion.owner,
        description: templateVersion.description || "",
        values: templateVersion.values || [],
      });
      await updateTemplate({
        variables: {
          template: restorePayload,
          message: saveMessage,
        },
      });
      toaster.create({
        title: "Success",
        description: `Restored Template version ${templateVersion.version}`,
        type: "success",
        duration: 2000,
        closable: true,
      });

      setTemplateDescription(templateVersion.description || "");
      setTemplateValues(templateVersion.values || []);
      setHistoryOpen(false);
    } catch {
      toaster.create({
        title: "Error",
        description: `Template could not be restored`,
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  /**
   * Preview a Template as it was at an earlier point in time
   */
  const handlePreviewVersion = (templateVersion: AttributeHistory) => {
    setPreviewVersion(templateVersion);
    setHistoryOpen(false);
  };

  // Define the columns for Template usage
  const usageColumnHelper = createColumnHelper<AttributeUsage>();
  const usageColumns = [
    usageColumnHelper.accessor("entity", {
      cell: (info) => {
        const entityId = info.cell.getValue();
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={entityId} disabled={entityId.length < 20} showArrow>
              <Linky id={entityId} type={"entities"} size={"xs"} />
            </Tooltip>

            <Button
              size="2xs"
              mx={"1"}
              variant="subtle"
              colorPalette="gray"
              aria-label={"View Entity"}
              onClick={() => navigate(`/entities/${entityId}`)}
            >
              View
              <Icon name={"a_right"} size={"xs"} />
            </Button>
          </Flex>
        );
      },
      header: "Entity",
      meta: {
        minWidth: 300,
      },
    }),
    usageColumnHelper.accessor("modifications", {
      cell: (info) => {
        const modifications = info.cell.getValue();
        if (modifications.length > 0) {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {modifications.map((modification) => {
                return (
                  <Tag.Root colorPalette={"orange"}>
                    <Tag.Label fontSize={"xs"}>{_.capitalize(modification)}</Tag.Label>
                  </Tag.Root>
                );
              })}
            </Flex>
          );
        } else {
          return (
            <Tag.Root colorPalette={"green"}>
              <Tag.Label fontSize={"xs"}>None</Tag.Label>
            </Tag.Root>
          );
        }
      },
      header: "Modifications",
    }),
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading && !updateLoading && !archiveLoading}>
      <Flex direction={"column"}>
        {/* Preview Banner */}
        {previewVersion && (
          <Flex
            direction={"row"}
            align={"center"}
            justify={"space-between"}
            gap={"2"}
            p={"2"}
            bg={"blue.100"}
            mx={"-1.5"}
            mt={"-1.5"}
            mb={"1"}
            px={"1.5"}
            pt={"1.5"}
          >
            <Flex direction={"row"} align={"center"} gap={"1"} wrap={"wrap"}>
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Icon name={"clock"} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Preview:
                </Text>
                <Tag.Root colorPalette={"green"}>
                  <Tag.Label fontSize={"xs"}>{previewVersion.version.slice(0, 6)}</Tag.Label>
                </Tag.Root>
              </Flex>
              <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                {dayjs(previewVersion.timestamp).format("MMM D, YYYY h:mm A")}
              </Text>
            </Flex>
            <Flex direction={"row"} gap={"2"} align={"center"}>
              <Tooltip
                content={"Insufficient permissions in this Workspace"}
                disabled={workspacePermissions.templates.archive}
                showArrow
              >
                <Button
                  size={"xs"}
                  variant={"solid"}
                  colorPalette={"orange"}
                  rounded={"md"}
                  onClick={async () => {
                    await handleRestoreFromHistoryClick(previewVersion);
                    setPreviewVersion(null);
                  }}
                  disabled={templateArchived || !workspacePermissions.templates.archive}
                >
                  Restore
                  <Icon name={"rewind"} size={"xs"} />
                </Button>
              </Tooltip>
              <Button
                size={"xs"}
                variant={"solid"}
                colorPalette={"red"}
                rounded={"md"}
                onClick={() => setPreviewVersion(null)}
              >
                Exit Preview
                <Icon name={"logout"} size={"xs"} />
              </Button>
            </Flex>
          </Flex>
        )}

        <Flex gap={"2"} p={"1"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          {/* Breadcrumbs */}
          <Flex align={"center"} gap={"2"} ml={"0.5"}>
            <Breadcrumb.Root>
              <Breadcrumb.List>
                <Breadcrumb.Item
                  gap={"1"}
                  onClick={() => navigate("/")}
                  _hover={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  <Icon name={"workspace"} size={"xs"} color={"black"} />
                  {loading ? (
                    <SkeletonText noOfLines={1} w={"80px"} my={"0.5"} h={"16px"} loading={loading} />
                  ) : (
                    _.truncate(workspaceName, { length: isBreakpointActive("md", "down") ? 12 : 24 })
                  )}
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
                <Breadcrumb.Item
                  gap={"1"}
                  onClick={() => navigate("/templates")}
                  _hover={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  <Icon size={"xs"} name={"template"} color={STYLES.template.color.icon} />
                  Templates
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
              </Breadcrumb.List>
            </Breadcrumb.Root>

            <Flex direction={"row"} gap={"2"} align={"center"} p={"0"} m={"0"}>
              <Flex
                id={"templateNameTag"}
                align={"center"}
                gap={"1"}
                p={"1"}
                border={"2px solid"}
                borderColor={displayTemplateArchived ? "gray.500" : STYLES.template.color.icon}
                bg={displayTemplateArchived ? STYLES.card.bg : STYLES.template.color.light}
                rounded={"md"}
              >
                <Icon
                  name={"template"}
                  size={"sm"}
                  color={displayTemplateArchived ? "gray.500" : STYLES.template.color.icon}
                />
                <Tooltip content={`${displayTemplateArchived ? "Archived: " : ""}${displayTemplateName}`} showArrow>
                  <Heading fontWeight={"semibold"} size={"sm"}>
                    {_.truncate(displayTemplateName, { length: isBreakpointActive("md", "down") ? 12 : 24 })}
                  </Heading>
                </Tooltip>
                {displayTemplateArchived && <Icon name={"archive"} size={"sm"} color={"text.subtle"} />}
              </Flex>
            </Flex>
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
            {templateArchived ? (
              <Tooltip
                content={"Insufficient permissions in this Workspace"}
                disabled={workspacePermissions.templates.archive}
                showArrow
              >
                <Button
                  id={"restoreTemplateButton"}
                  onClick={handleRestoreFromArchiveClick}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"orange"}
                  disabled={!workspacePermissions.templates.archive}
                >
                  Restore
                  <Icon name={"rewind"} size={"xs"} />
                </Button>
              </Tooltip>
            ) : (
              <Flex gap={"2"}>
                {editing && (
                  <Button onClick={handleCancelClick} size={"xs"} rounded={"md"} colorPalette={"red"}>
                    Cancel
                    <Icon name={"cross"} size={"xs"} />
                  </Button>
                )}
                <Tooltip
                  content={"Insufficient permissions in this Workspace"}
                  disabled={workspacePermissions.templates.edit}
                  showArrow
                >
                  <Button
                    id={"editTemplateButton"}
                    colorPalette={editing ? "green" : "blue"}
                    size={"xs"}
                    rounded={"md"}
                    onClick={handleEditClick}
                    loadingText={"Saving..."}
                    loading={updateLoading}
                    disabled={!!previewVersion || !workspacePermissions.templates.edit}
                  >
                    {editing ? "Save" : "Edit"}
                    {editing ? <Icon name={"save"} size={"xs"} /> : <Icon name={"edit"} size={"xs"} />}
                  </Button>
                </Tooltip>
              </Flex>
            )}

            {/* Actions Menu */}
            <Menu.Root size={"sm"}>
              <Menu.Trigger asChild>
                <Button size={"xs"} rounded={"md"} colorPalette={"action"} data-testid={"templateActionsButton"}>
                  Actions
                  <Icon name={"lightning"} size={"xs"} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    fontSize={"xs"}
                    value={"export"}
                    onClick={() => setExportOpen(true)}
                    disabled={templateArchived || !!previewVersion}
                  >
                    <Icon name={"download"} size={"xs"} />
                    Export
                  </Menu.Item>
                  <Tooltip
                    content={"Insufficient permissions in this Workspace"}
                    disabled={workspacePermissions.templates.archive}
                    showArrow
                  >
                    <Menu.Item
                      fontSize={"xs"}
                      value={"archive"}
                      onClick={() => setArchiveDialogOpen(true)}
                      disabled={templateArchived || !workspacePermissions.templates.archive}
                    >
                      <Icon name={"archive"} size={"xs"} />
                      Archive
                    </Menu.Item>
                  </Tooltip>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>

            {/* Version history */}
            <HistoryDrawer
              type={"template"}
              open={historyOpen}
              onOpenChange={setHistoryOpen}
              history={templateHistory}
              archived={templateArchived}
              previewActive={!!previewVersion}
              canRestore={workspacePermissions.templates.archive}
              onPreview={handlePreviewVersion}
              onRestore={handleRestoreFromHistoryClick}
            />

            {/* Archive Dialog */}
            <AlertDialog
              header={"Archive Template"}
              leftButtonAction={() => setArchiveDialogOpen(false)}
              rightButtonAction={handleArchiveClick}
              open={archiveDialogOpen}
              setOpen={setArchiveDialogOpen}
            >
              <Text fontSize={"xs"}>
                Are you sure you want to archive this Template? It can be restored any time from the Workspace archives.
              </Text>
            </AlertDialog>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Template Overview and Description */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Overview */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              grow={"1"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Flex direction={"column"} gap={"1"} grow={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Name
                  </Text>
                  <Input
                    id={"attributeNameInput"}
                    size={"xs"}
                    value={displayTemplateName}
                    onChange={(event) => {
                      setTemplateName(event.target.value);
                    }}
                    readOnly={!editing || !!previewVersion}
                    bg={"white"}
                    rounded={"md"}
                    border={STYLES.border.style}
                    borderColor={STYLES.border.color}
                  />
                </Flex>
              </Flex>

              <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Owner
                  </Text>
                  <ActorTag identifier={template.owner} fallback={"No Owner"} size={"sm"} />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Timestamp
                  </Text>
                  <TimestampTag timestamp={template.timestamp} description={"Created"} />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Visibility
                  </Text>
                  <VisibilityTag isPublic={workspaceIsPublic} isInherited />
                </Flex>
              </Flex>
            </Flex>

            {/* Description */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"100%"}
              gap={"2"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              rounded={"md"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Description
              </Text>
              <Textarea
                id={"attributeDescriptionInput"}
                value={displayTemplateDescription}
                size={"xs"}
                h={"100%"}
                readOnly={!(editing && !previewVersion)}
                onChange={(event) => setTemplateDescription(event.target.value)}
              />
            </Flex>
          </Flex>

          {/* Template Values and Usage */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Values */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Values ({templateValues.length})
              </Text>
              <Values
                key={previewVersion?.version ?? "current"}
                viewOnly={!editing || !!previewVersion}
                values={displayTemplateValues}
                setValues={setTemplateValues}
              />
            </Flex>

            {/* Usage */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Usage ({templateUsage.length} {templateUsage.length !== 1 ? "Entities" : "Entity"})
              </Text>
              {templateUsage.length > 0 ? (
                <DataTable
                  data={templateUsage}
                  columns={usageColumns}
                  visibleColumns={{}}
                  selectedRows={{}}
                  viewOnly={true}
                  showSelection={true}
                  showPagination
                />
              ) : (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon name={"template"} size={"lg"} color={STYLES.template.color.default} />
                    </EmptyState.Indicator>
                    <EmptyState.Description>No Usage</EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      <ExportDialog open={exportOpen} setOpen={setExportOpen} dataType={"template"} id={id} />

      {/* Save message dialog */}
      <SaveDialog
        open={saveMessageOpen}
        onOpenChange={(details) => setSaveMessageOpen(details.open)}
        onDone={handleSaveMessageDoneClick}
        value={saveMessage}
        onChange={setSaveMessage}
        placeholder={"(Optional) Enter a description of the changes made to the Template."}
        isPublic={workspaceIsPublic}
      />
    </Content>
  );
};

export default Template;
