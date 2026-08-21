// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Input,
  Text,
  useDisclosure,
  Tag,
  IconButton,
  Menu,
  Dialog,
  Fieldset,
  Field,
  Portal,
  CloseButton,
  HStack,
  createListCollection,
  ListCollection,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import ExportDialog from "@components/ExportDialog";
import HistoryDrawer from "@components/HistoryDrawer";
import RelationshipsGraph from "@components/RelationshipsGraph";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import UploadDialog from "@components/UploadDialog";
import AddAttributeDialog from "@components/AddAttributeDialog";
import SearchSelect from "@components/SearchSelect";
import AlertDialog from "@components/AlertDialog";
import AddRelationshipDialog from "@components/AddRelationshipDialog";
import Relationships from "@components/Relationships";
import EntityBreadcrumb from "@components/EntityBreadcrumb";
import EntityOverviewCard from "@components/EntityOverviewCard";
import EntityAttributesTable from "@components/EntityAttributesTable";
import EntityProjectsTable from "@components/EntityProjectsTable";
import EntityAttachmentsTable from "@components/EntityAttachmentsTable";
import Tooltip from "@components/Tooltip";
import { UnsavedChangesDialog } from "@components/UnsavedChangesDialog";
import { toaster } from "@components/Toast";
import SaveDialog from "@components/SaveDialog";

// Existing and custom types
import {
  AttributeModel,
  EntityHistory,
  EntityModel,
  IAttribute,
  IdentifierFormatModel,
  IGenericItem,
  IRelationship,
  ResponseData,
  WorkspaceModel,
} from "@types";

// Utility functions and libraries
import { requestStatic } from "@database/functions";
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
import { useWorkspace } from "@hooks/useWorkspace";
import { usePermissions } from "@hooks/usePermissions";

// Authentication
import { auth } from "@lib/auth";

// Variables
import { BASE_IDENTIFIER_FORMATS, STYLES } from "@variables";

// Events
import { usePostHog } from "posthog-js/react";

