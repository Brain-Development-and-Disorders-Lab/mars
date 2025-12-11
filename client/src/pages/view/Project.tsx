// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Drawer,
  EmptyState,
  Field,
  Fieldset,
  Flex,
  Heading,
  Input,
  Menu,
  Portal,
  RadioGroup,
  Select,
  Spacer,
  Stack,
  Tag,
  Text,
  createListCollection,
  useDisclosure,
  Timeline,
  Collapsible,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import Collaborators from "@components/Collaborators";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import AlertDialog from "@components/AlertDialog";
import DataTable from "@components/DataTable";
import SearchSelect from "@components/SearchSelect";
import TimestampTag from "@components/TimestampTag";
import VisibilityTag from "@components/VisibilityTag";
import Tooltip from "@components/Tooltip";
import { Information } from "@components/Label";
import { UnsavedChangesModal } from "@components/WarningModal";
import { toaster } from "@components/Toast";
import SaveModal from "@components/SaveModal";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import {
  ProjectHistory,
  ProjectModel,
  DataTableAction,
  IGenericItem,
} from "@types";
import { Cell } from "@tanstack/react-table";

// Apollo client imports
import { useQuery, gql, useMutation, useLazyQuery } from "@apollo/client";

// Routing and navigation
import { useParams, useNavigate, useBlocker } from "react-router-dom";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";

