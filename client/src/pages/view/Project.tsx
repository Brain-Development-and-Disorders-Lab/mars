// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Dialog,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Radio,
  RadioGroup,
  Select,
  Spacer,
  Stack,
  Tag,
  TagLabel,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
  useToast,
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
import { Information } from "@components/Label";
import { UnsavedChangesModal } from "@components/WarningModal";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import {
  ProjectHistory,
  ProjectModel,
  DataTableAction,
  IGenericItem,
} from "@types";

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
  const toast = useToast();

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
  const archiveDialogRef = useRef();
  const {
    open: archiveDialogOpen,
    onOpen: onArchiveDialogOpen,
    onClose: onArchiveDialogClose,
  } = useDisclosure();

  // History drawer
  const {
    open: historyOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose,
  } = useDisclosure();

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
  const [exportEntityDetails, setExportEntityDetails] = React.useState("name");

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
      toast({
        title: "Error",
        description: "Unable to retrieve Project information",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
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
      toast({
        title: "Updated Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } catch {
      if (updateError) {
        toast({
          title: "Error",
          description: updateError.message,
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
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
      toast({
        title: "Archived Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setProjectArchived(true);
      onArchiveDialogClose();
    } else {
      toast({
        title: "Error",
        description: "An error occurred when archiving Project",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
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
      toast({
        title: "Restored Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setProjectArchived(false);
    } else {
      toast({
        title: "Error",
        description: "An error occurred when restoring Project",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
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
      toast({
        title: "Success",
        description: `Restored Project version ${projectVersion.version}`,
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Project could not be restored",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    // Close the drawer
    onHistoryClose();

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
      toast({
        title: "Error",
        description: "Project Entities could not be exported",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
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

      toast({
        title: "Info",
        description: `Generated ${format.toUpperCase()} file`,
        status: "info",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    if (exportError) {
      toast({
        title: "Error",
        description: "An error occurred exporting this Project",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
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
      id: (info: any) => info.row.original,
      cell: (info: any) => (
        <Linky id={info.row.original} type={"entities"} size={"sm"} />
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
                aria-label={"Remove entity"}
                colorPalette={"red"}
                onClick={() => handleRemoveEntity(info.row.original)}
                size={"sm"}
              />
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
            <Menu>
              <MenuButton
                as={Button}
                colorPalette={"yellow"}
                rightIcon={<Icon name={"lightning"} />}
                size={"sm"}
              >
                Actions
              </MenuButton>
              <MenuList>
                <MenuItem
                  onClick={handleExportClick}
                  icon={<Icon name={"download"} />}
                  fontSize={"sm"}
                  disabled={exportLoading || projectArchived}
                >
                  Export Project
                </MenuItem>
                <Tooltip
                  disabled={projectEntities?.length > 0 || projectArchived}
                  label={"This Project does not contain any Entities."}
                  hasArrow
                >
                  <MenuItem
                    onClick={handleExportEntitiesClick}
                    icon={<Icon name={"download"} />}
                    fontSize={"sm"}
                    disabled={
                      projectEntities?.length === 0 ||
                      exportEntitiesLoading ||
                      projectArchived
                    }
                  >
                    Export Entities
                  </MenuItem>
                </Tooltip>
                <MenuItem
                  icon={<Icon name={"archive"} />}
                  onClick={onArchiveDialogOpen}
                  fontSize={"sm"}
                  disabled={projectArchived}
                >
                  Archive
                </MenuItem>
              </MenuList>
            </Menu>

            {projectArchived ? (
              <Button
                onClick={handleRestoreClick}
                size={"sm"}
                colorPalette={"orange"}
                rightIcon={<Icon name={"rewind"} />}
              >
                Restore
              </Button>
            ) : (
              <Flex gap={"2"}>
                {editing && (
                  <Button
                    onClick={handleCancelClick}
                    size={"sm"}
                    colorPalette={"red"}
                    rightIcon={<Icon name={"cross"} />}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  id={"editProjectButton"}
                  colorPalette={editing ? "green" : "blue"}
                  rightIcon={
                    editing ? <Icon name={"save"} /> : <Icon name={"edit"} />
                  }
                  onClick={handleEditClick}
                  loadingText={"Saving..."}
                  isLoading={isUpdating}
                  size={"sm"}
                >
                  {editing ? "Save" : "Edit"}
                </Button>
              </Flex>
            )}

            <Button
              onClick={onHistoryOpen}
              colorPalette={"gray"}
              size={"sm"}
              rightIcon={<Icon name={"clock"} />}
            >
              History
            </Button>

            {/* Archive Dialog */}
            <AlertDialog
              dialogRef={archiveDialogRef}
              header={"Archive Project"}
              rightButtonAction={handleArchiveClick}
              open={archiveDialogOpen}
              onOpen={onArchiveDialogOpen}
              onClose={onArchiveDialogClose}
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
                    isReadOnly={!editing}
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
                  <ActorTag orcid={project.owner} fallback={"Unknown User"} />
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
                  rightIcon={<Icon name={"add"} />}
                  onClick={onEntitiesOpen}
                  size={"sm"}
                  disabled={!editing}
                >
                  Add
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
                  <FormControl>
                    <Input
                      placeholder={"ORCiD"}
                      rounded={"md"}
                      size={"sm"}
                      value={newCollaborator}
                      onChange={(e) => setNewCollaborator(e.target.value)}
                      disabled={!editing}
                    />
                  </FormControl>
                  <Spacer />
                  <Button
                    colorPalette={"green"}
                    rightIcon={<Icon name={"add"} />}
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
                    <VStack align="start">
                      {projectCollaborators.map((collaborator, index) => (
                        <Flex key={index} align="center">
                          <Text mr="4">{collaborator}</Text>
                          {editing && (
                            <IconButton
                              aria-label="Remove collaborator"
                              icon={<Icon name="delete" />}
                              onClick={() =>
                                setProjectCollaborators((collaborators) =>
                                  collaborators.filter(
                                    (c) => c !== collaborator,
                                  ),
                                )
                              }
                            />
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
        <Dialog.Root open={entitiesOpen} onClose={onEntitiesClose} isCentered>
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
        <Dialog.Root
          open={isExportOpen}
          onClose={onExportClose}
          size={"xl"}
          isCentered
        >
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
                    <FormControl>
                      <Select
                        size={"sm"}
                        rounded={"md"}
                        value={exportFormat}
                        onChange={(event) => {
                          setExportFormat(event.target.value);

                          // Remove `entities` field if currently selected and switching to CSV format
                          if (event.target.value === "csv") {
                            setExportFields([
                              ...exportFields.filter(
                                (field) => field !== "entities",
                              ),
                            ]);
                          }
                        }}
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
                  <FormControl>
                    <FormLabel fontSize={"sm"}>Details</FormLabel>
                    {!loading ? (
                      <CheckboxGroup>
                        <Stack spacing={2} direction={"column"}>
                          <Checkbox
                            disabled
                            defaultChecked
                            size={"sm"}
                            fontSize={"sm"}
                          >
                            Name: {projectName}
                          </Checkbox>
                          <Checkbox
                            size={"sm"}
                            fontSize={"sm"}
                            isChecked={_.includes(exportFields, "created")}
                            onChange={(event) =>
                              handleExportCheck("created", event.target.checked)
                            }
                          >
                            Created:{" "}
                            {dayjs(project.created).format("DD MMM YYYY")}
                          </Checkbox>
                          <Checkbox
                            size={"sm"}
                            isChecked={_.includes(exportFields, "owner")}
                            onChange={(event) =>
                              handleExportCheck("owner", event.target.checked)
                            }
                          >
                            Owner: {project.owner}
                          </Checkbox>
                          <Checkbox
                            size={"sm"}
                            isChecked={_.includes(exportFields, "description")}
                            onChange={(event) =>
                              handleExportCheck(
                                "description",
                                event.target.checked,
                              )
                            }
                            disabled={_.isEqual(projectDescription, "")}
                          >
                            <Text noOfLines={1} fontSize={"sm"}>
                              Description:{" "}
                              {_.isEqual(projectDescription, "")
                                ? "No description"
                                : _.truncate(projectDescription, {
                                    length: 32,
                                  })}
                            </Text>
                          </Checkbox>
                        </Stack>
                      </CheckboxGroup>
                    ) : (
                      <Text fontSize={"sm"}>Loading details...</Text>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={"sm"}>Entities</FormLabel>
                    {!loading ? (
                      <CheckboxGroup>
                        <Tooltip
                          label={
                            "Entities cannot be included when exporting to CSV"
                          }
                          hasArrow
                          disabled={_.isEqual(exportFormat, "json")}
                        >
                          <Checkbox
                            size={"sm"}
                            isChecked={_.includes(exportFields, "entities")}
                            onChange={(event) =>
                              handleExportCheck(
                                "entities",
                                event.target.checked,
                              )
                            }
                            disabled={
                              _.isEqual(projectEntities.length, 0) ||
                              _.isEqual(exportFormat, "csv")
                            }
                          >
                            <Text noOfLines={1} fontSize={"sm"}>
                              Export Entities
                            </Text>
                          </Checkbox>
                        </Tooltip>
                      </CheckboxGroup>
                    ) : (
                      <Text fontSize={"sm"}>Loading details...</Text>
                    )}
                    {_.includes(exportFields, "entities") && (
                      <RadioGroup
                        onChange={setExportEntityDetails}
                        value={exportEntityDetails}
                      >
                        <Stack direction={"row"} gap={"1"}>
                          <Radio value={"name"} size={"sm"} fontSize={"sm"}>
                            Names
                          </Radio>
                          <Radio value={"_id"} size={"sm"} fontSize={"sm"}>
                            Identifiers
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    )}
                  </FormControl>
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
          onEsc={onSaveMessageOpen}
          onClose={onSaveMessageClose}
          open={isSaveMessageOpen}
          isCentered
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

        <Drawer
          open={historyOpen}
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
            </DrawerHeader>

            <DrawerBody>
              <VStack spacing={"2"}>
                {projectHistory && projectHistory.length > 0 ? (
                  projectHistory.map((projectVersion) => {
                    return (
                      <Card
                        w={"100%"}
                        key={`v_${projectVersion.timestamp}`}
                        variant={"simple"}
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
                              <Tag size={"sm"} colorPalette={"orange"}>
                                No Description
                              </Tag>
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
                                <Text fontSize={"sm"} fontWeight={"semibold"}>
                                  Entities
                                </Text>
                                {projectVersion.entities.length > 0 ? (
                                  <Flex
                                    direction={"row"}
                                    gap={"2"}
                                    align={"center"}
                                  >
                                    <Tag
                                      key={`v_c_${projectVersion.timestamp}_${projectVersion.entities[0]}`}
                                      size={"sm"}
                                    >
                                      <TagLabel>
                                        <Linky
                                          type={"projects"}
                                          id={projectVersion.entities[0]}
                                          size={"sm"}
                                        />
                                      </TagLabel>
                                    </Tag>
                                    {projectVersion.entities.length > 1 && (
                                      <Text
                                        fontWeight={"semibold"}
                                        fontSize={"sm"}
                                      >
                                        and {projectVersion.entities.length - 1}{" "}
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
                                <Text fontSize={"sm"} fontWeight={"semibold"}>
                                  Collaborators
                                </Text>
                                {projectVersion.collaborators.length > 0 ? (
                                  <Flex
                                    direction={"row"}
                                    gap={"2"}
                                    align={"center"}
                                  >
                                    <Tag
                                      key={`v_c_${projectVersion.timestamp}_${projectVersion.collaborators[0]}`}
                                      size={"sm"}
                                    >
                                      <TagLabel>
                                        {projectVersion.collaborators[0]}
                                      </TagLabel>
                                    </Tag>
                                    {projectVersion.collaborators.length >
                                      1 && (
                                      <Text
                                        fontWeight={"semibold"}
                                        fontSize={"sm"}
                                      >
                                        and{" "}
                                        {projectVersion.collaborators.length -
                                          1}{" "}
                                        others
                                      </Text>
                                    )}
                                  </Flex>
                                ) : (
                                  <Text fontSize={"sm"}>No Collaborators</Text>
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
                                <Text fontSize={"sm"} fontWeight={"semibold"}>
                                  Version
                                </Text>
                                <Flex
                                  direction={"row"}
                                  gap={"2"}
                                  align={"center"}
                                >
                                  <Tag size={"sm"} colorPalette={"green"}>
                                    {projectVersion.version}
                                  </Tag>
                                </Flex>
                                <Text
                                  fontWeight={"semibold"}
                                  fontSize={"xs"}
                                  color={"gray.400"}
                                >
                                  {dayjs(projectVersion.timestamp).fromNow()}
                                </Text>
                                <Text fontSize={"sm"} fontWeight={"semibold"}>
                                  Message
                                </Text>
                                {_.isEqual(projectVersion.message, "") ||
                                _.isNull(projectVersion.message) ? (
                                  <Flex>
                                    <Tag size={"sm"} colorPalette={"orange"}>
                                      No Message
                                    </Tag>
                                  </Flex>
                                ) : (
                                  <Tooltip
                                    label={projectVersion.message}
                                    disabled={
                                      projectVersion.message.length < 32
                                    }
                                    hasArrow
                                  >
                                    <Text fontSize={"sm"}>
                                      {_.truncate(projectVersion.message, {
                                        length: 32,
                                      })}
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
                                <Text fontSize={"sm"} fontWeight={"semibold"}>
                                  Author
                                </Text>
                                <Flex>
                                  <ActorTag
                                    orcid={projectVersion.author}
                                    fallback={"Unknown User"}
                                  />
                                </Flex>
                              </Flex>
                            </Flex>

                            <Flex w={"100%"} justify={"right"}>
                              <Button
                                colorPalette={"orange"}
                                size={"sm"}
                                rightIcon={<Icon name={"rewind"} />}
                                onClick={() => {
                                  handleRestoreFromHistoryClick(projectVersion);
                                }}
                                disabled={projectArchived}
                              >
                                Restore
                              </Button>
                            </Flex>
                          </Flex>
                        </Card.Footer>
                      </Card>
                    );
                  })
                ) : (
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    No previous versions.
                  </Text>
                )}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Flex>
    </Content>
  );
};

export default Project;