const Entity = () => {
  const { id } = useParams();
  const posthog = usePostHog();

  // Permissions
  const { workspacePermissions } = usePermissions();

  // Navigation and routing
  const navigate = useNavigate();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => editing && currentLocation.pathname !== nextLocation.pathname,
  );
  const { onClose: onBlockerClose } = useDisclosure();
  const cancelBlockerRef = useRef(null);

  // Workspace information
  const { workspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceIsPublic, setWorkspaceIsPublic] = useState(false);

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

  // Secondary identifier
  const [showSecondaryIdentifier, setShowSecondaryIdentifier] = useState(false);
  const [identifierFormats, setIdentifierFormats] = useState<ListCollection>(
    createListCollection({
      items: BASE_IDENTIFIER_FORMATS,
    }),
  );
  const [customIdentifierFormats, setCustomIdentifierFormats] = useState<IdentifierFormatModel[]>([]);
  const [identifierFormat, setIdentifierFormat] = useState<string[]>([]);
  const [secondaryIdentifier, setSecondaryIdentifier] = useState("");

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
    query GetEntityData($_id: String, $workspace: String) {
      entity(_id: $_id) {
        _id
        name
        owner
        created
        archived
        description
        projects
        secondaryIdentifier {
          value
          format
        }
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
          secondaryIdentifier {
            value
            format
          }
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
      workspace(_id: $workspace) {
        _id
        name
        isPublic
      }
      identifierFormats {
        _id
        name
        fixedLength
        alphanumericOnly
        lettersOnly
        numbersOnly
        allowSpecialCharacters
        uppercaseRequired
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery<{
    entity: EntityModel;
    projects: IGenericItem[];
    templates: AttributeModel[];
    workspace: WorkspaceModel;
    identifierFormats: IdentifierFormatModel[];
  }>(GET_ENTITY, {
    variables: {
      _id: id,
      workspace: workspace,
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
        setShowSecondaryIdentifier(!!data.entity.secondaryIdentifier?.value);
        setSecondaryIdentifier(data.entity.secondaryIdentifier?.value || "");
        setIdentifierFormat(data.entity.secondaryIdentifier?.format ? [data.entity.secondaryIdentifier.format] : []);
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

    // Store Workspace information
    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
      setWorkspaceIsPublic(data.workspace.isPublic);
    }

    // Store Identifier Format information
    if (data?.identifierFormats) {
      setCustomIdentifierFormats(data.identifierFormats);
      const customFormats = data.identifierFormats.map((format) => {
        return {
          label: format.name,
          value: format._id,
          category: "Custom",
        };
      });
      const updatedIdentifierFormats = createListCollection({
        items: [...BASE_IDENTIFIER_FORMATS, ...customFormats],
      });
      setIdentifierFormats(updatedIdentifierFormats);
    }
  }, [data, editing]);

  useEffect(() => {
    posthog.capture("client.entity.viewed");
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

  const displayShowSecondaryIdentifier = useMemo(() => {
    return previewVersion ? !!previewVersion.secondaryIdentifier?.value : showSecondaryIdentifier;
  }, [previewVersion, showSecondaryIdentifier]);

  const displaySecondaryIdentifierValue = useMemo(() => {
    return previewVersion ? previewVersion.secondaryIdentifier?.value || "" : secondaryIdentifier;
  }, [previewVersion, secondaryIdentifier]);

  const displaySecondaryIdentifierFormat = useMemo(() => {
    if (!previewVersion) return identifierFormat;
    const format = previewVersion.secondaryIdentifier?.format;
    return format ? [format] : [];
  }, [previewVersion, identifierFormat]);

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
        secondaryIdentifier: {
          value: showSecondaryIdentifier ? secondaryIdentifier : "",
          format: showSecondaryIdentifier ? identifierFormat[0] || "" : "",
        },
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
    setShowSecondaryIdentifier(!!entity.secondaryIdentifier?.value);
    setSecondaryIdentifier(entity.secondaryIdentifier?.value || "");
    setIdentifierFormat(entity.secondaryIdentifier?.format ? [entity.secondaryIdentifier.format] : []);
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
        secondaryIdentifier: entityVersion.secondaryIdentifier || { value: "", format: "" },
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
      setShowSecondaryIdentifier(!!entityVersion.secondaryIdentifier?.value);
      setSecondaryIdentifier(entityVersion.secondaryIdentifier?.value || "");
      setIdentifierFormat(entityVersion.secondaryIdentifier?.format ? [entityVersion.secondaryIdentifier.format] : []);

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

  /**
   * Preview an Entity as it was at an earlier point in time
   */
  const handlePreviewVersion = (entityVersion: EntityHistory) => {
    setPreviewVersion(entityVersion);
    setHistoryOpen(false);
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
          secondaryIdentifier: entity.secondaryIdentifier || { value: "", format: "" },
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
      posthog.capture("client.entity.cloned");
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
      posthog.capture("client.entity.archived");
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
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Tooltip
                content={"Insufficient permissions in this Workspace"}
                disabled={workspacePermissions.entities.archive}
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
                  disabled={entityArchived || !workspacePermissions.entities.archive}
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
          <EntityBreadcrumb
            loading={loading}
            workspaceName={workspaceName}
            onNavigateHome={() => navigate("/")}
            onNavigateEntities={() => navigate("/entities")}
            archived={displayEntityArchived}
            name={displayEntityName}
          />

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"} align={"center"}>
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
              <Tooltip
                content={"Insufficient permissions in this Workspace"}
                disabled={workspacePermissions.entities.archive}
                showArrow
              >
                <Button
                  id={"restoreEntityButton"}
                  variant={"solid"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"orange"}
                  onClick={handleRestoreFromArchiveClick}
                  disabled={!workspacePermissions.entities.archive}
                >
                  Restore
                  <Icon name={"rewind"} size={"xs"} />
                </Button>
              </Tooltip>
            ) : (
              <Tooltip
                content={"Insufficient permissions in this Workspace"}
                disabled={workspacePermissions.entities.edit}
                showArrow
              >
                <Button
                  id={"editEntityButton"}
                  variant={"solid"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={editing ? "green" : "blue"}
                  onClick={handleEditClick}
                  loading={isUpdating}
                  disabled={!!previewVersion || !workspacePermissions.entities.edit}
                >
                  {editing ? "Save" : "Edit"}
                  <Icon name={editing ? "save" : "edit"} size={"xs"} />
                </Button>
              </Tooltip>
            )}

            {/* Actions Menu */}
            <Menu.Root size={"sm"}>
              <Menu.Trigger asChild>
                <Button variant={"solid"} size={"xs"} rounded={"md"} colorPalette={"action"}>
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
                    <Tooltip
                      content={"Insufficient permissions in this Workspace"}
                      disabled={workspacePermissions.entities.create}
                      showArrow
                    >
                      <Menu.Item
                        value={"clone"}
                        onClick={() => setCloneOpen(true)}
                        fontSize={"xs"}
                        disabled={entityArchived || !!previewVersion || !workspacePermissions.entities.create}
                      >
                        <Icon name={"copy"} size={"xs"} />
                        Clone
                      </Menu.Item>
                    </Tooltip>
                    <Menu.Item
                      value={"export"}
                      onClick={handleExportClick}
                      fontSize={"xs"}
                      disabled={editing || entityArchived || !!previewVersion}
                    >
                      <Icon name={"download"} size={"xs"} />
                      Export
                    </Menu.Item>
                    <Tooltip
                      content={"Insufficient permissions in this Workspace"}
                      disabled={workspacePermissions.entities.archive}
                      showArrow
                    >
                      <Menu.Item
                        id={"archiveEntityButton"}
                        value={"archive"}
                        onClick={() => setArchiveDialogOpen(true)}
                        fontSize={"xs"}
                        disabled={entityArchived || !workspacePermissions.entities.archive}
                      >
                        <Icon name={"archive"} size={"xs"} />
                        Archive
                      </Menu.Item>
                    </Tooltip>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>

            {/* Version history */}
            <HistoryDrawer
              type={"entity"}
              open={historyOpen}
              onOpenChange={setHistoryOpen}
              history={entityHistory}
              archived={entityArchived}
              previewActive={!!previewVersion}
              canRestore={workspacePermissions.entities.archive}
              onPreview={handlePreviewVersion}
              onRestore={handleRestoreFromHistoryClick}
            />

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
          <EntityOverviewCard
            name={previewVersion ? displayEntityName : entityName}
            onNameChange={setEntityName}
            nameReadOnly={!editing || !!previewVersion}
            showSecondaryIdentifier={displayShowSecondaryIdentifier}
            onShowSecondaryIdentifierChange={setShowSecondaryIdentifier}
            showSecondaryIdentifierDisabled={!editing || !!previewVersion}
            secondaryIdentifierValue={displaySecondaryIdentifierValue}
            onSecondaryIdentifierChange={setSecondaryIdentifier}
            secondaryIdentifierReadOnly={!editing || !!previewVersion}
            secondaryIdentifierDisabled={!previewVersion && identifierFormat.length === 0}
            identifierFormat={displaySecondaryIdentifierFormat}
            onIdentifierFormatChange={setIdentifierFormat}
            identifierFormats={identifierFormats}
            identifierFormatDisabled={!editing || !!previewVersion}
            customIdentifierFormats={customIdentifierFormats}
            showValidationErrors={!previewVersion}
            owner={entity.owner}
            created={entity.created}
            visibilityIsPublic={workspaceIsPublic}
            description={previewVersion ? displayEntityDescription : entityDescription}
            onDescriptionChange={setEntityDescription}
            descriptionReadOnly={!(editing && !previewVersion)}
          />

          {/* Attributes and Projects */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            <EntityAttributesTable
              attributes={displayEntityAttributes}
              editing={editing && !previewVersion}
              entityName={entityName}
              templates={templates}
              onUpdate={onAttributeUpdate}
              onRemove={removeAttribute}
              onAddClick={() => setAddAttributesOpen(true)}
            />

            <EntityProjectsTable
              projects={displayEntityProjects}
              editing={editing && !previewVersion}
              onView={(projectId) => navigate(`/projects/${projectId}`)}
              onRemove={removeProject}
              onRemoveMany={removeProjects}
              onAddClick={() => setAddProjectsOpen(true)}
            />
          </Flex>

          {/* Relationships and Attachments */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Relationships */}
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
              <Flex gap={"2"} direction={"column"}>
                <Flex direction={"row"} justify={"space-between"} align={"center"}>
                  <Flex direction={"row"} gap={"0.5"} align={"center"}>
                    <Icon name={"graph"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                      Relationships ({entityRelationships.length})
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

            <EntityAttachmentsTable
              attachments={displayEntityAttachments}
              editing={editing && !previewVersion}
              onDownload={getDownload}
              onRemove={removeAttachment}
              onRemoveMany={removeAttachments}
              onUploadClick={() => setUploadOpen(true)}
            />
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
                <Dialog.Header p={"2"} bg={"project.light"} color={"project.dark"} roundedTop={"md"}>
                  <Flex direction={"row"} gap={"0.5"} align={"center"} ml={"0.5"}>
                    <Icon name={"project"} size={"xs"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Add Entity to Projects
                    </Text>
                  </Flex>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton size={"2xs"} top={"6px"} onClick={onCancelAddProjectsClick} colorPalette={"project"} />
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
                      justify={selectedProjects.length > 0 ? "start" : "center"}
                      rounded={"md"}
                      border={STYLES.border.style}
                      borderColor={STYLES.border.color}
                      minH={"60px"}
                      wrap={"wrap"}
                    >
                      {selectedProjects.length > 0 ? (
                        selectedProjects.map((project) => (
                          <Tag.Root
                            key={entity._id}
                            rounded={"xl"}
                            border={STYLES.border.style}
                            borderColor={STYLES.border.color}
                            bg={"white"}
                            p={"1"}
                          >
                            <Tag.Label fontSize={"xs"} bg={"white"} border={"0px 1px 0px 1px solid"}>
                              <Flex h={"100%"} justify={"left"}>
                                <Linky id={project._id} type={"projects"} />
                              </Flex>
                            </Tag.Label>
                            <Tag.EndElement mr={"0"}>
                              <Tooltip content={"Remove"} showArrow>
                                <Tag.CloseTrigger
                                  cursor={"pointer"}
                                  onClick={() =>
                                    setSelectedProjects((prev) => prev.filter((e) => e._id !== project._id))
                                  }
                                />
                              </Tooltip>
                            </Tag.EndElement>
                          </Tag.Root>
                        ))
                      ) : (
                        <Flex direction={"column"} gap={"3"} align={"center"} justify={"center"} p={"4"}>
                          <Icon name={"project"} size={"md"} color={STYLES.project.color.light} />
                          <Text fontSize={"xs"} fontWeight={"semibold"} color={"text.faint"}>
                            No Projects selected
                          </Text>
                        </Flex>
                      )}
                    </HStack>
                  </Flex>
                </Dialog.Body>

                <Dialog.Footer p={"2"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
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
              <Dialog.Header p={"2"} bg={STYLES.dialog.header.bg} roundedTop={"md"}>
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
              <Dialog.Header p={"2"} bg={STYLES.dialog.header.bg} roundedTop={"md"}>
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
                    <Flex p={"1"} border={STYLES.border.style} borderColor={STYLES.border.color} rounded={"md"}>
                      <QRCode id={`${id}_qr`} value={`${id}`} size={80} />
                    </Flex>
                  </Flex>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"2"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
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
              <Dialog.Header p={"2"} bg={STYLES.dialog.header.bg} roundedTop={"md"}>
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
                  <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
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

              <Dialog.Footer p={"2"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
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
          isPublic={workspaceIsPublic}
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
