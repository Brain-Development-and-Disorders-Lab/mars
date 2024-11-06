// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Link,
  Heading,
  Input,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Tag,
  TagLabel,
  FormControl,
  FormLabel,
  Select,
  TagCloseButton,
  CheckboxGroup,
  Checkbox,
  Stack,
  FormErrorMessage,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  DrawerHeader,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Spacer,
  Tooltip,
  IconButton,
  useBreakpoint,
  ModalFooter,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  CardFooter,
  Divider,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Graph from "@components/Graph";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Uploader from "@components/Uploader";
import Values from "@components/Values";
import PreviewModal from "@components/PreviewModal";
import AttributeViewButton from "@components/AttributeViewButton";
import SearchSelect from "@components/SearchSelect";
import Dialog from "@components/Dialog";
import TimestampTag from "@components/TimestampTag";
import VisibilityTag from "@components/VisibilityTag";
import { createColumnHelper } from "@tanstack/react-table";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import {
  AttributeModel,
  DataTableAction,
  EntityHistory,
  EntityModel,
  IAttribute,
  IGenericItem,
  IRelationship,
  IValue,
  ProjectModel,
  RelationshipType,
} from "@types";

// Utility functions and libraries
import { requestStatic } from "src/database/functions";
import { isValidValues } from "src/util";
import _ from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";
import { nanoid } from "nanoid";
import QRCode from "react-qr-code";

// Apollo client imports
import { useQuery, gql, useMutation, useLazyQuery } from "@apollo/client";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";

// Contexts
import { useWorkspace } from "@hooks/useWorkspace";
import { useAuthentication } from "@hooks/useAuthentication";
import Relationships from "@components/Relationships";

