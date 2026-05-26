// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Input,
  Text,
  useDisclosure,
  Tag,
  Select,
  Drawer,
  IconButton,
  Menu,
  Dialog,
  Fieldset,
  Field,
  createListCollection,
  Portal,
  CloseButton,
  HStack,
  EmptyState,
  Timeline,
  Collapsible,
  Spacer,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import ExportDialog from "@components/ExportDialog";
import RelationshipsGraph from "@components/RelationshipsGraph";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import UploadDialog from "@components/UploadDialog";
import PreviewDialog from "@components/PreviewDialog";
import ViewAttributeDialog from "@components/ViewAttributeDialog";
import AddAttributeDialog from "@components/AddAttributeDialog";
import SearchSelect from "@components/SearchSelect";
import AlertDialog from "@components/AlertDialog";
import TimestampTag from "@components/TimestampTag";
import VisibilityTag from "@components/VisibilityTag";
import AddRelationshipDialog from "@components/AddRelationshipDialog";
import Relationships from "@components/Relationships";
import Tooltip from "@components/Tooltip";
import { UnsavedChangesDialog } from "@components/UnsavedChangesDialog";
import { toaster } from "@components/Toast";
import SaveDialog from "@components/SaveDialog";
import { Cell, createColumnHelper } from "@tanstack/react-table";
import RichTextEditor from "@components/RichTextEditor";

// Existing and custom types
import {
  AttributeModel,
  DataTableAction,
  EntityHistory,
  EntityModel,
  IAttribute,
  IGenericItem,
  IRelationship,
  ResponseData,
} from "@types";

// Utility functions and libraries
import { requestStatic } from "src/database/functions";
import { ignoreAbort, removeTypename } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";
import QRCode from "react-qr-code";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";

// Routing and navigation
import { useParams, useNavigate, useBlocker } from "react-router-dom";

// Contexts and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Authentication
import { auth } from "@lib/auth";

// Variables
import { GLOBAL_STYLES } from "@variables";

// Analytics
import { usePostHog } from "posthog-js/react";

