// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  CloseButton,
  Dialog,
  Drawer,
  Field,
  Fieldset,
  Flex,
  Heading,
  IconButton,
  Input,
  Link,
  Menu,
  Portal,
  RadioGroup,
  Select,
  Spacer,
  Stack,
  Tag,
  Text,
  VStack,
  createListCollection,
  useDisclosure,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import ActorTag from "@components/ActorTag";
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
  const {
    open: entitiesOpen,
    onOpen: onEntitiesOpen,
    onClose: onEntitiesClose,
  } = useDisclosure();

  // State for dialog confirming if user should archive Project
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  // History drawer
  const [historyOpen, setHistoryOpen] = useState(false);

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
  const [projectCollaborators, setProjectCollaborators] = useState(
    [] as string[],
  );
  const [newCollaborator, setNewCollaborator] = useState("");

  // Save message modal
  const {
    open: isSaveMessageOpen,
    onOpen: onSaveMessageOpen,
    onClose: onSaveMessageClose,
  } = useDisclosure();
  const [saveMessage, setSaveMessage] = useState("");

  // Entities that can be added
  const [selectedEntity, setSelectedEntity] = useState({} as IGenericItem);

  // Export modal state and data
  const {
    open: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();
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
      setProjectName(data.project.name);
      setProjectArchived(data.project.archived);
      setProjectDescription(data.project.description);
      setProjectEntities(data.project.entities);
      setProjectHistory(data.project.history || []);
      setProjectCollaborators(data.project.collaborators || []);
    }
  }, [data]);

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
    onEntitiesClose();
  };

  /**
   * Handle the edit button being clicked
   */
  const handleEditClick = () => {
    if (editing) {
      // Open the save message modal
      onSaveMessageOpen();
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
    onSaveMessageClose();
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
    onExportOpen();
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
      onExportClose();

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
      id: (info: Cell<string, string>) => info.row.original,
      cell: (info: Cell<string, string>) => (
        <Linky id={info.row.original} type={"entities"} size={"sm"} />
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
                aria-label={"Remove entity"}
                colorPalette={"red"}
                onClick={() => handleRemoveEntity(info.row.original)}
                size={"sm"}
              >
                <Icon name={"delete"} />
              </IconButton>
            ) : (
              <Flex justifyContent={"right"} p={"2"} align={"center"} gap={"1"}>
                <Link
                  onClick={() => navigate(`/entities/${info.row.original}`)}
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
            id={"projectNameTag"}
            align={"center"}
            gap={"2"}
            p={"2"}
            border={"2px"}
            rounded={"md"}
          >
            <Icon name={"project"} size={"md"} />
            <Heading fontWeight={"semibold"} size={"md"}>
              {project.name}
            </Heading>
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
            {/* Actions Menu */}
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button colorPalette={"yellow"} size={"sm"}>
                  Actions
                  <Icon name={"lightning"} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    value={"export-project"}
                    onClick={handleExportClick}
                    fontSize={"sm"}
                    disabled={exportLoading || projectArchived}
                  >
                    <Icon name={"download"} />
                    Export Project
                  </Menu.Item>
                  <Tooltip
                    content={"This Project does not contain any Entities."}
                    disabled={projectEntities?.length > 0 || projectArchived}
                    showArrow
                  >
                    <Menu.Item
                      value={"export-entities"}
                      onClick={handleExportEntitiesClick}
                      fontSize={"sm"}
                      disabled={
                        projectEntities?.length === 0 ||
                        exportEntitiesLoading ||
                        projectArchived
                      }
                    >
                      <Icon name={"download"} />
                      Export Entities
                    </Menu.Item>
                  </Tooltip>
                  <Menu.Item
                    value={"archive"}
                    onClick={() => setArchiveDialogOpen(true)}
                    fontSize={"sm"}
                    disabled={projectArchived}
                  >
                    <Icon name={"archive"} />
                    Archive
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>

            {projectArchived ? (
              <Button
                onClick={handleRestoreClick}
                size={"sm"}
                colorPalette={"orange"}
              >
                Restore
                <Icon name={"rewind"} />
              </Button>
            ) : (
              <Flex gap={"2"}>
                {editing && (
                  <Button
                    onClick={handleCancelClick}
                    size={"sm"}
                    colorPalette={"red"}
                  >
                    Cancel
                    <Icon name={"cross"} />
                  </Button>
                )}
                <Button
                  id={"editProjectButton"}
                  colorPalette={editing ? "green" : "blue"}
                  onClick={handleEditClick}
                  loadingText={"Saving..."}
                  loading={isUpdating}
                  size={"sm"}
                >
                  {editing ? "Save" : "Edit"}
                  {editing ? <Icon name={"save"} /> : <Icon name={"edit"} />}
                </Button>
              </Flex>
            )}

            {/* Version history */}
            <Drawer.Root open={historyOpen} size={"md"}>
              <Drawer.Trigger asChild>
                <Button
                  onClick={() => setHistoryOpen(true)}
                  colorPalette={"gray"}
                  size={"sm"}
                >
                  History
                  <Icon name={"clock"} />
                </Button>
              </Drawer.Trigger>
              <Drawer.Backdrop />
              <Drawer.Positioner>
                <Drawer.Content>
                  <Drawer.CloseTrigger asChild>
                    <CloseButton size="sm" />
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
                            {projectHistory.length > 0
                              ? dayjs(projectHistory[0].timestamp).fromNow()
                              : "never"}
                          </Text>
                        </Flex>
                        <Flex direction={"row"} gap={"1"}>
                          <Text fontSize={"sm"} fontWeight={"semibold"}>
                            Previous Versions:
                          </Text>
                          <Text fontSize={"sm"} fontWeight={"normal"}>
                            {projectHistory.length}
                          </Text>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Drawer.Header>

                  <Drawer.Body>
                    <VStack gap={"2"}>
                      {projectHistory && projectHistory.length > 0 ? (
                        projectHistory.map((projectVersion) => {
                          return (
                            <Card.Root
                              w={"100%"}
                              key={`v_${projectVersion.timestamp}`}
                              variant={"outline"}
                              rounded={"md"}
                              border={"1px"}
                              borderColor={"gray.300"}
                            >
                              <Card.Header p={"0"}>
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
                                    {projectVersion.name}
                                  </Text>
                                </Flex>
                              </Card.Header>

                              <Card.Body px={"2"} py={"0"}>
                                <Flex direction={"column"} gap={"2"}>
                                  {/* Description */}
                                  {_.isEqual(projectVersion.description, "") ? (
                                    <Tag.Root
                                      size={"sm"}
                                      colorPalette={"orange"}
                                    >
                                      <Tag.Label>No Description</Tag.Label>
                                    </Tag.Root>
                                  ) : (
                                    <Text fontSize={"sm"}>
                                      {_.truncate(projectVersion.description, {
                                        length: 56,
                                      })}
                                    </Text>
                                  )}

                                  <Flex direction={"row"} gap={"2"}>
                                    {/* Entities */}
                                    <Flex
                                      direction={"column"}
                                      gap={"1"}
                                      p={"2"}
                                      rounded={"md"}
                                      border={"1px"}
                                      borderColor={"gray.300"}
                                      grow={"1"}
                                    >
                                      <Text
                                        fontSize={"sm"}
                                        fontWeight={"semibold"}
                                      >
                                        Entities
                                      </Text>
                                      {projectVersion.entities.length > 0 ? (
                                        <Flex
                                          direction={"row"}
                                          gap={"2"}
                                          align={"center"}
                                        >
                                          <Tag.Root
                                            key={`v_c_${projectVersion.timestamp}_${projectVersion.entities[0]}`}
                                            size={"sm"}
                                          >
                                            <Tag.Label>
                                              <Linky
                                                type={"projects"}
                                                id={projectVersion.entities[0]}
                                                size={"sm"}
                                              />
                                            </Tag.Label>
                                          </Tag.Root>
                                          {projectVersion.entities.length >
                                            1 && (
                                            <Text
                                              fontWeight={"semibold"}
                                              fontSize={"sm"}
                                            >
                                              and{" "}
                                              {projectVersion.entities.length -
                                                1}{" "}
                                              others
                                            </Text>
                                          )}
                                        </Flex>
                                      ) : (
                                        <Text fontSize={"sm"}>No Entities</Text>
                                      )}
                                    </Flex>

                                    {/* Collaborators */}
                                    <Flex
                                      direction={"column"}
                                      gap={"1"}
                                      p={"2"}
                                      rounded={"md"}
                                      border={"1px"}
                                      borderColor={"gray.300"}
                                      grow={"1"}
                                    >
                                      <Text
                                        fontSize={"sm"}
                                        fontWeight={"semibold"}
                                      >
                                        Collaborators
                                      </Text>
                                      {projectVersion.collaborators.length >
                                      0 ? (
                                        <Flex
                                          direction={"row"}
                                          gap={"2"}
                                          align={"center"}
                                        >
                                          <Tag.Root
                                            key={`v_c_${projectVersion.timestamp}_${projectVersion.collaborators[0]}`}
                                            size={"sm"}
                                          >
                                            <Tag.Label>
                                              {projectVersion.collaborators[0]}
                                            </Tag.Label>
                                          </Tag.Root>
                                          {projectVersion.collaborators.length >
                                            1 && (
                                            <Text
                                              fontWeight={"semibold"}
                                              fontSize={"sm"}
                                            >
                                              and{" "}
                                              {projectVersion.collaborators
                                                .length - 1}{" "}
                                              others
                                            </Text>
                                          )}
                                        </Flex>
                                      ) : (
                                        <Text fontSize={"sm"}>
                                          No Collaborators
                                        </Text>
                                      )}
                                    </Flex>
                                  </Flex>
                                </Flex>
                              </Card.Body>

                              <Card.Footer p={"2"}>
                                {/* Version information */}
                                <Flex direction={"column"} gap={"2"} w={"100%"}>
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
                                            {projectVersion.version}
                                          </Tag.Label>
                                        </Tag.Root>
                                      </Flex>
                                      <Text
                                        fontWeight={"semibold"}
                                        fontSize={"xs"}
                                        color={"gray.400"}
                                      >
                                        {dayjs(
                                          projectVersion.timestamp,
                                        ).fromNow()}
                                      </Text>
                                      <Text
                                        fontSize={"sm"}
                                        fontWeight={"semibold"}
                                      >
                                        Message
                                      </Text>
                                      {_.isEqual(projectVersion.message, "") ||
                                      _.isNull(projectVersion.message) ? (
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
                                          content={projectVersion.message}
                                          disabled={
                                            projectVersion.message.length < 32
                                          }
                                          showArrow
                                        >
                                          <Text fontSize={"sm"}>
                                            {_.truncate(
                                              projectVersion.message,
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
                                          orcid={projectVersion.author}
                                          fallback={"Unknown User"}
                                          size={"md"}
                                        />
                                      </Flex>
                                    </Flex>
                                  </Flex>

                                  <Flex w={"100%"} justify={"right"}>
                                    <Button
                                      colorPalette={"orange"}
                                      size={"sm"}
                                      onClick={() => {
                                        handleRestoreFromHistoryClick(
                                          projectVersion,
                                        );
                                      }}
                                      disabled={projectArchived}
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
                          No previous versions.
                        </Text>
                      )}
                    </VStack>
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
              <Text>
                Are you sure you want to archive this Project? No Entities will
                be deleted. This Project will be moved to the Workspace archive.
              </Text>
            </AlertDialog>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"2"} p={"2"} wrap={"wrap"}>
          {/* Overview and "Description" field */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"}>
            {/* Overview */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              bg={"gray.100"}
              rounded={"md"}
              grow={"1"}
            >
              <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"1"} grow={"1"}>
                  <Text fontWeight={"bold"} fontSize={"sm"}>
                    Name
                  </Text>
                  <Input
                    id={"projectNameInput"}
                    size={"sm"}
                    value={projectName}
                    onChange={(event) => {
                      setProjectName(event.target.value);
                    }}
                    readOnly={!editing}
                    bg={"white"}
                    rounded={"md"}
                    border={"1px"}
                    borderColor={"gray.300"}
                  />
                </Flex>

                <TimestampTag
                  timestamp={project.created}
                  description={"Created"}
                />
              </Flex>

              <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"sm"}>
                    Visibility
                  </Text>
                  <VisibilityTag isPublic={false} isInherited />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"} fontSize={"sm"}>
                    Owner
                  </Text>
                  <ActorTag
                    orcid={project.owner}
                    fallback={"Unknown User"}
                    size={"md"}
                  />
                </Flex>
              </Flex>
            </Flex>

            {/* Description */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"1"}
              border={"1px"}
              borderColor={"gray.300"}
              rounded={"md"}
              basis={"40%"}
              grow={"1"}
            >
              <Text fontWeight={"bold"} fontSize={"sm"}>
                Description
              </Text>
              <MDEditor
                height={150}
                minHeight={100}
                maxHeight={400}
                id={"projectDescriptionInput"}
                style={{ width: "100%" }}
                value={projectDescription}
                preview={editing ? "edit" : "preview"}
                extraCommands={[]}
                onChange={(value) => {
                  setProjectDescription(value || "");
                }}
              />
            </Flex>
          </Flex>

          {/* "Entities" and "Collaborators" */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"}>
            {/* Entities */}
            <Flex
              direction={"column"}
              h={"fit-content"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
              w={{ base: "100%", md: "50%" }}
            >
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
              >
                {/* Entities in the Project */}
                <Text fontSize={"sm"} fontWeight={"bold"}>
                  Entities
                </Text>
                <Button
                  id={"addEntityButton"}
                  onClick={onEntitiesOpen}
                  size={"sm"}
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
                minH={projectEntities.length > 0 ? "fit-content" : "200px"}
              >
                {projectEntities && projectEntities.length > 0 ? (
                  <DataTable
                    data={projectEntities}
                    columns={entitiesColumns}
                    visibleColumns={{}}
                    selectedRows={{}}
                    viewOnly={!editing}
                    showSelection={true}
                    actions={entitiesTableActions}
                    showPagination
                    showItemCount
                  />
                ) : (
                  <Flex w={"100%"} justify={"center"} align={"center"}>
                    <Text
                      color={"gray.400"}
                      fontWeight={"semibold"}
                      fontSize={"sm"}
                    >
                      No Entities
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>

            {/* Collaborators */}
            <Flex
              direction={"column"}
              gap={"2"}
              p={"2"}
              h={"fit-content"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
              grow={"1"}
            >
              {/* Collaborators display */}
              <Flex direction={"column"}>
                <Text fontSize={"sm"} fontWeight={"bold"} mb={"2"}>
                  Collaborators
                </Text>
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root>
                        <Input
                          placeholder={"ORCiD"}
                          rounded={"md"}
                          size={"sm"}
                          value={newCollaborator}
                          onChange={(e) => setNewCollaborator(e.target.value)}
                          disabled={!editing}
                        />
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                  <Spacer />
                  <Button
                    colorPalette={"green"}
                    size={"sm"}
                    disabled={!editing}
                    onClick={() => {
                      // Prevent adding empty or duplicate collaborator
                      if (
                        newCollaborator &&
                        !projectCollaborators.includes(newCollaborator)
                      ) {
                        setProjectCollaborators((collaborators) => [
                          ...collaborators,
                          newCollaborator,
                        ]);
                        setNewCollaborator(""); // Clear the input after adding
                      }
                    }}
                  >
                    Add
                    <Icon name={"add"} />
                  </Button>
                </Flex>
                <Flex
                  w={"100%"}
                  justify={"center"}
                  align={"center"}
                  minH={
                    projectCollaborators.length > 0 ? "fit-content" : "200px"
                  }
                >
                  {projectCollaborators.length === 0 ? (
                    <Text
                      color={"gray.400"}
                      fontWeight={"semibold"}
                      fontSize={"sm"}
                    >
                      No Collaborators
                    </Text>
                  ) : (
                    <VStack align={"start"}>
                      {projectCollaborators.map((collaborator, index) => (
                        <Flex key={index} align="center">
                          <Text mr="4">{collaborator}</Text>
                          {editing && (
                            <IconButton
                              aria-label="Remove collaborator"
                              onClick={() =>
                                setProjectCollaborators((collaborators) =>
                                  collaborators.filter(
                                    (c) => c !== collaborator,
                                  ),
                                )
                              }
                            >
                              <Icon name="delete" />
                            </IconButton>
                          )}
                        </Flex>
                      ))}
                    </VStack>
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Modal to add Entities */}
        <Dialog.Root open={entitiesOpen} placement={"center"}>
          <Dialog.Trigger />
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              {/* p={"2"} gap={"0"} w={["md", "lg", "xl"]} */}
              {/* Heading and close button */}
              <Dialog.Header p={"2"}>Add Entity</Dialog.Header>
              <Dialog.Body p={"2"}>
                <SearchSelect
                  id={"entitySearchSelect"}
                  resultType={"entity"}
                  value={selectedEntity}
                  onChange={setSelectedEntity}
                />
              </Dialog.Body>

              <Dialog.Footer p={"2"}>
                <Button
                  colorPalette={"red"}
                  size={"sm"}
                  variant={"outline"}
                  onClick={onEntitiesClose}
                >
                  Cancel
                  <Icon name={"cross"} />
                </Button>

                <Spacer />

                <Button
                  id={"addEntityDoneButton"}
                  colorPalette={"green"}
                  size={"sm"}
                  onClick={() => {
                    if (id) {
                      // Add the Origin to the Entity
                      addEntities(selectedEntity);
                    }
                  }}
                >
                  Done
                  <Icon name={"check"} />
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Dialog to export Entities */}
        <Dialog.Root open={isExportOpen} size={"xl"} placement={"center"}>
          <Dialog.Trigger />
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              {/* p={"2"} w={["lg", "xl", "2xl"]} gap={"0"} */}
              {/* Heading and close button */}
              <Dialog.Header p={"2"}>Export Project</Dialog.Header>
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
                      " To export Entities alongside Project details, use JSON format."
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
                >
                  <Flex gap={"1"} align={"center"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      Format:
                    </Text>
                    <Fieldset.Root>
                      <Fieldset.Content>
                        <Field.Root>
                          <Select.Root
                            key={"select-export-format"}
                            size={"sm"}
                            collection={createListCollection({
                              items: ["JSON", "CSV"],
                            })}
                            onValueChange={(details) => {
                              setExportFormat(details.items[0].toLowerCase());

                              // Remove `entities` field if currently selected and switching to CSV format
                              if (details.items[0].toLowerCase() === "csv") {
                                setExportFields([
                                  ...exportFields.filter(
                                    (field) => field !== "entities",
                                  ),
                                ]);
                              }
                            }}
                          >
                            <Select.HiddenSelect />
                            <Select.Label>Select Export Format</Select.Label>
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
                            <Portal>
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
                    Select the Project fields to be exported.
                  </Text>
                </Flex>

                {/* Selection content */}
                <Flex
                  direction={"row"}
                  p={"2"}
                  gap={"4"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.300"}
                >
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root>
                        <Field.Label>Details</Field.Label>
                        {!loading ? (
                          <CheckboxGroup>
                            <Stack gap={2} direction={"column"}>
                              <Checkbox.Root
                                disabled
                                defaultChecked
                                size={"sm"}
                                fontSize={"sm"}
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                                <Checkbox.Label>
                                  Name: {projectName}
                                </Checkbox.Label>
                              </Checkbox.Root>
                              <Checkbox.Root
                                size={"sm"}
                                fontSize={"sm"}
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
                                <Checkbox.Label>
                                  Created:{" "}
                                  {dayjs(project.created).format("DD MMM YYYY")}
                                </Checkbox.Label>
                              </Checkbox.Root>
                              <Checkbox.Root
                                size={"sm"}
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
                                <Checkbox.Label>
                                  Owner: {project.owner}
                                </Checkbox.Label>
                              </Checkbox.Root>
                              <Checkbox.Root
                                size={"sm"}
                                checked={_.includes(
                                  exportFields,
                                  "description",
                                )}
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
                                <Checkbox.Label>
                                  <Text lineClamp={1} fontSize={"sm"}>
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
                          </CheckboxGroup>
                        ) : (
                          <Text fontSize={"sm"}>Loading details...</Text>
                        )}
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>Entities</Field.Label>
                        {!loading ? (
                          <CheckboxGroup>
                            <Tooltip
                              content={
                                "Entities cannot be included when exporting to CSV"
                              }
                              disabled={_.isEqual(exportFormat, "json")}
                              showArrow
                            >
                              <Checkbox.Root
                                size={"sm"}
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
                                <Checkbox.Label>
                                  <Text lineClamp={1} fontSize={"sm"}>
                                    Export Entities
                                  </Text>
                                </Checkbox.Label>
                              </Checkbox.Root>
                            </Tooltip>
                          </CheckboxGroup>
                        ) : (
                          <Text fontSize={"sm"}>Loading details...</Text>
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
                                <RadioGroup.Label fontSize={"sm"}>
                                  Names
                                </RadioGroup.Label>
                              </RadioGroup.Item>
                              <RadioGroup.Item value={"_id"}>
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemIndicator />
                                <RadioGroup.Label fontSize={"sm"}>
                                  Identifiers
                                </RadioGroup.Label>
                              </RadioGroup.Item>
                            </Stack>
                          </RadioGroup.Root>
                        )}
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
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
                      colorPalette={"blue"}
                      size={"sm"}
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

        {/* Save message modal */}
        <Dialog.Root
          open={isSaveMessageOpen}
          placement={"center"}
          closeOnEscape
        >
          <Dialog.Trigger />
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              {/* p={"2"} */}
              <Dialog.Header p={"2"}>
                <Flex w={"100%"} direction={"row"} gap={"2"} align={"center"}>
                  <Icon name={"save"} />
                  <Text fontWeight={"semibold"}>Saving Changes</Text>
                </Flex>
              </Dialog.Header>
              <Dialog.Body p={"2"}>
                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"sm"} color={"gray.600"}>
                    Specify a description of the changes made to the Project.
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
                <Flex direction={"row"} w={"100%"} justify={"space-between"}>
                  <Button
                    size={"sm"}
                    colorPalette={"red"}
                    onClick={() => onSaveMessageClose()}
                  >
                    Cancel
                    <Icon name={"cross"} />
                  </Button>

                  <Button
                    id={"saveMessageDoneButton"}
                    size={"sm"}
                    colorPalette={"green"}
                    onClick={() => handleSaveMessageDoneClick()}
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

export default Project;