const Entity = () => {
  const { id } = useParams();
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();
  const toast = useToast();

  // Authentication
  const { token } = useAuthentication();

  const {
    isOpen: isGraphOpen,
    onOpen: onGraphOpen,
    onClose: onGraphClose,
  } = useDisclosure();

  const {
    isOpen: isShareOpen,
    onOpen: onShareOpen,
    onClose: onShareClose,
  } = useDisclosure();

  const {
    isOpen: isAddProjectsOpen,
    onOpen: onAddProjectsOpen,
    onClose: onAddProjectsClose,
  } = useDisclosure();
  const [projectData, setProjectData] = useState([] as ProjectModel[]);
  const [selectedProjects, setSelectedProjects] = useState([] as string[]);

  const {
    isOpen: isAddRelationshipsOpen,
    onOpen: onAddRelationshipsOpen,
    onClose: onAddRelationshipsClose,
  } = useDisclosure();
  const [selectedRelationshipType, setSelectedRelationshipType] = useState(
    "general" as RelationshipType,
  );
  const [selectedRelationshipTarget, setSelectedRelationshipTarget] = useState(
    {} as IGenericItem,
  );

  // History drawer
  const {
    isOpen: isHistoryOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose,
  } = useDisclosure();

  // Archive state
  const [entityArchived, setEntityArchived] = useState(false);

  // Adding Attributes to existing Entity
  const {
    isOpen: isAddAttributesOpen,
    onOpen: onAddAttributesOpen,
    onClose: onAddAttributesClose,
  } = useDisclosure();
  const [attributes, setAttributes] = useState([] as AttributeModel[]);
  const [attributeName, setAttributeName] = useState("");
  const [attributeDescription, setAttributeDescription] = useState("");
  const [attributeValues, setAttributeValues] = useState([] as IValue<any>[]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

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
          _id
          version
          name
          created
          timestamp
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

  // Query to create a template Attribute
  const CREATE_ATTRIBUTE = gql`
    mutation CreateAttribute($attribute: AttributeCreateInput) {
      createAttribute(attribute: $attribute) {
        success
        message
      }
    }
  `;
  const [
    createAttribute,
    { loading: loadingAttributeCreate, error: errorAttributeCreate },
  ] = useMutation(CREATE_ATTRIBUTE);

  // Mutation to update Entity
  const UPDATE_ENTITY = gql`
    mutation UpdateEntity($entity: EntityUpdateInput) {
      updateEntity(entity: $entity) {
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
    }
    // Unpack Project data
    if (data?.projects) {
      setProjectData(data.projects);
    }
    // Unpack Attribute data
    if (data?.attributes) {
      setAttributes(data.attributes);
    }
  }, [data]);

  // Display any GraphQL errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Unable to retrieve Entity information",
        status: "error",
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
    const fileResponse = await requestStatic<any>(response.data.downloadFile, {
      responseType: "blob",
    });

    // Attempt to download the received data
    if (fileResponse.data) {
      FileSaver.saveAs(new Blob([fileResponse.data]), slugify(filename));
    } else {
      toast({
        title: "Error",
        status: "error",
        description: `Error creating download for file "${filename}"`,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
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
    const response = await createAttribute({
      variables: {
        attribute: attributeData,
      },
    });

    if (response.data.createAttribute.success) {
      toast({
        title: "Saved!",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setAttributes(() => [...attributes, attributeData as AttributeModel]);
    }

    if (errorAttributeCreate) {
      toast({
        title: "Error",
        description: errorAttributeCreate.message,
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
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

  // State for dialog confirming if user should archive
  const archiveDialogRef = useRef();
  const {
    isOpen: isArchiveDialogOpen,
    onOpen: onArchiveDialogOpen,
    onClose: onArchiveDialogClose,
  } = useDisclosure();

  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();
  const [exportFields, setExportFields] = useState(["owner"] as string[]);
  const [exportFormat, setExportFormat] = useState("json");

  const {
    isOpen: isUploadOpen,
    onOpen: onUploadOpen,
    onClose: onUploadClose,
  } = useDisclosure();

  const [previewAttachment, setPreviewAttachment] = useState(
    {} as IGenericItem,
  );
  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
  } = useDisclosure();

  // Toggle editing status
  const handleEditClick = async () => {
    if (editing) {
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
          },
        });

        toast({
          title: "Updated Successfully",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Entity could not be updated`,
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      }

      // Run a refetch operation
      await refetch();

      setEditing(false);
      setIsUpdating(false);
    } else {
      setEditing(true);
    }
  };

  /**
   * Handle cancelling an Edit operation
   */
  const handleCancelClick = () => {
    // Disable editing
    setEditing(false);

    // Reset all Entity states
    setEntityData(entityData);
    setEntityName(entityName);
    setEntityDescription(entityDescription);
    setEntityProjects(entityProjects);
    setEntityRelationships(entityRelationships);
    setEntityAttributes(entityAttributes);
    setEntityAttachments(entityAttachments);
    setEntityHistory(entityHistory);

    // Reload the page for maximum effect
    window.location.reload();
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
      toast({
        title: "Error while restoring Entity",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } else {
      toast({
        title: "Entity restored successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
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
      id: (info: any) => info.row.original,
      cell: (info: any) => (
        <Linky id={info.row.original} type={"projects"} size={"sm"} />
      ),
      header: "Name",
    },
    {
      id: "view",
      cell: (info: any) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            {editing ? (
              <IconButton
                icon={<Icon name={"delete"} />}
                aria-label={"Remove project"}
                colorScheme={"red"}
                onClick={() => {
                  removeProject(info.row.original);
                }}
                size={"sm"}
              />
            ) : (
              <Flex justifyContent={"right"} p={"2"} align={"center"} gap={"1"}>
                <Link
                  onClick={() => navigate(`/projects/${info.row.original}`)}
                >
                  <Text fontWeight={"semibold"}>View</Text>
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
          <Tooltip label={info.getValue()} hasArrow>
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
          <Tooltip label={info.getValue()} hasArrow>
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
          <Tooltip label={tooltipLabelValue} hasArrow>
            <Tag colorScheme={"purple"} size={"sm"}>
              {info.row.original.values.length}
            </Tag>
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
          <Tooltip label={info.getValue()} hasArrow>
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
      id: (info: any) => `type_${info.row.original.name}`,
      cell: (info: any) => {
        const fileExtension = _.upperCase(
          _.last(info.row.original.name.split(".")),
        );
        const fileColorScheme = _.isEqual(fileExtension, "PDF")
          ? "red"
          : "yellow";
        return <Tag colorScheme={fileColorScheme}>{fileExtension}</Tag>;
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
          onPreviewOpen();
        };

        return (
          <Flex w={"100%"} justify={"end"} gap={"4"}>
            <IconButton
              aria-label={"Preview attachment"}
              size={"sm"}
              key={`preview-file-${info.getValue()}`}
              colorScheme={"gray"}
              icon={<Icon name={"view"} />}
              onClick={() => handlePreview()}
            />
            {editing ? (
              <IconButton
                aria-label={"Remove attachment"}
                size={"sm"}
                key={`remove-file-${info.getValue()}`}
                colorScheme={"red"}
                icon={<Icon name={"delete"} />}
                onClick={() => removeAttachment(info.getValue())}
              />
            ) : (
              <IconButton
                aria-label={"Download attachment"}
                size={"sm"}
                key={`download-file-${info.getValue()}`}
                colorScheme={"blue"}
                icon={<Icon name={"download"} />}
                onClick={() => handleDownload()}
              />
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
        },
      });
      toast({
        title: "Restored Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });

      // Update the state (safely)
      setEntityDescription(entityVersion.description || "");
      setEntityProjects(entityVersion.projects || []);
      setEntityRelationships(entityVersion.relationships || []);
      setEntityAttributes(entityVersion.attributes || []);
      setEntityAttachments(entityVersion.attachments || []);

      // Close the sidebar
      onHistoryClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Entity could not be restored`,
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  // Handle clicking the "Share" button
  const handleShareClick = () => {
    onShareOpen();
  };

  // Handle clicking the "Export" button
  const handleExportClick = () => {
    setEntityData(entityData);
    onExportOpen();
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
      onExportClose();

      // Reset the export state
      setExportFields([]);

      toast({
        title: "Success",
        description: `Successfully generated ${format.toUpperCase()} file`,
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    if (exportError) {
      toast({
        title: "Error",
        description: "An error occurred when exporting this Entity",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
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

  // Archive the Entity when confirmed
  const handleArchiveClick = async () => {
    const response = await archiveEntity({
      variables: {
        _id: entityData._id,
        state: true,
      },
    });

    if (response.data.archiveEntity.success) {
      toast({
        title: "Archived Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setEntityArchived(true);
      onArchiveDialogClose();
    } else {
      toast({
        title: "Error",
        description: "An error occurred while archiving Entity",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    setEditing(false);
  };

  const handleEntityNodeClick = (id: string) => {
    onGraphClose();
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
      target: selectedRelationshipTarget,
      type: selectedRelationshipType,
    };

    setEntityRelationships([...entityRelationships, relationship]);

    // Reset the relationship modal state
    setSelectedRelationshipType("general");
    setSelectedRelationshipTarget({} as IGenericItem);

    onAddRelationshipsClose();
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
    onAddAttributesClose();

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
    onAddAttributesClose();

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
    onAddProjectsClose();
  };

  /**
   * Click handler for "Cancel" button when adding Entities to a Project
   */
  const onCancelAddProjectsClick = () => {
    setSelectedProjects([]);
    onAddProjectsClose();
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
            border={"2px"}
            rounded={"md"}
          >
            <Icon name={"entity"} size={"md"} />
            <Heading fontWeight={"semibold"} size={"md"}>
              {entityData.name}
            </Heading>
            {entityArchived && <Icon name={"archive"} size={"md"} />}
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"} align={"center"}>
            {editing && (
              <Button
                onClick={handleCancelClick}
                size={"sm"}
                colorScheme={"red"}
                rightIcon={<Icon name={"cross"} />}
              >
                Cancel
              </Button>
            )}
            {entityArchived ? (
              <Button
                id={"restoreEntityButton"}
                onClick={handleRestoreFromArchiveClick}
                size={"sm"}
                colorScheme={"orange"}
                rightIcon={<Icon name={"rewind"} />}
              >
                Restore
              </Button>
            ) : (
              <Flex gap={"2"}>
                <Button
                  id={"editEntityButton"}
                  onClick={handleEditClick}
                  size={"sm"}
                  colorScheme={editing ? "green" : "blue"}
                  rightIcon={
                    editing ? <Icon name={"check"} /> : <Icon name={"edit"} />
                  }
                  loadingText={"Saving..."}
                  isLoading={isUpdating}
                >
                  {editing ? "Done" : "Edit"}
                </Button>
              </Flex>
            )}

            {/* History button */}
            <Button
              size={"sm"}
              colorScheme={"green"}
              rightIcon={<Icon name={"clock"} />}
              onClick={onHistoryOpen}
            >
              History
            </Button>

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
                  icon={<Icon name={"print"} />}
                  fontSize={"sm"}
                  isDisabled
                >
                  Print
                </MenuItem>
                <MenuItem
                  icon={<Icon name={"share"} />}
                  fontSize={"sm"}
                  onClick={handleShareClick}
                >
                  Share
                </MenuItem>
                <MenuItem
                  icon={<Icon name={"graph"} />}
                  onClick={onGraphOpen}
                  fontSize={"sm"}
                  isDisabled={editing || entityArchived}
                >
                  Visualize
                </MenuItem>
                <MenuItem
                  onClick={handleExportClick}
                  icon={<Icon name={"download"} />}
                  fontSize={"sm"}
                  isDisabled={editing || entityArchived}
                >
                  Export
                </MenuItem>
                <MenuItem
                  id={"archiveEntityButton"}
                  onClick={onArchiveDialogOpen}
                  icon={<Icon name={"archive"} />}
                  fontSize={"sm"}
                  isDisabled={entityArchived}
                >
                  Archive
                </MenuItem>
              </MenuList>
            </Menu>

            {/* Archive Dialog */}
            <Dialog
              dialogRef={archiveDialogRef}
              header={"Archive Entity"}
              rightButtonAction={handleArchiveClick}
              isOpen={isArchiveDialogOpen}
              onOpen={onArchiveDialogOpen}
              onClose={onArchiveDialogClose}
            >
              <Flex gap={"2"} direction={"column"}>
                <Text fontWeight={"semibold"} fontSize={"sm"}>
                  Are you sure you want to archive this Entity?
                </Text>
                <Text fontSize={"sm"}>
                  This Entity will be moved to the Workspace archive. All
                  relationships will be preserved, however it will not be
                  visible. It can be restored at any time.
                </Text>
              </Flex>
            </Dialog>
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
              <Flex gap={"2"} direction={"row"}>
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
                    isReadOnly={!editing}
                    rounded={"md"}
                    border={"1px"}
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
              <Flex gap={"2"} direction={"row"} w={"100%"}>
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
              border={"1px"}
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
              border={"1px"}
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
                  size={"sm"}
                  rightIcon={<Icon name={"add"} />}
                  isDisabled={!editing}
                  onClick={onAddProjectsOpen}
                >
                  Add
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
              border={"1px"}
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
                  size={"sm"}
                  rightIcon={<Icon name={"add"} />}
                  isDisabled={!editing}
                  onClick={onAddAttributesOpen}
                >
                  Add
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
              border={"1px"}
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
                    size={"sm"}
                    rightIcon={<Icon name={"add"} />}
                    isDisabled={!editing}
                    onClick={onAddRelationshipsOpen}
                  >
                    Add
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
              border={"1px"}
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
                    size={"sm"}
                    rightIcon={<Icon name={"upload"} />}
                    onClick={onUploadOpen}
                  >
                    Upload
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
        <Modal
          isOpen={isAddAttributesOpen}
          onClose={onAddAttributesClose}
          size={"4xl"}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"2"} gap={"2"}>
            <ModalHeader p={"2"}>Add Attribute</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              {/* Attribute creation */}
              <Flex direction={"column"} gap={"2"} pb={"2"} justify={"center"}>
                <Select
                  size={"sm"}
                  placeholder={"Select Template"}
                  value={selectedTemplate}
                  onChange={(event) => {
                    if (!_.isEqual(event.target.value.toString(), "")) {
                      setSelectedTemplate(event.target.value);
                      for (const attribute of attributes) {
                        if (
                          _.isEqual(
                            event.target.value.toString(),
                            attribute._id,
                          )
                        ) {
                          setAttributeName(attribute.name);
                          setAttributeDescription(attribute.description);
                          setAttributeValues(() => [...attribute.values]);
                          break;
                        }
                      }
                    }
                  }}
                >
                  {!loading &&
                    attributes.map((attribute) => {
                      return (
                        <option key={attribute._id} value={attribute._id}>
                          {attribute.name}
                        </option>
                      );
                    })}
                  ;
                </Select>
                <Text fontSize="sm">
                  Don't see the Template you're looking for? You can
                  <Link
                    onClick={() => navigate("/create/attribute")}
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
                    <FormControl isRequired>
                      <FormLabel fontSize={"sm"}>Name</FormLabel>
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
                        <FormErrorMessage>
                          A name must be specified for the Attribute.
                        </FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize={"sm"}>Description</FormLabel>
                      <MDEditor
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
                        <FormErrorMessage>
                          A description should be provided for the Attribute.
                        </FormErrorMessage>
                      )}
                    </FormControl>
                  </Flex>

                  <Flex>
                    <FormControl isRequired isInvalid={isAttributeValueError}>
                      <Values
                        viewOnly={false}
                        values={attributeValues}
                        setValues={setAttributeValues}
                      />
                    </FormControl>
                  </Flex>
                </Flex>
              </Flex>

              {/* Modal buttons */}
              <Flex direction={"row"} justify={"center"} gap={"2"}>
                {/* "Cancel" button */}
                <Button
                  colorScheme={"red"}
                  size={"sm"}
                  variant={"outline"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={onAddAttributesClose}
                >
                  Cancel
                </Button>

                <Spacer />

                <Button
                  colorScheme={"blue"}
                  size={"sm"}
                  variant={"outline"}
                  rightIcon={<Icon name={"add"} />}
                  onClick={onSaveAsTemplate}
                  isDisabled={isAttributeError}
                  isLoading={loadingAttributeCreate}
                >
                  Save as Template
                </Button>

                <Button
                  colorScheme={"green"}
                  size={"sm"}
                  rightIcon={<Icon name={"check"} />}
                  isDisabled={isAttributeError}
                  onClick={() => {
                    addAttribute();
                  }}
                >
                  Done
                </Button>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Add Projects modal */}
        <Modal
          isOpen={isAddProjectsOpen}
          onClose={onAddProjectsClose}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"2"} gap={"2"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Add Entity to Projects</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              {/* Select component for Projects */}
              <Flex direction={"column"} gap={"2"}>
                <FormControl>
                  <Select
                    size={"sm"}
                    title={"Select Project"}
                    placeholder={"Select Project"}
                    onChange={(event) => {
                      const selectedProject = event.target.value.toString();
                      if (selectedProjects.includes(selectedProject)) {
                        // Check that the selected Project has not already been selected
                        toast({
                          title: "Warning",
                          description: "Project has already been selected.",
                          status: "warning",
                          duration: 2000,
                          position: "bottom-right",
                          isClosable: true,
                        });
                      } else if (!_.isEqual(selectedProject, "")) {
                        // Add the selected Project if not the default option
                        setSelectedProjects([
                          ...selectedProjects,
                          selectedProject,
                        ]);
                      }
                    }}
                  >
                    {!loading &&
                      projectData.map((project: IGenericItem) => {
                        if (
                          !_.includes(selectedProjects, project._id) &&
                          !_.includes(entityProjects, project._id)
                        ) {
                          // Only include Projects that haven't been selected or the Entity is currently present in
                          return (
                            <option key={project._id} value={project._id}>
                              {project.name}
                            </option>
                          );
                        } else {
                          return null;
                        }
                      })}
                  </Select>
                </FormControl>

                <Flex
                  direction={"row"}
                  gap={"2"}
                  p={"2"}
                  align={"center"}
                  justify={"center"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  minH={"100px"}
                >
                  {selectedProjects.length > 0 ? (
                    selectedProjects.map((project) => {
                      if (!_.isEqual(project, "")) {
                        return (
                          <Tag key={`tag-${project}`}>
                            <TagLabel>
                              <Linky
                                id={project}
                                type={"projects"}
                                size={"sm"}
                              />
                            </TagLabel>
                            <TagCloseButton
                              onClick={() => {
                                setSelectedProjects([
                                  ...selectedProjects.filter((selected) => {
                                    return !_.isEqual(project, selected);
                                  }),
                                ]);
                              }}
                            />
                          </Tag>
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
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter p={"2"}>
              {/* "Cancel" button */}
              <Flex direction={"row"} justify={"center"} w={"100%"}>
                <Button
                  colorScheme={"red"}
                  size={"sm"}
                  variant={"outline"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={onCancelAddProjectsClick}
                >
                  Cancel
                </Button>

                <Spacer />

                <Button
                  colorScheme={"green"}
                  size={"sm"}
                  rightIcon={<Icon name={"check"} />}
                  onClick={() => {
                    addProjects(selectedProjects);
                  }}
                  isDisabled={selectedProjects.length === 0}
                >
                  Add Entity to {selectedProjects.length} Project
                  {selectedProjects.length === 1 ? "" : "s"}
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Add Relationships modal */}
        <Modal
          isOpen={isAddRelationshipsOpen}
          onClose={onAddRelationshipsClose}
          size={"lg"}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"2"} gap={"0"}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>
              <Text fontWeight={"bold"} fontSize={"sm"}>
                Add Relationship
              </Text>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              <Flex direction={"column"} gap={"2"}>
                <Flex
                  direction={"row"}
                  gap={"2"}
                  justify={"space-between"}
                  p={"2"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.300"}
                >
                  <Flex direction={"column"} gap={"1"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      Source
                    </Text>
                    <Select size={"sm"} rounded={"md"} isDisabled>
                      <option>{entityName}</option>
                    </Select>
                  </Flex>
                  <Flex direction={"column"} gap={"1"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      Type
                    </Text>
                    <Select
                      size={"sm"}
                      rounded={"md"}
                      value={selectedRelationshipType}
                      onChange={(event) =>
                        setSelectedRelationshipType(
                          event.target.value as RelationshipType,
                        )
                      }
                    >
                      <option value={"general"}>General</option>
                      <option value={"parent"}>Parent</option>
                      <option value={"child"}>Child</option>
                    </Select>
                  </Flex>
                  <Flex direction={"column"} gap={"1"}>
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
                  <Tag
                    fontSize={"sm"}
                    fontWeight={"semibold"}
                    colorScheme={"yellow"}
                  >
                    {selectedRelationshipType === "general" && "related"}
                    {selectedRelationshipType === "child" && "a child"}
                    {selectedRelationshipType === "parent" && "a parent"}
                  </Tag>
                  <Text fontSize={"sm"}>
                    {selectedRelationshipType === "general" ? "to" : "of"}
                  </Text>
                  <Tag
                    fontSize={"sm"}
                    fontWeight={"semibold"}
                    colorScheme={"blue"}
                  >
                    {_.isUndefined(selectedRelationshipTarget.name)
                      ? "Select Entity"
                      : selectedRelationshipTarget.name}
                  </Tag>
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter p={"2"}>
              <Button
                colorScheme={"red"}
                size={"sm"}
                variant={"outline"}
                rightIcon={<Icon name={"cross"} />}
                onClick={onAddRelationshipsClose}
              >
                Cancel
              </Button>

              <Spacer />

              <Button
                colorScheme={"green"}
                size={"sm"}
                rightIcon={<Icon name={"check"} />}
                isDisabled={_.isUndefined(selectedRelationshipTarget._id)}
                onClick={() => addRelationship()}
              >
                Done
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Upload modal */}
        <Uploader
          isOpen={isUploadOpen}
          onOpen={onUploadOpen}
          onClose={onUploadClose}
          uploads={toUploadAttachments}
          setUploads={setToUploadAttachments}
          target={entityData._id}
        />

        {/* Export modal */}
        <Modal
          isOpen={isExportOpen}
          onClose={onExportClose}
          size={"2xl"}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"2"} w={["lg", "xl", "2xl"]} gap={"0"}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Export Entity</ModalHeader>
            <ModalCloseButton />

            <ModalBody px={"2"} gap={"2"}>
              {/* Export information */}
              <Flex
                direction={"row"}
                w={"100%"}
                gap={"2"}
                p={"2"}
                align={"center"}
                justifySelf={"left"}
                bg={"blue.200"}
                rounded={"md"}
              >
                <Icon name={"info"} color={"blue.500"} />
                {_.isEqual(exportFormat, "json") && (
                  <Text fontSize={"sm"} color={"blue.700"}>
                    JSON files can be re-imported into Metadatify.
                  </Text>
                )}
                {_.isEqual(exportFormat, "csv") && (
                  <Text fontSize={"sm"} color={"blue.700"}>
                    When exporting Origins, Products, or Projects, only the name
                    will be exported. To export identifiers, use JSON format.
                  </Text>
                )}
              </Flex>

              {/* Select export format */}
              <Flex
                w={"100%"}
                direction={"row"}
                py={"2"}
                gap={"2"}
                justify={"space-between"}
                align={"center"}
              >
                <Flex gap={"1"} align={"center"}>
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    Format:
                  </Text>
                  <FormControl>
                    <Select
                      size={"sm"}
                      rounded={"md"}
                      value={exportFormat}
                      onChange={(event) => setExportFormat(event.target.value)}
                    >
                      <option key={"json"} value={"json"}>
                        JSON
                      </option>
                      <option key={"csv"} value={"csv"}>
                        CSV
                      </option>
                    </Select>
                  </FormControl>
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
                border={"1px"}
                borderColor={"gray.300"}
              >
                <Flex direction={"row"} gap={"2"}>
                  <FormControl>
                    <FormLabel fontSize={"sm"}>Details</FormLabel>
                    {!loading ? (
                      <CheckboxGroup size={"sm"}>
                        <Stack spacing={2} direction={"column"}>
                          <Checkbox disabled defaultChecked fontSize={"sm"}>
                            Name: {entityName}
                          </Checkbox>
                          <Checkbox
                            isChecked={_.includes(exportFields, "created")}
                            onChange={(event) =>
                              handleExportCheck("created", event.target.checked)
                            }
                            fontSize={"sm"}
                          >
                            Created:{" "}
                            {dayjs(entityData.created).format("DD MMM YYYY")}
                          </Checkbox>
                          <Checkbox isChecked={true} isDisabled fontSize={"sm"}>
                            Owner: {entityData.owner}
                          </Checkbox>
                          <Checkbox
                            isChecked={_.includes(exportFields, "description")}
                            onChange={(event) =>
                              handleExportCheck(
                                "description",
                                event.target.checked,
                              )
                            }
                            isDisabled={_.isEqual(entityDescription, "")}
                          >
                            <Text noOfLines={1} fontSize={"sm"}>
                              Description:{" "}
                              {_.isEqual(entityDescription, "")
                                ? "No description"
                                : _.truncate(entityDescription, { length: 32 })}
                            </Text>
                          </Checkbox>
                        </Stack>
                      </CheckboxGroup>
                    ) : (
                      <Text fontSize={"sm"}>Loading details</Text>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize={"sm"}>Projects</FormLabel>
                    {!loading && entityProjects.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityProjects.map((project) => {
                          allExportFields.push(`project_${project}`);
                          return (
                            <Checkbox
                              size={"sm"}
                              key={project}
                              isChecked={_.includes(
                                exportFields,
                                `project_${project}`,
                              )}
                              onChange={(event) =>
                                handleExportCheck(
                                  `project_${project}`,
                                  event.target.checked,
                                )
                              }
                            >
                              <Linky
                                id={project}
                                type={"projects"}
                                size={"sm"}
                              />
                            </Checkbox>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Text fontSize={"sm"}>No Projects</Text>
                    )}
                  </FormControl>
                </Flex>

                <Divider />

                <Flex direction={"row"} gap={"2"}>
                  <FormControl>
                    <FormLabel fontSize={"sm"}>Origins</FormLabel>
                    {!loading && entityRelationships?.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityRelationships.map((relationship) => {
                          allExportFields.push(
                            `relationship_${relationship.target._id}_${relationship.type}`,
                          );
                          return (
                            <Checkbox
                              size={"sm"}
                              fontSize={"sm"}
                              key={relationship.target._id}
                              isChecked={_.includes(
                                exportFields,
                                `relationship_${relationship.target._id}_${relationship.type}`,
                              )}
                              onChange={(event) =>
                                handleExportCheck(
                                  `relationship_${relationship.target._id}_${relationship.type}`,
                                  event.target.checked,
                                )
                              }
                            >
                              <Linky
                                id={relationship.target._id}
                                type={"entities"}
                                size={"sm"}
                              />
                            </Checkbox>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Text fontSize={"sm"}>No Origins</Text>
                    )}
                  </FormControl>
                </Flex>

                <Divider />

                <Flex direction={"row"} gap={"2"}>
                  <FormControl>
                    <FormLabel fontSize={"sm"}>Attributes</FormLabel>
                    {!loading && entityAttributes.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityAttributes.map((attribute) => {
                          allExportFields.push(`attribute_${attribute._id}`);
                          return (
                            <Checkbox
                              size={"sm"}
                              fontSize={"sm"}
                              key={attribute._id}
                              isChecked={_.includes(
                                exportFields,
                                `attribute_${attribute._id}`,
                              )}
                              onChange={(event) =>
                                handleExportCheck(
                                  `attribute_${attribute._id}`,
                                  event.target.checked,
                                )
                              }
                            >
                              {attribute.name}
                            </Checkbox>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Text fontSize={"sm"}>No Attributes</Text>
                    )}
                  </FormControl>
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter p={"2"}>
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
                    rightIcon={<Icon name={"download"} />}
                    colorScheme={"blue"}
                    size={"sm"}
                    onClick={() => handleDownloadClick(exportFormat)}
                    isLoading={exportLoading}
                  >
                    Download
                  </Button>
                </Flex>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Graph modal */}
        <Modal
          size={"full"}
          onEsc={onGraphClose}
          onClose={onGraphClose}
          isOpen={isGraphOpen}
        >
          <ModalOverlay />
          <ModalContent p={"2"}>
            <ModalHeader p={"2"} gap={"2"}>
              Visualize: {entityName}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={"2"}>
              <Graph
                id={entityData._id}
                entityNavigateHook={handleEntityNodeClick}
              />
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Attachment preview modal */}
        <Modal isOpen={isPreviewOpen} onClose={onPreviewClose}>
          <ModalOverlay />
          <ModalContent minW={"3xl"}>
            <ModalHeader>Attachment Preview</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex
                w={"100%"}
                h={"100%"}
                justify={"center"}
                align={"center"}
                pb={"2"}
              >
                <PreviewModal attachment={previewAttachment} />
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Share modal */}
        <Modal isOpen={isShareOpen} onClose={onShareClose} isCentered>
          <ModalOverlay />
          <ModalContent p={"2"} gap={"0"} w={["md", "lg", "xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Share Entity</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
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
                    size={"sm"}
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        `https://app.metadatify.com/entities/${id}`,
                      );
                      toast({
                        title: "Copied to clipboard",
                        status: "success",
                        position: "bottom-right",
                        isClosable: true,
                        duration: 2000,
                      });
                    }}
                  >
                    Copy
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
                    border={"1px"}
                    borderColor={"gray.300"}
                    rounded={"md"}
                  >
                    <QRCode id={`${id}_qr`} value={`${id}`} size={80} />
                  </Flex>
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter p={"2"}>
              <Spacer />
              <Button
                colorScheme={"green"}
                size={"sm"}
                rightIcon={<Icon name={"check"} />}
                onClick={onShareClose}
              >
                Done
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Version history */}
        <Drawer
          isOpen={isHistoryOpen}
          placement={"right"}
          size={"md"}
          onClose={onHistoryClose}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader pb={"2"}>
              <Flex direction={"column"} w={"100%"} gap={"2"}>
                <Text fontSize={"sm"} fontWeight={"bold"}>
                  History
                </Text>
                <Flex direction={"row"} gap={"1"} justify={"space-between"}>
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
                      Previous Versions:
                    </Text>
                    <Text fontSize={"sm"} fontWeight={"normal"}>
                      {entityHistory.length}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </DrawerHeader>

            <DrawerBody>
              <VStack spacing={"2"}>
                {entityHistory.length > 0 ? (
                  entityHistory.map((entityVersion) => {
                    return (
                      <Card
                        w={"100%"}
                        key={`v_${entityVersion.timestamp}`}
                        variant={"simple"}
                        rounded={"md"}
                        border={"1px"}
                        borderColor={"gray.300"}
                      >
                        <CardHeader p={"0"}>
                          <Flex
                            direction={"column"}
                            w={"100%"}
                            gap={"1"}
                            p={"2"}
                          >
                            <Text
                              fontWeight={"semibold"}
                              fontSize={"sm"}
                              color={"gray.700"}
                            >
                              {entityVersion.name}
                            </Text>
                            <Flex
                              direction={"row"}
                              gap={"2"}
                              justify={"space-between"}
                            >
                              <Tag size={"sm"} colorScheme={"green"}>
                                {entityVersion.version}
                              </Tag>

                              <Text
                                fontWeight={"semibold"}
                                fontSize={"xs"}
                                color={"gray.400"}
                              >
                                {dayjs(entityVersion.timestamp).fromNow()}
                              </Text>
                            </Flex>
                          </Flex>
                        </CardHeader>
                        <CardBody px={"2"} py={"0"}>
                          <Flex direction={"column"} gap={"2"}>
                            {/* Description */}
                            <Flex w={"100%"}>
                              {_.isEqual(entityVersion.description, "") ? (
                                <Tag size={"sm"} colorScheme={"orange"}>
                                  No Description
                                </Tag>
                              ) : (
                                <Text fontSize={"sm"}>
                                  {_.truncate(entityVersion.description, {
                                    length: 56,
                                  })}
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
                                border={"1px"}
                                borderColor={"gray.300"}
                                grow={"1"}
                              >
                                <Text fontSize={"sm"} fontWeight={"semibold"}>
                                  Projects
                                </Text>
                                {entityVersion.projects.length > 0 ? (
                                  <Flex
                                    direction={"row"}
                                    gap={"2"}
                                    align={"center"}
                                  >
                                    <Tag
                                      key={`v_c_${entityVersion.timestamp}_${entityVersion.projects[0]}`}
                                      size={"sm"}
                                    >
                                      <TagLabel>
                                        <Linky
                                          type={"projects"}
                                          id={entityVersion.projects[0]}
                                          size={"sm"}
                                        />
                                      </TagLabel>
                                    </Tag>
                                    {entityVersion.projects.length > 1 && (
                                      <Text
                                        fontWeight={"semibold"}
                                        fontSize={"sm"}
                                      >
                                        and {entityVersion.projects.length - 1}{" "}
                                        others
                                      </Text>
                                    )}
                                  </Flex>
                                ) : (
                                  <Text fontSize={"sm"}>No Projects</Text>
                                )}
                              </Flex>

                              {/* Relationships */}
                              <Flex
                                direction={"column"}
                                gap={"1"}
                                p={"2"}
                                rounded={"md"}
                                border={"1px"}
                                borderColor={"gray.300"}
                                grow={"1"}
                              >
                                <Text fontWeight={"semibold"} fontSize={"sm"}>
                                  Relationships
                                </Text>
                                <Flex direction={"row"} gap={"2"}>
                                  <Flex w={"100%"}>
                                    <Tag
                                      key={`v_o_${entityVersion.timestamp}`}
                                      size={"sm"}
                                    >
                                      <TagLabel>
                                        {entityVersion?.relationships?.length}
                                      </TagLabel>
                                    </Tag>
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
                                border={"1px"}
                                borderColor={"gray.300"}
                                grow={"1"}
                              >
                                <Text fontSize={"sm"} fontWeight={"semibold"}>
                                  Attributes
                                </Text>
                                {entityVersion.attributes.length > 0 ? (
                                  <Flex
                                    direction={"row"}
                                    gap={"2"}
                                    align={"center"}
                                  >
                                    <Tooltip
                                      label={
                                        "Values: " +
                                        entityVersion.attributes[0].values
                                          .length
                                      }
                                      hasArrow
                                    >
                                      <Tag
                                        key={`v_a_${entityVersion.timestamp}_${entityVersion.attributes[0]._id}`}
                                        size={"sm"}
                                      >
                                        <TagLabel>
                                          {entityVersion.attributes[0].name}
                                        </TagLabel>
                                      </Tag>
                                    </Tooltip>
                                    {entityVersion.attributes.length > 1 && (
                                      <Text fontSize={"sm"}>
                                        and{" "}
                                        {entityVersion.attributes.length - 1}{" "}
                                        other
                                        {entityVersion.attributes.length > 2
                                          ? "s"
                                          : ""}
                                      </Text>
                                    )}
                                  </Flex>
                                ) : (
                                  <Text fontSize={"sm"}>No Attributes</Text>
                                )}
                              </Flex>

                              {/* Attachments */}
                              <Flex
                                direction={"column"}
                                gap={"1"}
                                p={"2"}
                                rounded={"md"}
                                border={"1px"}
                                borderColor={"gray.300"}
                                grow={"1"}
                              >
                                <Text fontSize={"sm"} fontWeight={"semibold"}>
                                  Attachments
                                </Text>
                                {entityVersion.attachments.length > 0 ? (
                                  <Flex
                                    direction={"row"}
                                    gap={"2"}
                                    align={"center"}
                                  >
                                    <Tooltip
                                      label={entityVersion.attachments[0].name}
                                      hasArrow
                                    >
                                      <Tag
                                        key={`v_at_${entityVersion.timestamp}_${entityVersion.attachments[0]._id}`}
                                        size={"sm"}
                                      >
                                        <TagLabel>
                                          {_.truncate(
                                            entityVersion.attachments[0].name,
                                            { length: 24 },
                                          )}
                                        </TagLabel>
                                      </Tag>
                                    </Tooltip>
                                    {entityVersion.attachments.length > 1 && (
                                      <Text fontSize={"sm"}>
                                        and{" "}
                                        {entityVersion.attachments.length - 1}{" "}
                                        other
                                        {entityVersion.attachments.length > 2
                                          ? "s"
                                          : ""}
                                      </Text>
                                    )}
                                  </Flex>
                                ) : (
                                  <Text fontSize={"sm"}>No Attachments</Text>
                                )}
                              </Flex>
                            </Flex>
                          </Flex>
                        </CardBody>
                        <CardFooter p={"0"}>
                          <Flex
                            w={"100%"}
                            justify={"right"}
                            align={"center"}
                            p={"2"}
                          >
                            <Button
                              colorScheme={"orange"}
                              size={"sm"}
                              rightIcon={<Icon name={"rewind"} />}
                              onClick={() => {
                                handleRestoreFromHistoryClick(entityVersion);
                              }}
                              isDisabled={entityArchived}
                            >
                              Restore
                            </Button>
                          </Flex>
                        </CardFooter>
                      </Card>
                    );
                  })
                ) : (
                  <Text>No previous versions.</Text>
                )}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Flex>
    </Content>
  );
};

export default Entity;
