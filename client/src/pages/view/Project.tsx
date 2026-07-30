// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  CloseButton,
  Dialog,
  Drawer,
  EmptyState,
  Field,
  Flex,
  Heading,
  Input,
  Menu,
  Select,
  Spacer,
  Tag,
  Text,
  createListCollection,
  useDisclosure,
  Timeline,
  Collapsible,
  Textarea,
  Breadcrumb,
  SkeletonText,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import ExportDialog from "@components/ExportDialog";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import AlertDialog from "@components/AlertDialog";
import DataTable from "@components/DataTable";
import MultiEntitySelect from "@components/MultiEntitySelect";
import TimestampTag from "@components/TimestampTag";
import VisibilityTag from "@components/VisibilityTag";
import Tooltip from "@components/Tooltip";
import { UnsavedChangesDialog } from "@components/UnsavedChangesDialog";
import { toaster } from "@components/Toast";
import SaveDialog from "@components/SaveDialog";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import {
  ProjectHistory,
  ProjectModel,
  DataTableAction,
  IGenericItem,
  ResponseData,
  EntityModel,
  AttributeModel,
} from "@types";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";

// Routing and navigation
import { useParams, useNavigate, useBlocker } from "react-router-dom";

// Hooks
import { usePermissions } from "@hooks/usePermissions";
import { useWorkspace } from "@hooks/useWorkspace";

// Utility functions and libraries
import { removeTypename } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";

// Variables
import { GLOBAL_STYLES } from "@variables";

// Row shape for the Entities table; description and attributes are undefined until fetched
type EntityTableRow = {
  _id: string;
  description?: string;
  attributes?: AttributeModel[];
};

