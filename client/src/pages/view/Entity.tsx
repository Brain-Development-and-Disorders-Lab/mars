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
  Checkbox,
  Stack,
  Drawer,
  IconButton,
  Menu,
  Dialog,
  Separator,
  Fieldset,
  Field,
  createListCollection,
  Portal,
  CloseButton,
  Spinner,
  HStack,
  EmptyState,
  Timeline,
  Collapsible,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import RelationshipGraph from "@components/RelationshipGraph";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import UploadDialog from "@components/UploadDialog";
import Values from "@components/Values";
import PreviewModal from "@components/PreviewModal";
import AttributeViewButton from "@components/AttributeViewButton";
import SearchSelect from "@components/SearchSelect";
import AlertDialog from "@components/AlertDialog";
import TimestampTag from "@components/TimestampTag";
import VisibilityTag from "@components/VisibilityTag";
import Relationships from "@components/Relationships";
import Tooltip from "@components/Tooltip";
import { Information } from "@components/Label";
import { UnsavedChangesModal } from "@components/WarningModal";
import { toaster } from "@components/Toast";
import SaveModal from "@components/SaveModal";
import { Cell, createColumnHelper } from "@tanstack/react-table";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import {
  AttributeModel,
  DataTableAction,
  EntityHistory,
  EntityModel,
  GenericValueType,
  IAttribute,
  IGenericItem,
  IRelationship,
  ISelectOption,
  IValue,
  RelationshipType,
  ResponseData,
} from "@types";

// Utility functions and libraries
import { requestStatic } from "src/database/functions";
import { createSelectOptions, removeTypename } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";
import { nanoid } from "nanoid";
import QRCode from "react-qr-code";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";

// Routing and navigation
import { useParams, useNavigate, useBlocker } from "react-router-dom";

// Contexts and hooks
import { useWorkspace } from "@hooks/useWorkspace";
import { useAuthentication } from "@hooks/useAuthentication";
import { useBreakpoint } from "@hooks/useBreakpoint";