const Entity = () => {
  const { id } = useParams();
  const { breakpoint } = useBreakpoint();
  const posthog = usePostHog();

  // Navigation and routing
  const navigate = useNavigate();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => editing && currentLocation.pathname !== nextLocation.pathname,
  );
  const { onClose: onBlockerClose } = useDisclosure();
  const cancelBlockerRef = useRef(null);

  // Graph dialog
  const [graphOpen, setGraphOpen] = useState(false);

  // Share dialog
  const [shareOpen, setShareOpen] = useState(false);

  const [addProjectsOpen, setAddProjectsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState({} as IGenericItem);
  const [selectedProjects, setSelectedProjects] = useState<IGenericItem[]>([]);

  // Add relationships dialog
  const [addRelationshipsOpen, setAddRelationshipsOpen] = useState(false);

  // Save message dialog
  const [saveMessageOpen, setSaveMessageOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Clone dialog
  const [cloneOpen, setCloneOpen] = useState(false);
  const [clonedEntityName, setClonedEntityName] = useState("");

  // History drawer
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [historySortOrder, setHistorySortOrder] = useState<"newest-first" | "oldest-first">("newest-first");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [appliedStartDate, setAppliedStartDate] = useState<string>("");
  const [appliedEndDate, setAppliedEndDate] = useState<string>("");
  const [dateFilterApplied, setDateFilterApplied] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<EntityHistory | null>(null);

  // Toggles
  const [isUpdating, setIsUpdating] = useState(false);
  const [editing, setEditing] = useState(false);

  // Archive state
  const [entityArchived, setEntityArchived] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<AttributeModel[]>([]);

  // Controls the add-attribute dialog
  const [addAttributesOpen, setAddAttributesOpen] = useState(false);

  // Authentication and user
  const [user, setUser] = useState("");

  /**
   * Helper function to get user information
   */
  const getUser = async () => {
    const sessionResponse = await auth.getSession();
    if (sessionResponse.error || !sessionResponse.data) {
      toaster.create({
        title: "Error",
        description: "Session expired, please login again",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else {
      setUser(sessionResponse.data.user.id);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  // Query to retrieve Entity data and associated data for editing
  const GET_ENTITY = gql`
    query GetEntityData($_id: String) {
      entity(_id: $_id) {
        _id
        name
        owner
        created
        archived
        description
        projects
        relationships {
          source {
            _id
            name
          }
          target {
            _id
            name
          }
          type
        }
        attributes {
          _id
          name
          description
          owner
          values {
            _id
            name
            type
            data
          }
        }
        attachments {
          _id
          name
        }
        history {
          author
          message
          timestamp
          version
          _id
          name
          created
          archived
          owner
          description
          projects
          relationships {
            source {
              _id
              name
            }
            target {
              _id
              name
            }
            type
          }
          attributes {
            _id
            name
            owner
            description
            values {
              _id
              name
              type
              data
            }
          }
          attachments {
            _id
            name
          }
        }
      }
      projects {
        _id
        name
      }
      templates {
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
  const { loading, error, data, refetch } = useQuery<{
    entity: EntityModel;
    projects: IGenericItem[];
    templates: AttributeModel[];
  }>(GET_ENTITY, {
    variables: {
      _id: id,
    },
    fetchPolicy: "no-cache",
  });

  const GET_FILE_URL = gql`
    query GetFileURL($_id: String) {
      downloadFile(_id: $_id)
    }
  `;
  const [getFile] = useLazyQuery<{ downloadFile: string }>(GET_FILE_URL);

  // Query to create a new Entity
  const CREATE_ENTITY = gql`
    mutation CreateEntity($entity: EntityCreateInput) {
      createEntity(entity: $entity) {
        success
        message
        data
      }
    }
  `;
  const [createEntity, { error: createEntityError, loading: createEntityLoading }] = useMutation<{
    createEntity: ResponseData<string>;
  }>(CREATE_ENTITY);

  // Query to create a template Template
  const CREATE_TEMPLATE = gql`
    mutation CreateTemplate($template: AttributeCreateInput) {
      createTemplate(template: $template) {
        success
        message
      }
    }
  `;
  const [createTemplate, { error: errorTemplateCreate }] = useMutation<{
    createTemplate: ResponseData<string>;
  }>(CREATE_TEMPLATE);

  // Mutation to update Entity
  const UPDATE_ENTITY = gql`
    mutation UpdateEntity($entity: EntityUpdateInput, $message: String) {
      updateEntity(entity: $entity, message: $message) {
        success
        message
      }
    }
  `;
  const [updateEntity, { loading: updateLoading }] = useMutation(UPDATE_ENTITY, {
    refetchQueries: ["GetEntityData"],
    awaitRefetchQueries: true,
  });

  // Mutation to archive Entity
  const ARCHIVE_ENTITY = gql`
    mutation ArchiveEntity($_id: String, $state: Boolean) {
      archiveEntity(_id: $_id, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveEntity, { error: archiveError, loading: archiveLoading }] = useMutation<{
    archiveEntity: ResponseData<string>;
  }>(ARCHIVE_ENTITY, {
    refetchQueries: ["GetEntityData"],
    awaitRefetchQueries: true,
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.entity) {
      // Unpack all the Entity data
      setEntity(data.entity);

      if (!editing) {
        setEntityName(data.entity.name);
        setEntityArchived(data.entity.archived);
        setEntityDescription(data.entity.description || "");
        setEntityProjects(data.entity.projects || []);
        setEntityRelationships(data.entity.relationships || []);
        setEntityAttributes(data.entity.attributes || []);
      }

      setEntityAttachments(data.entity.attachments);
      setEntityHistory(data.entity.history || []);

      // Set the cloned Entity name
      setClonedEntityName(`${data.entity.name} (cloned)`);
    }
    // Unpack Template data
    if (data?.templates) {
      setTemplates(data.templates);
    }
  }, [data, editing]);

  useEffect(() => {
    posthog.capture("entity_viewed");
  }, [id]);

  // Display any GraphQL errors
  useEffect(() => {
    if (error) {
      toaster.create({
        title: "Error",
        description: "Unable to retrieve Entity information",
        type: "error",
        closable: true,
      });
    }
  }, [error]);

  /**
   * Utility function to retrieve a file from the server for download
   * @param id File identifier, generated by server
   * @param filename Name of downloaded file, slugified prior to download
   */
  const getDownload = async (_id: string, filename: string) => {
    // Get the static path to the resource for download
    const response = await getFile({
      variables: {
        _id: _id,
      },
    });

    if (!response.data?.downloadFile) {
      toaster.create({
        title: "Error",
        description: "Unable to retrieve file for download",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else if (response.data.downloadFile) {
      // Perform the "GET" request to retrieve the data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileResponse = await requestStatic<any>(response.data.downloadFile, {
        responseType: "blob",
      });

      // Attempt to download the received data
      if (fileResponse.data) {
        FileSaver.saveAs(new Blob([fileResponse.data]), slugify(filename));
      } else {
        toaster.create({
          title: "Error",
          type: "error",
          description: `Error creating download for file "${filename}"`,
          duration: 4000,
          closable: true,
        });
      }
    }
  };

  /**
   * Saves the current attribute form as a reusable Template.
   * Called from the add-attribute dialog when the user clicks "Save as Template".
   */
  const onSaveAsTemplate = async (attributeData: IAttribute) => {
    const response = await createTemplate({
      variables: { template: attributeData },
    });

    if (errorTemplateCreate || !response.data?.createTemplate) {
      toaster.create({
        title: "Error",
        description: errorTemplateCreate?.message || "Unable to save Template",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else if (response.data.createTemplate.success) {
      toaster.create({ title: "Saved!", type: "success", duration: 2000, closable: true });
      setTemplates([...templates, attributeData as AttributeModel]);
    }
  };

  // Break up entity data into editable fields
  const [entity, setEntity] = useState<EntityModel>({} as EntityModel);
  const [entityName, setEntityName] = useState("");
  const [entityDescription, setEntityDescription] = useState("");
  const [entityProjects, setEntityProjects] = useState<string[]>([]);
  const [entityRelationships, setEntityRelationships] = useState<IRelationship[]>([]);
  const [entityAttributes, setEntityAttributes] = useState<AttributeModel[]>([]);
  const [entityHistory, setEntityHistory] = useState<EntityHistory[]>([]);

  // Sorted and filtered history based on sort order and date range
  const sortedEntityHistory = useMemo(() => {
    let filtered = [...entityHistory];

    // Apply date filter if active
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
          end.setHours(23, 59, 59, 999); // Include the entire end date
          if (itemDateOnly > end) return false;
        }

        return true;
      });
    }

    // Sort based on sort order
    if (historySortOrder === "newest-first") {
      return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
  }, [entityHistory, historySortOrder, dateFilterApplied, appliedStartDate, appliedEndDate]);

  const [entityAttachments, setEntityAttachments] = useState<IGenericItem[]>([]);
  const [toUploadAttachments, setToUploadAttachments] = useState<string[]>([]);

  // Computed values that use preview data when in preview mode
  const displayEntityName = useMemo(() => {
    return previewVersion ? previewVersion.name : entityName;
  }, [previewVersion, entityName]);

  const displayEntityDescription = useMemo(() => {
    return previewVersion ? previewVersion.description || "" : entityDescription;
  }, [previewVersion, entityDescription]);

  const displayEntityProjects = useMemo(() => {
    return previewVersion ? previewVersion.projects : entityProjects;
  }, [previewVersion, entityProjects]);

  const displayEntityRelationships = useMemo(() => {
    return previewVersion ? previewVersion.relationships : entityRelationships;
  }, [previewVersion, entityRelationships]);

  const displayEntityAttributes = useMemo(() => {
    return previewVersion ? previewVersion.attributes : entityAttributes;
  }, [previewVersion, entityAttributes]);

  const displayEntityAttachments = useMemo(() => {
    return previewVersion ? previewVersion.attachments : entityAttachments;
  }, [previewVersion, entityAttachments]);

  const displayEntityArchived = useMemo(() => {
    return previewVersion ? previewVersion.archived : entityArchived;
  }, [previewVersion, entityArchived]);

  const displayEntityData = useMemo(() => {
    if (previewVersion) {
      return {
        ...entity,
        name: previewVersion.name,
        description: previewVersion.description || "",
        projects: previewVersion.projects,
        relationships: previewVersion.relationships,
        attributes: previewVersion.attributes,
        attachments: previewVersion.attachments,
        archived: previewVersion.archived,
      };
    }
    return entity;
  }, [previewVersion, entity]);

  // Archive dialog
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  // Export dialog
  const [exportOpen, setExportOpen] = useState(false);

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);

  // Toggle editing status
  const handleEditClick = () => {
    if (previewVersion) return; // Disable editing in preview mode
    if (editing) {
      // Open the save message dialog
      setSaveMessageOpen(true);
    } else {
      setEditing(true);
    }
  };

  /**
   * Helper function to handle clicking the "Done" button within
   * the save message dialog
   */
  const handleSaveMessageDoneClick = async () => {
    setIsUpdating(updateLoading);
    try {
      const mutationPayload = removeTypename({
        _id: entity._id,
        name: entityName,
        archived: entityArchived,
        created: entity.created,
        owner: entity.owner,
        description: entityDescription,
        projects: entityProjects,
        relationships: entityRelationships,
        attributes: entityAttributes,
        attachments: entityAttachments,
      });
      await updateEntity({
        variables: {
          entity: mutationPayload,
          message: saveMessage,
        },
      });

      toaster.create({
        title: "Updated Successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
    } catch {
      toaster.create({
        title: "Error",
        description: `Entity could not be updated`,
        type: "error",
        duration: 2000,
        closable: true,
      });
    }

    // Close the save message dialog
    setSaveMessageOpen(false);
    setSaveMessage("");

    setEditing(false);
    setIsUpdating(false);
  };

  /**
   * Handle cancelling an Edit operation
   */
  const handleCancelClick = () => {
    // Disable editing
    setEditing(false);

    // Reset all Entity states
    setEntity(entity);
    setEntityName(entity.name);
    setEntityDescription(entity.description);
    setEntityProjects(entity.projects);
    setEntityRelationships(entity.relationships);
    setEntityAttributes(entity.attributes);
    setEntityAttachments(entity.attachments);
    setEntityHistory(entity.history);
  };

  /**
   * Restore an Entity from an archived status
   */
  const handleRestoreFromArchiveClick = async () => {
    await archiveEntity({
      variables: {
        _id: entity._id,
        state: false,
      },
    });

    if (archiveError) {
      toaster.create({
        title: "Error while unarchiving Entity",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else {
      toaster.create({
        title: "Entity successfully unarchived",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setEntityArchived(false);
    }
  };

  // Configure Projects table columns and data
  const projectsTableColumns = [
    {
      id: "projectId",
      accessorFn: (row: string) => row,
      cell: (info: Cell<string, string>) => {
        const projectId = info.getValue();
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={projectId} disabled={projectId.length < 32} showArrow>
              <Linky id={projectId} type={"projects"} size={"xs"} truncate={false} />
            </Tooltip>
            {editing ? (
              <Button
                size="2xs"
                mx={"1"}
                variant="subtle"
                colorPalette="red"
                aria-label={"Remove Project"}
                onClick={() => {
                  removeProject(projectId);
                }}
              >
                Remove
                <Icon name={"delete"} size={"xs"} />
              </Button>
            ) : (
              <Button
                size="2xs"
                mx={"1"}
                variant="subtle"
                colorPalette="gray"
                aria-label={"View Project"}
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                View
                <Icon name={"a_right"} size={"xs"} />
              </Button>
            )}
          </Flex>
        );
      },
      header: "Name",
    },
  ];
  const projectsTableActions: DataTableAction[] = [
    {
      label: "Remove Projects",
      icon: "delete",
      action(table, rows) {
        const projectsToRemove: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          projectsToRemove.push(table.getRow(rowIndex).original);
        }

        removeProjects(projectsToRemove);
      },
    },
  ];

  // Utility function to check if Attribute is an instance of a known Template
  const isKnownTemplate = (_id: string, templates: AttributeModel[]): boolean => {
    for (const attribute of templates) {
      if (_.startsWith(_id, attribute._id) || _.isEqual(_id, attribute._id)) {
        // Template / Attribute ID matches
        return true;
      }
    }
    // No matches
    return false;
  };

  // Configure attribute table columns and data
  const attributeTableColumnHelper = createColumnHelper<AttributeModel>();
  const attributeTableColumns = [
    attributeTableColumnHelper.accessor("name", {
      cell: (info) => {
        const attribute = info.row.original;
        const [viewAttributeDialogOpen, setViewAttributeDialogOpen] = useState(false);
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 16} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 16 })}
              </Text>
            </Tooltip>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Button
                size="2xs"
                variant="subtle"
                rounded="md"
                colorPalette="gray"
                aria-label={"View Attribute"}
                onClick={() => setViewAttributeDialogOpen(true)}
              >
                {editing ? "Edit" : "Expand"}
                <Icon name={editing ? "edit" : "expand"} size={"xs"} />
              </Button>
              {editing && (
                <Button
                  size="2xs"
                  rounded="md"
                  variant="subtle"
                  colorPalette="red"
                  aria-label={"Delete Attribute"}
                  onClick={() => removeAttribute(attribute._id)}
                >
                  Delete
                  <Icon name={"delete"} size={"xs"} />
                </Button>
              )}
              <ViewAttributeDialog
                open={viewAttributeDialogOpen}
                setOpen={setViewAttributeDialogOpen}
                attribute={attribute}
                editing={editing}
                isTemplate={isKnownTemplate(attribute._id, templates)}
                onAttributeUpdate={onAttributeUpdate}
                removeCallback={() => {
                  removeAttribute(attribute._id);
                }}
              />
            </Flex>
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 240,
      },
    }),
    attributeTableColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>Empty</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Flex>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 32} showArrow>
              <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 32 })}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
    }),
    attributeTableColumnHelper.accessor("values", {
      cell: (info) => {
        const values = info.row.original.values;
        if (values.length === 0) {
          return (
            <Text fontSize={"xs"} color={"gray.500"}>
              No values
            </Text>
          );
        }
        const valueNames = values.map((value) => value.name).join(", ");
        const truncatedNames = valueNames.length > 50 ? `${valueNames.substring(0, 50)}...` : valueNames;
        return (
          <Tooltip content={valueNames} showArrow disabled={valueNames.length <= 50}>
            <Text fontSize={"xs"}>{truncatedNames}</Text>
          </Tooltip>
        );
      },
      header: "Values",
    }),
  ];
  const [visibleAttributeTableColumns, setVisibleAttributeTableColumns] = useState({});

  // Effect to adjust column visibility
  useEffect(() => {
    if (_.isEqual(breakpoint, "sm") || _.isEqual(breakpoint, "base") || _.isUndefined(breakpoint)) {
      setVisibleAttributeTableColumns({ description: false });
    } else {
      setVisibleAttributeTableColumns({});
    }
  }, [breakpoint]);

  // Configure attachment table columns and data
  const attachmentTableColumnHelper = createColumnHelper<IGenericItem>();
  const attachmentTableColumns = [
    attachmentTableColumnHelper.accessor("name", {
      cell: (info) => {
        const attachmentId = info.row.original._id;
        const attachmentName = info.row.original.name;

        const handleDownload = async () => {
          await getDownload(attachmentId, attachmentName);
        };

        return (
          <Flex w={"100%"} justify={"space-between"} gap={"1"} align={"center"}>
            <Tooltip content={attachmentName} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(attachmentName, { length: 36 })}
              </Text>
            </Tooltip>
            <Flex gap={"1"} align={"center"}>
              <PreviewDialog
                attachment={{
                  _id: attachmentId,
                  name: attachmentName,
                }}
              />
              {editing ? (
                <IconButton
                  aria-label={"Remove attachment"}
                  size={"2xs"}
                  variant={"subtle"}
                  key={`remove-file-${attachmentId}`}
                  colorPalette={"red"}
                  onClick={() => removeAttachment(attachmentId)}
                >
                  <Icon name={"delete"} size={"xs"} />
                </IconButton>
              ) : (
                <IconButton
                  aria-label={"Download attachment"}
                  size={"2xs"}
                  variant={"subtle"}
                  key={`download-file-${attachmentId}`}
                  colorPalette={"blue"}
                  onClick={() => handleDownload()}
                >
                  <Icon name={"download"} size={"xs"} />
                </IconButton>
              )}
            </Flex>
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 360,
      },
    }),
    {
      id: "type",
      accessorFn: (row: IGenericItem) => row.name,
      cell: (info: Cell<IGenericItem, string>) => {
        const fileExtension = _.upperCase(_.last(info.row.original.name.split(".")));
        let fileColorScheme = "yellow";
        if (_.isEqual(fileExtension, "PDF")) {
          fileColorScheme = "red";
        } else if (_.isEqual(fileExtension, "DNA")) {
          fileColorScheme = "green";
        } else if (_.isEqual(fileExtension, "PNG") || _.isEqual(fileExtension, "JPEG")) {
          fileColorScheme = "blue";
        }

        return (
          <Tag.Root colorPalette={fileColorScheme}>
            <Tag.Label>{fileExtension}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "File Format",
    },
  ];
  const attachmentTableActions: DataTableAction[] = [
    {
      label: "Remove Attachments",
      icon: "delete",
      action(table, rows) {
        const attachmentsToRemove: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          attachmentsToRemove.push(table.getRow(rowIndex).original._id);
        }
        removeAttachments(attachmentsToRemove);
      },
    },
  ];

  /**
   * Restore an Entity from an earlier point in time
   * @param {EntityHistory} entityVersion historical Entity data to restore
   */
  const handleRestoreFromHistoryClick = async (entityVersion: EntityHistory) => {
    try {
      const restorePayload = removeTypename({
        _id: entity._id,
        name: entityVersion.name,
        created: entity.created,
        archived: entityVersion.archived,
        owner: entityVersion.owner,
        description: entityVersion.description || "",
        projects: entityVersion.projects || [],
        relationships: entityVersion.relationships || [],
        attributes: entityVersion.attributes || [],
        attachments: entityVersion.attachments || [],
      });
      await updateEntity({
        variables: {
          entity: restorePayload,
          message: saveMessage,
        },
      });
      toaster.create({
        title: "Success",
        description: `Restored Entity version ${entityVersion.version}`,
        type: "success",
        duration: 2000,
        closable: true,
      });

      // Update the state (safely)
      setEntityDescription(entityVersion.description || "");
      setEntityProjects(entityVersion.projects || []);
      setEntityRelationships(entityVersion.relationships || []);
      setEntityAttributes(entityVersion.attributes || []);
      setEntityAttachments(entityVersion.attachments || []);

      // Close the sidebar
      setHistoryOpen(false);
    } catch {
      toaster.create({
        title: "Error",
        description: `Entity could not be restored`,
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  // Handle clicking the "Share" button
  const handleShareClick = () => {
    setShareOpen(true);
  };

  // Handle clicking the "Export" button
  const handleExportClick = () => {
    setEntity(entity);
    setExportOpen(true);
  };

  // Handle clicking the "Download" button
  // Handle clicking the "Clone" button
  const handleCloneClick = async () => {
    // Create a new Entity, with `(cloned)` appended to the name
    const response = await createEntity({
      variables: {
        entity: removeTypename({
          name: clonedEntityName,
          owner: entity.owner,
          created: dayjs(Date.now()).toISOString(),
          archived: false,
          description: entity.description,
          projects: entity.projects,
          relationships: entity.relationships,
          attributes: entity.attributes,
          attachments: entity.attachments,
        }),
      },
    });

    if (createEntityError || !response.data?.createEntity) {
      toaster.create({
        title: "Error",
        description: "An error occurred while cloning the Entity",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else if (response.data.createEntity.success) {
      posthog.capture("entity_cloned");
      setCloneOpen(false);

      toaster.create({
        title: "Cloned Successfully",
        description: "Entity has been cloned successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      // Navigate to the new Entity
      navigate(`/entities/${response.data.createEntity.data}`);
    }
  };

  // Archive the Entity when confirmed
  const handleArchiveClick = async () => {
    const response = await archiveEntity({
      variables: {
        _id: entity._id,
        state: true,
      },
    });

    if (!response.data?.archiveEntity || !response.data.archiveEntity.success) {
      toaster.create({
        title: "Error",
        description: "An error occurred while archiving Entity",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (response.data.archiveEntity.success) {
      posthog.capture("entity_archived");
      toaster.create({
        title: "Archived Successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setEntityArchived(true);
      setArchiveDialogOpen(false);
    }

    setEditing(false);
  };

  const handleEntityNodeClick = (id: string) => {
    setGraphOpen(false);
    navigate(`/entities/${id}`);
  };

  // Remove a Project from the Entity state
  const removeProject = (id: string) => {
    setEntityProjects(
      entityProjects.filter((project) => {
        return project !== id;
      }),
    );
  };

  const removeProjects = (ids: string[]) => {
    setEntityProjects(
      entityProjects.filter((project) => {
        return !_.includes(ids, project);
      }),
    );
  };

  // Remove Attachments from the Entity state
  const removeAttachment = (id: string) => {
    setEntityAttachments(
      entityAttachments.filter((attachment) => {
        return attachment._id !== id;
      }),
    );
  };

  const removeAttachments = (ids: string[]) => {
    setEntityAttachments(
      entityAttachments.filter((attachment) => {
        return !_.includes(ids, attachment._id);
      }),
    );
  };

  // Remove Attributes from the Entity state
  const removeAttribute = (id: string) => {
    setEntityAttributes(
      entityAttributes.filter((attribute) => {
        return attribute._id !== id;
      }),
    );
  };

  const onAttributeUpdate = (updated: AttributeModel) => {
    const updatedAttributes = _.cloneDeep(entityAttributes).map((attribute) => {
      if (attribute._id === updated._id) {
        attribute.name = updated.name;
        attribute.description = updated.description;
        attribute.values = updated.values;
      }
      return attribute;
    });
    setEntityAttributes([...updatedAttributes]);
  };

  /**
   * Callback function to the Entity to Projects
   * @param {string[]} projects List of Projects to add the Entities to
   */
  const addProjects = (): void => {
    setEntityProjects([...entityProjects, ...selectedProjects.map((p) => p._id)]);
    setSelectedProjects([]);
    setSelectedProject({} as IGenericItem);
    setAddProjectsOpen(false);
  };

  const onCancelAddProjectsClick = () => {
    setSelectedProjects([]);
    setSelectedProject({} as IGenericItem);
    setAddProjectsOpen(false);
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
                disabled={entityArchived}
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

        <Flex gap={"2"} p={"1"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          <Flex direction={"row"} gap={"2"} align={"center"} p={"0"} m={"0"}>
            <Flex
              id={"entityNameTag"}
              align={"center"}
              gap={"1"}
              p={"1"}
              border={"2px solid"}
              borderColor={GLOBAL_STYLES.entity.iconColor}
              bg={"purple.50"}
              rounded={"md"}
            >
              <Icon name={"entity"} size={"sm"} color={GLOBAL_STYLES.entity.iconColor} />
              <Tooltip content={displayEntityData.name}>
                <Heading fontWeight={"semibold"} size={"sm"}>
                  {_.truncate(displayEntityData.name, { length: 30 })}
                </Heading>
              </Tooltip>
            </Flex>

            {displayEntityArchived && (
              <Flex
                id={"entityArchiveTag"}
                align={"center"}
                gap={"1"}
                p={"1"}
                border={"2px solid"}
                borderColor={"gray.500"}
                bg={GLOBAL_STYLES.card.bg}
                rounded={"md"}
              >
                <Icon name={"archive"} size={"sm"} color={"gray.500"} />
                <Tooltip content={"This Entity has been archived"}>
                  <Heading fontWeight={"semibold"} size={"sm"}>
                    Archived
                  </Heading>
                </Tooltip>
              </Flex>
            )}
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"} align={"center"}>
            {/* Actions Menu */}
            <Menu.Root size={"sm"}>
              <Menu.Trigger asChild>
                <Button variant={"solid"} size={"xs"} rounded={"md"} colorPalette={"yellow"}>
                  Actions
                  <Icon name={"lightning"} size={"xs"} />
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value={"print"} fontSize={"xs"} disabled>
                      <Icon name={"print"} size={"xs"} />
                      Print
                    </Menu.Item>
                    <Menu.Item value={"share"} fontSize={"xs"} onClick={handleShareClick}>
                      <Icon name={"share"} size={"xs"} />
                      Share
                    </Menu.Item>
                    <Menu.Item
                      value={"visualize"}
                      onClick={() => setGraphOpen(true)}
                      fontSize={"xs"}
                      disabled={editing || entityArchived || !!previewVersion}
                    >
                      <Icon name={"graph"} size={"xs"} />
                      Visualize
                    </Menu.Item>
                    <Menu.Item
                      value={"clone"}
                      onClick={() => setCloneOpen(true)}
                      fontSize={"xs"}
                      disabled={entityArchived || !!previewVersion}
                    >
                      <Icon name={"copy"} size={"xs"} />
                      Clone
                    </Menu.Item>
                    <Menu.Item
                      value={"export"}
                      onClick={handleExportClick}
                      fontSize={"xs"}
                      disabled={editing || entityArchived || !!previewVersion}
                    >
                      <Icon name={"download"} size={"xs"} />
                      Export
                    </Menu.Item>
                    <Menu.Item
                      id={"archiveEntityButton"}
                      value={"archive"}
                      onClick={() => setArchiveDialogOpen(true)}
                      fontSize={"xs"}
                      disabled={entityArchived}
                    >
                      <Icon name={"archive"} size={"xs"} />
                      Archive
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>

            {editing && (
              <Button
                id={"addProjectsDialogButton"}
                variant={"solid"}
                size={"xs"}
                rounded={"md"}
                colorPalette={"red"}
                onClick={handleCancelClick}
              >
                Cancel
                <Icon name={"cross"} size={"xs"} />
              </Button>
            )}
            {entityArchived ? (
              <Button
                id={"restoreEntityButton"}
                variant={"solid"}
                size={"xs"}
                rounded={"md"}
                colorPalette={"orange"}
                onClick={handleRestoreFromArchiveClick}
              >
                Restore
                <Icon name={"rewind"} size={"xs"} />
              </Button>
            ) : (
              <Button
                id={"editEntityButton"}
                variant={"solid"}
                size={"xs"}
                rounded={"md"}
                colorPalette={editing ? "green" : "blue"}
                onClick={handleEditClick}
                loading={isUpdating}
                disabled={!!previewVersion}
              >
                {editing ? "Save" : "Edit"}
                <Icon name={editing ? "save" : "edit"} size={"xs"} />
              </Button>
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
                    <Drawer.Header p={"2"} bg={GLOBAL_STYLES.dialog.headerColor} roundedTop={"md"}>
                      <Flex direction={"row"} gap={"1"} align={"center"}>
                        <Icon name={"clock"} size={"xs"} />
                        <Text fontSize={"sm"} fontWeight={"semibold"}>
                          Entity History
                        </Text>
                      </Flex>
                    </Drawer.Header>

                    <Drawer.Body pt={"0"} p={"2"} px={"2"} gap={"2"}>
                      <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"} mx={"0.5"} mb={"2"}>
                        <Flex direction={"row"} gap={"1"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            Last modified:
                          </Text>
                          <Text fontSize={"xs"} fontWeight={"normal"}>
                            {entityHistory.length > 0 ? dayjs(entityHistory[0].timestamp).fromNow() : "never"}
                          </Text>
                        </Flex>
                        <Flex direction={"row"} gap={"1"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            Versions:
                          </Text>
                          <Text fontSize={"xs"} fontWeight={"normal"}>
                            {entityHistory.length}
                          </Text>
                        </Flex>
                      </Flex>

                      <Flex
                        direction={"row"}
                        gap={"2"}
                        align={"start"}
                        rounded={"md"}
                        bg={"gray.100"}
                        p={"2"}
                        justify={"space-between"}
                        wrap={"wrap"}
                      >
                        <Flex direction={"column"} gap={"1"} align={"center"} justify={"left"} ml={"0.5"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"} w={"100%"} ml={"0.5"}>
                            Sort
                          </Text>
                          <Select.Root
                            value={[historySortOrder]}
                            w={"240px"}
                            rounded={"md"}
                            size={"xs"}
                            bg={"white"}
                            collection={createListCollection({
                              items: [
                                {
                                  value: "newest-first",
                                  label: "Newest → Oldest",
                                },
                                {
                                  value: "oldest-first",
                                  label: "Oldest → Newest",
                                },
                              ],
                            })}
                            onValueChange={(details) =>
                              setHistorySortOrder(details.value[0] as "newest-first" | "oldest-first")
                            }
                          >
                            <Select.HiddenSelect />
                            <Select.Control>
                              <Select.Trigger rounded={"md"}>
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
                                    {
                                      value: "newest-first",
                                      label: "Newest → Oldest",
                                    },
                                    {
                                      value: "oldest-first",
                                      label: "Oldest → Newest",
                                    },
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

                        <Flex direction={"column"} gap={"1"} align={"center"} wrap={"wrap"} ml={"0.5"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"} w={"100%"} ml={"0.5"}>
                            Edited Between
                          </Text>

                          <Flex direction={"row"} gap={"2"} align={"center"}>
                            <Field.Root gap={"0"}>
                              <Field.Label fontSize={"xs"} ml={"0.5"}>
                                Start
                              </Field.Label>
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
                              <Field.Label fontSize={"xs"} ml={"0.5"}>
                                End
                              </Field.Label>
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
                          <Flex direction={"row"} gap={"2"} align={"center"} justify={"flex-end"} w={"100%"}>
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
                              Apply Filter
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
                              Reset Filter
                            </Button>
                          </Flex>
                        </Flex>
                      </Flex>

                      {sortedEntityHistory.length > 0 ? (
                        <Timeline.Root size="sm" variant="subtle" mt={"2"}>
                          {sortedEntityHistory.map((entityVersion) => {
                            const isExpanded = expandedVersions.has(entityVersion.version);
                            return (
                              <Timeline.Item key={`v_${entityVersion.timestamp}`}>
                                <Timeline.Connector>
                                  <Timeline.Separator />
                                  <Timeline.Indicator />
                                </Timeline.Connector>
                                <Timeline.Content>
                                  <Flex direction={"column"} gap={"2"} w={"100%"}>
                                    <Flex
                                      direction={{ base: "column", sm: "row" }}
                                      gap={"2"}
                                      align={{ base: "start", sm: "center" }}
                                      justify={"space-between"}
                                    >
                                      <Flex direction={"column"} gap={"0.5"} grow={"1"}>
                                        <Flex direction={"row"} gap={"1"} align={"center"}>
                                          <Tag.Root size={"sm"} colorPalette={"green"}>
                                            <Tag.Label fontSize={"xs"}>{entityVersion.version.slice(0, 6)}</Tag.Label>
                                          </Tag.Root>
                                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                                            {entityVersion.name}
                                          </Text>
                                          <Text fontSize={"xs"} color={"gray.500"}>
                                            {dayjs(entityVersion.timestamp).fromNow()}
                                          </Text>
                                        </Flex>
                                        <Flex direction={"row"} gap={"1"} align={"center"}>
                                          {entityVersion.message && !_.isEqual(entityVersion.message, "") ? (
                                            <Tooltip
                                              content={entityVersion.message}
                                              disabled={entityVersion.message.length <= 40}
                                              showArrow
                                            >
                                              <Text fontSize={"xs"} color={"gray.600"}>
                                                {_.truncate(entityVersion.message, { length: 40 })}
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
                                              newExpanded.add(entityVersion.version);
                                            } else {
                                              newExpanded.delete(entityVersion.version);
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
                                            setPreviewVersion(entityVersion);
                                            setHistoryOpen(false);
                                          }}
                                          disabled={entityArchived}
                                        >
                                          Preview
                                          <Icon name={"expand"} size={"xs"} />
                                        </Button>
                                        <Button
                                          variant={"solid"}
                                          size={"xs"}
                                          rounded={"md"}
                                          colorPalette={"orange"}
                                          onClick={() => handleRestoreFromHistoryClick(entityVersion)}
                                          disabled={entityArchived || !!previewVersion}
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
                                          newExpanded.add(entityVersion.version);
                                        } else {
                                          newExpanded.delete(entityVersion.version);
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
                                          bg={GLOBAL_STYLES.card.bg}
                                          rounded={"md"}
                                        >
                                          <Flex direction={"row"} gap={"2"} align={"center"}>
                                            <Text fontSize={"xs"} fontWeight={"semibold"}>
                                              Author:
                                            </Text>
                                            <ActorTag
                                              identifier={entityVersion.author}
                                              fallback={"Unknown User"}
                                              size={"sm"}
                                            />
                                          </Flex>

                                          <Flex direction={"column"} gap={"0.5"}>
                                            <Text fontSize={"xs"} fontWeight={"semibold"}>
                                              Description:
                                            </Text>
                                            {_.isEqual(entityVersion.description, "") ? (
                                              <Flex>
                                                <Tag.Root size={"sm"} colorPalette={"orange"}>
                                                  <Tag.Label fontSize={"xs"}>No Description</Tag.Label>
                                                </Tag.Root>
                                              </Flex>
                                            ) : (
                                              <Text fontSize={"xs"}>{entityVersion.description}</Text>
                                            )}
                                          </Flex>

                                          <Flex direction={"row"} gap={"1"}>
                                            <Flex
                                              direction={"column"}
                                              gap={"1"}
                                              p={"2"}
                                              rounded={"md"}
                                              border={GLOBAL_STYLES.border.style}
                                              borderColor={GLOBAL_STYLES.border.color}
                                              bg={"white"}
                                              grow={"1"}
                                            >
                                              <Text fontSize={"xs"} fontWeight={"semibold"}>
                                                Projects
                                              </Text>
                                              {entityVersion.projects.length > 0 ? (
                                                <Flex direction={"row"} gap={"2"} align={"center"} wrap={"wrap"}>
                                                  {entityVersion.projects.map((projectId) => (
                                                    <Linky
                                                      type={"projects"}
                                                      id={projectId}
                                                      size={"xs"}
                                                      key={`p_${entityVersion}_${projectId}`}
                                                    />
                                                  ))}
                                                </Flex>
                                              ) : (
                                                <Flex>
                                                  <Tag.Root size={"sm"} colorPalette={"orange"}>
                                                    <Tag.Label fontSize={"xs"}>No Projects</Tag.Label>
                                                  </Tag.Root>
                                                </Flex>
                                              )}
                                            </Flex>

                                            <Flex
                                              direction={"column"}
                                              gap={"1"}
                                              p={"2"}
                                              rounded={"md"}
                                              border={GLOBAL_STYLES.border.style}
                                              borderColor={GLOBAL_STYLES.border.color}
                                              bg={"white"}
                                              grow={"1"}
                                            >
                                              <Text fontSize={"xs"} fontWeight={"semibold"}>
                                                Relationships
                                              </Text>
                                              <Flex direction={"row"} gap={"1"}>
                                                <Tag.Root
                                                  key={`v_o_${entityVersion.timestamp}`}
                                                  size={"sm"}
                                                  colorPalette={
                                                    entityVersion.relationships.length > 0 ? undefined : "orange"
                                                  }
                                                >
                                                  <Tag.Label fontSize={"xs"}>
                                                    {entityVersion.relationships.length > 0
                                                      ? entityVersion.relationships.length
                                                      : "No Relationships"}
                                                  </Tag.Label>
                                                </Tag.Root>
                                              </Flex>
                                            </Flex>
                                          </Flex>

                                          <Flex direction={"row"} gap={"1"}>
                                            <Flex
                                              direction={"column"}
                                              gap={"1"}
                                              p={"2"}
                                              rounded={"md"}
                                              border={GLOBAL_STYLES.border.style}
                                              borderColor={GLOBAL_STYLES.border.color}
                                              bg={"white"}
                                              grow={"1"}
                                            >
                                              <Text fontSize={"xs"} fontWeight={"semibold"}>
                                                Attributes
                                              </Text>
                                              {entityVersion.attributes.length > 0 ? (
                                                <Flex direction={"row"} gap={"2"} align={"center"} wrap={"wrap"}>
                                                  {entityVersion.attributes.slice(0, 3).map((attr) => (
                                                    <Tooltip
                                                      key={`v_a_${entityVersion.timestamp}_${attr._id}`}
                                                      content={"Values: " + attr.values.length}
                                                      showArrow
                                                    >
                                                      <Tag.Root size={"sm"}>
                                                        <Tag.Label fontSize={"xs"}>{attr.name}</Tag.Label>
                                                      </Tag.Root>
                                                    </Tooltip>
                                                  ))}
                                                  {entityVersion.attributes.length > 3 && (
                                                    <Text fontSize={"xs"}>
                                                      and {entityVersion.attributes.length - 3} more
                                                    </Text>
                                                  )}
                                                </Flex>
                                              ) : (
                                                <Flex>
                                                  <Tag.Root size={"sm"} colorPalette={"orange"}>
                                                    <Tag.Label fontSize={"xs"}>No Attributes</Tag.Label>
                                                  </Tag.Root>
                                                </Flex>
                                              )}
                                            </Flex>

                                            <Flex
                                              direction={"column"}
                                              gap={"1"}
                                              p={"2"}
                                              rounded={"md"}
                                              border={GLOBAL_STYLES.border.style}
                                              borderColor={GLOBAL_STYLES.border.color}
                                              bg={"white"}
                                              grow={"1"}
                                            >
                                              <Text fontSize={"xs"} fontWeight={"semibold"}>
                                                Attachments
                                              </Text>
                                              {entityVersion.attachments.length > 0 ? (
                                                <Flex direction={"row"} gap={"2"} align={"center"} wrap={"wrap"}>
                                                  {entityVersion.attachments.slice(0, 3).map((attachment) => (
                                                    <Tooltip
                                                      key={`v_at_${entityVersion.timestamp}_${attachment._id}`}
                                                      content={attachment.name}
                                                      showArrow
                                                    >
                                                      <Tag.Root size={"sm"}>
                                                        <Tag.Label fontSize={"xs"}>
                                                          {_.truncate(attachment.name, { length: 20 })}
                                                        </Tag.Label>
                                                      </Tag.Root>
                                                    </Tooltip>
                                                  ))}
                                                  {entityVersion.attachments.length > 3 && (
                                                    <Text fontSize={"xs"}>
                                                      and {entityVersion.attachments.length - 3} more
                                                    </Text>
                                                  )}
                                                </Flex>
                                              ) : (
                                                <Flex>
                                                  <Tag.Root size={"sm"} colorPalette={"orange"}>
                                                    <Tag.Label fontSize={"xs"}>No Attachments</Tag.Label>
                                                  </Tag.Root>
                                                </Flex>
                                              )}
                                            </Flex>
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
              header={"Archive Entity"}
              leftButtonAction={() => setArchiveDialogOpen(false)}
              rightButtonAction={handleArchiveClick}
              open={archiveDialogOpen}
              setOpen={setArchiveDialogOpen}
            >
              <Flex gap={"2"} direction={"column"} p={"0"}>
                <Text fontWeight={"semibold"} fontSize={"xs"}>
                  Are you sure you want to archive this Entity?
                </Text>
                <Text fontSize={"xs"}>
                  This Entity will be moved to the Workspace archive. All relationships will be preserved, however it
                  will not be visible. It can be restored at any time.
                </Text>
              </Flex>
            </AlertDialog>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Entity Overview and Description */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Entity Overview */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              bg={"gray.100"}
              rounded={"md"}
              grow={"1"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              {/* "Name" field */}
              <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"2"} grow={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"} ml={"0.5"}>
                    Name
                  </Text>
                  <Input
                    id={"entityNameInput"}
                    size={"xs"}
                    value={previewVersion ? displayEntityName : entityName}
                    onChange={(event) => {
                      setEntityName(event.target.value || "");
                    }}
                    readOnly={!editing || !!previewVersion}
                    rounded={"md"}
                    border={GLOBAL_STYLES.border.style}
                    borderColor={GLOBAL_STYLES.border.color}
                    bg={"white"}
                  />
                </Flex>
              </Flex>

              {/* "Owner", "Timestamp", and "Visibility" fields */}
              <Flex gap={"2"} direction={"row"} w={"100%"} wrap={"wrap"}>
                {/* Owner */}
                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"} ml={"0.5"}>
                    Owner
                  </Text>
                  <ActorTag identifier={entity.owner} fallback={"Unknown User"} size={"sm"} />
                </Flex>

                {/* Timestamp */}
                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"} ml={"0.5"}>
                    Timestamp
                  </Text>
                  <TimestampTag timestamp={entity.created} description={"Created"} />
                </Flex>

                <Spacer />

                {/* Visibility */}
                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"} ml={"0.5"}>
                    Visibility
                  </Text>
                  <VisibilityTag isPublic={false} isInherited />
                </Flex>
              </Flex>
            </Flex>

            {/* Description */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"100%"}
              gap={"2"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
              rounded={"md"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"} ml={"0.5"}>
                Description
              </Text>
              <RichTextEditor
                id={"entityDescriptionInput"}
                value={previewVersion ? displayEntityDescription : entityDescription}
                readOnly={!(editing && !previewVersion)}
                onChange={(value) => setEntityDescription(value)}
                h={"100%"}
              />
            </Flex>
          </Flex>

          {/* Attributes and Projects */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Attributes */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex direction={"row"} justify={"space-between"} align={"center"}>
                <Flex direction={"row"} gap={"0.5"} align={"center"}>
                  <Icon name={"attribute"} size={"xs"} color={GLOBAL_STYLES.template.iconColor} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"} ml={"0.5"}>
                    Attributes
                  </Text>
                </Flex>
                <Button
                  id={"addAttributeDialogButton"}
                  variant={"solid"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  onClick={() => setAddAttributesOpen(true)}
                  disabled={!editing}
                >
                  Add
                  <Icon name={"add"} size={"xs"} />
                </Button>
              </Flex>

              <Flex
                w={"100%"}
                justify={"center"}
                align={"center"}
                minH={displayEntityAttributes.length > 0 ? "fit-content" : "120px"}
              >
                {displayEntityAttributes.length === 0 ? (
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"attribute"} size={"lg"} color={GLOBAL_STYLES.template.lightColor} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No Attributes</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                ) : (
                  <DataTable
                    data={displayEntityAttributes}
                    columns={attributeTableColumns}
                    visibleColumns={visibleAttributeTableColumns}
                    selectedRows={{}}
                    viewOnly={!editing || !!previewVersion}
                    showPagination
                    showSelection
                  />
                )}
              </Flex>
            </Flex>

            {/* Projects */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex direction={"row"} justify={"space-between"} align={"center"}>
                <Flex direction={"row"} gap={"0.5"} align={"center"}>
                  <Icon name={"project"} size={"xs"} color={GLOBAL_STYLES.project.iconColor} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"} ml={"0.5"}>
                    Projects
                  </Text>
                </Flex>
                <Button
                  id={"addProjectsDialogButton"}
                  variant={"solid"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  onClick={() => setAddProjectsOpen(true)}
                  disabled={!editing}
                >
                  Add
                  <Icon name={"add"} size={"xs"} />
                </Button>
              </Flex>
              <Flex
                w={"100%"}
                justify={"center"}
                align={"center"}
                minH={displayEntityProjects.length > 0 ? "fit-content" : "120px"}
              >
                {displayEntityProjects.length === 0 ? (
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"project"} size={"lg"} color={GLOBAL_STYLES.project.defaultColor} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No Projects</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                ) : (
                  <DataTable
                    data={displayEntityProjects}
                    columns={projectsTableColumns}
                    visibleColumns={{}}
                    selectedRows={{}}
                    viewOnly={!editing || !!previewVersion}
                    actions={projectsTableActions}
                    showPagination
                    showSelection
                  />
                )}
              </Flex>
            </Flex>
          </Flex>

          {/* Relationships and Attachments */}
          <Flex direction={"row"} gap={"1"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Relationships */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex gap={"2"} direction={"column"}>
                <Flex direction={"row"} justify={"space-between"} align={"center"}>
                  <Flex direction={"row"} gap={"0.5"} align={"center"}>
                    <Icon name={"graph"} size={"xs"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"} ml={"0.5"}>
                      Relationships
                    </Text>
                  </Flex>
                  <Button
                    variant={"solid"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={() => setAddRelationshipsOpen(true)}
                    disabled={!editing || !!previewVersion}
                  >
                    Add
                    <Icon name={"add"} size={"xs"} />
                  </Button>
                </Flex>
                <Relationships
                  relationships={displayEntityRelationships}
                  setRelationships={setEntityRelationships}
                  viewOnly={!editing || !!previewVersion}
                />
              </Flex>
            </Flex>

            {/* Attachments */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex gap={"1"} direction={"column"}>
                <Flex direction={"row"} justify={"space-between"} align={"center"}>
                  <Flex direction={"row"} gap={"0.5"} align={"center"}>
                    <Icon name={"attachment"} size={"xs"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"} ml={"0.5"}>
                      Attachments
                    </Text>
                  </Flex>
                  <Button
                    variant={"solid"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={() => setUploadOpen(true)}
                    disabled={!editing || !!previewVersion}
                  >
                    Upload
                    <Icon name={"upload"} size={"xs"} />
                  </Button>
                </Flex>

                <Flex
                  w={"100%"}
                  justify={"center"}
                  align={"center"}
                  minH={displayEntityAttachments.length > 0 ? "fit-content" : "120px"}
                >
                  {displayEntityAttachments.length === 0 ? (
                    <EmptyState.Root>
                      <EmptyState.Content>
                        <EmptyState.Indicator>
                          <Icon name={"attachment"} size={"lg"} />
                        </EmptyState.Indicator>
                        <EmptyState.Description>No Attachments</EmptyState.Description>
                      </EmptyState.Content>
                    </EmptyState.Root>
                  ) : (
                    <DataTable
                      data={displayEntityAttachments}
                      columns={attachmentTableColumns}
                      visibleColumns={{}}
                      selectedRows={{}}
                      viewOnly={!editing || !!previewVersion}
                      actions={attachmentTableActions}
                      showPagination
                      showSelection
                    />
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Add Attributes dialog */}
        <AddAttributeDialog
          open={addAttributesOpen}
          onClose={() => setAddAttributesOpen(false)}
          owner={user}
          templates={templates}
          entityName={entityName}
          entityDescription={entityDescription}
          onAdd={(attribute) => setEntityAttributes([...entityAttributes, attribute])}
          onSaveAsTemplate={onSaveAsTemplate}
        />

        {/* Add Projects dialog */}
        <Dialog.Root
          open={addProjectsOpen}
          onOpenChange={(event) => setAddProjectsOpen(event.open)}
          placement={"center"}
          closeOnEscape
          closeOnInteractOutside
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content w={["lg", "xl", "2xl"]}>
                <Dialog.Header p={"2"} bg={GLOBAL_STYLES.dialog.headerColor} roundedTop={"md"}>
                  <Flex direction={"row"} gap={"0.5"} align={"center"} ml={"0.5"}>
                    <Icon name={"project"} size={"xs"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Add Entity to Projects
                    </Text>
                  </Flex>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton size={"2xs"} top={"6px"} onClick={onCancelAddProjectsClick} />
                  </Dialog.CloseTrigger>
                </Dialog.Header>
                <Dialog.Body p={"2"} gap={"2"}>
                  <Flex direction={"column"} gap={"2"}>
                    <SearchSelect
                      id={"projectSearchSelect"}
                      resultType={"project"}
                      value={selectedProject}
                      onChange={(selection) => {
                        let invalidSelection = false;
                        setSelectedProjects((previousProjects) => {
                          const alreadyStaged = previousProjects.some((project) => project._id === selection._id);
                          const alreadyInProject = entityProjects.includes(selection._id);
                          invalidSelection = alreadyStaged || alreadyInProject;

                          return alreadyStaged || alreadyInProject
                            ? previousProjects
                            : [...previousProjects, selection];
                        });

                        // Show warning if invalid Project selection
                        if (invalidSelection) {
                          toaster.create({
                            title: "Cannot add Project",
                            description: "Project already staged or Entity in Project already",
                            type: "warning",
                            duration: 2000,
                            closable: true,
                          });
                        }

                        setSelectedProject({} as IGenericItem);
                      }}
                      placeholder={"Search projects..."}
                    />

                    <HStack
                      gap={"2"}
                      p={"1"}
                      align={"center"}
                      justify={"center"}
                      rounded={"md"}
                      border={GLOBAL_STYLES.border.style}
                      borderColor={GLOBAL_STYLES.border.color}
                      minH={"60px"}
                      wrap={"wrap"}
                    >
                      {selectedProjects.length > 0 ? (
                        selectedProjects.map((project) => (
                          <Tag.Root key={project._id} bg={"white"} rounded={"md"} pl={"0"}>
                            <Tag.Label p={"0"} fontSize={"xs"}>
                              <Flex w={"100%"} justify={"left"}>
                                <Linky id={project._id} type={"projects"} size={"xs"} />
                              </Flex>
                            </Tag.Label>
                            <Tag.EndElement mr={"0"}>
                              <Tag.CloseTrigger
                                onClick={() =>
                                  setSelectedProjects(selectedProjects.filter((p) => p._id !== project._id))
                                }
                              />
                            </Tag.EndElement>
                          </Tag.Root>
                        ))
                      ) : (
                        <Flex direction={"column"} gap={"3"} align={"center"} justify={"center"} p={"4"}>
                          <Icon name={"project"} size={"md"} color={GLOBAL_STYLES.project.lightColor} />
                          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.400"}>
                            No Projects selected
                          </Text>
                        </Flex>
                      )}
                    </HStack>
                  </Flex>
                </Dialog.Body>

                <Dialog.Footer p={"2"} bg={GLOBAL_STYLES.dialog.footerColor} roundedBottom={"md"}>
                  <Flex direction={"row"} justify={"space-between"} w={"100%"}>
                    <Button
                      variant={"solid"}
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"red"}
                      onClick={onCancelAddProjectsClick}
                    >
                      Cancel
                      <Icon name={"cross"} size={"xs"} />
                    </Button>
                    <Button
                      variant={"solid"}
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"green"}
                      onClick={addProjects}
                      disabled={selectedProjects.length === 0}
                    >
                      Add to {selectedProjects.length} {selectedProjects.length === 1 ? "Project" : "Projects"}
                      <Icon name={"check"} size={"xs"} />
                    </Button>
                  </Flex>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>

        {/* Add Relationships dialog */}
        <AddRelationshipDialog
          open={addRelationshipsOpen}
          onClose={() => setAddRelationshipsOpen(false)}
          sourceId={entity._id}
          sourceName={entityName}
          existingRelationships={entityRelationships}
          onAdd={(relationships) => setEntityRelationships([...entityRelationships, ...relationships])}
        />

        {/* Upload dialog */}
        <UploadDialog
          open={uploadOpen}
          setOpen={setUploadOpen}
          uploads={toUploadAttachments}
          setUploads={setToUploadAttachments}
          target={entity._id}
          onUploadSuccess={() => {
            if (refetch) {
              refetch().catch(ignoreAbort);
            }
          }}
        />

        {/* Export dialog */}
        <ExportDialog open={exportOpen} setOpen={setExportOpen} dataType={"entity"} id={id} />

        {/* Graph dialog */}
        <Dialog.Root
          open={graphOpen}
          onOpenChange={(event) => setGraphOpen(event.open)}
          size={"cover"}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header p={"2"} bg={GLOBAL_STYLES.dialog.headerColor} roundedTop={"md"}>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"graph"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Visualize: {entityName}
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size={"2xs"} top={"6px"} onClick={() => setGraphOpen(false)} />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"1"}>
                <RelationshipsGraph id={entity._id} entityNavigateHook={handleEntityNodeClick} />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Share dialog */}
        <Dialog.Root
          open={shareOpen}
          onOpenChange={(event) => setShareOpen(event.open)}
          placement={"center"}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content gap={"0"} w={["md", "lg", "xl"]}>
              {/* Heading and close button */}
              <Dialog.Header p={"2"} bg={GLOBAL_STYLES.dialog.headerColor} roundedTop={"md"}>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"share"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Share Entity
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size={"2xs"} top={"6px"} onClick={() => setShareOpen(false)} />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"2"}>
                <Flex direction={"column"} gap={"1"}>
                  <Flex direction={"row"} gap={"2"} align={"center"}>
                    <Flex w={"25%"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Sharable URL:
                      </Text>
                    </Flex>
                    <Flex w={"60%"}>
                      <Input
                        size={"xs"}
                        value={`https://app.metadatify.com/entities/${id}`}
                        rounded={"md"}
                        onFocus={(event) => event.target.select()}
                        readOnly
                      />
                    </Flex>
                    <IconButton
                      size={"xs"}
                      rounded={"md"}
                      variant={"outline"}
                      onClick={async () => {
                        await navigator.clipboard.writeText(`https://app.metadatify.com/entities/${id}`);
                        toaster.create({
                          title: "Copied to clipboard",
                          type: "success",
                          duration: 2000,
                          closable: true,
                        });
                      }}
                    >
                      <Icon name={"copy"} size={"xs"} />
                    </IconButton>
                  </Flex>

                  <Flex direction={"row"} gap={"2"} align={"center"}>
                    <Flex w={"25%"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Unique ID:
                      </Text>
                    </Flex>
                    <Flex w={"60%"}>
                      <Input
                        size={"xs"}
                        value={id}
                        rounded={"md"}
                        onFocus={(event) => event.target.select()}
                        readOnly
                      />
                    </Flex>
                    <IconButton
                      size={"xs"}
                      rounded={"md"}
                      variant={"outline"}
                      onClick={async () => {
                        await navigator.clipboard.writeText(`${id}`);
                        toaster.create({
                          title: "Copied to clipboard",
                          type: "success",
                          duration: 2000,
                          closable: true,
                        });
                      }}
                    >
                      <Icon name={"copy"} size={"xs"} />
                    </IconButton>
                  </Flex>

                  <Flex direction={"row"} gap={"2"}>
                    <Flex w={"25%"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        QR Code:
                      </Text>
                    </Flex>
                    <Flex
                      p={"1"}
                      border={GLOBAL_STYLES.border.style}
                      borderColor={GLOBAL_STYLES.border.color}
                      rounded={"md"}
                    >
                      <QRCode id={`${id}_qr`} value={`${id}`} size={80} />
                    </Flex>
                  </Flex>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"2"} bg={GLOBAL_STYLES.dialog.footerColor} roundedBottom={"md"}>
                <Flex direction={"row"} w={"100%"} gap={"1"} justify={"right"} align={"center"}>
                  <Button
                    variant={"solid"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={() => setShareOpen(false)}
                  >
                    Done
                    <Icon name={"check"} size={"xs"} />
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Clone dialog */}
        <Dialog.Root
          open={cloneOpen}
          onOpenChange={(details) => setCloneOpen(details.open)}
          placement={"center"}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content gap={"0"} w={["md", "lg", "xl"]}>
              {/* Heading and close button */}
              <Dialog.Header p={"2"} bg={GLOBAL_STYLES.dialog.headerColor} roundedTop={"md"}>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"copy"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Clone Entity
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size={"2xs"} top={"6px"} onClick={() => setCloneOpen(false)} />
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body p={"2"}>
                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"xs"} color={"gray.600"}>
                    By default, the cloned Entity will be created with the same name, but with "(cloned)" appended to
                    the end. You can modify the name below.
                  </Text>

                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root>
                        <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                          Cloned Entity Name:
                        </Field.Label>
                        <Input
                          size={"xs"}
                          rounded={"md"}
                          value={clonedEntityName}
                          onChange={(event) => setClonedEntityName(event.target.value)}
                        />
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"2"} bg={GLOBAL_STYLES.dialog.footerColor} roundedBottom={"md"}>
                <Flex direction={"row"} w={"100%"} gap={"1"} justify={"space-between"}>
                  <Button
                    variant={"solid"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"red"}
                    onClick={() => setCloneOpen(false)}
                  >
                    Cancel
                    <Icon name={"cross"} size={"xs"} />
                  </Button>
                  <Button
                    variant={"solid"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={handleCloneClick}
                    loading={createEntityLoading}
                    disabled={clonedEntityName === ""}
                  >
                    Clone
                    <Icon name={"copy"} size={"xs"} />
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Save message dialog */}
        <SaveDialog
          open={saveMessageOpen}
          onOpenChange={(details) => setSaveMessageOpen(details.open)}
          onDone={handleSaveMessageDoneClick}
          value={saveMessage}
          onChange={setSaveMessage}
          placeholder={"(Optional) Enter a description of the changes made to the Entity."}
          showCloseButton={true}
          modifiedType={"Entity"}
        />

        {/* Blocker warning message */}
        <UnsavedChangesDialog
          blocker={blocker}
          cancelBlockerRef={cancelBlockerRef}
          onClose={onBlockerClose}
          callback={onBlockerClose}
        />
      </Flex>
    </Content>
  );
};

export default Entity;