const Project = () => {
  const { id } = useParams();

  // Navigation and routing
  const navigate = useNavigate();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      editing && currentLocation.pathname !== nextLocation.pathname,
  );
  const { onClose: onBlockerClose } = useDisclosure();
  const cancelBlockerRef = useRef(null);

  // Add Entities
  const [entitiesOpen, setEntitiesOpen] = useState(false);

  // State for dialog confirming if user should archive Project
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

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
  const [previewVersion, setPreviewVersion] = useState<ProjectHistory | null>(
    null,
  );

  // Page state
  const [editing, setEditing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Project state
  const [project, setProject] = useState({} as ProjectModel);
  const [projectName, setProjectName] = useState("");
  const [projectArchived, setProjectArchived] = useState(false);
  const [projectEntities, setProjectEntities] = useState([] as string[]);
  const [projectDescription, setProjectDescription] = useState("");
  const [projectHistory, setProjectHistory] = useState([] as ProjectHistory[]);

  // Sorted and filtered history based on sort order and date range
  const sortedProjectHistory = useMemo(() => {
    let filtered = [...projectHistory];

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
  }, [projectHistory, historySortOrder, dateFilterApplied, startDate, endDate]);

  const [projectCollaborators, setProjectCollaborators] = useState(
    [] as string[],
  );

  // Computed values that use preview data when in preview mode
  const displayProjectName = useMemo(() => {
    return previewVersion ? previewVersion.name : projectName;
  }, [previewVersion, projectName]);

  const displayProjectDescription = useMemo(() => {
    return previewVersion
      ? previewVersion.description || ""
      : projectDescription;
  }, [previewVersion, projectDescription]);

  const displayProjectEntities = useMemo(() => {
    return previewVersion ? previewVersion.entities : projectEntities;
  }, [previewVersion, projectEntities]);

  const displayProjectCollaborators = useMemo(() => {
    return previewVersion ? previewVersion.collaborators : projectCollaborators;
  }, [previewVersion, projectCollaborators]);

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
        collaborators: previewVersion.collaborators,
        archived: previewVersion.archived,
      };
    }
    return project;
  }, [previewVersion, project]);

  // Save message modal
  const [saveMessageOpen, setSaveMessageOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Entities that can be added
  const [selectedEntity, setSelectedEntity] = useState({} as IGenericItem);

  // Export modal state and data
  const selectExportFormatRef = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFields, setExportFields] = useState([] as string[]);
  const [exportFormat, setExportFormat] = useState("json");
  const [exportEntityDetails, setExportEntityDetails] = React.useState<
    string | null
  >("name");

  useEffect(() => {
    if (isLoaded) {
      // Update the state of editable data fields
      setProjectEntities(project.entities);
    }
  }, [isLoaded]);

  // Execute GraphQL query both on page load and navigation
  const GET_PROJECT_WITH_ENTITIES = gql`
    query GetProjectWithEntities($_id: String) {
      project(_id: $_id) {
        _id
        name
        archived
        created
        description
        owner
        entities
        collaborators
        history {
          message
          author
          name
          timestamp
          version
          collaborators
          created
          description
          entities
        }
      }
      entities {
        _id
        name
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery(
    GET_PROJECT_WITH_ENTITIES,
    {
      variables: {
        _id: id,
      },
      fetchPolicy: "network-only",
    },
  );

  // Query to get Project Entities export contents
  const GET_PROJECT_ENTITIES_EXPORT = gql`
    query GetProjectEntitiesExport($_id: String, $format: String) {
      exportProjectEntities(_id: $_id, format: $format)
    }
  `;
  const [
    exportProjectEntities,
    { loading: exportEntitiesLoading, error: exportEntitiesError },
  ] = useLazyQuery(GET_PROJECT_ENTITIES_EXPORT);

  // Query to get Project Entities export contents
  const GET_PROJECT_EXPORT = gql`
    query GetProjectExport($_id: String, $format: String, $fields: [String]) {
      exportProject(_id: $_id, format: $format, fields: $fields)
    }
  `;
  const [exportProject, { loading: exportLoading, error: exportError }] =
    useLazyQuery(GET_PROJECT_EXPORT);

  // Mutation to update Project
  const UPDATE_PROJECT = gql`
    mutation UpdateProject($project: ProjectUpdateInput, $message: String) {
      updateProject(project: $project, message: $message) {
        success
        message
      }
    }
  `;
  const [updateProject, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_PROJECT);

  // Mutation to archive Project
  const ARCHIVE_PROJECT = gql`
    mutation ArchiveProject($_id: String, $state: Boolean) {
      archiveProject(_id: $_id, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveProject, { loading: archiveLoading }] =
    useMutation(ARCHIVE_PROJECT);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.project) {
      setProject(data.project);

      if (!editing) {
        setProjectName(data.project.name);
        setProjectArchived(data.project.archived);
        setProjectDescription(data.project.description);
        setProjectEntities(data.project.entities);
        setProjectCollaborators(data.project.collaborators || []);
      }

      setProjectHistory(data.project.history || []);
    }
  }, [data, editing]);

  const { workspace } = useWorkspace();

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

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

  /**
   * Callback function to add Entities to a Project
   * @param {IGenericItem} entity Entity to add
   */
  const addEntities = (entity: IGenericItem): void => {
    setProjectEntities([...projectEntities, entity._id]);
    setEntitiesOpen(false);
  };

  /**
   * Handle the edit button being clicked
   */
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
    setIsUpdating(true);

    // Collate update data
    const updateData: ProjectModel = {
      _id: project._id,
      name: projectName,
      timestamp: project.timestamp,
      archived: projectArchived,
      description: projectDescription,
      owner: project.owner,
      collaborators: projectCollaborators || [],
      created: project.created,
      entities: projectEntities,
      history: projectHistory,
    };

    try {
      await updateProject({
        variables: {
          project: {
            _id: updateData._id,
            name: updateData.name,
            timestamp: updateData.timestamp,
            archived: updateData.archived,
            created: updateData.created,
            owner: updateData.owner,
            collaborators: updateData.collaborators,
            description: updateData.description,
            entities: updateData.entities,
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

    // Refetch Project data
    await refetch();

    setEditing(false);
    setIsUpdating(false);

    // Close the save message modal
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
    if (response.data.archiveProject.success) {
      toaster.create({
        title: "Archived Successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setProjectArchived(true);
      setArchiveDialogOpen(false);
    } else {
      toaster.create({
        title: "Error",
        description: "An error occurred when archiving Project",
        type: "error",
        duration: 2000,
        closable: true,
      });
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
    if (response.data.archiveProject.success) {
      toaster.create({
        title: "Restored Successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      setProjectArchived(false);
    } else {
      toaster.create({
        title: "Error",
        description: "An error occurred when restoring Project",
        type: "error",
        duration: 2000,
        closable: true,
      });
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
    setProjectCollaborators(project.collaborators);
  };

  /**
   * Restore a Project from an earlier point in time
   * @param {ProjectHistory} projectVersion historical Project data to restore
   */
  const handleRestoreFromHistoryClick = async (
    projectVersion: ProjectHistory,
  ) => {
    // Reconstruct a `ProjectModel` instance from the prior version
    const updateData: ProjectModel = {
      _id: project._id,
      name: projectVersion.name,
      timestamp: project.timestamp,
      archived: project.archived,
      created: project.created,
      owner: project.owner,
      collaborators: project.collaborators || [],
      description: projectVersion.description,
      entities: projectVersion.entities,
      history: project.history,
    };
    setIsLoaded(false);

    try {
      await updateProject({
        variables: {
          project: {
            _id: updateData._id,
            name: updateData.name,
            timestamp: updateData.timestamp,
            archived: updateData.archived,
            created: updateData.created,
            owner: updateData.owner,
            collaborators: updateData.collaborators,
            description: updateData.description,
            entities: updateData.entities,
          },
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
    setProjectCollaborators(updateData?.collaborators || []);

    // Refetch Project data
    await refetch();

    setIsLoaded(true);
  };

  // Handle clicking the "Export" button
  const handleExportClick = () => {
    setProject(project);
    setExportOpen(true);
  };

  // Handle clicking the "Export" button
  const handleExportEntitiesClick = async () => {
    const response = await exportProjectEntities({
      variables: { _id: project._id, format: "json" },
    });
    if (response.data.exportProjectEntities) {
      FileSaver.saveAs(
        new Blob([response.data.exportProjectEntities]),
        slugify(
          `export_${project._id}_entities_${dayjs(Date.now()).format(
            "YYYY_MM_DD",
          )}.json`,
        ),
      );
    }

    if (exportEntitiesError) {
      toaster.create({
        title: "Error",
        description: "Project Entities could not be exported",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  // Handle clicking the "Download" button
  const handleDownloadClick = async (format: string) => {
    let fields = exportFields;
    // Update the exported fields if using JSON format and `Entities` have been selected
    if (_.isEqual(format, "json") && _.includes(fields, "entities")) {
      fields = exportFields.filter((field) => !_.isEqual(field, "entities"));
      if (_.isEqual(exportEntityDetails, "name")) {
        fields.push("entities_names");
      } else {
        fields.push("entities_id");
      }
    }

    // Send query to generate data
    const response = await exportProject({
      variables: {
        _id: id,
        fields: fields,
        format: format,
      },
    });

    if (response.data.exportProject) {
      FileSaver.saveAs(
        new Blob([response.data.exportProject]),
        slugify(`${projectName.replace(" ", "")}_export.${format}`),
      );

      // Close the "Export" modal
      setExportOpen(false);

      // Reset the export state
      setExportFields([]);

      toaster.create({
        title: "Info",
        description: `Generated ${format.toUpperCase()} file`,
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
        const updatedFields = exportFields.filter((existingField) => {
          if (!_.isEqual(existingField, field)) {
            return existingField;
          }
          return;
        });
        setExportFields(updatedFields);
      }
    }
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
  const entitiesColumns = [
    {
      id: "entityId",
      accessorFn: (row: string) => row,
      cell: (info: Cell<string, string>) => {
        const entityId = info.getValue();
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip
              content={entityId}
              disabled={entityId.length < 20}
              showArrow
            >
              <Linky id={entityId} type={"entities"} size={"xs"} />
            </Tooltip>
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
    },
  ];
  const entitiesTableActions: DataTableAction[] = [
    {
      label: "Remove Entities",
      icon: "delete",
      action(table, rows) {
        const entitiesToRemove: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          entitiesToRemove.push(table.getRow(rowIndex).original);
        }
        handleRemoveEntities(entitiesToRemove);
      },
    },
  ];

  return (
    <Content
      isError={!_.isUndefined(error)}
      isLoaded={!loading && !archiveLoading && !updateLoading}
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
                disabled={displayProjectArchived}
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
            id={"projectNameTag"}
            align={"center"}
            gap={"1"}
            p={"1"}
            border={"2px solid"}
            rounded={"md"}
          >
            <Icon name={"project"} size={"sm"} />
            <Heading fontWeight={"semibold"} size={"sm"}>
              {displayProjectData.name}
            </Heading>
            {displayProjectArchived && <Icon name={"archive"} size={"sm"} />}
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
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
                    disabled={
                      exportLoading || projectArchived || !!previewVersion
                    }
                  >
                    <Icon name={"download"} size={"xs"} />
                    Export Project
                  </Menu.Item>
                  <Tooltip
                    content={"This Project does not contain any Entities."}
                    disabled={
                      displayProjectEntities?.length > 0 ||
                      displayProjectArchived
                    }
                    showArrow
                  >
                    <Menu.Item
                      value={"export-entities"}
                      onClick={handleExportEntitiesClick}
                      fontSize={"xs"}
                      disabled={
                        displayProjectEntities?.length === 0 ||
                        exportEntitiesLoading ||
                        displayProjectArchived ||
                        !!previewVersion
                      }
                    >
                      <Icon name={"download"} size={"xs"} />
                      Export Entities
                    </Menu.Item>
                  </Tooltip>
                  <Menu.Item
                    value={"archive"}
                    onClick={() => setArchiveDialogOpen(true)}
                    fontSize={"xs"}
                    disabled={projectArchived || !!previewVersion}
                  >
                    <Icon name={"archive"} size={"xs"} />
                    Archive
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>

            {displayProjectArchived ? (
              <Button
                onClick={handleRestoreClick}
                size={"xs"}
                rounded={"md"}
                colorPalette={"orange"}
              >
                Restore
                <Icon name={"rewind"} size={"xs"} />
              </Button>
            ) : (
              <Flex gap={"2"}>
                {editing && (
                  <Button
                    onClick={handleCancelClick}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"red"}
                  >
                    Cancel
                    <Icon name={"cross"} size={"xs"} />
                  </Button>
                )}
                <Button
                  id={"editProjectButton"}
                  colorPalette={editing ? "green" : "blue"}
                  size={"xs"}
                  rounded={"md"}
                  onClick={handleEditClick}
                  loadingText={"Saving..."}
                  loading={isUpdating}
                  disabled={!!previewVersion}
                >
                  {editing ? "Save" : "Edit"}
                  {editing ? (
                    <Icon name={"save"} size={"xs"} />
                  ) : (
                    <Icon name={"edit"} size={"xs"} />
                  )}
                </Button>
              </Flex>
            )}

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
                    <CloseButton
                      top={"6px"}
                      size={"2xs"}
                      onClick={() => setHistoryOpen(false)}
                    />
                  </Drawer.CloseTrigger>
                  <Drawer.Header p={"2"} bg={"blue.300"} roundedTop={"md"}>
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Icon name={"clock"} size={"xs"} />
                      <Text fontSize={"sm"} fontWeight={"semibold"}>
                        Project History
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
                      <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
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
                          {projectHistory.length > 0
                            ? dayjs(projectHistory[0].timestamp).fromNow()
                            : "never"}
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

                    {sortedProjectHistory && sortedProjectHistory.length > 0 ? (
                      <Timeline.Root size="sm" variant="subtle" mt={"1"}>
                        {sortedProjectHistory.map((projectVersion) => {
                          const isExpanded = expandedVersions.has(
                            projectVersion.version,
                          );
                          return (
                            <Timeline.Item
                              key={`v_${projectVersion.timestamp}`}
                            >
                              <Timeline.Connector>
                                <Timeline.Separator />
                                <Timeline.Indicator />
                              </Timeline.Connector>
                              <Timeline.Content>
                                <Flex direction={"column"} gap={"1"} w={"100%"}>
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
                                        <Text
                                          fontSize={"xs"}
                                          fontWeight={"semibold"}
                                        >
                                          {projectVersion.name}
                                        </Text>
                                        <Tag.Root
                                          size={"sm"}
                                          colorPalette={"green"}
                                        >
                                          <Tag.Label fontSize={"xs"}>
                                            {projectVersion.version.slice(0, 6)}
                                          </Tag.Label>
                                        </Tag.Root>
                                        <Text
                                          fontSize={"xs"}
                                          color={"gray.500"}
                                        >
                                          {dayjs(
                                            projectVersion.timestamp,
                                          ).fromNow()}
                                        </Text>
                                      </Flex>
                                      <Flex
                                        direction={"row"}
                                        gap={"1"}
                                        align={"center"}
                                      >
                                        {projectVersion.message &&
                                        !_.isEqual(
                                          projectVersion.message,
                                          "",
                                        ) ? (
                                          <Tooltip
                                            content={projectVersion.message}
                                            disabled={
                                              projectVersion.message.length <=
                                              40
                                            }
                                            showArrow
                                          >
                                            <Text
                                              fontSize={"xs"}
                                              color={"gray.600"}
                                            >
                                              {_.truncate(
                                                projectVersion.message,
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
                                              No description
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
                                              projectVersion.version,
                                            );
                                          } else {
                                            newExpanded.delete(
                                              projectVersion.version,
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
                                          setPreviewVersion(projectVersion);
                                          setHistoryOpen(false);
                                        }}
                                        disabled={displayProjectArchived}
                                      >
                                        Preview
                                        <Icon name={"expand"} size={"xs"} />
                                      </Button>
                                      <Button
                                        colorPalette={"orange"}
                                        size={"xs"}
                                        rounded={"md"}
                                        onClick={() => {
                                          handleRestoreFromHistoryClick(
                                            projectVersion,
                                          );
                                        }}
                                        disabled={
                                          displayProjectArchived ||
                                          !!previewVersion
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
                                        newExpanded.add(projectVersion.version);
                                      } else {
                                        newExpanded.delete(
                                          projectVersion.version,
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
                                            orcid={projectVersion.author}
                                            fallback={"Unknown User"}
                                            size={"sm"}
                                          />
                                        </Flex>

                                        <Flex direction={"column"} gap={"0.5"}>
                                          <Text
                                            fontSize={"xs"}
                                            fontWeight={"semibold"}
                                          >
                                            Description:
                                          </Text>
                                          {_.isEqual(
                                            projectVersion.description,
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
                                              {projectVersion.description}
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
                                              Entities
                                            </Text>
                                            {projectVersion.entities.length >
                                            0 ? (
                                              <Flex
                                                direction={"row"}
                                                gap={"2"}
                                                align={"center"}
                                                wrap={"wrap"}
                                              >
                                                {projectVersion.entities.map(
                                                  (entityId) => (
                                                    <Tag.Root
                                                      key={`v_e_${projectVersion.timestamp}_${entityId}`}
                                                      size={"sm"}
                                                    >
                                                      <Tag.Label
                                                        fontSize={"xs"}
                                                      >
                                                        <Linky
                                                          type={"entities"}
                                                          id={entityId}
                                                          size={"xs"}
                                                        />
                                                      </Tag.Label>
                                                    </Tag.Root>
                                                  ),
                                                )}
                                              </Flex>
                                            ) : (
                                              <Text fontSize={"xs"}>
                                                No Entities
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
                                              Collaborators
                                            </Text>
                                            {projectVersion.collaborators
                                              .length > 0 ? (
                                              <Flex
                                                direction={"row"}
                                                gap={"2"}
                                                align={"center"}
                                                wrap={"wrap"}
                                              >
                                                {projectVersion.collaborators.map(
                                                  (collaborator) => (
                                                    <Tag.Root
                                                      key={`v_c_${projectVersion.timestamp}_${collaborator}`}
                                                      size={"sm"}
                                                    >
                                                      <Tag.Label
                                                        fontSize={"xs"}
                                                      >
                                                        {collaborator}
                                                      </Tag.Label>
                                                    </Tag.Root>
                                                  ),
                                                )}
                                              </Flex>
                                            ) : (
                                              <Text fontSize={"xs"}>
                                                No Collaborators
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
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        No previous versions.
                      </Text>
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
                Are you sure you want to archive this Project? No Entities will
                be deleted. This Project will be moved to the Workspace archive.
              </Text>
            </AlertDialog>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"1"} p={"1"} wrap={"wrap"}>
          {/* Overview and "Description" field */}
          <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
            {/* Overview */}
            <Flex
              direction={"column"}
              p={"1"}
              h={"fit-content"}
              gap={"1"}
              bg={"gray.100"}
              rounded={"md"}
              grow={"1"}
            >
              <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"1"} grow={"1"}>
                  <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                    Project Name
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
                    border={"1px solid"}
                    borderColor={"gray.300"}
                  />
                </Flex>

                <TimestampTag
                  timestamp={project.created}
                  description={"Created"}
                />
              </Flex>

              <Flex gap={"1"} direction={"row"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                    Project Visibility
                  </Text>
                  <VisibilityTag isPublic={false} isInherited />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                    Project Owner
                  </Text>
                  <ActorTag
                    orcid={project.owner}
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
              gap={"1"}
              border={"1px solid"}
              borderColor={"gray.300"}
              rounded={"md"}
              basis={"40%"}
              grow={"1"}
            >
              <Text fontWeight={"bold"} fontSize={"xs"} ml={"0.5"}>
                Project Description
              </Text>
              <MDEditor
                height={150}
                minHeight={100}
                maxHeight={400}
                id={"projectDescriptionInput"}
                style={{ width: "100%" }}
                value={
                  previewVersion
                    ? displayProjectDescription
                    : projectDescription
                }
                preview={editing && !previewVersion ? "edit" : "preview"}
                extraCommands={[]}
                onChange={(value) => {
                  setProjectDescription(value || "");
                }}
              />
            </Flex>
          </Flex>

          {/* "Entities" and "Collaborators" */}
          <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
            {/* Entities */}
            <Flex
              direction={"column"}
              h={"fit-content"}
              p={"1"}
              gap={"1"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
              w={{ base: "100%", md: "50%" }}
            >
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
              >
                {/* Entities in the Project */}
                <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                  <Icon name={"entity"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Project Entities
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
                minH={
                  displayProjectEntities.length > 0 ? "fit-content" : "200px"
                }
              >
                {displayProjectEntities && displayProjectEntities.length > 0 ? (
                  <DataTable
                    data={displayProjectEntities}
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
                        <Icon name={"entity"} size={"lg"} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>
                        No Entities
                      </EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                )}
              </Flex>
            </Flex>

            {/* Collaborators */}
            <Collaborators
              editing={editing && !previewVersion}
              projectCollaborators={displayProjectCollaborators}
              setProjectCollaborators={setProjectCollaborators}
            />
          </Flex>
        </Flex>

        {/* Modal to add Entities */}
        <Dialog.Root
          open={entitiesOpen}
          onOpenChange={(details) => setEntitiesOpen(details.open)}
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
                fontWeight={"semibold"}
                fontSize={"xs"}
                bg={"blue.300"}
                roundedTop={"md"}
              >
                <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                  <Icon name={"add"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Add Entity
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size={"2xs"}
                    top={"6px"}
                    onClick={() => setEntitiesOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={"1"} gap={"1"}>
                <Text fontSize={"xs"}>
                  Select an Entity to add to the Project.
                </Text>
                <SearchSelect
                  id={"entitySearchSelect"}
                  resultType={"entity"}
                  value={selectedEntity}
                  onChange={setSelectedEntity}
                />
              </Dialog.Body>

              <Dialog.Footer p={"1"}>
                <Button
                  colorPalette={"red"}
                  size={"xs"}
                  rounded={"md"}
                  variant={"solid"}
                  onClick={() => setEntitiesOpen(false)}
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
                  onClick={() => {
                    if (id) {
                      // Add the Origin to the Entity
                      addEntities(selectedEntity);
                    }
                  }}
                >
                  Done
                  <Icon name={"check"} size={"xs"} />
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Dialog to export Entities */}
        <Dialog.Root
          open={exportOpen}
          onOpenChange={(details) => setExportOpen(details.open)}
          size={"xl"}
          placement={"center"}
          closeOnEscape
          closeOnInteractOutside
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content w={["lg", "xl", "2xl"]} gap={"0"}>
              {/* Heading and close button */}
              <Dialog.Header
                p={"2"}
                fontWeight={"semibold"}
                fontSize={"xs"}
                bg={"blue.300"}
                roundedTop={"md"}
              >
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"download"} size={"sm"} />
                  Export Project
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
                {/* Select export format */}
                <Flex
                  w={"100%"}
                  direction={"column"}
                  py={"1"}
                  gap={"1"}
                  ref={selectExportFormatRef}
                >
                  <Flex
                    direction={"row"}
                    gap={"1"}
                    align={"center"}
                    justify={"space-between"}
                    ml={"0.5"}
                  >
                    <Flex direction={"row"} gap={"1"} align={"center"}>
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
                              rounded={"md"}
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
                    {/* Export information */}
                    {_.isEqual(exportFormat, "json") && (
                      <Information
                        text={"JSON files can be re-imported into Metadatify."}
                      />
                    )}
                    {_.isEqual(exportFormat, "csv") && (
                      <Information
                        text={
                          "To export Entities alongside Project details, use JSON format."
                        }
                      />
                    )}
                  </Flex>
                  <Text fontSize={"xs"}>
                    Select the Project fields to be exported:
                  </Text>
                </Flex>

                {/* Selection content */}
                <Flex
                  direction={"row"}
                  p={"1"}
                  gap={"1"}
                  rounded={"md"}
                  border={"1px solid"}
                  borderColor={"gray.300"}
                >
                  <Fieldset.Root>
                    <Fieldset.Content gap={"1"}>
                      <Fieldset.Legend fontSize={"xs"}>Details</Fieldset.Legend>
                      {!loading ? (
                        <Stack gap={"1"} direction={"column"}>
                          <Checkbox.Root
                            disabled
                            defaultChecked
                            size={"xs"}
                            rounded={"md"}
                            fontSize={"xs"}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize={"xs"}>
                              Name: {projectName}
                            </Checkbox.Label>
                          </Checkbox.Root>
                          <Checkbox.Root
                            size={"xs"}
                            rounded={"md"}
                            fontSize={"xs"}
                            checked={_.includes(exportFields, "created")}
                            onCheckedChange={(details) =>
                              handleExportCheck(
                                "created",
                                details.checked as boolean,
                              )
                            }
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize={"xs"}>
                              Created:{" "}
                              {dayjs(project.created).format("DD MMM YYYY")}
                            </Checkbox.Label>
                          </Checkbox.Root>
                          <Checkbox.Root
                            size={"xs"}
                            rounded={"md"}
                            checked={_.includes(exportFields, "owner")}
                            onCheckedChange={(details) =>
                              handleExportCheck(
                                "owner",
                                details.checked as boolean,
                              )
                            }
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize={"xs"}>
                              Owner: {project.owner}
                            </Checkbox.Label>
                          </Checkbox.Root>
                          <Checkbox.Root
                            size={"xs"}
                            rounded={"md"}
                            checked={_.includes(exportFields, "description")}
                            onCheckedChange={(details) =>
                              handleExportCheck(
                                "description",
                                details.checked as boolean,
                              )
                            }
                            disabled={_.isEqual(projectDescription, "")}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize={"xs"}>
                              <Text lineClamp={1} fontSize={"xs"}>
                                Description:{" "}
                                {_.isEqual(projectDescription, "")
                                  ? "No description"
                                  : _.truncate(projectDescription, {
                                      length: 32,
                                    })}
                              </Text>
                            </Checkbox.Label>
                          </Checkbox.Root>
                        </Stack>
                      ) : (
                        <Text fontSize={"xs"}>Loading details...</Text>
                      )}
                    </Fieldset.Content>
                  </Fieldset.Root>
                  <Fieldset.Root>
                    <Fieldset.Content gap={"1"}>
                      <Fieldset.Legend fontSize={"xs"}>
                        Entities
                      </Fieldset.Legend>
                      {!loading ? (
                        <Tooltip
                          content={
                            "Entities cannot be included when exporting to CSV"
                          }
                          disabled={_.isEqual(exportFormat, "json")}
                          showArrow
                        >
                          <Checkbox.Root
                            size={"xs"}
                            rounded={"md"}
                            checked={_.includes(exportFields, "entities")}
                            onCheckedChange={(details) =>
                              handleExportCheck(
                                "entities",
                                details.checked as boolean,
                              )
                            }
                            disabled={
                              _.isEqual(projectEntities.length, 0) ||
                              _.isEqual(exportFormat, "csv")
                            }
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize={"xs"}>
                              <Text lineClamp={1} fontSize={"xs"}>
                                Export Entities
                              </Text>
                            </Checkbox.Label>
                          </Checkbox.Root>
                        </Tooltip>
                      ) : (
                        <Text fontSize={"xs"}>Loading details...</Text>
                      )}
                      {_.includes(exportFields, "entities") && (
                        <RadioGroup.Root
                          value={exportEntityDetails}
                          onValueChange={(event) =>
                            setExportEntityDetails(event.value)
                          }
                        >
                          <Stack direction={"row"} gap={"1"}>
                            <RadioGroup.Item value={"name"}>
                              <RadioGroup.ItemHiddenInput />
                              <RadioGroup.ItemIndicator />
                              <RadioGroup.Label fontSize={"xs"}>
                                Names
                              </RadioGroup.Label>
                            </RadioGroup.Item>
                            <RadioGroup.Item value={"_id"}>
                              <RadioGroup.ItemHiddenInput />
                              <RadioGroup.ItemIndicator />
                              <RadioGroup.Label fontSize={"xs"}>
                                Identifiers
                              </RadioGroup.Label>
                            </RadioGroup.Item>
                          </Stack>
                        </RadioGroup.Root>
                      )}
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>
              </Dialog.Body>

              <Dialog.Footer p={"1"} bg={"gray.100"} roundedBottom={"md"}>
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
                      colorPalette={"blue"}
                      size={"xs"}
                      rounded={"md"}
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

        {/* Save message modal */}
        <SaveModal
          open={saveMessageOpen}
          onOpenChange={(details) => setSaveMessageOpen(details.open)}
          onDone={handleSaveMessageDoneClick}
          value={saveMessage}
          onChange={setSaveMessage}
          description={
            "Specify a description of the changes made to the Project."
          }
          modifiedType={"Project"}
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

export default Project;