const Entity = () => {
  const { id } = useParams();
  const { breakpoint } = useBreakpoint();

  // Navigation and routing
  const navigate = useNavigate();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      editing && currentLocation.pathname !== nextLocation.pathname,
  );
  const { onClose: onBlockerClose } = useDisclosure();
  const cancelBlockerRef = useRef(null);

  // Authentication
  const { token } = useAuthentication();

  // Graph dialog
  const [graphOpen, setGraphOpen] = useState(false);

  // Share dialog
  const [shareOpen, setShareOpen] = useState(false);

  const [projects, setProjects] = useState<IGenericItem[]>([]);
  const projectsCollection = useMemo(() => {
    const items = createSelectOptions<IGenericItem>(projects, "_id", "name");
    return createListCollection<ISelectOption>({
      items: items || [],
    });
  }, [projects]);
  const selectProjectsContainerRef = useRef(null);
  const [addProjectsOpen, setAddProjectsOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const [addRelationshipsOpen, setAddRelationshipsOpen] = useState(false);
  const selectRelationshipTypeRef = useRef(null);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState(
    "general" as RelationshipType,
  );
  const [selectedRelationshipTarget, setSelectedRelationshipTarget] = useState(
    {} as IGenericItem,
  );

  // Save message modal
  const [saveMessageOpen, setSaveMessageOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Clone modal
  const [cloneOpen, setCloneOpen] = useState(false);
  const [clonedEntityName, setClonedEntityName] = useState("");

  // History drawer
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set(),
  );
  const [historySortOrder, setHistorySortOrder] = useState<
    "newest-first" | "oldest-first"
  >("newest-first");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [dateFilterApplied, setDateFilterApplied] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<EntityHistory | null>(
    null,
  );

  // Toggles
  const [isUpdating, setIsUpdating] = useState(false);
  const [editing, setEditing] = useState(false);

  // Archive state
  const [entityArchived, setEntityArchived] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<AttributeModel[]>([]);
  const addAttributesContainerRef = useRef(null);
  const templatesCollection = useMemo(() => {
    const items = createSelectOptions<AttributeModel>(templates, "_id", "name");
    return createListCollection<ISelectOption>({
      items: items || [],
    });
  }, [templates]);

  // Adding Templates to existing Entity
  const [addAttributesOpen, setAddAttributesOpen] = useState(false);
  const [attributeName, setAttributeName] = useState("");
  const [attributeDescription, setAttributeDescription] = useState("");
  const [attributeValues, setAttributeValues] = useState(
    [] as IValue<GenericValueType>[],
  );

  const isAttributeNameError = attributeName === "";
  const isAttributeDescriptionError = attributeDescription === "";
  const [isAttributeValueError, setIsAttributeValueError] = useState(false);
  const isAttributeError =
    isAttributeNameError ||
    isAttributeDescriptionError ||
    isAttributeValueError;

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
    fetchPolicy: "network-only",
  });

  const GET_FILE_URL = gql`
    query GetFileURL($_id: String) {
      downloadFile(_id: $_id)
    }
  `;
  const [getFile] = useLazyQuery<{ downloadFile: string }>(GET_FILE_URL);

  // Query to export an Entity, returning the string contents of a file for download
  const EXPORT_ENTITY = gql`
    query ExportEntity($_id: String, $format: String, $fields: [String]) {
      exportEntity(_id: $_id, format: $format, fields: $fields)
    }
  `;
  const [exportEntity, { loading: exportLoading, error: exportError }] =
    useLazyQuery<{ exportEntity: string }>(EXPORT_ENTITY);

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
  const [
    createEntity,
    { error: createEntityError, loading: createEntityLoading },
  ] = useMutation<{ createEntity: ResponseData<string> }>(CREATE_ENTITY);

  // Query to create a template Template
  const CREATE_TEMPLATE = gql`
    mutation CreateTemplate($template: AttributeCreateInput) {
      createTemplate(template: $template) {
        success
        message
      }
    }
  `;
  const [
    createTemplate,
    { loading: loadingTemplateCreate, error: errorTemplateCreate },
  ] = useMutation<{ createTemplate: ResponseData<string> }>(CREATE_TEMPLATE);

  // Mutation to update Entity
  const UPDATE_ENTITY = gql`
    mutation UpdateEntity($entity: EntityUpdateInput, $message: String) {
      updateEntity(entity: $entity, message: $message) {
        success
        message
      }
    }
  `;
  const [updateEntity, { loading: updateLoading }] = useMutation(UPDATE_ENTITY);

  // Mutation to archive Entity
  const ARCHIVE_ENTITY = gql`
    mutation ArchiveEntity($_id: String, $state: Boolean) {
      archiveEntity(_id: $_id, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveEntity, { error: archiveError, loading: archiveLoading }] =
    useMutation<{ archiveEntity: ResponseData<string> }>(ARCHIVE_ENTITY);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.entity) {
      // Unpack all the Entity data
      setEntityData(data.entity);

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
    // Unpack Project data
    if (data?.projects) {
      // Filter out existing Project membership or selected Projects
      setProjects(
        data.projects.filter((project: IGenericItem) => {
          return (
            !_.includes(selectedProjects, project._id) &&
            !_.includes(entityProjects, project._id)
          );
        }),
      );
    }
    // Unpack Template data
    if (data?.templates) {
      setTemplates(data.templates);
    }
  }, [data, editing]);

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

  const { workspace } = useWorkspace();

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

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
      const fileResponse = await requestStatic<any>(
        response.data.downloadFile,
        {
          responseType: "blob",
        },
      );

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

  const onSaveAsTemplate = async () => {
    const attributeData: IAttribute = {
      name: attributeName,
      archived: false,
      owner: token.orcid,
      description: attributeDescription,
      values: attributeValues,
    };

    // Execute the GraphQL mutation
    const response = await createTemplate({
      variables: {
        template: attributeData,
      },
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
      toaster.create({
        title: "Saved!",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setTemplates([...templates, attributeData as AttributeModel]);
    }
  };

  useEffect(() => {
    setIsAttributeValueError(
      attributeValues.length === 0 ||
        attributeValues.some((value) => value.name === ""),
    );
  }, [attributeValues]);

  // Break up entity data into editable fields
  const [entityData, setEntityData] = useState({} as EntityModel);
  const [entityName, setEntityName] = useState("");
  const [entityDescription, setEntityDescription] = useState("");
  const [entityProjects, setEntityProjects] = useState([] as string[]);
  const [entityRelationships, setEntityRelationships] = useState(
    [] as IRelationship[],
  );
  const [entityAttributes, setEntityAttributes] = useState(
    [] as AttributeModel[],
  );
  const [entityHistory, setEntityHistory] = useState([] as EntityHistory[]);

  // Sorted and filtered history based on sort order and date range
  const sortedEntityHistory = useMemo(() => {
    let filtered = [...entityHistory];

    // Apply date filter if active
    if (dateFilterApplied) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.timestamp);
        const itemDateOnly = new Date(
          itemDate.getFullYear(),
          itemDate.getMonth(),
          itemDate.getDate(),
        );

        if (startDate) {
          const start = new Date(startDate);
          if (itemDateOnly < start) return false;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the entire end date
          if (itemDateOnly > end) return false;
        }

        return true;
      });
    }

    // Sort based on sort order
    if (historySortOrder === "newest-first") {
      return filtered.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    } else {
      return filtered.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
    }
  }, [entityHistory, historySortOrder, dateFilterApplied, startDate, endDate]);

  const [entityAttachments, setEntityAttachments] = useState(
    [] as IGenericItem[],
  );
  const [toUploadAttachments, setToUploadAttachments] = useState(
    [] as string[],
  );

  // Computed values that use preview data when in preview mode
  const displayEntityName = useMemo(() => {
    return previewVersion ? previewVersion.name : entityName;
  }, [previewVersion, entityName]);

  const displayEntityDescription = useMemo(() => {
    return previewVersion
      ? previewVersion.description || ""
      : entityDescription;
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
        ...entityData,
        name: previewVersion.name,
        description: previewVersion.description || "",
        projects: previewVersion.projects,
        relationships: previewVersion.relationships,
        attributes: previewVersion.attributes,
        attachments: previewVersion.attachments,
        archived: previewVersion.archived,
      };
    }
    return entityData;
  }, [previewVersion, entityData]);

  // Archive dialog
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  // Export dialog
  const selectExportFormatRef = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFields, setExportFields] = useState(["owner"] as string[]);

  const [exportFormat, setExportFormat] = useState("json");

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);

  // Toggle editing status
  const handleEditClick = () => {
    if (previewVersion) return; // Disable editing in preview mode
    if (editing) {
      // Open the save message modal
      setSaveMessageOpen(true);
    } else {
      setEditing(true);
    }
  };

  /**
   * Helper function to handle clicking the "Done" button within
   * the save message modal
   */
  const handleSaveMessageDoneClick = async () => {
    setIsUpdating(updateLoading);
    try {
      const mutationPayload = removeTypename({
        _id: entityData._id,
        name: entityName,
        archived: entityArchived,
        created: entityData.created,
        owner: entityData.owner,
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

    // Close the save message modal
    setSaveMessageOpen(false);
    setSaveMessage("");

    setEditing(false);
    setIsUpdating(false);

    // Run a refetch operation
    await refetch();
  };

  /**
   * Handle cancelling an Edit operation
   */
  const handleCancelClick = () => {
    // Disable editing
    setEditing(false);

    // Reset all Entity states
    setEntityData(entityData);
    setEntityName(entityData.name);
    setEntityDescription(entityData.description);
    setEntityProjects(entityData.projects);
    setEntityRelationships(entityData.relationships);
    setEntityAttributes(entityData.attributes);
    setEntityAttachments(entityData.attachments);
    setEntityHistory(entityData.history);
  };

  /**
   * Restore an Entity from an archived status
   */
  const handleRestoreFromArchiveClick = async () => {
    await archiveEntity({
      variables: {
        _id: entityData._id,
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
            <Tooltip
              content={projectId}
              disabled={projectId.length < 32}
              showArrow
            >
              <Linky
                id={projectId}
                type={"projects"}
                size={"xs"}
                truncate={false}
              />
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

  // Configure attribute table columns and data
  const attributeTableColumnHelper = createColumnHelper<AttributeModel>();
  const attributeTableColumns = [
    attributeTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 16}
              showArrow
            >
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 16 })}
              </Text>
            </Tooltip>
            <AttributeViewButton
              attribute={info.row.original}
              editing={editing}
              doneCallback={handleUpdateAttribute}
              cancelCallback={handleCancelAttribute}
              removeCallback={() => {
                removeAttribute(info.row.original._id);
              }}
            />
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
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 32}
              showArrow
            >
              <Text fontSize={"xs"}>
                {_.truncate(info.getValue(), { length: 32 })}
              </Text>
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
        const truncatedNames =
          valueNames.length > 50
            ? `${valueNames.substring(0, 50)}...`
            : valueNames;
        return (
          <Tooltip
            content={valueNames}
            showArrow
            disabled={valueNames.length <= 50}
          >
            <Text fontSize={"xs"}>{truncatedNames}</Text>
          </Tooltip>
        );
      },
      header: "Values",
    }),
  ];
  const [visibleAttributeTableColumns, setVisibleAttributeTableColumns] =
    useState({});

  // Effect to adjust column visibility
  useEffect(() => {
    if (
      _.isEqual(breakpoint, "sm") ||
      _.isEqual(breakpoint, "base") ||
      _.isUndefined(breakpoint)
    ) {
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
              <PreviewModal
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
        const fileExtension = _.upperCase(
          _.last(info.row.original.name.split(".")),
        );
        let fileColorScheme = "yellow";
        if (_.isEqual(fileExtension, "PDF")) {
          fileColorScheme = "red";
        } else if (_.isEqual(fileExtension, "DNA")) {
          fileColorScheme = "green";
        } else if (
          _.isEqual(fileExtension, "PNG") ||
          _.isEqual(fileExtension, "JPEG")
        ) {
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
  const handleRestoreFromHistoryClick = async (
    entityVersion: EntityHistory,
  ) => {
    try {
      const restorePayload = removeTypename({
        _id: entityData._id,
        name: entityVersion.name,
        created: entityData.created,
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
    setEntityData(entityData);
    setExportOpen(true);
  };

  // Handle clicking the "Download" button
  const handleDownloadClick = async (format: string) => {
    // Execute query to export the Entity
    const response = await exportEntity({
      variables: {
        _id: id,
        format: format,
        fields: exportFields,
      },
    });

    if (response.data) {
      let exportData = response.data.exportEntity;
      // Clean the response data if required
      if (_.isEqual(format, "json")) {
        exportData = JSON.stringify(JSON.parse(exportData), null, "  ");
      }

      FileSaver.saveAs(
        new Blob([exportData]),
        slugify(`${entityName.replace(" ", "")}_export.${format}`),
      );

      // Close the "Export" modal
      setExportOpen(false);

      // Reset the export state
      setExportFields([]);

      toaster.create({
        title: "Success",
        description: `Successfully generated ${format.toUpperCase()} file`,
        type: "success",
        duration: 2000,
        closable: true,
      });
    }

    if (exportError) {
      toaster.create({
        title: "Error",
        description: "An error occurred when exporting this Entity",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  // A list of all fields that can be exported, generated when the interface is opened
  const allExportFields = ["name", "created", "owner", "description"];

  // Handle checkbox selection on the export modal
  const handleExportCheck = (field: string, checkState: boolean) => {
    if (_.isEqual(checkState, true)) {
      // If checked after click, add field to exportFields
      if (!exportFields.includes(field)) {
        const updatedFields = [...exportFields, field];
        setExportFields(updatedFields);
      }
    } else {
      // If unchecked after click, remove the field from exportFields
      if (exportFields.includes(field)) {
        const updatedFields = exportFields.filter(
          (existingField) => !_.isEqual(existingField, field),
        );
        setExportFields(updatedFields);
      }
    }
  };

  // Handle clicking the "Clone" button
  const handleCloneClick = async () => {
    // Create a new Entity, with `(cloned)` appended to the name
    const response = await createEntity({
      variables: {
        entity: removeTypename({
          name: clonedEntityName,
          owner: entityData.owner,
          created: dayjs(Date.now()).toISOString(),
          archived: false,
          description: entityData.description,
          projects: entityData.projects,
          relationships: entityData.relationships,
          attributes: entityData.attributes,
          attachments: entityData.attachments,
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
        _id: entityData._id,
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

  // Add Relationships to the Entity state
  const addRelationship = (): void => {
    // Create the `IRelationship` data structure
    const relationship: IRelationship = {
      source: {
        _id: entityData._id,
        name: entityName,
      },
      target: {
        _id: selectedRelationshipTarget._id,
        name: selectedRelationshipTarget.name,
      },
      type: selectedRelationshipType,
    };

    setEntityRelationships([...entityRelationships, relationship]);

    // Reset the relationship modal state
    setSelectedRelationshipType("general");
    setSelectedRelationshipTarget({} as IGenericItem);

    setAddRelationshipsOpen(false);
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

  // Add Attributes to the Entity state
  const addAttribute = () => {
    setEntityAttributes(() => [
      ...entityAttributes,
      {
        _id: `a-${entityData._id}-${nanoid(6)}`,
        name: attributeName,
        owner: entityData.owner,
        timestamp: dayjs(Date.now()).toISOString(),
        archived: false,
        description: attributeDescription,
        values: attributeValues,
      },
    ]);
    setAddAttributesOpen(false);

    // Reset state of creating an Attribute
    setAttributeName("");
    setAttributeDescription("");
    setAttributeValues([]);
  };

  // Handle updates to Attributes
  const handleUpdateAttribute = (updated: AttributeModel) => {
    // Find the Attribute and update the state
    setEntityAttributes([
      ...entityAttributes.map((attribute) => {
        if (_.isEqual(attribute._id, updated._id)) {
          return _.cloneDeep(updated);
        }
        return attribute;
      }),
    ]);
  };

  // Handle cancelling adding an Attribute by clearing the state
  const handleCancelAttribute = () => {
    setAddAttributesOpen(false);

    // Reset state of creating an Attribute
    setAttributeName("");
    setAttributeDescription("");
    setAttributeValues([]);
  };

  /**
   * Callback function to the Entity to Projects
   * @param {string[]} projects List of Projects to add the Entities to
   */
  const addProjects = (projects: string[]): void => {
    setEntityProjects([
      ...entityProjects,
      ...projects.filter((project) => !_.isEqual("", project)),
    ]);
    setSelectedProjects([]);
    setAddProjectsOpen(false);
  };

  /**
   * Click handler for "Cancel" button when adding Entities to a Project
   */
  const onCancelAddProjectsClick = () => {
    setSelectedProjects([]);
    setAddProjectsOpen(false);
  };

  return (
    <Content
      isError={!_.isUndefined(error)}
      isLoaded={!loading && !updateLoading && !archiveLoading}
    >
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
                <Tag.Label fontSize={"xs"}>
                  {previewVersion.version.slice(0, 6)}
                </Tag.Label>
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

        <Flex
          gap={"1"}
          p={"1"}
          pb={{ base: "1", lg: "0" }}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
          wrap={"wrap"}
        >
          <Flex
            id={"entityNameTag"}
            align={"center"}
            gap={"1"}
            p={"1"}
            border={"2px solid"}
            rounded={"md"}
          >
            <Icon name={"entity"} size={"sm"} />
            <Tooltip content={displayEntityData.name}>
              <Heading fontWeight={"semibold"} size={"sm"}>
                {_.truncate(displayEntityData.name, { length: 30 })}
              </Heading>
            </Tooltip>
            {displayEntityArchived && <Icon name={"archive"} size={"sm"} />}
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"1"} wrap={"wrap"} align={"center"}>
            {/* Actions Menu */}
            <Menu.Root size={"sm"}>
              <Menu.Trigger asChild>
                <Button
                  variant={"solid"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"yellow"}
                >
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
                    <Menu.Item
                      value={"share"}
                      fontSize={"xs"}
                      onClick={handleShareClick}
                    >
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
                id={"addProjectsModalButton"}
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
                      <CloseButton
                        size={"2xs"}
                        top={"6px"}
                        onClick={() => setHistoryOpen(false)}
                      />
                    </Drawer.CloseTrigger>
                    <Drawer.Header p={"2"} bg={"blue.300"} roundedTop={"md"}>
                      <Flex direction={"row"} gap={"1"} align={"center"}>
                        <Icon name={"clock"} size={"xs"} />
                        <Text fontSize={"sm"} fontWeight={"semibold"}>
                          Entity History
                        </Text>
                      </Flex>
                    </Drawer.Header>

                    <Drawer.Body pt={"0"} p={"1"} px={"2"}>
                      <Flex
                        direction={"column"}
                        gap={"1"}
                        align={"start"}
                        rounded={"md"}
                        bg={"gray.100"}
                        p={"1"}
                      >
                        <Text
                          fontSize={"xs"}
                          fontWeight={"semibold"}
                          ml={"0.5"}
                        >
                          Date filter:
                        </Text>

                        <Flex
                          direction={"row"}
                          gap={"1"}
                          align={"center"}
                          wrap={"wrap"}
                          ml={"0.5"}
                        >
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Field.Root gap={"0"}>
                              <Field.Label fontSize={"xs"}>
                                Start date
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
                              <Field.Label fontSize={"xs"}>
                                End date
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
                          <Button
                            size={"xs"}
                            rounded={"md"}
                            variant={"solid"}
                            colorPalette={"blue"}
                            alignSelf={"end"}
                            onClick={() => {
                              if (startDate || endDate) {
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
                              setDateFilterApplied(false);
                            }}
                          >
                            Clear
                          </Button>
                        </Flex>

                        <Flex
                          direction={"row"}
                          gap={"1"}
                          align={"center"}
                          ml={"0.5"}
                        >
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
                              setHistorySortOrder(
                                details.value[0] as
                                  | "newest-first"
                                  | "oldest-first",
                              )
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
                      </Flex>

                      <Flex
                        direction={"row"}
                        gap={"1"}
                        align={"center"}
                        justify={"space-between"}
                        mx={"0.5"}
                      >
                        <Flex direction={"row"} gap={"1"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            Last modified:
                          </Text>
                          <Text fontSize={"xs"} fontWeight={"normal"}>
                            {entityHistory.length > 0
                              ? dayjs(entityHistory[0].timestamp).fromNow()
                              : "never"}
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

                      {sortedEntityHistory.length > 0 ? (
                        <Timeline.Root size="sm" variant="subtle" mt={"1"}>
                          {sortedEntityHistory.map((entityVersion) => {
                            const isExpanded = expandedVersions.has(
                              entityVersion.version,
                            );
                            return (
                              <Timeline.Item
                                key={`v_${entityVersion.timestamp}`}
                              >
                                <Timeline.Connector>
                                  <Timeline.Separator />
                                  <Timeline.Indicator />
                                </Timeline.Connector>
                                <Timeline.Content>
                                  <Flex
                                    direction={"column"}
                                    gap={"1"}
                                    w={"100%"}
                                  >
                                    <Flex
                                      direction={"row"}
                                      gap={"2"}
                                      align={"center"}
                                      justify={"space-between"}
                                    >
                                      <Flex
                                        direction={"column"}
                                        gap={"0.5"}
                                        grow={"1"}
                                      >
                                        <Flex
                                          direction={"row"}
                                          gap={"1"}
                                          align={"center"}
                                        >
                                          <Tag.Root
                                            size={"sm"}
                                            colorPalette={"green"}
                                          >
                                            <Tag.Label fontSize={"xs"}>
                                              {entityVersion.version.slice(
                                                0,
                                                6,
                                              )}
                                            </Tag.Label>
                                          </Tag.Root>
                                          <Text
                                            fontSize={"xs"}
                                            fontWeight={"semibold"}
                                          >
                                            {entityVersion.name}
                                          </Text>
                                          <Text
                                            fontSize={"xs"}
                                            color={"gray.500"}
                                          >
                                            {dayjs(
                                              entityVersion.timestamp,
                                            ).fromNow()}
                                          </Text>
                                        </Flex>
                                        <Flex
                                          direction={"row"}
                                          gap={"1"}
                                          align={"center"}
                                        >
                                          {entityVersion.message &&
                                          !_.isEqual(
                                            entityVersion.message,
                                            "",
                                          ) ? (
                                            <Tooltip
                                              content={entityVersion.message}
                                              disabled={
                                                entityVersion.message.length <=
                                                40
                                              }
                                              showArrow
                                            >
                                              <Text
                                                fontSize={"xs"}
                                                color={"gray.600"}
                                              >
                                                {_.truncate(
                                                  entityVersion.message,
                                                  { length: 40 },
                                                )}
                                              </Text>
                                            </Tooltip>
                                          ) : (
                                            <Tag.Root
                                              size={"sm"}
                                              colorPalette={"orange"}
                                            >
                                              <Tag.Label fontSize={"xs"}>
                                                No message
                                              </Tag.Label>
                                            </Tag.Root>
                                          )}
                                        </Flex>
                                      </Flex>
                                      <Flex direction={"row"} gap={"1"}>
                                        <Collapsible.Root
                                          open={isExpanded}
                                          onOpenChange={(event) => {
                                            const newExpanded = new Set(
                                              expandedVersions,
                                            );
                                            if (event.open) {
                                              newExpanded.add(
                                                entityVersion.version,
                                              );
                                            } else {
                                              newExpanded.delete(
                                                entityVersion.version,
                                              );
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
                                              aria-label={
                                                isExpanded
                                                  ? "Collapse details"
                                                  : "Expand details"
                                              }
                                            >
                                              Details
                                              <Icon
                                                name={
                                                  isExpanded ? "c_up" : "c_down"
                                                }
                                                size={"xs"}
                                              />
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
                                          onClick={() =>
                                            handleRestoreFromHistoryClick(
                                              entityVersion,
                                            )
                                          }
                                          disabled={
                                            entityArchived || !!previewVersion
                                          }
                                        >
                                          Restore
                                          <Icon name={"rewind"} size={"xs"} />
                                        </Button>
                                      </Flex>
                                    </Flex>

                                    <Collapsible.Root
                                      open={isExpanded}
                                      onOpenChange={(event) => {
                                        const newExpanded = new Set(
                                          expandedVersions,
                                        );
                                        if (event.open) {
                                          newExpanded.add(
                                            entityVersion.version,
                                          );
                                        } else {
                                          newExpanded.delete(
                                            entityVersion.version,
                                          );
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
                                          <Flex
                                            direction={"row"}
                                            gap={"2"}
                                            align={"center"}
                                          >
                                            <Text
                                              fontSize={"xs"}
                                              fontWeight={"semibold"}
                                            >
                                              Author:
                                            </Text>
                                            <ActorTag
                                              orcid={entityVersion.author}
                                              fallback={"Unknown User"}
                                              size={"sm"}
                                            />
                                          </Flex>

                                          <Flex
                                            direction={"column"}
                                            gap={"0.5"}
                                          >
                                            <Text
                                              fontSize={"xs"}
                                              fontWeight={"semibold"}
                                            >
                                              Description:
                                            </Text>
                                            {_.isEqual(
                                              entityVersion.description,
                                              "",
                                            ) ? (
                                              <Tag.Root
                                                size={"sm"}
                                                colorPalette={"orange"}
                                              >
                                                <Tag.Label fontSize={"xs"}>
                                                  No Description
                                                </Tag.Label>
                                              </Tag.Root>
                                            ) : (
                                              <Text fontSize={"xs"}>
                                                {entityVersion.description}
                                              </Text>
                                            )}
                                          </Flex>

                                          <Flex direction={"row"} gap={"1"}>
                                            <Flex
                                              direction={"column"}
                                              gap={"1"}
                                              p={"2"}
                                              rounded={"md"}
                                              border={"1px solid"}
                                              borderColor={"gray.300"}
                                              bg={"white"}
                                              grow={"1"}
                                            >
                                              <Text
                                                fontSize={"xs"}
                                                fontWeight={"semibold"}
                                              >
                                                Projects
                                              </Text>
                                              {entityVersion.projects.length >
                                              0 ? (
                                                <Flex
                                                  direction={"row"}
                                                  gap={"2"}
                                                  align={"center"}
                                                  wrap={"wrap"}
                                                >
                                                  {entityVersion.projects.map(
                                                    (projectId) => (
                                                      <Tag.Root
                                                        key={`v_c_${entityVersion.timestamp}_${projectId}`}
                                                        size={"sm"}
                                                      >
                                                        <Tag.Label
                                                          fontSize={"xs"}
                                                        >
                                                          <Linky
                                                            type={"projects"}
                                                            id={projectId}
                                                            size={"xs"}
                                                          />
                                                        </Tag.Label>
                                                      </Tag.Root>
                                                    ),
                                                  )}
                                                </Flex>
                                              ) : (
                                                <Text fontSize={"xs"}>
                                                  No Projects
                                                </Text>
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
                                              grow={"1"}
                                            >
                                              <Text
                                                fontSize={"xs"}
                                                fontWeight={"semibold"}
                                              >
                                                Relationships
                                              </Text>
                                              <Flex direction={"row"} gap={"1"}>
                                                <Tag.Root
                                                  key={`v_o_${entityVersion.timestamp}`}
                                                  size={"sm"}
                                                >
                                                  <Tag.Label fontSize={"xs"}>
                                                    {entityVersion
                                                      ?.relationships?.length ||
                                                      0}
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
                                              border={"1px solid"}
                                              borderColor={"gray.300"}
                                              bg={"white"}
                                              grow={"1"}
                                            >
                                              <Text
                                                fontSize={"xs"}
                                                fontWeight={"semibold"}
                                              >
                                                Attributes
                                              </Text>
                                              {entityVersion.attributes.length >
                                              0 ? (
                                                <Flex
                                                  direction={"row"}
                                                  gap={"2"}
                                                  align={"center"}
                                                  wrap={"wrap"}
                                                >
                                                  {entityVersion.attributes
                                                    .slice(0, 3)
                                                    .map((attr) => (
                                                      <Tooltip
                                                        key={`v_a_${entityVersion.timestamp}_${attr._id}`}
                                                        content={
                                                          "Values: " +
                                                          attr.values.length
                                                        }
                                                        showArrow
                                                      >
                                                        <Tag.Root size={"sm"}>
                                                          <Tag.Label
                                                            fontSize={"xs"}
                                                          >
                                                            {attr.name}
                                                          </Tag.Label>
                                                        </Tag.Root>
                                                      </Tooltip>
                                                    ))}
                                                  {entityVersion.attributes
                                                    .length > 3 && (
                                                    <Text fontSize={"xs"}>
                                                      and{" "}
                                                      {entityVersion.attributes
                                                        .length - 3}{" "}
                                                      more
                                                    </Text>
                                                  )}
                                                </Flex>
                                              ) : (
                                                <Text fontSize={"xs"}>
                                                  No Attributes
                                                </Text>
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
                                              grow={"1"}
                                            >
                                              <Text
                                                fontSize={"xs"}
                                                fontWeight={"semibold"}
                                              >
                                                Attachments
                                              </Text>
                                              {entityVersion.attachments
                                                .length > 0 ? (
                                                <Flex
                                                  direction={"row"}
                                                  gap={"2"}
                                                  align={"center"}
                                                  wrap={"wrap"}
                                                >
                                                  {entityVersion.attachments
                                                    .slice(0, 3)
                                                    .map((attachment) => (
                                                      <Tooltip
                                                        key={`v_at_${entityVersion.timestamp}_${attachment._id}`}
                                                        content={
                                                          attachment.name
                                                        }
                                                        showArrow
                                                      >
                                                        <Tag.Root size={"sm"}>
                                                          <Tag.Label
                                                            fontSize={"xs"}
                                                          >
                                                            {_.truncate(
                                                              attachment.name,
                                                              { length: 20 },
                                                            )}
                                                          </Tag.Label>
                                                        </Tag.Root>
                                                      </Tooltip>
                                                    ))}
                                                  {entityVersion.attachments
                                                    .length > 3 && (
                                                    <Text fontSize={"xs"}>
                                                      and{" "}
                                                      {entityVersion.attachments
                                                        .length - 3}{" "}
                                                      more
                                                    </Text>
                                                  )}
                                                </Flex>
                                              ) : (
                                                <Text fontSize={"xs"}>
                                                  No Attachments
                                                </Text>
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
                            <EmptyState.Description>
                              No History
                            </EmptyState.Description>
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
                <Text fontWeight={"semibold"} fontSize={"sm"}>
                  Are you sure you want to archive this Entity?
                </Text>
                <Text fontSize={"sm"}>
                  This Entity will be moved to the Workspace archive. All
                  relationships will be preserved, however it will not be
                  visible. It can be restored at any time.
                </Text>
              </Flex>
            </AlertDialog>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"1"} p={"1"}>
          {/* Entity Overview and Description */}
          <Flex
            direction={"row"}
            gap={"1"}
            p={"0"}
            wrap={"wrap"}
            align={"stretch"}
          >
            {/* Entity Overview */}
            <Flex
              direction={"column"}
              p={"1"}
              h={"fit-content"}
              gap={"1"}
              bg={"gray.100"}
              rounded={"md"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              {/* "Name" field */}
              <Flex gap={"1"} direction={"row"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"1"} grow={"1"}>
                  <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                    Entity Name
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
                    border={"1px solid"}
                    borderColor={"gray.300"}
                    bg={"white"}
                  />
                </Flex>
                <TimestampTag
                  timestamp={entityData.created}
                  description={"Created"}
                />
              </Flex>

              {/* "Created" and "Owner" fields */}
              <Flex gap={"1"} direction={"row"} w={"100%"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                    Entity Visibility
                  </Text>
                  <VisibilityTag isPublic={false} isInherited />
                </Flex>

                {/* Owner */}
                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                    Entity Owner
                  </Text>
                  <ActorTag
                    orcid={entityData.owner}
                    fallback={"Unknown User"}
                    size={"sm"}
                  />
                </Flex>
              </Flex>
            </Flex>

            {/* Description */}
            <Flex
              direction={"column"}
              p={"1"}
              h={"fit-content"}
              gap={"1"}
              border={"1px solid"}
              borderColor={"gray.300"}
              rounded={"md"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex direction={"column"} gap={"1"} w={"100%"}>
                <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                  Entity Description
                </Text>
                <Flex>
                  <MDEditor
                    height={150}
                    minHeight={100}
                    maxHeight={400}
                    id={"entityDescriptionInput"}
                    style={{ width: "100%" }}
                    value={
                      previewVersion
                        ? displayEntityDescription
                        : entityDescription
                    }
                    preview={editing && !previewVersion ? "edit" : "preview"}
                    extraCommands={[]}
                    onChange={(value) => {
                      setEntityDescription(value || "");
                    }}
                  />
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          {/* Attributes and Relationships */}
          <Flex
            direction={"row"}
            gap={"1"}
            p={"0"}
            wrap={"wrap"}
            align={"stretch"}
          >
            {/* Attributes */}
            <Flex
              direction={"column"}
              p={"1"}
              h={"fit-content"}
              gap={"1"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
              >
                <Flex direction={"row"} gap={"0.5"} align={"center"}>
                  <Icon name={"attribute"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"bold"} ml={"0.5"}>
                    Entity Attributes
                  </Text>
                </Flex>
                <Button
                  id={"addAttributeModalButton"}
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
                minH={
                  displayEntityAttributes.length > 0 ? "fit-content" : "120px"
                }
              >
                {displayEntityAttributes.length === 0 ? (
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"attribute"} size={"lg"} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>
                        No Attributes
                      </EmptyState.Description>
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

            {/* Relationships */}
            <Flex
              direction={"column"}
              p={"1"}
              h={"fit-content"}
              gap={"1"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex gap={"1"} direction={"column"}>
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  align={"center"}
                >
                  <Flex direction={"row"} gap={"0.5"} align={"center"}>
                    <Icon name={"graph"} size={"xs"} />
                    <Text fontSize={"xs"} fontWeight={"bold"} ml={"0.5"}>
                      Entity Relationships
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
                <Flex
                  w={"100%"}
                  justify={"center"}
                  align={displayEntityRelationships.length > 0 ? "" : "center"}
                  minH={
                    displayEntityRelationships.length > 0
                      ? "fit-content"
                      : "120px"
                  }
                >
                  {displayEntityRelationships.length > 0 ? (
                    <Relationships
                      relationships={displayEntityRelationships}
                      setRelationships={setEntityRelationships}
                      viewOnly={!editing || !!previewVersion}
                    />
                  ) : (
                    <EmptyState.Root>
                      <EmptyState.Content>
                        <EmptyState.Indicator>
                          <Icon name={"graph"} size={"lg"} />
                        </EmptyState.Indicator>
                        <EmptyState.Description>
                          No Relationships
                        </EmptyState.Description>
                      </EmptyState.Content>
                    </EmptyState.Root>
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          {/* Projects and Attachments */}
          <Flex
            direction={"row"}
            gap={"1"}
            p={"0"}
            wrap={"wrap"}
            align={"stretch"}
          >
            {/* Projects */}
            <Flex
              direction={"column"}
              p={"1"}
              h={"fit-content"}
              gap={"1"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
              >
                <Flex direction={"row"} gap={"0.5"} align={"center"}>
                  <Icon name={"project"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"bold"} ml={"0.5"}>
                    Linked Projects
                  </Text>
                </Flex>
                <Button
                  id={"addProjectsModalButton"}
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
                minH={
                  displayEntityProjects.length > 0 ? "fit-content" : "120px"
                }
              >
                {displayEntityProjects.length === 0 ? (
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"project"} size={"lg"} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>
                        No Projects
                      </EmptyState.Description>
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

            {/* Attachments */}
            <Flex
              direction={"column"}
              p={"1"}
              h={"fit-content"}
              gap={"1"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex gap={"1"} direction={"column"}>
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  align={"center"}
                >
                  <Flex direction={"row"} gap={"0.5"} align={"center"}>
                    <Icon name={"attachment"} size={"xs"} />
                    <Text fontSize={"xs"} fontWeight={"bold"} ml={"0.5"}>
                      Entity Attachments
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
                  minH={
                    displayEntityAttachments.length > 0
                      ? "fit-content"
                      : "120px"
                  }
                >
                  {displayEntityAttachments.length === 0 ? (
                    <EmptyState.Root>
                      <EmptyState.Content>
                        <EmptyState.Indicator>
                          <Icon name={"attachment"} size={"lg"} />
                        </EmptyState.Indicator>
                        <EmptyState.Description>
                          No Attachments
                        </EmptyState.Description>
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

        {/* Add Attributes modal */}
        <Dialog.Root
          open={addAttributesOpen}
          size={"xl"}
          placement={"center"}
          onOpenChange={(event) => setAddAttributesOpen(event.open)}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content ref={addAttributesContainerRef}>
              <Dialog.Header p={"2"} roundedTop={"md"} bg={"blue.300"}>
                <Flex direction={"row"} gap={"0.5"} align={"center"}>
                  <Icon name={"attribute"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                    Add Attribute
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"2xs"}
                    top={"6px"}
                    onClick={() => setAddAttributesOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"1"}>
                {/* Attribute creation */}
                <Flex direction={"column"} gap={"1"} justify={"center"}>
                  <Select.Root
                    key={"select-template"}
                    size={"xs"}
                    collection={templatesCollection}
                    disabled={templatesCollection.items.length === 0}
                    onValueChange={(details) => {
                      if (!_.isEqual(details.items[0], "")) {
                        for (const template of templates) {
                          if (_.isEqual(details.items[0], template._id)) {
                            setAttributeName(template.name);
                            setAttributeDescription(template.description);
                            setAttributeValues(() => [...template.values]);
                            break;
                          }
                        }
                      }
                    }}
                  >
                    <Select.HiddenSelect />
                    <Select.Label fontSize={"xs"} ml={"0.5"}>
                      Create from Template ({templatesCollection.items.length}{" "}
                      available)
                    </Select.Label>
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder={"Select Template"} />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal container={addAttributesContainerRef}>
                      <Select.Positioner>
                        <Select.Content>
                          {templatesCollection.items.map((template) => (
                            <Select.Item item={template} key={template.value}>
                              {template.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>

                  <Flex
                    direction={"column"}
                    gap={"1"}
                    w={"100%"}
                    justify={"center"}
                  >
                    <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
                      {/* Attribute name */}
                      <Flex
                        direction={"column"}
                        p={"1"}
                        h={"fit-content"}
                        w={{ base: "100%", md: "50%" }}
                        gap={"1"}
                        rounded={"md"}
                        border={"1px solid"}
                        borderColor={"gray.300"}
                      >
                        <Flex direction={"row"} gap={"1"}>
                          <Flex grow={"1"}>
                            <Fieldset.Root>
                              <Fieldset.Content>
                                <Field.Root
                                  data-testid={"create-attribute-name"}
                                  required
                                >
                                  <Field.Label fontSize={"xs"} ml={"0.5"}>
                                    Name
                                    <Field.RequiredIndicator />
                                  </Field.Label>
                                  <Input
                                    bg={"white"}
                                    size={"xs"}
                                    rounded={"md"}
                                    placeholder={"Name"}
                                    value={attributeName}
                                    onChange={(event) =>
                                      setAttributeName(event.target.value)
                                    }
                                  />
                                </Field.Root>
                              </Fieldset.Content>
                            </Fieldset.Root>
                          </Flex>
                        </Flex>

                        {/* "Owner" field */}
                        <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
                          <Flex direction={"column"} gap={"1"}>
                            <Text
                              fontWeight={"semibold"}
                              fontSize={"xs"}
                              ml={"0.5"}
                            >
                              Owner
                            </Text>
                            <Flex>
                              <ActorTag
                                orcid={token.orcid}
                                fallback={"Unknown User"}
                                size={"sm"}
                              />
                            </Flex>
                          </Flex>
                        </Flex>
                      </Flex>

                      {/* Attribute description */}
                      <Flex
                        direction={"row"}
                        p={"1"}
                        h={"fit-content"}
                        gap={"1"}
                        border={"1px solid"}
                        borderColor={"gray.300"}
                        rounded={"md"}
                        grow={"1"}
                      >
                        <Fieldset.Root>
                          <Fieldset.Content>
                            <Field.Root
                              data-testid={"create-attribute-description"}
                            >
                              <Field.Label fontSize={"xs"} ml={"0.5"}>
                                Description
                              </Field.Label>
                              <MDEditor
                                height={118}
                                minHeight={100}
                                maxHeight={400}
                                style={{ width: "100%" }}
                                value={attributeDescription}
                                preview={"edit"}
                                extraCommands={[]}
                                onChange={(value) => {
                                  setAttributeDescription(value || "");
                                }}
                              />
                            </Field.Root>
                          </Fieldset.Content>
                        </Fieldset.Root>
                      </Flex>
                    </Flex>
                    <Flex>
                      <Fieldset.Root invalid={isAttributeValueError}>
                        <Fieldset.Content>
                          <Field.Root required>
                            <Values
                              viewOnly={false}
                              values={attributeValues}
                              setValues={setAttributeValues}
                            />
                          </Field.Root>
                        </Fieldset.Content>
                      </Fieldset.Root>
                    </Flex>
                  </Flex>
                </Flex>
              </Dialog.Body>
              <Dialog.Footer p={"1"} bg={"gray.100"} roundedBottom={"md"}>
                <Flex
                  direction={"row"}
                  gap={"1"}
                  justify={"space-between"}
                  w={"100%"}
                >
                  {/* "Cancel" button */}
                  <Button
                    variant={"solid"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"red"}
                    onClick={() => setAddAttributesOpen(false)}
                  >
                    Cancel
                    <Icon name={"cross"} size={"xs"} />
                  </Button>

                  <Flex direction={"row"} gap={"1"}>
                    <Button
                      variant={"solid"}
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"green"}
                      onClick={onSaveAsTemplate}
                      disabled={isAttributeError}
                      loading={loadingTemplateCreate}
                    >
                      Save as Template
                      <Icon name={"add"} size={"xs"} />
                    </Button>

                    <Button
                      data-testid={"save-add-attribute-button"}
                      variant={"solid"}
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"green"}
                      disabled={isAttributeError}
                      onClick={() => {
                        addAttribute();
                      }}
                    >
                      Save
                      <Icon name={"check"} size={"xs"} />
                    </Button>
                  </Flex>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Add Projects modal */}
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
              <Dialog.Content
                w={["lg", "xl", "2xl"]}
                ref={selectProjectsContainerRef}
              >
                {/* Heading and close button */}
                <Dialog.Header p={"2"} bg={"blue.300"} roundedTop={"md"}>
                  <Flex
                    direction={"row"}
                    gap={"0.5"}
                    align={"center"}
                    ml={"0.5"}
                  >
                    <Icon name={"project"} size={"xs"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Link Entity to Project
                    </Text>
                  </Flex>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton
                      size={"2xs"}
                      top={"6px"}
                      onClick={() => setAddProjectsOpen(false)}
                    />
                  </Dialog.CloseTrigger>
                </Dialog.Header>
                <Dialog.Body p={"1"}>
                  {/* Select component for Projects */}
                  <Flex direction={"column"} gap={"1"}>
                    <Select.Root
                      id={"select-project"}
                      size={"xs"}
                      rounded={"md"}
                      collection={projectsCollection}
                      onValueChange={(details) => {
                        const selectedItem = details.items[0];
                        if (selectedProjects.includes(selectedItem.value)) {
                          // Check that the selected Project has not already been selected
                          toaster.create({
                            title: "Warning",
                            description: "Project has already been selected.",
                            type: "warning",
                            duration: 2000,
                            closable: true,
                          });
                        } else if (!_.isEqual(selectedItem.value, "")) {
                          // Add the selected Project if not the default option
                          setSelectedProjects([
                            ...selectedProjects,
                            selectedItem.value,
                          ]);
                        }
                      }}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder={"Select Project"} />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          {loading && (
                            <Spinner
                              size={"xs"}
                              borderWidth={"1.5px"}
                              color={"fg.muted"}
                            />
                          )}
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal container={selectProjectsContainerRef}>
                        <Select.Positioner>
                          <Select.Content>
                            {projectsCollection.items.map(
                              (item: ISelectOption) => {
                                return (
                                  <Select.Item item={item} key={item.value}>
                                    {item.label}
                                    <Select.ItemIndicator />
                                  </Select.Item>
                                );
                              },
                            )}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>

                    <HStack
                      gap={"1"}
                      p={"1"}
                      align={"center"}
                      justify={"center"}
                      rounded={"md"}
                      border={"1px solid"}
                      borderColor={"gray.300"}
                      minH={"100px"}
                    >
                      {selectedProjects.length > 0 ? (
                        selectedProjects.map((project) => {
                          if (!_.isEqual(project, "")) {
                            return (
                              <Flex key={`tag-${project}`}>
                                <Tag.Root>
                                  <Tag.StartElement>
                                    <Flex
                                      h={"100%"}
                                      align={"center"}
                                      justify={"center"}
                                    >
                                      <Icon name={"project"} size={"xs"} />
                                    </Flex>
                                  </Tag.StartElement>
                                  <Tag.Label p={"1"} fontSize={"xs"}>
                                    <Linky
                                      id={project}
                                      type={"projects"}
                                      size={"xs"}
                                    />
                                  </Tag.Label>
                                  <Tag.EndElement>
                                    <Tag.CloseTrigger
                                      onClick={() => {
                                        setSelectedProjects([
                                          ...selectedProjects.filter(
                                            (selected) => {
                                              return !_.isEqual(
                                                project,
                                                selected,
                                              );
                                            },
                                          ),
                                        ]);
                                      }}
                                    />
                                  </Tag.EndElement>
                                </Tag.Root>
                              </Flex>
                            );
                          } else {
                            return null;
                          }
                        })
                      ) : (
                        <Text
                          fontSize={"sm"}
                          fontWeight={"semibold"}
                          color={"gray.400"}
                        >
                          No Projects selected
                        </Text>
                      )}
                    </HStack>
                  </Flex>
                </Dialog.Body>

                <Dialog.Footer p={"1"} bg={"gray.100"} roundedBottom={"md"}>
                  {/* "Cancel" button */}
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
                      onClick={() => {
                        addProjects(selectedProjects);
                      }}
                      disabled={selectedProjects.length === 0}
                    >
                      Link Entity to {selectedProjects.length} Project
                      {selectedProjects.length === 1 ? "" : "s"}
                      <Icon name={"check"} size={"xs"} />
                    </Button>
                  </Flex>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>

        {/* Add Relationships modal */}
        <Dialog.Root
          open={addRelationshipsOpen}
          size={"lg"}
          placement={"center"}
          onOpenChange={(event) => setAddRelationshipsOpen(event.open)}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content ref={selectRelationshipTypeRef}>
              {/* Heading and close button */}
              <Dialog.Header p={"2"} bg={"blue.300"} roundedTop={"md"}>
                <Flex direction={"row"} gap={"0.5"} align={"center"} ml={"0.5"}>
                  <Icon name={"graph"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Add Relationship
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"2xs"}
                    top={"6px"}
                    onClick={() => setAddRelationshipsOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"1"}>
                <Flex direction={"column"} gap={"1"}>
                  <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Description:
                    </Text>
                    <Text fontSize={"xs"}>{displayEntityName} is</Text>
                    <Tag.Root
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      colorPalette={"yellow"}
                    >
                      <Tag.Label>
                        {selectedRelationshipType === "general" && "related"}
                        {selectedRelationshipType === "child" && "a child"}
                        {selectedRelationshipType === "parent" && "a parent"}
                      </Tag.Label>
                    </Tag.Root>
                    <Text fontSize={"xs"}>
                      {selectedRelationshipType === "general" ? "to" : "of"}
                    </Text>
                    <Tag.Root
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      colorPalette={"blue"}
                    >
                      <Tag.Label>
                        {_.isUndefined(selectedRelationshipTarget.name)
                          ? "Select Entity"
                          : selectedRelationshipTarget.name}
                      </Tag.Label>
                    </Tag.Root>
                  </Flex>
                  <Flex
                    direction={"row"}
                    gap={"1"}
                    justify={"space-between"}
                    p={"1"}
                    rounded={"md"}
                    border={"1px solid"}
                    borderColor={"gray.300"}
                  >
                    <Flex direction={"column"} gap={"1"} w={"33%"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Source
                      </Text>
                      <Input
                        size={"xs"}
                        rounded={"md"}
                        value={displayEntityName}
                        readOnly
                        disabled
                      />
                    </Flex>
                    <Flex direction={"column"} gap={"1"} w={"33%"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Type
                      </Text>
                      <Select.Root
                        key={"select-relationship-type"}
                        size={"xs"}
                        rounded={"md"}
                        collection={createListCollection({
                          items: ["General", "Parent", "Child"],
                        })}
                        onValueChange={(details) => {
                          setSelectedRelationshipType(
                            details.items[0].toLowerCase() as RelationshipType,
                          );
                        }}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText
                              placeholder={"Select Relationship Type"}
                            />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal container={selectRelationshipTypeRef}>
                          <Select.Positioner>
                            <Select.Content>
                              {createListCollection({
                                items: ["General", "Parent", "Child"],
                              }).items.map((relationship) => (
                                <Select.Item
                                  item={relationship}
                                  key={relationship}
                                >
                                  {relationship}
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    </Flex>
                    <Flex direction={"column"} gap={"1"} w={"33%"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Target
                      </Text>
                      <SearchSelect
                        resultType={"entity"}
                        value={selectedRelationshipTarget}
                        onChange={setSelectedRelationshipTarget}
                      />
                    </Flex>
                  </Flex>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"1"} bg={"gray.100"} roundedBottom={"md"}>
                <Flex
                  direction={"row"}
                  w={"100%"}
                  gap={"2"}
                  justify={"space-between"}
                >
                  <Button
                    variant={"solid"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"red"}
                    onClick={() => setAddRelationshipsOpen(false)}
                  >
                    Cancel
                    <Icon name={"cross"} size={"xs"} />
                  </Button>
                  <Button
                    variant={"solid"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    disabled={_.isUndefined(selectedRelationshipTarget._id)}
                    onClick={() => addRelationship()}
                  >
                    Done
                    <Icon name={"check"} size={"xs"} />
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Upload dialog */}
        <UploadDialog
          open={uploadOpen}
          setOpen={setUploadOpen}
          uploads={toUploadAttachments}
          setUploads={setToUploadAttachments}
          target={entityData._id}
          onUploadSuccess={() => {
            if (refetch) {
              refetch();
            }
          }}
        />

        {/* Export modal */}
        <Dialog.Root
          open={exportOpen}
          onOpenChange={(event) => setExportOpen(event.open)}
          size={"xl"}
          placement={"center"}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Trigger />
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content w={["lg", "xl", "2xl"]} gap={"0"}>
              {/* Heading and close button */}
              <Dialog.Header p={"2"} bg={"blue.300"} roundedTop={"md"}>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"download"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Export Entity
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"2xs"}
                    top={"6px"}
                    onClick={() => setExportOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"1"} gap={"1"}>
                {/* Export information */}
                {_.isEqual(exportFormat, "json") && (
                  <Information
                    text={"JSON files can be re-imported into Metadatify."}
                  />
                )}
                {_.isEqual(exportFormat, "csv") && (
                  <Information
                    text={
                      "When exporting Origins, Products, or Projects, only the name will be exported. To export identifiers, use JSON format."
                    }
                  />
                )}

                {/* Select export format */}
                <Flex
                  w={"100%"}
                  direction={"row"}
                  p={"1"}
                  gap={"1"}
                  justify={"space-between"}
                  align={"center"}
                  ref={selectExportFormatRef}
                >
                  <Flex gap={"1"} align={"center"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Format:
                    </Text>
                    <Fieldset.Root w={"fit-content"}>
                      <Fieldset.Content>
                        <Field.Root>
                          <Select.Root
                            key={"select-export-format"}
                            w={"120px"}
                            size={"xs"}
                            collection={createListCollection({
                              items: ["JSON", "CSV"],
                            })}
                            defaultValue={["JSON"]}
                            onValueChange={(details) =>
                              setExportFormat(details.items[0].toLowerCase())
                            }
                          >
                            <Select.HiddenSelect />
                            <Select.Control>
                              <Select.Trigger>
                                <Select.ValueText
                                  placeholder={"Select Export Format"}
                                />
                              </Select.Trigger>
                              <Select.IndicatorGroup>
                                <Select.Indicator />
                              </Select.IndicatorGroup>
                            </Select.Control>
                            <Portal container={selectExportFormatRef}>
                              <Select.Positioner>
                                <Select.Content>
                                  {createListCollection({
                                    items: ["JSON", "CSV"],
                                  }).items.map((valueType) => (
                                    <Select.Item
                                      item={valueType}
                                      key={valueType}
                                    >
                                      {valueType}
                                      <Select.ItemIndicator />
                                    </Select.Item>
                                  ))}
                                </Select.Content>
                              </Select.Positioner>
                            </Portal>
                          </Select.Root>
                        </Field.Root>
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>
                  <Text
                    fontSize={"xs"}
                    fontWeight={"semibold"}
                    color={"gray.600"}
                  >
                    Select the Entity fields to be exported.
                  </Text>
                </Flex>

                {/* Selection content */}
                <Flex
                  direction={"column"}
                  p={"1"}
                  gap={"1"}
                  rounded={"md"}
                  border={"1px solid"}
                  borderColor={"gray.300"}
                >
                  <Flex direction={"row"} gap={"1"}>
                    <Fieldset.Root>
                      <Fieldset.Content gap={"1"}>
                        <Fieldset.Legend
                          fontSize={"xs"}
                          fontWeight={"semibold"}
                        >
                          Entity Details
                        </Fieldset.Legend>
                        {!loading ? (
                          <Stack gap={1} direction={"column"}>
                            <Checkbox.Root
                              disabled
                              defaultChecked
                              fontSize={"xs"}
                              size={"xs"}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label>
                                Name: {entityName}
                              </Checkbox.Label>
                            </Checkbox.Root>
                            <Checkbox.Root
                              checked={_.includes(exportFields, "created")}
                              onCheckedChange={(details) =>
                                handleExportCheck(
                                  "created",
                                  details.checked as boolean,
                                )
                              }
                              fontSize={"xs"}
                              size={"xs"}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label>
                                Created:{" "}
                                {dayjs(entityData.created).format(
                                  "DD MMM YYYY",
                                )}
                              </Checkbox.Label>
                            </Checkbox.Root>
                            <Checkbox.Root
                              checked={true}
                              disabled
                              fontSize={"xs"}
                              size={"xs"}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label>
                                Owner: {entityData.owner}
                              </Checkbox.Label>
                            </Checkbox.Root>
                            <Checkbox.Root
                              checked={_.includes(exportFields, "description")}
                              onCheckedChange={(details) =>
                                handleExportCheck(
                                  "description",
                                  details.checked as boolean,
                                )
                              }
                              disabled={_.isEqual(entityDescription, "")}
                              size={"xs"}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label>
                                <Text lineClamp={1} fontSize={"xs"}>
                                  Description:{" "}
                                  {_.isEqual(entityDescription, "")
                                    ? "No description"
                                    : _.truncate(entityDescription, {
                                        length: 32,
                                      })}
                                </Text>
                              </Checkbox.Label>
                            </Checkbox.Root>
                          </Stack>
                        ) : (
                          <Text fontSize={"sm"}>Loading details</Text>
                        )}
                      </Fieldset.Content>
                    </Fieldset.Root>
                    <Fieldset.Root>
                      <Fieldset.Content gap={"1"}>
                        <Fieldset.Legend
                          fontSize={"xs"}
                          fontWeight={"semibold"}
                        >
                          Linked Projects
                        </Fieldset.Legend>
                        {!loading && entityProjects.length > 0 ? (
                          <Stack gap={1} direction={"column"}>
                            {entityProjects.map((project) => {
                              allExportFields.push(`project_${project}`);
                              return (
                                <Checkbox.Root
                                  size={"xs"}
                                  key={project}
                                  checked={_.includes(
                                    exportFields,
                                    `project_${project}`,
                                  )}
                                  onCheckedChange={(details) =>
                                    handleExportCheck(
                                      `project_${project}`,
                                      details.checked as boolean,
                                    )
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label>
                                    <Linky
                                      id={project}
                                      type={"projects"}
                                      size={"xs"}
                                    />
                                  </Checkbox.Label>
                                </Checkbox.Root>
                              );
                            })}
                          </Stack>
                        ) : (
                          <Text fontSize={"xs"}>No Projects</Text>
                        )}
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>

                  <Separator />

                  <Flex direction={"row"} gap={"1"}>
                    <Fieldset.Root>
                      <Fieldset.Content gap={"1"}>
                        <Fieldset.Legend
                          fontSize={"xs"}
                          fontWeight={"semibold"}
                        >
                          Entity Relationships
                        </Fieldset.Legend>
                        {!loading && entityRelationships?.length > 0 ? (
                          <Stack gap={1} direction={"column"}>
                            {entityRelationships.map((relationship) => {
                              allExportFields.push(
                                `relationship_${relationship.target._id}_${relationship.type}`,
                              );
                              return (
                                <Checkbox.Root
                                  size={"xs"}
                                  fontSize={"xs"}
                                  key={relationship.target._id}
                                  checked={_.includes(
                                    exportFields,
                                    `relationship_${relationship.target._id}_${relationship.type}`,
                                  )}
                                  onCheckedChange={(details) =>
                                    handleExportCheck(
                                      `relationship_${relationship.target._id}_${relationship.type}`,
                                      details.checked as boolean,
                                    )
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label>
                                    <Linky
                                      id={relationship.target._id}
                                      type={"entities"}
                                      size={"xs"}
                                    />
                                  </Checkbox.Label>
                                </Checkbox.Root>
                              );
                            })}
                          </Stack>
                        ) : (
                          <Text fontSize={"xs"}>No Relationships</Text>
                        )}
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>

                  <Separator />

                  <Flex direction={"row"} gap={"1"}>
                    <Fieldset.Root>
                      <Fieldset.Content gap={"1"}>
                        <Fieldset.Legend
                          fontSize={"xs"}
                          fontWeight={"semibold"}
                        >
                          Entity Attributes
                        </Fieldset.Legend>
                        {!loading && entityAttributes.length > 0 ? (
                          <Stack gap={1} direction={"column"}>
                            {entityAttributes.map((attribute) => {
                              allExportFields.push(
                                `attribute_${attribute._id}`,
                              );
                              return (
                                <Checkbox.Root
                                  size={"xs"}
                                  fontSize={"xs"}
                                  key={attribute._id}
                                  checked={_.includes(
                                    exportFields,
                                    `attribute_${attribute._id}`,
                                  )}
                                  onCheckedChange={(details) =>
                                    handleExportCheck(
                                      `attribute_${attribute._id}`,
                                      details.checked as boolean,
                                    )
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label>
                                    {attribute.name}
                                  </Checkbox.Label>
                                </Checkbox.Root>
                              );
                            })}
                          </Stack>
                        ) : (
                          <Text fontSize={"xs"}>No Attributes</Text>
                        )}
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"1"}>
                <Flex direction={"column"} w={"30%"} gap={"1"}>
                  {/* "Download" button */}
                  <Flex
                    direction={"row"}
                    w={"100%"}
                    gap={"1"}
                    justify={"right"}
                    align={"center"}
                  >
                    <Button
                      variant={"solid"}
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"blue"}
                      onClick={() => handleDownloadClick(exportFormat)}
                      loading={exportLoading}
                    >
                      Download
                      <Icon name={"download"} size={"xs"} />
                    </Button>
                  </Flex>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Graph modal */}
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
              <Dialog.Header p={"2"} bg={"blue.300"}>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"graph"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Visualize: {entityName}
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"2xs"}
                    top={"6px"}
                    onClick={() => setAddRelationshipsOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"0"}>
                <RelationshipGraph
                  id={entityData._id}
                  entityNavigateHook={handleEntityNodeClick}
                />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Share modal */}
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
              <Dialog.Header p={"2"} bg={"blue.300"} roundedTop={"md"}>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"share"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Share Entity
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"2xs"}
                    top={"6px"}
                    onClick={() => setShareOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"1"} px={"2"}>
                <Flex direction={"column"} gap={"1"}>
                  <Flex direction={"row"} gap={"1"} align={"center"}>
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
                        await navigator.clipboard.writeText(
                          `https://app.metadatify.com/entities/${id}`,
                        );
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

                  <Flex direction={"row"} gap={"1"} align={"center"}>
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

                  <Flex direction={"row"} gap={"1"}>
                    <Flex w={"25%"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        QR Code:
                      </Text>
                    </Flex>
                    <Flex
                      p={"1"}
                      border={"1px solid"}
                      borderColor={"gray.300"}
                      rounded={"md"}
                    >
                      <QRCode id={`${id}_qr`} value={`${id}`} size={80} />
                    </Flex>
                  </Flex>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"1"} bg={"gray.100"} roundedBottom={"md"}>
                <Flex
                  direction={"row"}
                  w={"100%"}
                  gap={"1"}
                  justify={"right"}
                  align={"center"}
                >
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

        {/* Clone modal */}
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
              <Dialog.Header p={"2"} bg={"blue.300"} roundedTop={"md"}>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"copy"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Clone Entity
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"2xs"}
                    top={"6px"}
                    onClick={() => setCloneOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"1"}>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} color={"gray.600"}>
                    By default, the cloned Entity will be created with the same
                    name, but with "(cloned)" appended to the end. You can
                    modify the name below.
                  </Text>

                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root>
                        <Field.Label fontSize={"xs"} fontWeight={"semibold"}>
                          Cloned Entity Name:
                        </Field.Label>
                        <Input
                          size={"xs"}
                          rounded={"md"}
                          value={clonedEntityName}
                          onChange={(event) =>
                            setClonedEntityName(event.target.value)
                          }
                        />
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"1"}>
                <Flex
                  direction={"row"}
                  w={"100%"}
                  gap={"1"}
                  justify={"space-between"}
                >
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

        {/* Save message modal */}
        <SaveModal
          open={saveMessageOpen}
          onOpenChange={(details) => setSaveMessageOpen(details.open)}
          onDone={handleSaveMessageDoneClick}
          value={saveMessage}
          onChange={setSaveMessage}
          placeholder={
            "(Optional) Enter a description of the changes made to the Entity."
          }
          showCloseButton={true}
          modifiedType={"Entity"}
        />

        {/* Blocker warning message */}
        <UnsavedChangesModal
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
