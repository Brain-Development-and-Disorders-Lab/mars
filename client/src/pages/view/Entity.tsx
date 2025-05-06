// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Link,
  Heading,
  Input,
  Text,
  useDisclosure,
  Tag,
  Select,
  Checkbox,
  Stack,
  Drawer,
  Card,
  Spacer,
  IconButton,
  useBreakpoint,
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
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Graph from "@components/Graph";
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
} from "@types";

// Utility functions and libraries
import { requestStatic } from "src/database/functions";
import { createSelectOptions, isValidValues } from "src/util";
import _ from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";
import { nanoid } from "nanoid";
import QRCode from "react-qr-code";

// Apollo client imports
import { useQuery, gql, useMutation, useLazyQuery } from "@apollo/client";

// Routing and navigation
import { useParams, useNavigate, useBlocker } from "react-router-dom";

// Contexts
import { useWorkspace } from "@hooks/useWorkspace";
import { useAuthentication } from "@hooks/useAuthentication";

const Entity = () => {
  const { id } = useParams();
  const breakpoint = useBreakpoint();

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
  const { loading, error, data, refetch } = useQuery(GET_ENTITY, {
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
  const [getFile] = useLazyQuery(GET_FILE_URL);

  // Query to export an Entity, returning the string contents of a file for download
  const EXPORT_ENTITY = gql`
    query ExportEntity($_id: String, $format: String, $fields: [String]) {
      exportEntity(_id: $_id, format: $format, fields: $fields)
    }
  `;
  const [exportEntity, { loading: exportLoading, error: exportError }] =
    useLazyQuery(EXPORT_ENTITY);

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
  ] = useMutation(CREATE_ENTITY);

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
  ] = useMutation(CREATE_TEMPLATE);

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
    useMutation(ARCHIVE_ENTITY);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.entity) {
      // Unpack all the Entity data
      setEntityData(data.entity);
      setEntityName(data.entity.name);
      setEntityArchived(data.entity.archived);
      setEntityDescription(data.entity.description || "");
      setEntityProjects(data.entity.projects || []);
      setEntityRelationships(data.entity.relationships || []);
      setEntityAttributes(data.entity.attributes || []);
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
  }, [data]);

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

    if (response.data.createTemplate.success) {
      toaster.create({
        title: "Saved!",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setTemplates([...templates, attributeData as AttributeModel]);
    }

    if (errorTemplateCreate) {
      toaster.create({
        title: "Error",
        description: errorTemplateCreate.message,
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  useEffect(() => {
    setIsAttributeValueError(
      !isValidValues(attributeValues) || attributeValues.length === 0,
    );
  }, [attributeValues]);

  // Toggles
  const [isUpdating, setIsUpdating] = useState(false);
  const [editing, setEditing] = useState(false);

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
  const [entityAttachments, setEntityAttachments] = useState(
    [] as IGenericItem[],
  );
  const [toUploadAttachments, setToUploadAttachments] = useState(
    [] as string[],
  );

  // Archive dialog
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  // Export dialog
  const selectExportFormatRef = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFields, setExportFields] = useState(["owner"] as string[]);
  const [exportFormat, setExportFormat] = useState("json");

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);

  const [previewAttachment, setPreviewAttachment] = useState(
    {} as IGenericItem,
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  // Toggle editing status
  const handleEditClick = () => {
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
      await updateEntity({
        variables: {
          entity: {
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
          },
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

  const truncateTableText =
    _.isEqual(breakpoint, "sm") ||
    _.isEqual(breakpoint, "base") ||
    _.isUndefined(breakpoint);

  // Configure Projects table columns and data
  const projectsTableColumns = [
    {
      id: (info: Cell<string, string>) => info.row.original,
      cell: (info: Cell<string, string>) => (
        <Linky id={info.row.original} type={"projects"} size={"sm"} />
      ),
      header: "Name",
    },
    {
      id: "view",
      cell: (info: Cell<string, string>) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            {editing ? (
              <IconButton
                aria-label={"Remove project"}
                colorPalette={"red"}
                onClick={() => {
                  removeProject(info.row.original);
                }}
                size={"sm"}
              >
                <Icon name={"delete"} />
              </IconButton>
            ) : (
              <Flex justifyContent={"right"} p={"2"} align={"center"} gap={"1"}>
                <Link
                  color={"black"}
                  fontWeight={"semibold"}
                  onClick={() => navigate(`/projects/${info.row.original}`)}
                >
                  View
                </Link>
                <Icon name={"a_right"} />
              </Flex>
            )}
          </Flex>
        );
      },
      header: "",
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
          <Tooltip content={info.getValue()} showArrow>
            <Text>
              {_.truncate(info.getValue(), {
                length: truncateTableText ? 12 : 24,
              })}
            </Text>
          </Tooltip>
        );
      },
      header: "Name",
    }),
    attributeTableColumnHelper.accessor("description", {
      cell: (info) => {
        return (
          <Tooltip content={info.getValue()} showArrow>
            <Text>{_.truncate(info.getValue(), { length: 12 })}</Text>
          </Tooltip>
        );
      },
      header: "Description",
    }),
    attributeTableColumnHelper.accessor("values", {
      cell: (info) => {
        const tooltipLabelValue = `${info.row.original.values
          .slice(0, 5)
          .map((value) => value.name)
          .join(", ")}${info.row.original.values.length > 5 ? "..." : ""}`;
        return (
          <Tooltip content={tooltipLabelValue} showArrow>
            <Tag.Root colorPalette={"purple"}>
              <Tag.Label>{info.row.original.values.length}</Tag.Label>
            </Tag.Root>
          </Tooltip>
        );
      },
      header: "Values",
    }),
    attributeTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"} gap={"4"}>
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
      header: "",
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
        return (
          <Tooltip content={info.getValue()} showArrow>
            <Text>
              {_.truncate(info.getValue(), {
                length: truncateTableText ? 12 : 24,
              })}
            </Text>
          </Tooltip>
        );
      },
      header: "Name",
    }),
    {
      id: (info: Cell<IGenericItem, string>) =>
        `type_${info.row.original.name}`,
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
      header: "Type",
    },
    attachmentTableColumnHelper.accessor("_id", {
      cell: (info) => {
        const handleDownload = async () => {
          await getDownload(info.getValue(), info.row.original.name);
        };

        const handlePreview = async () => {
          // Update the attachment state
          setPreviewAttachment({
            _id: info.getValue(),
            name: info.row.original.name,
          });

          // Open the preview modal
          setPreviewOpen(true);
        };

        return (
          <Flex w={"100%"} justify={"end"} gap={"2"}>
            {/* Attachment preview modal */}
            <Dialog.Root
              open={previewOpen}
              onOpenChange={(event) => setPreviewOpen(event.open)}
              placement={"center"}
              closeOnEscape
              closeOnInteractOutside
            >
              <Dialog.Trigger asChild>
                <IconButton
                  aria-label={"Preview attachment"}
                  variant={"subtle"}
                  size={"sm"}
                  rounded={"md"}
                  key={`preview-file-${info.getValue()}`}
                  colorPalette={"gray"}
                  onClick={() => handlePreview()}
                >
                  <Icon name={"expand"} />
                </IconButton>
              </Dialog.Trigger>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content maxW={"100vw"} w={"fit-content"}>
                  <Dialog.Header>Attachment Preview</Dialog.Header>
                  <Dialog.Body>
                    <Flex justify={"center"} align={"center"} pb={"2"}>
                      <PreviewModal attachment={previewAttachment} />
                    </Flex>
                  </Dialog.Body>
                </Dialog.Content>
              </Dialog.Positioner>
            </Dialog.Root>
            {editing ? (
              <IconButton
                aria-label={"Remove attachment"}
                size={"sm"}
                rounded={"md"}
                key={`remove-file-${info.getValue()}`}
                colorPalette={"red"}
                onClick={() => removeAttachment(info.getValue())}
              >
                <Icon name={"delete"} />
              </IconButton>
            ) : (
              <IconButton
                aria-label={"Download attachment"}
                size={"sm"}
                rounded={"md"}
                key={`download-file-${info.getValue()}`}
                colorPalette={"blue"}
                onClick={() => handleDownload()}
              >
                <Icon name={"download"} />
              </IconButton>
            )}
          </Flex>
        );
      },
      header: "",
    }),
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
      await updateEntity({
        variables: {
          entity: {
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
          },
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
        entity: {
          name: clonedEntityName,
          owner: entityData.owner,
          created: dayjs(Date.now()).toISOString(),
          archived: false,
          description: entityData.description,
          projects: entityData.projects,
          relationships: entityData.relationships,
          attributes: entityData.attributes,
          attachments: entityData.attachments,
        },
      },
    });

    if (response.data.createEntity.success) {
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

    if (createEntityError) {
      toaster.create({
        title: "Error",
        description: "An error occurred while cloning the Entity",
        type: "error",
        duration: 2000,
        closable: true,
      });
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

    if (response.data.archiveEntity.success) {
      toaster.create({
        title: "Archived Successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setEntityArchived(true);
      setArchiveDialogOpen(false);
    } else {
      toaster.create({
        title: "Error",
        description: "An error occurred while archiving Entity",
        type: "error",
        duration: 2000,
        closable: true,
      });
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
            id={"entityNameTag"}
            align={"center"}
            gap={"2"}
            p={"2"}
            border={"2px solid"}
            rounded={"md"}
          >
            <Icon name={"entity"} size={"md"} />
            <Tooltip content={entityData.name}>
              <Heading fontWeight={"semibold"} size={"md"}>
                {_.truncate(entityData.name, { length: 30 })}
              </Heading>
            </Tooltip>
            {entityArchived && <Icon name={"archive"} size={"md"} />}
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"} align={"center"}>
            {/* Actions Menu */}
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button
                  variant={"solid"}
                  size={"sm"}
                  rounded={"md"}
                  colorPalette={"yellow"}
                >
                  Actions
                  <Icon name={"lightning"} />
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value={"print"} fontSize={"sm"} disabled>
                      <Icon name={"print"} />
                      Print
                    </Menu.Item>
                    <Menu.Item
                      value={"share"}
                      fontSize={"sm"}
                      onClick={handleShareClick}
                    >
                      <Icon name={"share"} />
                      Share
                    </Menu.Item>
                    <Menu.Item
                      value={"visualize"}
                      onClick={() => setGraphOpen(true)}
                      fontSize={"sm"}
                      disabled={editing || entityArchived}
                    >
                      <Icon name={"graph"} />
                      Visualize
                    </Menu.Item>
                    <Menu.Item
                      value={"clone"}
                      onClick={() => setCloneOpen(true)}
                      fontSize={"sm"}
                      disabled={entityArchived}
                    >
                      <Icon name={"copy"} />
                      Clone
                    </Menu.Item>
                    <Menu.Item
                      value={"export"}
                      onClick={handleExportClick}
                      fontSize={"sm"}
                      disabled={editing || entityArchived}
                    >
                      <Icon name={"download"} />
                      Export
                    </Menu.Item>
                    <Menu.Item
                      id={"archiveEntityButton"}
                      value={"archive"}
                      onClick={() => setArchiveDialogOpen(true)}
                      fontSize={"sm"}
                      disabled={entityArchived}
                    >
                      <Icon name={"archive"} />
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
                size={"sm"}
                rounded={"md"}
                colorPalette={"red"}
                onClick={handleCancelClick}
              >
                Cancel
                <Icon name={"cross"} />
              </Button>
            )}
            {entityArchived ? (
              <Button
                id={"restoreEntityButton"}
                variant={"solid"}
                size={"sm"}
                rounded={"md"}
                colorPalette={"orange"}
                onClick={handleRestoreFromArchiveClick}
              >
                Restore
                <Icon name={"rewind"} />
              </Button>
            ) : (
              <Button
                id={"editEntityButton"}
                variant={"solid"}
                size={"sm"}
                rounded={"md"}
                colorPalette={editing ? "green" : "blue"}
                onClick={handleEditClick}
                loading={isUpdating}
              >
                {editing ? "Save" : "Edit"}
                <Icon name={editing ? "save" : "edit"} />
              </Button>
            )}

            {/* Version history */}
            <Drawer.Root
              open={historyOpen}
              size={"md"}
              onOpenChange={(event) => setHistoryOpen(event.open)}
              closeOnEscape
              closeOnInteractOutside
            >
              <Drawer.Trigger asChild>
                <Button
                  id={"historyButton"}
                  variant={"subtle"}
                  size={"sm"}
                  rounded={"md"}
                  onClick={() => setHistoryOpen(true)}
                >
                  History
                  <Icon name={"clock"} />
                </Button>
              </Drawer.Trigger>
              <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                  <Drawer.Content>
                    <Drawer.CloseTrigger asChild>
                      <CloseButton
                        size={"sm"}
                        onClick={() => setHistoryOpen(false)}
                      />
                    </Drawer.CloseTrigger>
                    <Drawer.Header pb={"2"}>
                      <Flex direction={"column"} w={"100%"} gap={"2"}>
                        <Text fontSize={"sm"} fontWeight={"bold"}>
                          History
                        </Text>
                        <Flex
                          direction={"row"}
                          gap={"1"}
                          justify={"space-between"}
                        >
                          <Flex direction={"row"} gap={"1"}>
                            <Text fontSize={"sm"} fontWeight={"semibold"}>
                              Last modified:
                            </Text>
                            <Text fontSize={"sm"} fontWeight={"normal"}>
                              {entityHistory.length > 0
                                ? dayjs(entityHistory[0].timestamp).fromNow()
                                : "never"}
                            </Text>
                          </Flex>
                          <Flex direction={"row"} gap={"1"}>
                            <Text fontSize={"sm"} fontWeight={"semibold"}>
                              Versions:
                            </Text>
                            <Text fontSize={"sm"} fontWeight={"normal"}>
                              {entityHistory.length}
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>
                    </Drawer.Header>

                    <Drawer.Body>
                      <Stack gap={"2"}>
                        {entityHistory.length > 0 ? (
                          entityHistory.map((entityVersion) => {
                            return (
                              <Card.Root
                                w={"100%"}
                                key={`v_${entityVersion.timestamp}`}
                                variant={"outline"}
                                rounded={"md"}
                                border={"1px solid"}
                                borderColor={"gray.300"}
                              >
                                <Card.Body p={"2"} pb={"0"}>
                                  <Flex direction={"column"} gap={"2"}>
                                    {/* Name */}
                                    <Text
                                      fontWeight={"semibold"}
                                      fontSize={"sm"}
                                      color={"gray.700"}
                                    >
                                      {entityVersion.name}
                                    </Text>

                                    {/* Description */}
                                    <Flex w={"100%"}>
                                      {_.isEqual(
                                        entityVersion.description,
                                        "",
                                      ) ? (
                                        <Tag.Root
                                          size={"sm"}
                                          colorPalette={"orange"}
                                        >
                                          <Tag.Label>No Description</Tag.Label>
                                        </Tag.Root>
                                      ) : (
                                        <Text fontSize={"sm"}>
                                          {_.truncate(
                                            entityVersion.description,
                                            {
                                              length: 56,
                                            },
                                          )}
                                        </Text>
                                      )}
                                    </Flex>

                                    <Flex direction={"row"} gap={"2"}>
                                      {/* Projects */}
                                      <Flex
                                        direction={"column"}
                                        gap={"1"}
                                        p={"2"}
                                        rounded={"md"}
                                        border={"1px solid"}
                                        borderColor={"gray.300"}
                                        grow={"1"}
                                      >
                                        <Text
                                          fontSize={"sm"}
                                          fontWeight={"semibold"}
                                        >
                                          Projects
                                        </Text>
                                        {entityVersion.projects.length > 0 ? (
                                          <Flex
                                            direction={"row"}
                                            gap={"2"}
                                            align={"center"}
                                          >
                                            <Tag.Root
                                              key={`v_c_${entityVersion.timestamp}_${entityVersion.projects[0]}`}
                                              size={"sm"}
                                            >
                                              <Tag.Label>
                                                <Linky
                                                  type={"projects"}
                                                  id={entityVersion.projects[0]}
                                                  size={"sm"}
                                                />
                                              </Tag.Label>
                                            </Tag.Root>
                                            {entityVersion.projects.length >
                                              1 && (
                                              <Text
                                                fontWeight={"semibold"}
                                                fontSize={"sm"}
                                              >
                                                and{" "}
                                                {entityVersion.projects.length -
                                                  1}{" "}
                                                others
                                              </Text>
                                            )}
                                          </Flex>
                                        ) : (
                                          <Text fontSize={"sm"}>
                                            No Projects
                                          </Text>
                                        )}
                                      </Flex>

                                      {/* Relationships */}
                                      <Flex
                                        direction={"column"}
                                        gap={"1"}
                                        p={"2"}
                                        rounded={"md"}
                                        border={"1px solid"}
                                        borderColor={"gray.300"}
                                        grow={"1"}
                                      >
                                        <Text
                                          fontWeight={"semibold"}
                                          fontSize={"sm"}
                                        >
                                          Relationships
                                        </Text>
                                        <Flex direction={"row"} gap={"2"}>
                                          <Flex w={"100%"}>
                                            <Tag.Root
                                              key={`v_o_${entityVersion.timestamp}`}
                                              size={"sm"}
                                            >
                                              <Tag.Label>
                                                {
                                                  entityVersion?.relationships
                                                    ?.length
                                                }
                                              </Tag.Label>
                                            </Tag.Root>
                                          </Flex>
                                        </Flex>
                                      </Flex>
                                    </Flex>

                                    <Flex direction={"row"} gap={"2"}>
                                      {/* Attributes */}
                                      <Flex
                                        direction={"column"}
                                        gap={"1"}
                                        p={"2"}
                                        rounded={"md"}
                                        border={"1px solid"}
                                        borderColor={"gray.300"}
                                        grow={"1"}
                                      >
                                        <Text
                                          fontSize={"sm"}
                                          fontWeight={"semibold"}
                                        >
                                          Attributes
                                        </Text>
                                        {entityVersion.attributes.length > 0 ? (
                                          <Flex
                                            direction={"row"}
                                            gap={"2"}
                                            align={"center"}
                                          >
                                            <Tooltip
                                              content={
                                                "Values: " +
                                                entityVersion.attributes[0]
                                                  .values.length
                                              }
                                              showArrow
                                            >
                                              <Tag.Root
                                                key={`v_a_${entityVersion.timestamp}_${entityVersion.attributes[0]._id}`}
                                                size={"sm"}
                                              >
                                                <Tag.Label>
                                                  {
                                                    entityVersion.attributes[0]
                                                      .name
                                                  }
                                                </Tag.Label>
                                              </Tag.Root>
                                            </Tooltip>
                                            {entityVersion.attributes.length >
                                              1 && (
                                              <Text fontSize={"sm"}>
                                                and{" "}
                                                {entityVersion.attributes
                                                  .length - 1}{" "}
                                                other
                                                {entityVersion.attributes
                                                  .length > 2
                                                  ? "s"
                                                  : ""}
                                              </Text>
                                            )}
                                          </Flex>
                                        ) : (
                                          <Text fontSize={"sm"}>
                                            No Attributes
                                          </Text>
                                        )}
                                      </Flex>

                                      {/* Attachments */}
                                      <Flex
                                        direction={"column"}
                                        gap={"1"}
                                        p={"2"}
                                        rounded={"md"}
                                        border={"1px solid"}
                                        borderColor={"gray.300"}
                                        grow={"1"}
                                      >
                                        <Text
                                          fontSize={"sm"}
                                          fontWeight={"semibold"}
                                        >
                                          Attachments
                                        </Text>
                                        {entityVersion.attachments.length >
                                        0 ? (
                                          <Flex
                                            direction={"row"}
                                            gap={"2"}
                                            align={"center"}
                                          >
                                            <Tooltip
                                              content={
                                                entityVersion.attachments[0]
                                                  .name
                                              }
                                              showArrow
                                            >
                                              <Tag.Root
                                                key={`v_at_${entityVersion.timestamp}_${entityVersion.attachments[0]._id}`}
                                                size={"sm"}
                                              >
                                                <Tag.Label>
                                                  {_.truncate(
                                                    entityVersion.attachments[0]
                                                      .name,
                                                    { length: 24 },
                                                  )}
                                                </Tag.Label>
                                              </Tag.Root>
                                            </Tooltip>
                                            {entityVersion.attachments.length >
                                              1 && (
                                              <Text fontSize={"sm"}>
                                                and{" "}
                                                {entityVersion.attachments
                                                  .length - 1}{" "}
                                                other
                                                {entityVersion.attachments
                                                  .length > 2
                                                  ? "s"
                                                  : ""}
                                              </Text>
                                            )}
                                          </Flex>
                                        ) : (
                                          <Text fontSize={"sm"}>
                                            No Attachments
                                          </Text>
                                        )}
                                      </Flex>
                                    </Flex>
                                  </Flex>
                                </Card.Body>

                                <Card.Footer p={"2"}>
                                  {/* Version information */}
                                  <Flex
                                    direction={"column"}
                                    gap={"2"}
                                    w={"100%"}
                                  >
                                    <Flex
                                      direction={"row"}
                                      gap={"2"}
                                      bg={"gray.100"}
                                      justify={"center"}
                                      rounded={"md"}
                                    >
                                      <Flex
                                        direction={"column"}
                                        w={"100%"}
                                        gap={"1"}
                                        p={"2"}
                                      >
                                        <Text
                                          fontSize={"sm"}
                                          fontWeight={"semibold"}
                                        >
                                          Version
                                        </Text>
                                        <Flex
                                          direction={"row"}
                                          gap={"2"}
                                          align={"center"}
                                        >
                                          <Tag.Root
                                            size={"sm"}
                                            colorPalette={"green"}
                                          >
                                            <Tag.Label>
                                              {entityVersion.version}
                                            </Tag.Label>
                                          </Tag.Root>
                                        </Flex>
                                        <Text
                                          fontWeight={"semibold"}
                                          fontSize={"xs"}
                                          color={"gray.400"}
                                        >
                                          {dayjs(
                                            entityVersion.timestamp,
                                          ).fromNow()}
                                        </Text>
                                        <Text
                                          fontSize={"sm"}
                                          fontWeight={"semibold"}
                                        >
                                          Message
                                        </Text>
                                        {_.isEqual(entityVersion.message, "") ||
                                        _.isNull(entityVersion.message) ? (
                                          <Flex>
                                            <Tag.Root
                                              size={"sm"}
                                              colorPalette={"orange"}
                                            >
                                              <Tag.Label>No Message</Tag.Label>
                                            </Tag.Root>
                                          </Flex>
                                        ) : (
                                          <Tooltip
                                            content={entityVersion.message}
                                            disabled={
                                              entityVersion.message.length < 32
                                            }
                                            showArrow
                                          >
                                            <Text fontSize={"sm"}>
                                              {_.truncate(
                                                entityVersion.message,
                                                {
                                                  length: 32,
                                                },
                                              )}
                                            </Text>
                                          </Tooltip>
                                        )}
                                      </Flex>

                                      <Flex
                                        direction={"column"}
                                        w={"100%"}
                                        gap={"1"}
                                        p={"2"}
                                      >
                                        <Text
                                          fontSize={"sm"}
                                          fontWeight={"semibold"}
                                        >
                                          Author
                                        </Text>
                                        <Flex>
                                          <ActorTag
                                            orcid={entityVersion.author}
                                            fallback={"Unknown User"}
                                            size={"md"}
                                          />
                                        </Flex>
                                      </Flex>
                                    </Flex>

                                    <Flex w={"100%"} justify={"right"}>
                                      <Button
                                        variant={"solid"}
                                        size={"sm"}
                                        rounded={"md"}
                                        colorPalette={"orange"}
                                        onClick={() =>
                                          handleRestoreFromHistoryClick(
                                            entityVersion,
                                          )
                                        }
                                        disabled={entityArchived}
                                      >
                                        Restore
                                        <Icon name={"rewind"} />
                                      </Button>
                                    </Flex>
                                  </Flex>
                                </Card.Footer>
                              </Card.Root>
                            );
                          })
                        ) : (
                          <Text fontSize={"sm"} fontWeight={"semibold"}>
                            No History.
                          </Text>
                        )}
                      </Stack>
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

        <Flex direction={"column"} gap={"2"} p={"2"}>
          {/* Overview and "Description" field */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"}>
            {/* Entity Overview */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              bg={"gray.100"}
              rounded={"md"}
              grow={"1"}
            >
              {/* "Name" field */}
              <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"1"} grow={"1"}>
                  <Text fontWeight={"bold"} fontSize={"sm"}>
                    Name
                  </Text>
                  <Input
                    id={"entityNameInput"}
                    size={"sm"}
                    value={entityName}
                    onChange={(event) => {
                      setEntityName(event.target.value || "");
                    }}
                    readOnly={!editing}
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
              <Flex gap={"2"} direction={"row"} w={"100%"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"sm"}>
                    Visibility
                  </Text>
                  <VisibilityTag isPublic={false} isInherited />
                </Flex>

                {/* Owner */}
                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"sm"}>
                    Owner
                  </Text>
                  <ActorTag
                    orcid={entityData.owner}
                    fallback={"Unknown User"}
                    size={"md"}
                  />
                </Flex>
              </Flex>
            </Flex>

            {/* Description */}
            <Flex
              direction={"row"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              border={"1px solid"}
              borderColor={"gray.300"}
              rounded={"md"}
              basis={"40%"}
              grow={"1"}
            >
              <Flex direction={"column"} gap={"1"} w={"100%"}>
                <Text fontWeight={"bold"} fontSize={"sm"}>
                  Description
                </Text>
                <Flex>
                  <MDEditor
                    height={150}
                    minHeight={100}
                    maxHeight={400}
                    id={"entityDescriptionInput"}
                    style={{ width: "100%" }}
                    value={entityDescription}
                    preview={editing ? "edit" : "preview"}
                    extraCommands={[]}
                    onChange={(value) => {
                      setEntityDescription(value || "");
                    }}
                  />
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          {/* "Projects" and "Attributes" fields */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"}>
            {/* Projects */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
              grow={"1"}
              basis={"40%"}
            >
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
              >
                <Text fontSize={"sm"} fontWeight={"bold"}>
                  Projects
                </Text>
                <Button
                  id={"addProjectsModalButton"}
                  variant={"solid"}
                  size={"sm"}
                  rounded={"md"}
                  colorPalette={"green"}
                  onClick={() => setAddProjectsOpen(true)}
                  disabled={!editing}
                >
                  Add
                  <Icon name={"add"} />
                </Button>
              </Flex>
              <Flex
                w={"100%"}
                justify={"center"}
                align={"center"}
                minH={entityProjects.length > 0 ? "fit-content" : "200px"}
              >
                {entityProjects.length === 0 ? (
                  <Text
                    color={"gray.400"}
                    fontWeight={"semibold"}
                    fontSize={"sm"}
                  >
                    No Projects
                  </Text>
                ) : (
                  <DataTable
                    data={entityProjects}
                    columns={projectsTableColumns}
                    visibleColumns={{}}
                    selectedRows={{}}
                    viewOnly={!editing}
                    actions={projectsTableActions}
                    showPagination
                    showSelection
                  />
                )}
              </Flex>
            </Flex>

            {/* Attributes */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
              grow={"1"}
              basis={"40%"}
            >
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
              >
                <Text fontSize={"sm"} fontWeight={"bold"}>
                  Attributes
                </Text>
                <Button
                  id={"addAttributeModalButton"}
                  variant={"solid"}
                  size={"sm"}
                  rounded={"md"}
                  colorPalette={"green"}
                  onClick={() => setAddAttributesOpen(true)}
                  disabled={!editing}
                >
                  Add
                  <Icon name={"add"} />
                </Button>
              </Flex>

              <Flex
                w={"100%"}
                justify={"center"}
                align={"center"}
                minH={entityAttributes.length > 0 ? "fit-content" : "200px"}
              >
                {entityAttributes.length === 0 ? (
                  <Text
                    color={"gray.400"}
                    fontWeight={"semibold"}
                    fontSize={"sm"}
                  >
                    No Attributes
                  </Text>
                ) : (
                  <DataTable
                    data={entityAttributes}
                    columns={attributeTableColumns}
                    visibleColumns={visibleAttributeTableColumns}
                    selectedRows={{}}
                    viewOnly={!editing}
                    showPagination
                    showSelection
                  />
                )}
              </Flex>
            </Flex>
          </Flex>

          {/* "Relationships" and "Attachments" fields */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"}>
            {/* Relationships */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
              basis={"40%"}
              grow={"1"}
            >
              <Flex gap={"2"} direction={"column"}>
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  align={"center"}
                >
                  <Text fontSize={"sm"} fontWeight={"bold"}>
                    Relationships
                  </Text>
                  <Button
                    variant={"solid"}
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={() => setAddRelationshipsOpen(true)}
                    disabled={!editing}
                  >
                    Add
                    <Icon name={"add"} />
                  </Button>
                </Flex>
                <Flex
                  w={"100%"}
                  justify={"center"}
                  align={entityRelationships.length > 0 ? "" : "center"}
                  minH={
                    entityRelationships.length > 0 ? "fit-content" : "200px"
                  }
                >
                  {entityRelationships.length > 0 ? (
                    <Relationships
                      relationships={entityRelationships}
                      setRelationships={setEntityRelationships}
                      viewOnly={!editing}
                    />
                  ) : (
                    <Text
                      color={"gray.400"}
                      fontWeight={"semibold"}
                      fontSize={"sm"}
                    >
                      No Relationships
                    </Text>
                  )}
                </Flex>
              </Flex>
            </Flex>

            {/* Attachments */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
              basis={"40%"}
              grow={"1"}
            >
              <Flex gap={"2"} direction={"column"}>
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  align={"center"}
                >
                  <Text fontSize={"sm"} fontWeight={"bold"}>
                    Attachments
                  </Text>
                  <Button
                    variant={"solid"}
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={() => setUploadOpen(true)}
                    disabled={!editing}
                  >
                    Upload
                    <Icon name={"upload"} />
                  </Button>
                </Flex>

                <Flex
                  w={"100%"}
                  justify={"center"}
                  align={"center"}
                  minH={entityAttachments.length > 0 ? "fit-content" : "200px"}
                >
                  {entityAttachments.length === 0 ? (
                    <Text
                      color={"gray.400"}
                      fontWeight={"semibold"}
                      fontSize={"sm"}
                    >
                      No Attachments
                    </Text>
                  ) : (
                    <DataTable
                      data={entityAttachments}
                      columns={attachmentTableColumns}
                      visibleColumns={{}}
                      selectedRows={{}}
                      viewOnly={!editing}
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
              <Dialog.Header
                p={"2"}
                mt={"2"}
                fontWeight={"semibold"}
                fontSize={"md"}
              >
                Add Attribute
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"sm"}
                    onClick={() => setAddAttributesOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"2"}>
                {/* Attribute creation */}
                <Flex
                  direction={"column"}
                  gap={"2"}
                  pb={"2"}
                  justify={"center"}
                >
                  <Select.Root
                    key={"select-template"}
                    size={"sm"}
                    collection={templatesCollection}
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
                    <Select.Label>Select Template</Select.Label>
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
                  <Text fontSize="sm">
                    Don't see the Template you're looking for? You can
                    <Link
                      onClick={() => navigate("/create/template")}
                      style={{
                        color: "#3182ce",
                        marginLeft: "5px",
                        marginRight: "5px",
                        textDecoration: "underline",
                      }}
                    >
                      create
                    </Link>
                    a new Template here.
                  </Text>

                  <Flex
                    direction={"column"}
                    gap={"2"}
                    w={"100%"}
                    justify={"center"}
                  >
                    <Flex direction={"row"} gap={"2"} wrap={["wrap", "nowrap"]}>
                      <Fieldset.Root>
                        <Fieldset.Content>
                          <Field.Root required>
                            <Field.Label>
                              Name
                              <Field.RequiredIndicator />
                            </Field.Label>
                            <Input
                              size={"sm"}
                              placeholder={"Name"}
                              id="formName"
                              rounded={"md"}
                              value={attributeName}
                              onChange={(event) =>
                                setAttributeName(event.target.value)
                              }
                              required
                            />
                            {isAttributeNameError && (
                              <Field.ErrorText>
                                A name must be specified for the Attribute.
                              </Field.ErrorText>
                            )}
                          </Field.Root>

                          <Field.Root required>
                            <Field.Label>
                              Description
                              <Field.RequiredIndicator />
                            </Field.Label>
                            <MDEditor
                              height={150}
                              minHeight={100}
                              maxHeight={400}
                              style={{ width: "100%" }}
                              value={attributeDescription}
                              preview={editing ? "edit" : "preview"}
                              id={"formDescription"}
                              extraCommands={[]}
                              onChange={(value) => {
                                setAttributeDescription(value || "");
                              }}
                            />
                            {isAttributeDescriptionError && (
                              <Field.ErrorText>
                                A description should be provided for the
                                Attribute.
                              </Field.ErrorText>
                            )}
                          </Field.Root>
                        </Fieldset.Content>
                      </Fieldset.Root>
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

                {/* Modal buttons */}
                <Flex direction={"row"} justify={"center"} gap={"2"}>
                  {/* "Cancel" button */}
                  <Button
                    variant={"outline"}
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"red"}
                    onClick={() => setAddAttributesOpen(false)}
                  >
                    Cancel
                    <Icon name={"cross"} />
                  </Button>

                  <Spacer />

                  <Button
                    variant={"solid"}
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"blue"}
                    onClick={onSaveAsTemplate}
                    disabled={isAttributeError}
                    loading={loadingTemplateCreate}
                  >
                    Create Template
                    <Icon name={"add"} />
                  </Button>

                  <Button
                    variant={"solid"}
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"green"}
                    disabled={isAttributeError}
                    onClick={() => {
                      addAttribute();
                    }}
                  >
                    Save
                    <Icon name={"check"} />
                  </Button>
                </Flex>
              </Dialog.Body>
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
                <Dialog.Header
                  p={"2"}
                  mt={"2"}
                  fontWeight={"semibold"}
                  fontSize={"md"}
                >
                  <Icon name={"project"} />
                  Add Entity to Projects
                  <Dialog.CloseTrigger asChild>
                    <CloseButton
                      size={"sm"}
                      onClick={() => setAddProjectsOpen(false)}
                    />
                  </Dialog.CloseTrigger>
                </Dialog.Header>
                <Dialog.Body p={"2"}>
                  {/* Select component for Projects */}
                  <Flex direction={"column"} gap={"2"}>
                    <Select.Root
                      id={"select-project"}
                      size={"sm"}
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
                      gap={"2"}
                      p={"2"}
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
                                  <Tag.Label p={"1"}>
                                    <Linky
                                      id={project}
                                      type={"projects"}
                                      size={"sm"}
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

                <Dialog.Footer p={"2"}>
                  {/* "Cancel" button */}
                  <Flex direction={"row"} justify={"space-between"} w={"100%"}>
                    <Button
                      variant={"outline"}
                      size={"sm"}
                      rounded={"md"}
                      colorPalette={"red"}
                      onClick={onCancelAddProjectsClick}
                    >
                      Cancel
                      <Icon name={"cross"} />
                    </Button>
                    <Button
                      variant={"solid"}
                      size={"sm"}
                      rounded={"md"}
                      colorPalette={"green"}
                      onClick={() => {
                        addProjects(selectedProjects);
                      }}
                      disabled={selectedProjects.length === 0}
                    >
                      Add Entity to {selectedProjects.length} Project
                      {selectedProjects.length === 1 ? "" : "s"}
                      <Icon name={"check"} />
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
              <Dialog.Header
                p={"2"}
                mt={"2"}
                fontWeight={"semibold"}
                fontSize={"md"}
              >
                Add Relationship
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"sm"}
                    onClick={() => setAddRelationshipsOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"2"}>
                <Flex direction={"column"} gap={"2"}>
                  <Flex
                    direction={"row"}
                    gap={"2"}
                    justify={"space-between"}
                    p={"2"}
                    rounded={"md"}
                    border={"1px solid"}
                    borderColor={"gray.300"}
                  >
                    <Flex direction={"column"} gap={"1"} w={"33%"}>
                      <Text fontSize={"sm"} fontWeight={"semibold"}>
                        Source
                      </Text>
                      <Input
                        size={"sm"}
                        rounded={"md"}
                        value={entityName}
                        readOnly
                        disabled
                      />
                    </Flex>
                    <Flex direction={"column"} gap={"1"} w={"33%"}>
                      <Text fontSize={"sm"} fontWeight={"semibold"}>
                        Type
                      </Text>
                      <Select.Root
                        key={"select-relationship-type"}
                        size={"sm"}
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
                      <Text fontSize={"sm"} fontWeight={"semibold"}>
                        Target
                      </Text>
                      <SearchSelect
                        resultType={"entity"}
                        value={selectedRelationshipTarget}
                        onChange={setSelectedRelationshipTarget}
                      />
                    </Flex>
                  </Flex>
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Text fontSize={"sm"} fontWeight={"bold"}>
                      Description:
                    </Text>
                    <Text fontSize={"sm"}>{entityName} is</Text>
                    <Tag.Root
                      fontSize={"sm"}
                      fontWeight={"semibold"}
                      colorPalette={"yellow"}
                    >
                      <Tag.Label>
                        {selectedRelationshipType === "general" && "related"}
                        {selectedRelationshipType === "child" && "a child"}
                        {selectedRelationshipType === "parent" && "a parent"}
                      </Tag.Label>
                    </Tag.Root>
                    <Text fontSize={"sm"}>
                      {selectedRelationshipType === "general" ? "to" : "of"}
                    </Text>
                    <Tag.Root
                      fontSize={"sm"}
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
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"2"}>
                <Flex
                  direction={"row"}
                  w={"100%"}
                  gap={"2"}
                  justify={"space-between"}
                >
                  <Button
                    variant={"outline"}
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"red"}
                    onClick={() => setAddRelationshipsOpen(false)}
                  >
                    Cancel
                    <Icon name={"cross"} />
                  </Button>
                  <Button
                    variant={"solid"}
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"green"}
                    disabled={_.isUndefined(selectedRelationshipTarget._id)}
                    onClick={() => addRelationship()}
                  >
                    Done
                    <Icon name={"check"} />
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
              <Dialog.Header
                p={"2"}
                mt={"2"}
                fontWeight={"semibold"}
                fontSize={"md"}
              >
                Export Entity
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"sm"}
                    onClick={() => setExportOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body px={"2"} gap={"2"}>
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
                  py={"2"}
                  gap={"2"}
                  justify={"space-between"}
                  align={"center"}
                  ref={selectExportFormatRef}
                >
                  <Flex gap={"2"} align={"center"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      Format:
                    </Text>
                    <Fieldset.Root w={"fit-content"}>
                      <Fieldset.Content>
                        <Field.Root>
                          <Select.Root
                            key={"select-export-format"}
                            w={"120px"}
                            size={"sm"}
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
                  <Text fontSize={"sm"}>
                    Select the Entity fields to be exported.
                  </Text>
                </Flex>

                {/* Selection content */}
                <Flex
                  direction={"column"}
                  p={"2"}
                  gap={"2"}
                  rounded={"md"}
                  border={"1px solid"}
                  borderColor={"gray.300"}
                >
                  <Flex direction={"row"} gap={"2"}>
                    <Fieldset.Root>
                      <Fieldset.Content>
                        <Fieldset.Legend>Details</Fieldset.Legend>
                        {!loading ? (
                          <Stack gap={2} direction={"column"}>
                            <Checkbox.Root
                              disabled
                              defaultChecked
                              fontSize={"sm"}
                              size={"sm"}
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
                              fontSize={"sm"}
                              size={"sm"}
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
                              fontSize={"sm"}
                              size={"sm"}
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
                              size={"sm"}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label>
                                <Text lineClamp={1} fontSize={"sm"}>
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
                      <Fieldset.Content>
                        <Fieldset.Legend>Projects</Fieldset.Legend>
                        {!loading && entityProjects.length > 0 ? (
                          <Stack gap={2} direction={"column"}>
                            {entityProjects.map((project) => {
                              allExportFields.push(`project_${project}`);
                              return (
                                <Checkbox.Root
                                  size={"sm"}
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
                                      size={"sm"}
                                    />
                                  </Checkbox.Label>
                                </Checkbox.Root>
                              );
                            })}
                          </Stack>
                        ) : (
                          <Text fontSize={"sm"}>No Projects</Text>
                        )}
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>

                  <Separator />

                  <Flex direction={"row"} gap={"2"}>
                    <Fieldset.Root>
                      <Fieldset.Content>
                        <Fieldset.Legend>Origins</Fieldset.Legend>
                        {!loading && entityRelationships?.length > 0 ? (
                          <Stack gap={2} direction={"column"}>
                            {entityRelationships.map((relationship) => {
                              allExportFields.push(
                                `relationship_${relationship.target._id}_${relationship.type}`,
                              );
                              return (
                                <Checkbox.Root
                                  size={"sm"}
                                  fontSize={"sm"}
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
                                      size={"sm"}
                                    />
                                  </Checkbox.Label>
                                </Checkbox.Root>
                              );
                            })}
                          </Stack>
                        ) : (
                          <Text fontSize={"sm"}>No Origins</Text>
                        )}
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>

                  <Separator />

                  <Flex direction={"row"} gap={"2"}>
                    <Fieldset.Root>
                      <Fieldset.Content>
                        <Fieldset.Legend>Attributes</Fieldset.Legend>
                        {!loading && entityAttributes.length > 0 ? (
                          <Stack gap={2} direction={"column"}>
                            {entityAttributes.map((attribute) => {
                              allExportFields.push(
                                `attribute_${attribute._id}`,
                              );
                              return (
                                <Checkbox.Root
                                  size={"sm"}
                                  fontSize={"sm"}
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
                          <Text fontSize={"sm"}>No Attributes</Text>
                        )}
                      </Fieldset.Content>
                    </Fieldset.Root>
                  </Flex>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"2"}>
                <Flex direction={"column"} w={"30%"} gap={"2"}>
                  {/* "Download" button */}
                  <Flex
                    direction={"row"}
                    w={"100%"}
                    gap={"2"}
                    justify={"right"}
                    align={"center"}
                  >
                    <Button
                      variant={"solid"}
                      size={"sm"}
                      rounded={"md"}
                      colorPalette={"blue"}
                      onClick={() => handleDownloadClick(exportFormat)}
                      loading={exportLoading}
                    >
                      Download
                      <Icon name={"download"} />
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
          size={"full"}
          closeOnEscape
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header
                p={"2"}
                mt={"2"}
                fontWeight={"semibold"}
                fontSize={"md"}
              >
                Visualize: {entityName}
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"sm"}
                    onClick={() => setAddRelationshipsOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"2"}>
                <Graph
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
              <Dialog.Header
                p={"2"}
                mt={"2"}
                fontWeight={"semibold"}
                fontSize={"md"}
              >
                Share Entity
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"sm"}
                    onClick={() => setShareOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"2"}>
                <Flex direction={"column"} gap={"2"}>
                  <Flex direction={"row"} gap={"2"} align={"center"}>
                    <Flex w={"25%"}>
                      <Text fontSize={"sm"} fontWeight={"semibold"}>
                        Sharable URL:
                      </Text>
                    </Flex>
                    <Flex w={"60%"}>
                      <Input
                        size={"sm"}
                        value={`https://app.metadatify.com/entities/${id}`}
                        rounded={"md"}
                        onFocus={(event) => event.target.select()}
                        readOnly
                      />
                    </Flex>
                    <Button
                      variant={"subtle"}
                      size={"sm"}
                      rounded={"md"}
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
                      Copy
                      <Icon name={"copy"} />
                    </Button>
                  </Flex>

                  <Flex direction={"row"} gap={"2"} align={"center"}>
                    <Flex w={"25%"}>
                      <Text fontSize={"sm"} fontWeight={"semibold"}>
                        Unique ID:
                      </Text>
                    </Flex>
                    <Flex w={"60%"}>
                      <Input
                        size={"sm"}
                        value={id}
                        rounded={"md"}
                        onFocus={(event) => event.target.select()}
                        readOnly
                      />
                    </Flex>
                    <Button
                      variant={"subtle"}
                      size={"sm"}
                      rounded={"md"}
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
                      Copy
                      <Icon name={"copy"} />
                    </Button>
                  </Flex>

                  <Flex direction={"row"} gap={"2"}>
                    <Flex w={"25%"}>
                      <Text fontSize={"sm"} fontWeight={"semibold"}>
                        QR Code:
                      </Text>
                    </Flex>
                    <Flex
                      p={"2"}
                      border={"1px solid"}
                      borderColor={"gray.300"}
                      rounded={"md"}
                    >
                      <QRCode id={`${id}_qr`} value={`${id}`} size={80} />
                    </Flex>
                  </Flex>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"2"}>
                <Spacer />
                <Button
                  variant={"solid"}
                  size={"sm"}
                  rounded={"md"}
                  colorPalette={"green"}
                  onClick={() => setShareOpen(false)}
                >
                  Done
                  <Icon name={"check"} />
                </Button>
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
            <Dialog.Content>
              {/* Heading and close button */}
              <Dialog.Header
                p={"2"}
                mt={"2"}
                fontWeight={"semibold"}
                fontSize={"md"}
              >
                Clone Entity
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"sm"}
                    onClick={() => setCloneOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"2"}>
                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"sm"} color={"gray.600"}>
                    By default, the cloned Entity will be created with the same
                    name, but with "(cloned)" appended to the end. You can
                    modify the name below.
                  </Text>

                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root>
                        <Field.Label>Cloned Entity Name:</Field.Label>
                        <Input
                          size={"sm"}
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

              <Dialog.Footer p={"2"}>
                <Flex
                  direction={"row"}
                  w={"100%"}
                  gap={"2"}
                  justify={"space-between"}
                >
                  <Button
                    variant={"outline"}
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"red"}
                    onClick={() => setCloneOpen(false)}
                  >
                    Cancel
                    <Icon name={"cross"} />
                  </Button>
                  <Button
                    variant={"solid"}
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={handleCloneClick}
                    loading={createEntityLoading}
                    disabled={clonedEntityName === ""}
                  >
                    Clone
                    <Icon name={"copy"} />
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Save message modal */}
        <Dialog.Root
          open={saveMessageOpen}
          onOpenChange={(details) => setSaveMessageOpen(details.open)}
          placement={"center"}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header
                p={"2"}
                mt={"2"}
                fontWeight={"semibold"}
                fontSize={"md"}
              >
                <Icon name={"save"} />
                Saving Changes
              </Dialog.Header>
              <Dialog.Body p={"2"}>
                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"sm"} color={"gray.600"}>
                    Specify a description of the changes made to the Entity.
                  </Text>
                  <MDEditor
                    height={150}
                    minHeight={100}
                    maxHeight={400}
                    id={"saveMessageInput"}
                    style={{ width: "100%" }}
                    value={saveMessage}
                    preview={"edit"}
                    extraCommands={[]}
                    onChange={(value) => {
                      setSaveMessage(value || "");
                    }}
                  />
                </Flex>
              </Dialog.Body>
              <Dialog.Footer p={"2"}>
                <Flex
                  direction={"row"}
                  w={"100%"}
                  gap={"2"}
                  justify={"space-between"}
                >
                  <Button
                    variant={"outline"}
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"red"}
                    onClick={() => setSaveMessageOpen(false)}
                  >
                    Cancel
                    <Icon name={"cross"} />
                  </Button>
                  <Button
                    variant={"solid"}
                    size={"sm"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={handleSaveMessageDoneClick}
                  >
                    Done
                    <Icon name={"check"} />
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

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