const Project = () => {
  const { id } = useParams();
  const client = useApolloClient();

  // Permissions
  const { workspacePermissions } = usePermissions();

  // Workspace information
  const { workspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");

  // Navigation and routing
  const navigate = useNavigate();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => editing && currentLocation.pathname !== nextLocation.pathname,
  );
  const { onClose: onBlockerClose } = useDisclosure();
  const cancelBlockerRef = useRef(null);

  // Add Entities
  const [entitiesOpen, setEntitiesOpen] = useState(false);

  // State for dialog confirming if user should archive Project
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  // History drawer
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [historySortOrder, setHistorySortOrder] = useState<"newest-first" | "oldest-first">("newest-first");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [appliedStartDate, setAppliedStartDate] = useState<string>("");
  const [appliedEndDate, setAppliedEndDate] = useState<string>("");
  const [dateFilterApplied, setDateFilterApplied] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<ProjectHistory | null>(null);

  // Page state
  const [editing, setEditing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Project state
  const [project, setProject] = useState({} as ProjectModel);
  const [projectName, setProjectName] = useState("");
  const [projectArchived, setProjectArchived] = useState(false);
  const [projectEntities, setProjectEntities] = useState([] as string[]);
  const [projectEntitiesData, setProjectEntitiesData] = useState<EntityModel[]>([]);
  const [projectDescription, setProjectDescription] = useState("");
  const [projectHistory, setProjectHistory] = useState([] as ProjectHistory[]);

  // Sorted and filtered history based on sort order and date range
  const sortedProjectHistory = useMemo(() => {
    let filtered = [...projectHistory];

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
  }, [projectHistory, historySortOrder, dateFilterApplied, appliedStartDate, appliedEndDate]);

  // Computed values that use preview data when in preview mode
  const displayProjectName = useMemo(() => {
    return previewVersion ? previewVersion.name : projectName;
  }, [previewVersion, projectName]);

  const displayProjectDescription = useMemo(() => {
    return previewVersion ? previewVersion.description || "" : projectDescription;
  }, [previewVersion, projectDescription]);

  const displayProjectEntities = useMemo(() => {
    return previewVersion ? previewVersion.entities : projectEntities;
  }, [previewVersion, projectEntities]);

  const displayProjectArchived = useMemo(() => {
    return previewVersion ? previewVersion.archived : projectArchived;
  }, [previewVersion, projectArchived]);

  const displayProjectData = useMemo(() => {
    if (previewVersion) {
      return {
        ...project,
        name: previewVersion.name,
        description: previewVersion.description || "",
        entities: previewVersion.entities,
        archived: previewVersion.archived,
      };
    }
    return project;
  }, [previewVersion, project]);

  // Merge fetched Entity data into the displayed rows, keyed by identifier
  const entitiesTableData = useMemo(() => {
    const entitiesById = new Map(projectEntitiesData.map((entity) => [entity._id, entity]));
    return displayProjectEntities.map((_id) => ({
      _id,
      description: entitiesById.get(_id)?.description,
      attributes: entitiesById.get(_id)?.attributes,
    }));
  }, [displayProjectEntities, projectEntitiesData]);

  // Save message dialog
  const [saveMessageOpen, setSaveMessageOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Entities staged for adding
  const [selectedEntities, setSelectedEntities] = useState<IGenericItem[]>([]);

  // Export dialog state
  const [exportOpen, setExportOpen] = useState(false);
  const [exportEntitiesOpen, setExportEntitiesOpen] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      // Update the state of editable data fields
      setProjectEntities(project.entities);
    }
  }, [isLoaded]);

  // Execute GraphQL query both on page load and navigation
  const GET_PROJECT_WITH_ENTITIES = gql`
    query GetProjectWithEntities($_id: String, $workspace: String) {
      project(_id: $_id) {
        _id
        name
        archived
        created
        description
        owner
        entities
        history {
          message
          author
          name
          timestamp
          version
          created
          description
          entities
        }
      }
      projectEntities(_id: $_id) {
        _id
        name
        description
        attributes {
          _id
          name
        }
      }
      workspace(_id: $workspace) {
        _id
        name
      }
    }
  `;
  const { loading, error, data } = useQuery<{
    project: ProjectModel;
    projectEntities: EntityModel[];
    workspace: IGenericItem;
  }>(GET_PROJECT_WITH_ENTITIES, {
    variables: {
      _id: id,
      workspace: workspace,
    },
    fetchPolicy: "no-cache",
  });

  // Query for an Entity's table data, used to populate a row as soon as it's added
  const GET_ENTITY_TABLE_DATA = gql`
    query GetEntityTableData($_id: String) {
      entity(_id: $_id) {
        _id
        description
        attributes {
          _id
        }
      }
    }
  `;

  // Mutation to update Project
  const UPDATE_PROJECT = gql`
    mutation UpdateProject($project: ProjectUpdateInput, $message: String) {
      updateProject(project: $project, message: $message) {
        success
        message
      }
    }
  `;
  const [updateProject, { loading: updateLoading, error: updateError }] = useMutation<{
    updateProject: ResponseData<string>;
  }>(UPDATE_PROJECT, {
    refetchQueries: ["GetProjectWithEntities"],
    awaitRefetchQueries: true,
  });

  // Mutation to archive Project
  const ARCHIVE_PROJECT = gql`
    mutation ArchiveProject($_id: String, $state: Boolean) {
      archiveProject(_id: $_id, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveProject, { loading: archiveLoading }] = useMutation<{
    archiveProject: ResponseData<string>;
  }>(ARCHIVE_PROJECT, {
    refetchQueries: ["GetProjectWithEntities"],
    awaitRefetchQueries: true,
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.project) {
      setProject(data.project);

      if (!editing) {
        setProjectName(data.project.name);
        setProjectArchived(data.project.archived);
        setProjectDescription(data.project.description);
        setProjectEntities(data.project.entities);
      }

      setProjectHistory(data.project.history || []);
    }

    if (data?.projectEntities) {
      setProjectEntitiesData(data.projectEntities);
    }

    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }
  }, [data, editing]);

  // Display error messages from GraphQL usage
  useEffect(() => {
    if ((!loading && _.isUndefined(data)) || error) {
      // Raised GraphQL error
      toaster.create({
        title: "Error",
        description: "Unable to retrieve Project information",
        type: "error",
        duration: 4000,
        closable: true,
      });
    }
  }, [loading, error]);

  const addEntities = async (): Promise<void> => {
    const addedEntityIds = selectedEntities.map((e) => e._id);
    setProjectEntities([...projectEntities, ...addedEntityIds]);
    setSelectedEntities([]);
    setEntitiesOpen(false);

    // Fetch table data for the newly added Entities so their rows aren't stuck loading
    const results = await Promise.all(
      addedEntityIds.map((_id) =>
        client.query<{ entity: EntityModel }>({ query: GET_ENTITY_TABLE_DATA, variables: { _id } }),
      ),
    );
    const fetchedEntities = results
      .map((result) => result.data?.entity)
      .filter((entity): entity is EntityModel => !_.isUndefined(entity));
    setProjectEntitiesData((existing) => [...existing, ...fetchedEntities]);
  };

  /**
   * Handle the edit button being clicked
   */
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
    setIsUpdating(true);

    // Collate update data
    const updateData: ProjectModel = {
      _id: project._id,
      name: projectName,
      timestamp: project.timestamp,
      archived: projectArchived,
      description: projectDescription,
      owner: project.owner,
      created: project.created,
      entities: projectEntities,
      history: projectHistory,
    };

    try {
      await updateProject({
        variables: {
          project: removeTypename({
            _id: updateData._id,
            name: updateData.name,
            timestamp: updateData.timestamp,
            archived: updateData.archived,
            created: updateData.created,
            owner: updateData.owner,
            description: updateData.description,
            entities: updateData.entities,
          }),
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
      if (updateError) {
        toaster.create({
          title: "Error",
          description: updateError.message,
          type: "error",
          duration: 2000,
          closable: true,
        });
      }
    }

    setEditing(false);
    setIsUpdating(false);

    // Close the save message dialog
    setSaveMessageOpen(false);
  };

  // Archive the Project when confirmed
  const handleArchiveClick = async () => {
    const response = await archiveProject({
      variables: {
        _id: project._id,
        state: true,
      },
    });

    if (!response.data?.archiveProject || !response.data.archiveProject.success) {
      toaster.create({
        title: "Error",
        description: "An error occurred when archiving Project",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (response.data.archiveProject.success) {
      toaster.create({
        title: "Archived Successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setProjectArchived(true);
      setArchiveDialogOpen(false);
    }

    setEditing(false);
  };

  // Restore the Project
  const handleRestoreClick = async () => {
    const response = await archiveProject({
      variables: {
        _id: project._id,
        state: false,
      },
    });

    if (!response.data?.archiveProject || !response.data.archiveProject.success) {
      toaster.create({
        title: "Error",
        description: "An error occurred when restoring Project",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (response.data.archiveProject.success) {
      toaster.create({
        title: "Restored Successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setProjectArchived(false);
    }

    setEditing(false);
  };

  const handleCancelClick = () => {
    // Disable editing
    setEditing(false);

    // Reset Project state values
    setProject(project);
    setProjectDescription(project.description);
    setProjectEntities(project.entities);
    setProjectHistory(project.history);
  };

  /**
   * Restore a Project from an earlier point in time
   * @param {ProjectHistory} projectVersion historical Project data to restore
   */
  const handleRestoreFromHistoryClick = async (projectVersion: ProjectHistory) => {
    // Reconstruct a `ProjectModel` instance from the prior version
    const updateData: ProjectModel = {
      _id: project._id,
      name: projectVersion.name,
      timestamp: project.timestamp,
      archived: project.archived,
      created: project.created,
      owner: project.owner,
      description: projectVersion.description,
      entities: projectVersion.entities,
      history: project.history,
    };
    setIsLoaded(false);

    try {
      await updateProject({
        variables: {
          project: removeTypename({
            _id: updateData._id,
            name: updateData.name,
            timestamp: updateData.timestamp,
            archived: updateData.archived,
            created: updateData.created,
            owner: updateData.owner,
            description: updateData.description,
            entities: updateData.entities,
          }),
          message: `Restored Project version ${projectVersion.version}`,
        },
      });
      toaster.create({
        title: "Success",
        description: `Restored Project version ${projectVersion.version}`,
        type: "success",
        duration: 2000,
        closable: true,
      });
    } catch {
      toaster.create({
        title: "Error",
        description: "Project could not be restored",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }

    // Close the drawer
    setHistoryOpen(false);

    // Apply updated state
    setProject(updateData);
    setProjectDescription(updateData.description);
    setProjectEntities(updateData.entities);
    setProjectHistory(updateData?.history || []);

    setIsLoaded(true);
  };

  // Handle clicking the "Export Project" button
  const handleExportClick = () => {
    setExportOpen(true);
  };

  // Handle clicking the "Export Entities" button
  const handleExportEntitiesClick = () => {
    setExportEntitiesOpen(true);
  };

  /**
   * Remove an Entity from the Project
   * @param _id Identifier of Entity to remove
   */
  const handleRemoveEntity = (_id: string) => {
    // Filter out the removed Entity
    const updatedEntities = projectEntities.filter((entity) => {
      return !_.isEqual(entity, _id);
    });
    setProjectEntities(updatedEntities);
  };

  /**
   * Remove multiple Entities from a Project
   * @param entities Identifiers of Entities to remove
   */
  const handleRemoveEntities = (entities: string[]) => {
    // Filter out the removed Entities
    const updatedEntities = projectEntities.filter((entity) => {
      return !_.includes(entities, entity);
    });
    setProjectEntities(updatedEntities);
  };

  // Define the columns for Entities listing
  const columnHelper = createColumnHelper<EntityTableRow>();
  const entitiesColumns = [
    columnHelper.accessor("_id", {
      cell: (info) => {
        const entityId = info.getValue();
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Linky id={entityId} type={"entities"} />
            {editing ? (
              <Button
                size="2xs"
                mx={"1"}
                variant="subtle"
                colorPalette="red"
                aria-label={"Remove Entity"}
                onClick={() => {
                  handleRemoveEntity(entityId);
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
                aria-label={"View Entity"}
                onClick={() => navigate(`/entities/${entityId}`)}
              >
                View
                <Icon name={"a_right"} size={"xs"} />
              </Button>
            )}
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 360,
      },
    }),
    columnHelper.accessor("description", {
      cell: (info) => {
        const description = info.getValue();
        if (_.isUndefined(description)) {
          return <SkeletonText noOfLines={1} />;
        }
        if (_.isEqual(description, "")) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>No Description</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Flex>
            <Tooltip content={description} disabled={description.length < 64} showArrow>
              <Text fontSize={"xs"}>{_.truncate(description, { length: 64 })}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 400,
      },
    }),
    columnHelper.accessor("attributes", {
      cell: (info) => {
        const attributes = info.getValue();
        if (_.isUndefined(attributes)) {
          return <SkeletonText noOfLines={1} />;
        } else {
          // 0 Attributes
          if (attributes.length === 0) {
            return (
              <Tag.Root colorPalette={"orange"}>
                <Tag.Label fontSize={"xs"}>No Attributes</Tag.Label>
              </Tag.Root>
            );
          }

          // Multiple Attributes
          if (attributes.length > 2) {
            return (
              <Flex direction={"row"} gap={"1"} align={"center"}>
                {attributes.slice(0, 2).map((attribute) => (
                  <Tag.Root colorPalette={"teal"}>
                    <Tag.StartElement>
                      <Icon name={"attribute"} color={GLOBAL_STYLES.template.color.icon} size={"xs"} />
                    </Tag.StartElement>
                    <Tag.Label fontSize={"xs"}>{attribute.name}</Tag.Label>
                  </Tag.Root>
                ))}
                <Text fontSize={"xs"}>
                  and {attributes.length - 2} other{attributes.length - 2 !== 1 ? "s" : ""}
                </Text>
              </Flex>
            );
          } else {
            return (
              <Flex direction={"row"} gap={"1"} align={"center"}>
                {attributes.map((attribute) => (
                  <Tag.Root colorPalette={"teal"}>
                    <Tag.StartElement>
                      <Icon name={"attribute"} color={GLOBAL_STYLES.template.color.icon} size={"xs"} />
                    </Tag.StartElement>
                    <Tag.Label fontSize={"xs"}>{attribute.name}</Tag.Label>
                  </Tag.Root>
                ))}
              </Flex>
            );
          }
        }
      },
      header: "Attributes",
      meta: {
        minWidth: 120,
      },
    }),
  ];
  const entitiesTableActions: DataTableAction[] = [
    {
      label: "Remove Entities",
      icon: "delete",
      action(table, rows) {
        const entitiesToRemove: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          entitiesToRemove.push(table.getRow(rowIndex).original._id);
        }
        handleRemoveEntities(entitiesToRemove);
      },
    },
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading && !archiveLoading && !updateLoading}>
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
              <Text fontSize={"xs"} color={GLOBAL_STYLES.font.secondaryHeader.color} ml={"0.5"}>
                {dayjs(previewVersion.timestamp).format("MMM D, YYYY h:mm A")}
              </Text>
            </Flex>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Tooltip
                content={"Insufficient permissions in this Workspace"}
                disabled={workspacePermissions.projects.archive}
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
                  disabled={displayProjectArchived || !workspacePermissions.projects.archive}
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
                    workspaceName
                  )}
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
                <Breadcrumb.Item
                  gap={"1"}
                  onClick={() => navigate("/projects")}
                  _hover={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  <Icon size={"xs"} name={"project"} color={GLOBAL_STYLES.project.color.icon} />
                  Projects
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
              </Breadcrumb.List>
            </Breadcrumb.Root>

            <Flex direction={"row"} gap={"2"} align={"center"} p={"0"} m={"0"}>
              <Flex
                id={"projectNameTag"}
                align={"center"}
                gap={"1"}
                p={"1"}
                border={"2px solid"}
                borderColor={displayProjectArchived ? "gray.500" : GLOBAL_STYLES.project.color.icon}
                bg={displayProjectArchived ? GLOBAL_STYLES.card.bg : "blue.50"}
                rounded={"md"}
              >
                <Icon
                  name={"project"}
                  size={"sm"}
                  color={displayProjectArchived ? "gray.500" : GLOBAL_STYLES.project.color.icon}
                />
                <Tooltip content={`${displayProjectArchived ? "Archived: " : ""}${displayProjectData.name}`} showArrow>
                  <Heading fontWeight={"semibold"} size={"sm"}>
                    {_.truncate(displayProjectData.name, { length: 30 })}
                  </Heading>
                </Tooltip>
                {displayProjectArchived && <Icon name={"archive"} size={"sm"} color={"gray.500"} />}
              </Flex>
            </Flex>
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
            {displayProjectArchived ? (
              <Tooltip
                content={"Insufficient permissions in this Workspace"}
                disabled={workspacePermissions.projects.archive}
                showArrow
              >
                <Button
                  onClick={handleRestoreClick}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"orange"}
                  disabled={!workspacePermissions.projects.archive}
                >
                  Restore
                  <Icon name={"rewind"} size={"xs"} />
                </Button>
              </Tooltip>
            ) : (
              <Flex gap={"1"}>
                {editing && (
                  <Button onClick={handleCancelClick} size={"xs"} rounded={"md"} colorPalette={"red"}>
                    Cancel
                    <Icon name={"cross"} size={"xs"} />
                  </Button>
                )}
                <Tooltip
                  content={"Insufficient permissions in this Workspace"}
                  disabled={workspacePermissions.projects.edit}
                  showArrow
                >
                  <Button
                    id={"editProjectButton"}
                    colorPalette={editing ? "green" : "blue"}
                    size={"xs"}
                    rounded={"md"}
                    onClick={handleEditClick}
                    loadingText={"Saving..."}
                    loading={isUpdating}
                    disabled={!!previewVersion || !workspacePermissions.projects.edit}
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
                <Button colorPalette={"yellow"} size={"xs"} rounded={"md"}>
                  Actions
                  <Icon name={"lightning"} size={"xs"} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    value={"export-project"}
                    onClick={handleExportClick}
                    fontSize={"xs"}
                    disabled={projectArchived || !!previewVersion}
                  >
                    <Icon name={"download"} size={"xs"} />
                    Export Project
                  </Menu.Item>
                  <Tooltip
                    content={"This Project does not contain any Entities."}
                    disabled={displayProjectEntities?.length > 0 || displayProjectArchived}
                    showArrow
                  >
                    <Menu.Item
                      value={"export-entities"}
                      onClick={handleExportEntitiesClick}
                      fontSize={"xs"}
                      disabled={displayProjectEntities?.length === 0 || displayProjectArchived || !!previewVersion}
                    >
                      <Icon name={"download"} size={"xs"} />
                      Export Entities
                    </Menu.Item>
                  </Tooltip>
                  <Tooltip
                    content={"Insufficient permissions in this Workspace"}
                    disabled={workspacePermissions.projects.create}
                    showArrow
                  >
                    <Menu.Item
                      value={"archive"}
                      onClick={() => setArchiveDialogOpen(true)}
                      fontSize={"xs"}
                      disabled={projectArchived || !!previewVersion || !workspacePermissions.projects.archive}
                    >
                      <Icon name={"archive"} size={"xs"} />
                      Archive
                    </Menu.Item>
                  </Tooltip>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>

            {/* Version history */}
            <Drawer.Root
              open={historyOpen}
              onOpenChange={(details) => setHistoryOpen(details.open)}
              size={"lg"}
              closeOnEscape
              closeOnInteractOutside
            >
              <Drawer.Trigger asChild>
                <Button
                  onClick={() => setHistoryOpen(true)}
                  variant={"subtle"}
                  colorPalette={"gray"}
                  size={"xs"}
                  rounded={"md"}
                >
                  History
                  <Icon name={"clock"} size={"xs"} />
                </Button>
              </Drawer.Trigger>
              <Drawer.Backdrop />
              <Drawer.Positioner padding={"4"}>
                <Drawer.Content rounded={"md"}>
                  <Drawer.CloseTrigger asChild>
                    <CloseButton top={"6px"} size={"2xs"} onClick={() => setHistoryOpen(false)} />
                  </Drawer.CloseTrigger>
                  <Drawer.Header p={"2"} bg={GLOBAL_STYLES.dialog.header.bg} roundedTop={"md"}>
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Icon name={"clock"} size={"xs"} />
                      <Text fontSize={"sm"} fontWeight={"semibold"}>
                        Project History
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
                          {projectHistory.length > 0 ? dayjs(projectHistory[0].timestamp).fromNow() : "never"}
                        </Text>
                      </Flex>
                      <Flex direction={"row"} gap={"1"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Versions:
                        </Text>
                        <Text fontSize={"xs"} fontWeight={"normal"}>
                          {projectHistory.length}
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

                    {sortedProjectHistory.length > 0 ? (
                      <Timeline.Root size="sm" variant="subtle" mt={"2"}>
                        {sortedProjectHistory.map((projectVersion) => {
                          const isExpanded = expandedVersions.has(projectVersion.version);
                          return (
                            <Timeline.Item key={`v_${projectVersion.timestamp}`}>
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
                                          <Tag.Label fontSize={"xs"}>{projectVersion.version.slice(0, 6)}</Tag.Label>
                                        </Tag.Root>
                                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                                          {projectVersion.name}
                                        </Text>
                                        <Text fontSize={"xs"} color={"gray.500"}>
                                          {dayjs(projectVersion.timestamp).fromNow()}
                                        </Text>
                                      </Flex>
                                      <Flex direction={"row"} gap={"1"} align={"center"}>
                                        {projectVersion.message && !_.isEqual(projectVersion.message, "") ? (
                                          <Tooltip
                                            content={projectVersion.message}
                                            disabled={projectVersion.message.length <= 40}
                                            showArrow
                                          >
                                            <Text fontSize={"xs"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                                              {_.truncate(projectVersion.message, { length: 40 })}
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
                                            newExpanded.add(projectVersion.version);
                                          } else {
                                            newExpanded.delete(projectVersion.version);
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
                                          setPreviewVersion(projectVersion);
                                          setHistoryOpen(false);
                                        }}
                                        disabled={projectArchived}
                                      >
                                        Preview
                                        <Icon name={"expand"} size={"xs"} />
                                      </Button>
                                      <Tooltip
                                        content={"Insufficient permissions in this Workspace"}
                                        disabled={workspacePermissions.projects.archive}
                                        showArrow
                                      >
                                        <Button
                                          variant={"solid"}
                                          size={"xs"}
                                          rounded={"md"}
                                          colorPalette={"orange"}
                                          onClick={() => handleRestoreFromHistoryClick(projectVersion)}
                                          disabled={
                                            projectArchived ||
                                            !!previewVersion ||
                                            !workspacePermissions.projects.archive
                                          }
                                        >
                                          Restore
                                          <Icon name={"rewind"} size={"xs"} />
                                        </Button>
                                      </Tooltip>
                                    </Flex>
                                  </Flex>

                                  <Collapsible.Root
                                    open={isExpanded}
                                    onOpenChange={(event) => {
                                      const newExpanded = new Set(expandedVersions);
                                      if (event.open) {
                                        newExpanded.add(projectVersion.version);
                                      } else {
                                        newExpanded.delete(projectVersion.version);
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
                                            identifier={projectVersion.author}
                                            fallback={"Unknown User"}
                                            size={"sm"}
                                          />
                                        </Flex>

                                        <Flex direction={"column"} gap={"0.5"}>
                                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                                            Description:
                                          </Text>
                                          {_.isEqual(projectVersion.description, "") ? (
                                            <Flex>
                                              <Tag.Root size={"sm"} colorPalette={"orange"}>
                                                <Tag.Label fontSize={"xs"}>No Description</Tag.Label>
                                              </Tag.Root>
                                            </Flex>
                                          ) : (
                                            <Text fontSize={"xs"}>{projectVersion.description}</Text>
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
                                              Entities
                                            </Text>
                                            {projectVersion.entities.length > 0 ? (
                                              <Flex direction={"row"} gap={"2"} align={"center"} wrap={"wrap"}>
                                                {projectVersion.entities.map((entityId) => (
                                                  <Linky
                                                    key={`v_e_${projectVersion.timestamp}_${entityId}`}
                                                    type={"entities"}
                                                    id={entityId}
                                                    size={"xs"}
                                                  />
                                                ))}
                                              </Flex>
                                            ) : (
                                              <Flex>
                                                <Tag.Root size={"sm"} colorPalette={"orange"}>
                                                  <Tag.Label fontSize={"xs"}>No Entities</Tag.Label>
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
            </Drawer.Root>

            {/* Archive Dialog */}
            <AlertDialog
              header={"Archive Project"}
              leftButtonAction={() => setArchiveDialogOpen(false)}
              rightButtonAction={handleArchiveClick}
              open={archiveDialogOpen}
              setOpen={setArchiveDialogOpen}
            >
              <Text fontSize={"xs"}>
                Are you sure you want to archive this Project? No Entities will be deleted. This Project will be moved
                to the Workspace archive.
              </Text>
            </AlertDialog>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Project Overview and Description */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Overview */}
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
                  <Text
                    fontSize={"xs"}
                    fontWeight={"semibold"}
                    color={GLOBAL_STYLES.font.secondaryHeader.color}
                    ml={"0.5"}
                  >
                    Name
                  </Text>
                  <Input
                    id={"projectNameInput"}
                    size={"xs"}
                    rounded={"md"}
                    value={previewVersion ? displayProjectName : projectName}
                    onChange={(event) => {
                      setProjectName(event.target.value);
                    }}
                    readOnly={!editing || !!previewVersion}
                    bg={"white"}
                    border={GLOBAL_STYLES.border.style}
                    borderColor={GLOBAL_STYLES.border.color}
                  />
                </Flex>
              </Flex>

              <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"2"}>
                  <Text
                    fontSize={"xs"}
                    fontWeight={"semibold"}
                    color={GLOBAL_STYLES.font.secondaryHeader.color}
                    ml={"0.5"}
                  >
                    Owner
                  </Text>
                  <ActorTag identifier={project.owner} fallback={"Unknown User"} size={"sm"} />
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <Text
                    fontSize={"xs"}
                    fontWeight={"semibold"}
                    color={GLOBAL_STYLES.font.secondaryHeader.color}
                    ml={"0.5"}
                  >
                    Timestamp
                  </Text>
                  <TimestampTag timestamp={project.created} description={"Created"} />
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <Text
                    fontSize={"xs"}
                    fontWeight={"semibold"}
                    color={GLOBAL_STYLES.font.secondaryHeader.color}
                    ml={"0.5"}
                  >
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
              <Text fontSize={"xs"} fontWeight={"semibold"} color={GLOBAL_STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Description
              </Text>
              <Textarea
                id={"projectDescriptionInput"}
                value={previewVersion ? displayProjectDescription : projectDescription}
                size={"xs"}
                h={"100%"}
                readOnly={!(editing && !previewVersion)}
                onChange={(event) => setProjectDescription(event.target.value)}
              />
            </Flex>
          </Flex>

          {/* Project Entities */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Entities */}
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
                {/* Entities in the Project */}
                <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                  <Icon name={"entity"} size={"xs"} color={GLOBAL_STYLES.entity.color.icon} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                    Entities ({projectEntities.length})
                  </Text>
                </Flex>
                <Button
                  colorPalette={"green"}
                  id={"addEntityButton"}
                  onClick={() => setEntitiesOpen(true)}
                  size={"xs"}
                  rounded={"md"}
                  disabled={!editing || !!previewVersion}
                >
                  Add
                  <Icon name={"add"} size={"xs"} />
                </Button>
              </Flex>
              <Flex
                w={"100%"}
                justify={"center"}
                align={"center"}
                minH={displayProjectEntities.length > 0 ? "fit-content" : "200px"}
              >
                {displayProjectEntities && displayProjectEntities.length > 0 ? (
                  <DataTable
                    data={entitiesTableData}
                    columns={entitiesColumns}
                    visibleColumns={{}}
                    selectedRows={{}}
                    viewOnly={!editing || !!previewVersion}
                    showSelection={true}
                    actions={entitiesTableActions}
                    showPagination
                  />
                ) : (
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"entity"} size={"lg"} color={GLOBAL_STYLES.entity.color.default} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No Entities</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Dialog to add Entities */}
        <Dialog.Root
          open={entitiesOpen}
          onOpenChange={(details) => {
            if (!details.open) setSelectedEntities([]);
            setEntitiesOpen(details.open);
          }}
          placement={"center"}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content gap={"0"} w={["md", "lg", "xl"]}>
              <Dialog.Header
                p={"2"}
                fontWeight={"semibold"}
                fontSize={"xs"}
                bg={GLOBAL_STYLES.dialog.header.bg}
                roundedTop={"md"}
              >
                <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                  <Icon name={"entity"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Add Entities to Project
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"2xs"}
                    top={"6px"}
                    onClick={() => {
                      setSelectedEntities([]);
                      setEntitiesOpen(false);
                    }}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"2"} gap={"2"}>
                <MultiEntitySelect
                  projectEntities={projectEntities}
                  selectedEntities={selectedEntities}
                  setSelectedEntities={setSelectedEntities}
                />
              </Dialog.Body>

              <Dialog.Footer p={"2"} bg={GLOBAL_STYLES.dialog.footer.bg} roundedBottom={"md"}>
                <Button
                  colorPalette={"red"}
                  size={"xs"}
                  rounded={"md"}
                  variant={"solid"}
                  onClick={() => {
                    setSelectedEntities([]);
                    setEntitiesOpen(false);
                  }}
                >
                  Cancel
                  <Icon name={"cross"} size={"xs"} />
                </Button>
                <Spacer />
                <Button
                  id={"addEntityDoneButton"}
                  colorPalette={"green"}
                  size={"xs"}
                  rounded={"md"}
                  disabled={selectedEntities.length === 0}
                  onClick={addEntities}
                >
                  Add {selectedEntities.length} {selectedEntities.length === 1 ? "Entity" : "Entities"}
                  <Icon name={"check"} size={"xs"} />
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Export dialog, individual project */}
        <ExportDialog open={exportOpen} setOpen={setExportOpen} dataType={"project"} id={id} />

        {/* Export dialog, project entities */}
        <ExportDialog
          open={exportEntitiesOpen}
          setOpen={setExportEntitiesOpen}
          dataType={"entities"}
          ids={projectEntities}
        />

        {/* Save message dialog */}
        <SaveDialog
          open={saveMessageOpen}
          onOpenChange={(details) => setSaveMessageOpen(details.open)}
          onDone={handleSaveMessageDoneClick}
          value={saveMessage}
          onChange={setSaveMessage}
          description={"Specify a description of the changes made to the Project."}
          modifiedType={"Project"}
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

export default Project;
