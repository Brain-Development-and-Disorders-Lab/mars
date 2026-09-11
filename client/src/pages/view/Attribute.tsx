// React
import React, { useEffect, useMemo, useState } from "react";

// Existing and custom components
import { Button, Flex, Menu, Tag, Text } from "@chakra-ui/react";
import { Content } from "@components/Container";
import HistoryDrawer from "@components/HistoryDrawer";
import Icon from "@components/Icon";
import Values from "@components/Values";
import DialogAlert from "@components/DialogAlert";
import AttributeBreadcrumb from "@components/AttributeBreadcrumb";
import AttributeOverviewCard from "@components/AttributeOverviewCard";
import AttributeUsageTable from "@components/AttributeUsageTable";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import DialogExport from "@components/DialogExport";
import DialogSave from "@components/DialogSave";

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
import { usePermissions } from "@hooks/usePermissions";
import { useWorkspace } from "@hooks/useWorkspace";

// Variables
import { STYLES } from "@variables";

const Attribute = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Permissions
  const { workspacePermissions } = usePermissions();

  // Workspace information
  const { workspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceIsPublic, setWorkspaceIsPublic] = useState(false);

  const [editing, setEditing] = useState(false);

  const [attribute, setAttribute] = useState({} as AttributeModel);
  const [attributeName, setAttributeName] = useState("");
  const [attributeDescription, setAttributeDescription] = useState("");
  const [attributeArchived, setAttributeArchived] = useState(false);
  const [attributeValues, setAttributeValues] = useState<IValue[]>([]);
  const [attributeUsage, setAttributeUsage] = useState<AttributeUsage[]>([]);
  const [attributeHistory, setAttributeHistory] = useState<AttributeHistory[]>([]);

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
  const displayAttributeArchived = useMemo(() => {
    return previewVersion ? previewVersion.archived : attributeArchived;
  }, [previewVersion, attributeArchived]);

  const displayAttributeName = useMemo(() => {
    return previewVersion ? previewVersion.name : attributeName;
  }, [previewVersion, attributeName]);

  const displayAttributeDescription = useMemo(() => {
    return previewVersion ? previewVersion.description || "" : attributeDescription;
  }, [previewVersion, attributeDescription]);

  const displayAttributeValues = useMemo(() => {
    return previewVersion ? previewVersion.values : attributeValues;
  }, [previewVersion, attributeValues]);

  // GraphQL operations
  const GET_ATTRIBUTE = gql`
    query GetAttribute($_id: String, $workspace: String) {
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
    attribute: AttributeModel;
    workspace: WorkspaceModel;
  }>(GET_ATTRIBUTE, {
    variables: {
      _id: id,
      workspace: workspace,
    },
    fetchPolicy: "no-cache",
  });

  const GET_ATTRIBUTE_USAGE = gql`
    query GetAttributeUsage($_id: String) {
      attributeUsage(_id: $_id) {
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
    attributeUsage: AttributeUsage[];
  }>(GET_ATTRIBUTE_USAGE, {
    variables: {
      _id: id,
    },
    fetchPolicy: "no-cache",
  });

  // Mutation to update Attribute
  const UPDATE_ATTRIBUTE = gql`
    mutation UpdateAttribute($attribute: AttributeInput, $message: String) {
      updateAttribute(attribute: $attribute, message: $message) {
        success
        message
      }
    }
  `;
  const [updateAttribute, { loading: updateLoading }] = useMutation<{
    updateAttribute: ResponseData<string>;
  }>(UPDATE_ATTRIBUTE, {
    refetchQueries: ["GetAttribute"],
    awaitRefetchQueries: true,
  });

  // Mutation to archive Attribute
  const ARCHIVE_ATTRIBUTE = gql`
    mutation ArchiveAttribute($_id: String, $state: Boolean) {
      archiveAttribute(_id: $_id, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveAttribute, { loading: archiveLoading }] = useMutation<{
    archiveAttribute: ResponseData<string>;
  }>(ARCHIVE_ATTRIBUTE, {
    refetchQueries: ["GetAttribute"],
    awaitRefetchQueries: true,
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.attribute) {
      setAttribute(data.attribute);
      setAttributeName(data.attribute.name);
      setAttributeArchived(data.attribute.archived);
      setAttributeDescription(data.attribute.description || "");
      setAttributeValues(data.attribute.values);
      setAttributeHistory(data.attribute.history || []);
    }

    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
      setWorkspaceIsPublic(data.workspace.isPublic);
    }

    if (usageData?.attributeUsage) {
      setAttributeUsage(usageData.attributeUsage);
    }
  }, [loading, usageLoading]);

  useEffect(() => {
    if (error || usageError) {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Unable to retrieve Attribute information",
        duration: 4000,
        closable: true,
      });
    }
  }, [error]);

  // Archive the Attribute when confirmed
  const handleArchiveClick = async () => {
    const response = await archiveAttribute({
      variables: {
        _id: attribute._id,
        state: true,
      },
    });

    if (!response.data?.archiveAttribute || !response.data.archiveAttribute.success) {
      toaster.create({
        title: "Error",
        description: "An error occurred while archiving Attribute",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (response.data.archiveAttribute.success) {
      toaster.create({
        title: "Archived Successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setAttributeArchived(true);
      setArchiveDialogOpen(false);
    }

    setEditing(false);
  };

  // Restore the Attribute from archive
  const handleRestoreFromArchiveClick = async () => {
    const response = await archiveAttribute({
      variables: {
        _id: attribute._id,
        state: false,
      },
    });

    if (!response.data?.archiveAttribute || !response.data.archiveAttribute.success) {
      toaster.create({
        title: "Error",
        description: "An error occurred while restoring Attribute",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (response.data.archiveAttribute.success) {
      toaster.create({
        title: "Restored Attribute successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setAttributeArchived(false);
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
      const response = await updateAttribute({
        variables: {
          attribute: removeTypename({
            _id: attribute._id,
            name: attributeName,
            description: attributeDescription,
            values: attributeValues,
          }),
          message: saveMessage,
        },
      });

      if (!response.data?.updateAttribute || !response.data.updateAttribute.success) {
        toaster.create({
          title: "Error",
          description: "An error occurred when saving Attribute updates",
          type: "error",
          duration: 2000,
          closable: true,
        });
        setEditing(true);
      } else if (response.data.updateAttribute.success) {
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
        description: "An error occurred when saving Attribute updates",
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
    setAttribute(attribute);
    setAttributeName(attribute.name);
    setAttributeDescription(attribute.description);
    setAttributeValues(attribute.values);
  };

  /**
   * Restore a Attribute from an earlier point in time
   */
  const handleRestoreFromHistoryClick = async (attributeVersion: AttributeHistory) => {
    try {
      const restorePayload = removeTypename({
        _id: attribute._id,
        name: attributeVersion.name,
        archived: attributeVersion.archived,
        owner: attributeVersion.owner,
        description: attributeVersion.description || "",
        values: attributeVersion.values || [],
      });
      await updateAttribute({
        variables: {
          attribute: restorePayload,
          message: saveMessage,
        },
      });
      toaster.create({
        title: "Success",
        description: `Restored Attribute version ${attributeVersion.version}`,
        type: "success",
        duration: 2000,
        closable: true,
      });

      setAttributeDescription(attributeVersion.description || "");
      setAttributeValues(attributeVersion.values || []);
      setHistoryOpen(false);
    } catch {
      toaster.create({
        title: "Error",
        description: `Attribute could not be restored`,
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  /**
   * Preview a Attribute as it was at an earlier point in time
   */
  const handlePreviewVersion = (attributeVersion: AttributeHistory) => {
    setPreviewVersion(attributeVersion);
    setHistoryOpen(false);
  };

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
                disabled={workspacePermissions.attributes.archive}
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
                  disabled={attributeArchived || !workspacePermissions.attributes.archive}
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
          <AttributeBreadcrumb
            loading={loading}
            workspaceName={workspaceName}
            onNavigateHome={() => navigate("/")}
            onNavigateAttributes={() => navigate("/attributes")}
            archived={displayAttributeArchived}
            name={displayAttributeName}
          />

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
            {attributeArchived ? (
              <Tooltip
                content={"Insufficient permissions in this Workspace"}
                disabled={workspacePermissions.attributes.archive}
                showArrow
              >
                <Button
                  id={"restoreAttributeButton"}
                  onClick={handleRestoreFromArchiveClick}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"orange"}
                  disabled={!workspacePermissions.attributes.archive}
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
                  disabled={workspacePermissions.attributes.edit}
                  showArrow
                >
                  <Button
                    id={"editAttributeButton"}
                    colorPalette={editing ? "green" : "blue"}
                    size={"xs"}
                    rounded={"md"}
                    onClick={handleEditClick}
                    loadingText={"Saving..."}
                    loading={updateLoading}
                    disabled={!!previewVersion || !workspacePermissions.attributes.edit}
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
                <Button size={"xs"} rounded={"md"} colorPalette={"action"} data-testid={"attributeActionsButton"}>
                  Actions
                  <Icon name={"lightning"} size={"xs"} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content p={"1"}>
                  <Menu.ItemGroup title={"Manage"}>
                    <Menu.ItemGroupLabel fontSize={"xs"} p={"1"}>
                      Manage
                    </Menu.ItemGroupLabel>
                    <Menu.Item
                      fontSize={"xs"}
                      value={"export"}
                      onClick={() => setExportOpen(true)}
                      disabled={attributeArchived || !!previewVersion}
                    >
                      <Icon name={"download"} size={"xs"} />
                      Export Attribute
                    </Menu.Item>
                    <Tooltip
                      content={"Insufficient permissions in this Workspace"}
                      disabled={workspacePermissions.attributes.archive}
                      showArrow
                    >
                      <Menu.Item
                        fontSize={"xs"}
                        value={"archive"}
                        onClick={() => setArchiveDialogOpen(true)}
                        disabled={attributeArchived || !workspacePermissions.attributes.archive}
                      >
                        <Icon name={"archive"} size={"xs"} />
                        Archive Attribute
                      </Menu.Item>
                    </Tooltip>
                  </Menu.ItemGroup>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>

            {/* Version history */}
            <HistoryDrawer
              type={"attribute"}
              open={historyOpen}
              onOpenChange={setHistoryOpen}
              history={attributeHistory}
              archived={attributeArchived}
              previewActive={!!previewVersion}
              canRestore={workspacePermissions.attributes.archive}
              onPreview={handlePreviewVersion}
              onRestore={handleRestoreFromHistoryClick}
            />

            {/* Archive Dialog */}
            <DialogAlert
              header={"Archive Attribute"}
              leftButtonAction={() => setArchiveDialogOpen(false)}
              rightButtonAction={handleArchiveClick}
              open={archiveDialogOpen}
              setOpen={setArchiveDialogOpen}
            >
              <Text fontSize={"xs"}>
                Are you sure you want to archive this Attribute? It can be restored any time from the Workspace
                archives.
              </Text>
            </DialogAlert>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Attribute Overview and Description */}
          <AttributeOverviewCard
            name={displayAttributeName}
            onNameChange={setAttributeName}
            nameReadOnly={!editing || !!previewVersion}
            owner={attribute.owner}
            timestamp={attribute.timestamp}
            visibilityIsPublic={workspaceIsPublic}
            description={displayAttributeDescription}
            onDescriptionChange={setAttributeDescription}
            descriptionReadOnly={!(editing && !previewVersion)}
          />

          {/* Attribute Values and Usage */}
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
                Values ({attributeValues.length})
              </Text>
              <Values
                key={previewVersion?.version ?? "current"}
                viewOnly={!editing || !!previewVersion}
                values={displayAttributeValues}
                setValues={setAttributeValues}
              />
            </Flex>

            {/* Attribute Usage */}
            <AttributeUsageTable
              attributeUsage={attributeUsage}
              onViewEntity={(entityId) => navigate(`/entities/${entityId}`)}
            />
          </Flex>
        </Flex>
      </Flex>

      <DialogExport open={exportOpen} setOpen={setExportOpen} dataType={"attribute"} id={id} />

      {/* Save message dialog */}
      <DialogSave
        open={saveMessageOpen}
        onOpenChange={(details) => setSaveMessageOpen(details.open)}
        onDone={handleSaveMessageDoneClick}
        value={saveMessage}
        onChange={setSaveMessage}
        placeholder={"(Optional) Enter a description of the changes made to the Attribute."}
        isPublic={workspaceIsPublic}
      />
    </Content>
  );
};

export default Attribute;
