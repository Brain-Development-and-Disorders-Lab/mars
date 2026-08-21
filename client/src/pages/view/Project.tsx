// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  CloseButton,
  Dialog,
  EmptyState,
  Flex,
  Menu,
  Spacer,
  Tag,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import ExportDialog from "@components/ExportDialog";
import HistoryDrawer from "@components/HistoryDrawer";
import Icon from "@components/Icon";
import AlertDialog from "@components/AlertDialog";
import MultiEntitySelect from "@components/MultiEntitySelect";
import ProjectBreadcrumb from "@components/ProjectBreadcrumb";
import ProjectOverviewCard from "@components/ProjectOverviewCard";
import ProjectEntitiesTable from "@components/ProjectEntitiesTable";
import Tooltip from "@components/Tooltip";
import { UnsavedChangesDialog } from "@components/UnsavedChangesDialog";
import { toaster } from "@components/Toast";
import SaveDialog from "@components/SaveDialog";

// Existing and custom types
import { ProjectHistory, ProjectModel, IGenericItem, ResponseData, EntityModel, WorkspaceModel } from "@types";

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
import { STYLES } from "@variables";

const Project = () => {
  const { id } = useParams();
  const client = useApolloClient();

  // Permissions
  const { workspacePermissions } = usePermissions();

  // Workspace information
  const { workspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceIsPublic, setWorkspaceIsPublic] = useState(false);

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
        isPublic
      }
    }
  `;
  const { loading, error, data } = useQuery<{
    project: ProjectModel;
    projectEntities: EntityModel[];
    workspace: WorkspaceModel;
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
      setWorkspaceIsPublic(data.workspace.isPublic);
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

  /**
   * Preview a Project as it was at an earlier point in time
   */
  const handlePreviewVersion = (projectVersion: ProjectHistory) => {
    setPreviewVersion(projectVersion);
    setHistoryOpen(false);
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
              <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
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
          <ProjectBreadcrumb
            loading={loading}
            workspaceName={workspaceName}
            onNavigateHome={() => navigate("/")}
            onNavigateProjects={() => navigate("/projects")}
            archived={displayProjectArchived}
            name={displayProjectName}
          />

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
                <Button colorPalette={"action"} size={"xs"} rounded={"md"}>
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
            <HistoryDrawer
              type={"project"}
              open={historyOpen}
              onOpenChange={setHistoryOpen}
              history={projectHistory}
              archived={projectArchived}
              previewActive={!!previewVersion}
              canRestore={workspacePermissions.projects.archive}
              onPreview={handlePreviewVersion}
              onRestore={handleRestoreFromHistoryClick}
            />

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
          <ProjectOverviewCard
            name={previewVersion ? displayProjectName : projectName}
            onNameChange={setProjectName}
            nameReadOnly={!editing || !!previewVersion}
            owner={project.owner}
            created={project.created}
            visibilityIsPublic={workspaceIsPublic}
            description={previewVersion ? displayProjectDescription : projectDescription}
            onDescriptionChange={setProjectDescription}
            descriptionReadOnly={!(editing && !previewVersion)}
          />

          {/* Project Entities */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            <ProjectEntitiesTable
              entities={entitiesTableData}
              entityCount={projectEntities.length}
              editing={editing && !previewVersion}
              onView={(entityId) => navigate(`/entities/${entityId}`)}
              onRemove={handleRemoveEntity}
              onRemoveMany={handleRemoveEntities}
              onAddClick={() => setEntitiesOpen(true)}
              addDisabled={!editing || !!previewVersion}
            />
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
                bg={"project.light"}
                color={"project.dark"}
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
                    colorPalette={"project"}
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

              <Dialog.Footer p={"2"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
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

export default Project;
