// React
import React, { useEffect, useMemo, useState } from "react";

// Existing and custom components
import {
  Button,
  CloseButton,
  Collapsible,
  createListCollection,
  Drawer,
  EmptyState,
  Field,
  Flex,
  Heading,
  Input,
  Menu,
  Portal,
  Select,
  Tag,
  Text,
  Timeline,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";
import AlertDialog from "@components/AlertDialog";
import ActorTag from "@components/ActorTag";
import Linky from "@components/Linky";
import TimestampTag from "@components/TimestampTag";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import VisibilityTag from "@components/VisibilityTag";
import SaveModal from "@components/SaveModal";
import MDEditor from "@uiw/react-md-editor";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import { AttributeHistory, AttributeModel, AttributeUsage, IValue, ResponseData } from "@types";

// Utility functions and libraries
import { removeTypename } from "@lib/util";
import _ from "lodash";
import slugify from "slugify";
import FileSaver from "file-saver";
import dayjs from "dayjs";

// Routing and navigation
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "@apollo/client";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import DataTable from "@components/DataTable";

const Template = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);

  const [template, setTemplate] = useState({} as AttributeModel);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateArchived, setTemplateArchived] = useState(false);
  const [templateValues, setTemplateValues] = useState<IValue[]>([]);
  const [templateUsage, setTemplateUsage] = useState<AttributeUsage[]>([]);
  const [templateHistory, setTemplateHistory] = useState<AttributeHistory[]>([]);

  // State for dialog confirming if user should archive
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  // Save message modal
  const [saveMessageOpen, setSaveMessageOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // History drawer
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [historySortOrder, setHistorySortOrder] = useState<"newest-first" | "oldest-first">("newest-first");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [appliedStartDate, setAppliedStartDate] = useState<string>("");
  const [appliedEndDate, setAppliedEndDate] = useState<string>("");
  const [dateFilterApplied, setDateFilterApplied] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<AttributeHistory | null>(null);

  // Sorted and filtered history based on sort order and date range
  const sortedTemplateHistory = useMemo(() => {
    let filtered = [...templateHistory];

    if (dateFilterApplied) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.timestamp);
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

        if (appliedStartDate) {
          const start = new Date(appliedStartDate);
          if (itemDateOnly < start) return false;
        }

        if (appliedEndDate) {
          const end = new Date(appliedEndDate);
          end.setHours(23, 59, 59, 999);
          if (itemDateOnly > end) return false;
        }

        return true;
      });
    }

    if (historySortOrder === "newest-first") {
      return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
  }, [templateHistory, historySortOrder, dateFilterApplied, appliedStartDate, appliedEndDate]);

  // Computed values that use preview data when in preview mode
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
    }
  `;
  const { loading, error, data } = useQuery<{
    template: AttributeModel;
  }>(GET_TEMPLATE, {
    variables: {
      _id: id,
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

  // Query to get Template export contents
  const GET_TEMPLATE_EXPORT = gql`
    query GetTemplateExport($_id: String) {
      exportTemplate(_id: $_id)
    }
  `;
  const [exportTemplate, { error: exportError }] = useLazyQuery<{
    exportTemplate: string;
  }>(GET_TEMPLATE_EXPORT);

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
   * Handle the "Done" button within the save message modal
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
   * Handle the export button being clicked
   */
  const handleDownloadClick = async () => {
    const response = await exportTemplate({
      variables: {
        _id: id,
      },
    });

    if (!response.data?.exportTemplate || exportError) {
      toaster.create({
        title: "Error",
        description: "An error occurred exporting this Template",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (response.data.exportTemplate) {
      FileSaver.saveAs(
        new Blob([response.data.exportTemplate]),
        slugify(`${templateName.replace(" ", "")}_export.json`),
      );

      toaster.create({
        title: "Success",
        description: `Generated JSON file`,
        type: "success",
        duration: 2000,
        closable: true,
      });
    }
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
        minWidth: 400,
      },
    }),
    usageColumnHelper.accessor("modifications", {
      cell: (info) => {
        const modifications = info.cell.getValue();
        if (modifications.length > 0) {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Text fontWeight={"semibold"} fontSize={"xs"}>
                Modified:
              </Text>
              {modifications.map((modification) => {
                return (
                  <Tag.Root colorPalette={"orange"}>
                    <Tag.Label fontSize={"xs"}>{modification}</Tag.Label>
                  </Tag.Root>
                );
              })}
            </Flex>
          );
        } else {
          return (
            <Tag.Root colorPalette={"green"}>
              <Tag.Label fontSize={"xs"}>Original</Tag.Label>
            </Tag.Root>
          );
        }
      },
      header: "Status",
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
            px={"1.5"}
            pt={"1.5"}
          >
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <Icon name={"clock"} size={"xs"} />
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                Preview:
              </Text>
              <Tag.Root colorPalette={"green"}>
                <Tag.Label fontSize={"xs"}>{previewVersion.version.slice(0, 6)}</Tag.Label>
              </Tag.Root>
              <Text fontSize={"xs"} color={"gray.600"}>
                {dayjs(previewVersion.timestamp).format("MMM D, YYYY h:mm A")}
              </Text>
            </Flex>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Button
                size={"xs"}
                variant={"solid"}
                colorPalette={"orange"}
                rounded={"md"}
                onClick={async () => {
                  await handleRestoreFromHistoryClick(previewVersion);
                  setPreviewVersion(null);
                }}
                disabled={templateArchived}
              >
                Restore
                <Icon name={"rewind"} size={"xs"} />
              </Button>
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

        <Flex
          gap={"1"}
          p={"1"}
          pb={{ base: "1", lg: "0" }}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
          wrap={"wrap"}
        >
          <Flex align={"center"} gap={"1"} p={"1"} border={"2px solid"} rounded={"md"}>
            <Icon name={"template"} size={"sm"} />
            <Heading fontWeight={"semibold"} size={"sm"}>
              {displayTemplateName}
            </Heading>
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
            {/* Actions Menu */}
            <Menu.Root size={"sm"}>
              <Menu.Trigger asChild>
                <Button size={"xs"} rounded={"md"} colorPalette={"yellow"} data-testid={"templateActionsButton"}>
                  Actions
                  <Icon name={"lightning"} size={"xs"} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    fontSize={"xs"}
                    value={"export"}
                    onClick={handleDownloadClick}
                    disabled={editing || templateArchived}
                  >
                    <Icon name={"download"} size={"xs"} />
                    Export
                  </Menu.Item>
                  <Menu.Item
                    fontSize={"xs"}
                    value={"archive"}
                    onClick={() => setArchiveDialogOpen(true)}
                    disabled={templateArchived}
                  >
                    <Icon name={"archive"} size={"xs"} />
                    Archive
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>

            {templateArchived ? (
              <Button
                id={"restoreTemplateButton"}
                onClick={handleRestoreFromArchiveClick}
                size={"xs"}
                rounded={"md"}
                colorPalette={"orange"}
              >
                Restore
                <Icon name={"rewind"} size={"xs"} />
              </Button>
            ) : (
              <Flex gap={"1"}>
                {editing && (
                  <Button onClick={handleCancelClick} size={"xs"} rounded={"md"} colorPalette={"red"}>
                    Cancel
                    <Icon name={"cross"} size={"xs"} />
                  </Button>
                )}
                <Button
                  id={"editTemplateButton"}
                  colorPalette={editing ? "green" : "blue"}
                  size={"xs"}
                  rounded={"md"}
                  onClick={handleEditClick}
                  loadingText={"Saving..."}
                  loading={updateLoading}
                  disabled={!!previewVersion}
                >
                  {editing ? "Save" : "Edit"}
                  {editing ? <Icon name={"save"} size={"xs"} /> : <Icon name={"edit"} size={"xs"} />}
                </Button>
              </Flex>
            )}

            {/* Version history */}
            <Drawer.Root
              open={historyOpen}
              size={"lg"}
              onOpenChange={(event) => setHistoryOpen(event.open)}
              closeOnEscape
              closeOnInteractOutside
            >
              <Drawer.Trigger asChild>
                <Button
                  id={"historyButton"}
                  variant={"subtle"}
                  size={"xs"}
                  rounded={"md"}
                  onClick={() => setHistoryOpen(true)}
                >
                  History
                  <Icon name={"clock"} size={"xs"} />
                </Button>
              </Drawer.Trigger>
              <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner padding={"4"}>
                  <Drawer.Content rounded={"md"}>
                    <Drawer.CloseTrigger asChild>
                      <CloseButton size={"2xs"} top={"6px"} onClick={() => setHistoryOpen(false)} />
                    </Drawer.CloseTrigger>
                    <Drawer.Header p={"2"} bg={"blue.300"} roundedTop={"md"}>
                      <Flex direction={"row"} gap={"1"} align={"center"}>
                        <Icon name={"clock"} size={"xs"} />
                        <Text fontSize={"sm"} fontWeight={"semibold"}>
                          Template History
                        </Text>
                      </Flex>
                    </Drawer.Header>

                    <Drawer.Body pt={"0"} p={"1"} px={"2"}>
                      <Flex direction={"column"} gap={"1"} align={"start"} rounded={"md"} bg={"gray.100"} p={"1"}>
                        <Flex
                          direction={"row"}
                          gap={"1"}
                          align={"center"}
                          justify={"space-between"}
                          w={"full"}
                          mx={"0.5"}
                        >
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            Date filter:
                          </Text>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            {dateFilterApplied ? 1 : 0} Active Filter
                            {!dateFilterApplied ? "s" : ""}
                          </Text>
                        </Flex>

                        <Flex direction={"row"} gap={"1"} align={"center"} wrap={"wrap"} ml={"0.5"}>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Field.Root gap={"0"}>
                              <Field.Label fontSize={"xs"}>Start date</Field.Label>
                              <Input
                                type={"date"}
                                size={"xs"}
                                rounded={"md"}
                                w={"140px"}
                                bg={"white"}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                              />
                            </Field.Root>
                            <Field.Root gap={"0"}>
                              <Field.Label fontSize={"xs"}>End date</Field.Label>
                              <Input
                                type={"date"}
                                size={"xs"}
                                rounded={"md"}
                                w={"140px"}
                                bg={"white"}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                              />
                            </Field.Root>
                          </Flex>
                          <Button
                            size={"xs"}
                            rounded={"md"}
                            variant={"solid"}
                            colorPalette={"blue"}
                            alignSelf={"end"}
                            onClick={() => {
                              if (startDate || endDate) {
                                setAppliedStartDate(startDate);
                                setAppliedEndDate(endDate);
                                setDateFilterApplied(true);
                              }
                            }}
                          >
                            Apply
                          </Button>
                          <Button
                            size={"xs"}
                            rounded={"md"}
                            variant={"outline"}
                            alignSelf={"end"}
                            bg={"white"}
                            _hover={{ bg: "gray.50" }}
                            onClick={() => {
                              setStartDate("");
                              setEndDate("");
                              setAppliedStartDate("");
                              setAppliedEndDate("");
                              setDateFilterApplied(false);
                            }}
                          >
                            Clear
                          </Button>
                        </Flex>

                        <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            Sort by:
                          </Text>
                          <Select.Root
                            value={[historySortOrder]}
                            w={"240px"}
                            rounded={"md"}
                            size={"xs"}
                            bg={"white"}
                            collection={createListCollection({
                              items: [
                                { value: "newest-first", label: "Newest → Oldest" },
                                { value: "oldest-first", label: "Oldest → Newest" },
                              ],
                            })}
                            onValueChange={(details) =>
                              setHistorySortOrder(details.value[0] as "newest-first" | "oldest-first")
                            }
                          >
                            <Select.HiddenSelect />
                            <Select.Control>
                              <Select.Trigger>
                                <Select.ValueText />
                              </Select.Trigger>
                              <Select.IndicatorGroup>
                                <Select.Indicator />
                              </Select.IndicatorGroup>
                            </Select.Control>
                            <Select.Positioner>
                              <Select.Content>
                                {createListCollection({
                                  items: [
                                    { value: "newest-first", label: "Newest → Oldest" },
                                    { value: "oldest-first", label: "Oldest → Newest" },
                                  ],
                                }).items.map((item) => (
                                  <Select.Item item={item} key={item.value}>
                                    {item.label}
                                    <Select.ItemIndicator />
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Select.Root>
                        </Flex>
                      </Flex>

                      <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"} mx={"0.5"}>
                        <Flex direction={"row"} gap={"1"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            Last modified:
                          </Text>
                          <Text fontSize={"xs"} fontWeight={"normal"}>
                            {templateHistory.length > 0 ? dayjs(templateHistory[0].timestamp).fromNow() : "never"}
                          </Text>
                        </Flex>
                        <Flex direction={"row"} gap={"1"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            Versions:
                          </Text>
                          <Text fontSize={"xs"} fontWeight={"normal"}>
                            {templateHistory.length}
                          </Text>
                        </Flex>
                      </Flex>

                      {sortedTemplateHistory.length > 0 ? (
                        <Timeline.Root size="sm" variant="subtle" mt={"1"}>
                          {sortedTemplateHistory.map((templateVersion) => {
                            const isExpanded = expandedVersions.has(templateVersion.version);
                            return (
                              <Timeline.Item key={`v_${templateVersion.timestamp}`}>
                                <Timeline.Connector>
                                  <Timeline.Separator />
                                  <Timeline.Indicator />
                                </Timeline.Connector>
                                <Timeline.Content>
                                  <Flex direction={"column"} gap={"1"} w={"100%"}>
                                    <Flex
                                      direction={{ base: "column", sm: "row" }}
                                      gap={"2"}
                                      align={{ base: "start", sm: "center" }}
                                      justify={"space-between"}
                                    >
                                      <Flex direction={"column"} gap={"0.5"} grow={"1"}>
                                        <Flex direction={"row"} gap={"1"} align={"center"}>
                                          <Tag.Root size={"sm"} colorPalette={"green"}>
                                            <Tag.Label fontSize={"xs"}>{templateVersion.version.slice(0, 6)}</Tag.Label>
                                          </Tag.Root>
                                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                                            {templateVersion.name}
                                          </Text>
                                          <Text fontSize={"xs"} color={"gray.500"}>
                                            {dayjs(templateVersion.timestamp).fromNow()}
                                          </Text>
                                        </Flex>
                                        <Flex direction={"row"} gap={"1"} align={"center"}>
                                          {templateVersion.message && !_.isEqual(templateVersion.message, "") ? (
                                            <Tooltip
                                              content={templateVersion.message}
                                              disabled={templateVersion.message.length <= 40}
                                              showArrow
                                            >
                                              <Text fontSize={"xs"} color={"gray.600"}>
                                                {_.truncate(templateVersion.message, { length: 40 })}
                                              </Text>
                                            </Tooltip>
                                          ) : (
                                            <Tag.Root size={"sm"} colorPalette={"orange"}>
                                              <Tag.Label fontSize={"xs"}>No message</Tag.Label>
                                            </Tag.Root>
                                          )}
                                        </Flex>
                                      </Flex>
                                      <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
                                        <Collapsible.Root
                                          open={isExpanded}
                                          onOpenChange={(event) => {
                                            const newExpanded = new Set(expandedVersions);
                                            if (event.open) {
                                              newExpanded.add(templateVersion.version);
                                            } else {
                                              newExpanded.delete(templateVersion.version);
                                            }
                                            setExpandedVersions(newExpanded);
                                          }}
                                        >
                                          <Collapsible.Trigger asChild>
                                            <Button
                                              size={"xs"}
                                              variant={"subtle"}
                                              colorPalette={"gray"}
                                              rounded={"md"}
                                              aria-label={isExpanded ? "Collapse details" : "Expand details"}
                                            >
                                              Details
                                              <Icon name={isExpanded ? "c_up" : "c_down"} size={"xs"} />
                                            </Button>
                                          </Collapsible.Trigger>
                                        </Collapsible.Root>
                                        <Button
                                          variant={"solid"}
                                          size={"xs"}
                                          rounded={"md"}
                                          colorPalette={"blue"}
                                          onClick={() => {
                                            setPreviewVersion(templateVersion);
                                            setHistoryOpen(false);
                                          }}
                                          disabled={templateArchived}
                                        >
                                          Preview
                                          <Icon name={"expand"} size={"xs"} />
                                        </Button>
                                        <Button
                                          variant={"solid"}
                                          size={"xs"}
                                          rounded={"md"}
                                          colorPalette={"orange"}
                                          onClick={() => handleRestoreFromHistoryClick(templateVersion)}
                                          disabled={templateArchived || !!previewVersion}
                                        >
                                          Restore
                                          <Icon name={"rewind"} size={"xs"} />
                                        </Button>
                                      </Flex>
                                    </Flex>

                                    <Collapsible.Root
                                      open={isExpanded}
                                      onOpenChange={(event) => {
                                        const newExpanded = new Set(expandedVersions);
                                        if (event.open) {
                                          newExpanded.add(templateVersion.version);
                                        } else {
                                          newExpanded.delete(templateVersion.version);
                                        }
                                        setExpandedVersions(newExpanded);
                                      }}
                                    >
                                      <Collapsible.Content>
                                        <Flex
                                          direction={"column"}
                                          gap={"2"}
                                          mt={"1"}
                                          p={"2"}
                                          bg={"gray.50"}
                                          rounded={"md"}
                                        >
                                          <Flex direction={"row"} gap={"2"} align={"center"}>
                                            <Text fontSize={"xs"} fontWeight={"semibold"}>
                                              Author:
                                            </Text>
                                            <ActorTag
                                              identifier={templateVersion.author}
                                              fallback={"Unknown User"}
                                              size={"sm"}
                                            />
                                          </Flex>

                                          <Flex direction={"column"} gap={"0.5"}>
                                            <Text fontSize={"xs"} fontWeight={"semibold"}>
                                              Description:
                                            </Text>
                                            {_.isEqual(templateVersion.description, "") ? (
                                              <Flex>
                                                <Tag.Root size={"sm"} colorPalette={"orange"}>
                                                  <Tag.Label fontSize={"xs"}>No Description</Tag.Label>
                                                </Tag.Root>
                                              </Flex>
                                            ) : (
                                              <Text fontSize={"xs"}>{templateVersion.description}</Text>
                                            )}
                                          </Flex>

                                          <Flex
                                            direction={"column"}
                                            gap={"1"}
                                            p={"2"}
                                            rounded={"md"}
                                            border={"1px solid"}
                                            borderColor={"gray.300"}
                                            bg={"white"}
                                          >
                                            <Text fontSize={"xs"} fontWeight={"semibold"}>
                                              Values
                                            </Text>
                                            {templateVersion.values.length > 0 ? (
                                              <Flex direction={"row"} gap={"2"} align={"center"} wrap={"wrap"}>
                                                {templateVersion.values.slice(0, 3).map((value) => (
                                                  <Tooltip
                                                    key={`v_val_${templateVersion.timestamp}_${value._id}`}
                                                    content={"Type: " + value.type}
                                                    showArrow
                                                  >
                                                    <Tag.Root size={"sm"}>
                                                      <Tag.Label fontSize={"xs"}>{value.name}</Tag.Label>
                                                    </Tag.Root>
                                                  </Tooltip>
                                                ))}
                                                {templateVersion.values.length > 3 && (
                                                  <Text fontSize={"xs"}>
                                                    and {templateVersion.values.length - 3} more
                                                  </Text>
                                                )}
                                              </Flex>
                                            ) : (
                                              <Text fontSize={"xs"}>No Values</Text>
                                            )}
                                          </Flex>
                                        </Flex>
                                      </Collapsible.Content>
                                    </Collapsible.Root>
                                  </Flex>
                                </Timeline.Content>
                              </Timeline.Item>
                            );
                          })}
                        </Timeline.Root>
                      ) : (
                        <EmptyState.Root>
                          <EmptyState.Content>
                            <EmptyState.Indicator>
                              <Icon name={"clock"} size={"lg"} />
                            </EmptyState.Indicator>
                            <EmptyState.Description>No History</EmptyState.Description>
                          </EmptyState.Content>
                        </EmptyState.Root>
                      )}
                    </Drawer.Body>
                  </Drawer.Content>
                </Drawer.Positioner>
              </Portal>
            </Drawer.Root>

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

        <Flex direction={"column"} gap={"1"} p={"1"} wrap={"wrap"}>
          {/* Overview and "Description" field */}
          <Flex direction={"row"} gap={"1"} p={"0"} wrap={"wrap"}>
            {/* Overview */}
            <Flex direction={"column"} p={"1"} h={"fit-content"} gap={"1"} bg={"gray.100"} rounded={"md"} grow={"1"}>
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Flex direction={"column"} gap={"1"} grow={"1"}>
                  <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                    Template Name
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
                    border={"1px solid"}
                    borderColor={"gray.300"}
                  />
                </Flex>

                <TimestampTag timestamp={template.timestamp} description={"Created"} />
              </Flex>

              <Flex gap={"1"} direction={"row"}>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                    Template Visibility
                  </Text>
                  <VisibilityTag isPublic={false} isInherited />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                    Template Owner
                  </Text>
                  <ActorTag identifier={template.owner} fallback={"No Owner"} size={"sm"} />
                </Flex>
              </Flex>
            </Flex>

            {/* Description */}
            <Flex
              direction={"column"}
              p={"1"}
              gap={"1"}
              border={"1px solid"}
              borderColor={"gray.300"}
              rounded={"md"}
              basis={"40%"}
              grow={"1"}
            >
              <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                Template Description
              </Text>
              <MDEditor
                id={"attributeDescriptionInput"}
                height={150}
                minHeight={100}
                maxHeight={400}
                style={{ width: "100%" }}
                value={displayTemplateDescription}
                preview={editing && !previewVersion ? "edit" : "preview"}
                extraCommands={[]}
                onChange={(value) => {
                  setTemplateDescription(value || "");
                }}
              />
            </Flex>
          </Flex>

          <Flex direction={"column"} gap={"1"} p={"1"} rounded={"md"} border={"1px solid"} borderColor={"gray.300"}>
            <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
              Template Values
            </Text>
            <Values
              key={previewVersion?.version ?? "current"}
              viewOnly={!editing || !!previewVersion}
              values={displayTemplateValues}
              setValues={setTemplateValues}
            />
          </Flex>

          <Flex direction={"column"} gap={"1"} p={"1"} rounded={"md"} border={"1px solid"} borderColor={"gray.300"}>
            <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
              Template Usage
            </Text>
            <DataTable
              data={templateUsage}
              columns={usageColumns}
              visibleColumns={{}}
              selectedRows={{}}
              viewOnly={true}
              showSelection={true}
              showPagination
            />
          </Flex>
        </Flex>
      </Flex>

      {/* Save message modal */}
      <SaveModal
        open={saveMessageOpen}
        onOpenChange={(details) => setSaveMessageOpen(details.open)}
        onDone={handleSaveMessageDoneClick}
        value={saveMessage}
        onChange={setSaveMessage}
        placeholder={"(Optional) Enter a description of the changes made to the Template."}
      />
    </Content>
  );
};

export default Template;
