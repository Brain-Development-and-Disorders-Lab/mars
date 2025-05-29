// React and Chakra UI components
import React, { useEffect, useState } from "react";
import {
  Flex,
  Input,
  Button,
  Text,
  Heading,
  Code,
  Fieldset,
  Field,
} from "@chakra-ui/react";

// Custom components
import ActorTag from "@components/ActorTag";
import Collaborators from "@components/Collaborators";
import Icon from "@components/Icon";
import DataTable from "@components/DataTable";
import { Content } from "@components/Container";
import TimestampTag from "@components/TimestampTag";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";
import VisibilityTag from "@components/VisibilityTag";
import MDEditor from "@uiw/react-md-editor";
import { createColumnHelper } from "@tanstack/react-table";

// Custom types
import {
  CounterModel,
  DataTableAction,
  IGenericItem,
  IResponseMessage,
  WorkspaceModel,
} from "@types";

// GraphQL imports
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// Navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";

// Contexts and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { useWorkspace } from "@hooks/useWorkspace";

const Workspace = () => {
  const navigate = useNavigate();

  // Query to get a Workspace
  const GET_WORKSPACE = gql`
    query GetWorkspace($_id: String) {
      workspace(_id: $_id) {
        _id
        name
        owner
        public
        timestamp
        description
        collaborators
      }
    }
  `;
  const [getWorkspace, { loading: workspaceLoading, error: workspaceError }] =
    useLazyQuery<{
      workspace: WorkspaceModel;
    }>(GET_WORKSPACE, { fetchPolicy: "network-only" });

  // Queries
  const GET_WORKSPACE_DATA = gql`
    query GetWorkspaceData($archived: Boolean) {
      projects {
        _id
        name
        archived
      }
      entities(archived: $archived) {
        _id
        name
        archived
      }
      templates {
        _id
        name
        archived
      }
      counters {
        _id
        name
        current
        format
        increment
      }
    }
  `;
  const [
    getWorkspaceData,
    { loading: workspaceDataLoading, error: workspaceDataError },
  ] = useLazyQuery<{
    entities: (IGenericItem & { archived: boolean })[];
    projects: (IGenericItem & { archived: boolean })[];
    templates: (IGenericItem & { archived: boolean })[];
    counters: CounterModel[];
  }>(GET_WORKSPACE_DATA, {
    fetchPolicy: "network-only",
    variables: {
      archived: true,
    },
  });

  // Mutation to archive Entities
  const ARCHIVE_ENTITIES = gql`
    mutation ArchiveEntities($toArchive: [String], $state: Boolean) {
      archiveEntities(toArchive: $toArchive, state: $state) {
        success
        message
      }
    }
  `;
  const [
    archiveEntitiesQuery,
    { error: archiveEntitiesError, loading: archiveEntitiesLoading },
  ] = useMutation(ARCHIVE_ENTITIES);

  // Mutation to archive Projects
  const ARCHIVE_PROJECTS = gql`
    mutation ArchiveProjects($toArchive: [String], $state: Boolean) {
      archiveProjects(toArchive: $toArchive, state: $state) {
        success
        message
      }
    }
  `;
  const [
    archiveProjectsQuery,
    { error: archiveProjectsError, loading: archiveProjectsLoading },
  ] = useMutation(ARCHIVE_PROJECTS);

  // Mutation to archive Templates
  const ARCHIVE_TEMPLATES = gql`
    mutation ArchiveTemplates($toArchive: [String], $state: Boolean) {
      archiveTemplates(toArchive: $toArchive, state: $state) {
        success
        message
      }
    }
  `;
  const [
    archiveTemplatesQuery,
    { error: archiveTemplatesError, loading: archiveTemplatesLoading },
  ] = useMutation(ARCHIVE_TEMPLATES);

  // Mutation to update Workspace
  const UPDATE_WORKSPACE = gql`
    mutation UpdateWorkspace($workspace: WorkspaceUpdateInput) {
      updateWorkspace(workspace: $workspace) {
        success
        message
      }
    }
  `;
  const [
    updateWorkspace,
    { loading: workspaceUpdateLoading, error: workspaceUpdateError },
  ] = useMutation<IResponseMessage>(UPDATE_WORKSPACE);

  // State for Workspace details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [created, setCreated] = useState("");

  // State for Workspace contents
  const [entities, setEntities] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [projects, setProjects] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [templates, setTemplates] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [shownEntities, setShownEntities] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [selectedEntities, setSelectedEntities] = useState({});
  const [shownProjects, setShownProjects] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [selectedProjects, setSelectedProjects] = useState({});
  const [shownTemplates, setShownTemplates] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [selectedTemplates, setSelectedTemplates] = useState({});

  // State for Workspace content presentation (show archived or not)
  const [showArchivedEntities, setShowArchivedEntities] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const [showArchivedTemplates, setShowArchivedTemplates] = useState(false);

  // State for Workspace collaborators
  const [collaborators, setCollaborators] = useState([] as string[]);

  // State for Workspace Counters
  const [counters, setCounters] = useState([] as CounterModel[]);

  // State for Workspace privacy
  const [isPublic, setIsPublic] = useState(false);

  const { workspace } = useWorkspace();

  useEffect(() => {
    const refreshWorkspace = async () => {
      // Get the Workspace information
      const workspaceResult = await getWorkspace({
        variables: {
          _id: workspace,
        },
      });
      if (workspaceResult.data?.workspace) {
        setName(workspaceResult.data.workspace.name);
        setOwner(workspaceResult.data.workspace.owner);
        setCreated(workspaceResult.data.workspace.timestamp);
        setDescription(workspaceResult.data.workspace.description);
        setCollaborators(workspaceResult.data.workspace.collaborators);
        setIsPublic(workspaceResult.data.workspace.public);
      }

      // Get all Workspace data
      const workspaceData = await getWorkspaceData();
      if (workspaceData.data?.entities) {
        setEntities(workspaceData.data.entities);
        setShownEntities([
          ...workspaceData.data.entities.filter(
            (entity) => entity.archived === showArchivedEntities,
          ),
        ]);
        setSelectedEntities({});
      }
      if (workspaceData.data?.projects) {
        setProjects(workspaceData.data.projects);
        setShownProjects([
          ...workspaceData.data.projects.filter(
            (project) => project.archived === showArchivedProjects,
          ),
        ]);
        setSelectedProjects({});
      }
      if (workspaceData.data?.templates) {
        setTemplates(workspaceData.data.templates);
        setShownTemplates([
          ...workspaceData.data.templates.filter(
            (template) => template.archived === showArchivedTemplates,
          ),
        ]);
        setSelectedTemplates({});
      }
      if (workspaceData.data?.counters) {
        setCounters(workspaceData.data.counters);
      }

      if (workspaceError || workspaceDataError) {
        toaster.create({
          title: "Error",
          description: "Unable to refresh Workspace information",
          type: "error",
          duration: 2000,
          closable: true,
        });
      }
    };

    // Refresh the Workspace information when the identifier changes
    refreshWorkspace();
  }, [workspace]);

  // Effect to manage what contents are shown when `showArchived` is changed or archive state changed
  useEffect(() => {
    setShownEntities([
      ...entities.filter((entity) => entity.archived === showArchivedEntities),
    ]);
    setSelectedEntities({});
    setShownProjects([
      ...projects.filter(
        (project) => project.archived === showArchivedProjects,
      ),
    ]);
    setSelectedProjects({});
    setShownTemplates([
      ...templates.filter(
        (template) => template.archived === showArchivedTemplates,
      ),
    ]);
    setSelectedTemplates({});
  }, [
    entities,
    projects,
    templates,
    showArchivedEntities,
    showArchivedProjects,
    showArchivedTemplates,
  ]);

  /**
   * Handler function for modal `Done` button, apply updates to the Workspace
   */
  const handleUpdateClick = async () => {
    await updateWorkspace({
      variables: {
        workspace: {
          _id: workspace,
          name: name,
          description: description,
          owner: owner,
          public: isPublic,
          collaborators: collaborators,
          entities: entities.map((e) => e._id),
          projects: projects.map((p) => p._id),
          templates: templates.map((t) => t._id),
        },
      },
    });

    // Update Entity archive state
    await archiveEntitiesQuery({
      variables: {
        toArchive: entities
          .filter((entity) => entity.archived === true)
          .map((entity) => entity._id),
        state: true,
      },
    });
    await archiveEntitiesQuery({
      variables: {
        toArchive: entities
          .filter((entity) => entity.archived === false)
          .map((entity) => entity._id),
        state: false,
      },
    });

    // Update Project archive state
    await archiveProjectsQuery({
      variables: {
        toArchive: projects
          .filter((project) => project.archived === true)
          .map((project) => project._id),
        state: true,
      },
    });
    await archiveProjectsQuery({
      variables: {
        toArchive: projects
          .filter((project) => project.archived === false)
          .map((project) => project._id),
        state: false,
      },
    });

    // Update Template archive state
    await archiveTemplatesQuery({
      variables: {
        toArchive: templates
          .filter((template) => template.archived === true)
          .map((template) => template._id),
        state: true,
      },
    });
    await archiveTemplatesQuery({
      variables: {
        toArchive: templates
          .filter((template) => template.archived === false)
          .map((template) => template._id),
        state: false,
      },
    });

    if (workspaceUpdateError) {
      toaster.create({
        title: "Error",
        description: "Unable to update Workspace",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (archiveEntitiesError) {
      toaster.create({
        title: "Error",
        description: "Unable to apply archive state to Entities",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (archiveProjectsError) {
      toaster.create({
        title: "Error",
        description: "Unable to apply archive state to Projects",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (archiveTemplatesError) {
      toaster.create({
        title: "Error",
        description: "Unable to apply archive state to Templates",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else {
      navigate("/");
    }
  };

  const { isBreakpointActive } = useBreakpoint();
  const truncateTableText = !isBreakpointActive("md", "up");

  // Utility functions for archiving or restoring Workspace contents
  const archiveEntity = async (_id: string, state: boolean) => {
    // Clone and update the local collection of Entities
    const updated = _.cloneDeep(entities);
    updated.map((entity) => {
      if (_.isEqual(entity._id, _id)) {
        entity.archived = state;
      }
    });
    setEntities(updated);
  };

  const archiveEntities = (toArchive: string[], state: boolean) => {
    const updated = _.cloneDeep(entities);
    updated.map((entity) => {
      if (_.includes(toArchive, entity._id)) {
        entity.archived = state;
      }
    });
    setEntities(updated);
  };

  const archiveProject = async (_id: string, state: boolean) => {
    // Clone and update the local collection of Projects
    const updated = _.cloneDeep(projects);
    updated.map((project) => {
      if (_.isEqual(project._id, _id)) {
        project.archived = state;
      }
    });
    setProjects(updated);
  };

  const archiveProjects = (toArchive: string[], state: boolean) => {
    const updated = _.cloneDeep(projects);
    updated.map((project) => {
      if (_.includes(toArchive, project._id)) {
        project.archived = state;
      }
    });
    setProjects(updated);
  };

  const archiveTemplate = async (_id: string, state: boolean) => {
    // Clone and update the local collection of Templates
    const updated = _.cloneDeep(templates);
    updated.map((template) => {
      if (_.isEqual(template._id, _id)) {
        template.archived = state;
      }
    });
    setTemplates(updated);
  };

  const archiveTemplates = (toArchive: string[], state: boolean) => {
    const updated = _.cloneDeep(templates);
    updated.map((template) => {
      if (_.includes(toArchive, template._id)) {
        template.archived = state;
      }
    });
    setTemplates(updated);
  };

  // Setup `DataTable` components
  const entitiesTableColumnHelper = createColumnHelper<IGenericItem>();
  const entitiesTableColumns = [
    entitiesTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 24}
              showArrow
            >
              <Text>
                {_.truncate(info.getValue(), {
                  length: truncateTableText ? 12 : 24,
                })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Name",
    }),
    entitiesTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"} p={"0.5"} gap={"2"}>
            <Button
              size={"sm"}
              rounded={"md"}
              aria-label={"Archive Entity"}
              colorPalette={"orange"}
              onClick={() =>
                archiveEntity(info.row.original._id, !showArchivedEntities)
              }
            >
              {showArchivedEntities ? "Restore" : "Archive"}
              {<Icon name={showArchivedEntities ? "rewind" : "archive"} />}
            </Button>
            <Button
              variant={"subtle"}
              size={"sm"}
              rounded={"md"}
              aria-label={"View Entity"}
              onClick={() => navigate(`/entities/${info.row.original._id}`)}
            >
              View
              <Icon name={"a_right"} />
            </Button>
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const entitiesTableActions: DataTableAction[] = [
    {
      label: showArchivedEntities ? "Restore Entities" : "Archive Entities",
      icon: showArchivedEntities ? "rewind" : "archive",
      action(table, rows) {
        const entitiesToArchive: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          entitiesToArchive.push(table.getRow(rowIndex).original._id);
        }
        archiveEntities(entitiesToArchive, !showArchivedEntities);
      },
    },
  ];

  const projectsTableColumnHelper = createColumnHelper<IGenericItem>();
  const projectsTableColumns = [
    projectsTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 24}
              showArrow
            >
              <Text>
                {_.truncate(info.getValue(), {
                  length: truncateTableText ? 12 : 24,
                })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Name",
    }),
    projectsTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"} p={"0.5"} gap={"2"}>
            <Button
              size={"sm"}
              rounded={"md"}
              aria-label={"Archive Project"}
              colorPalette={"orange"}
              onClick={() =>
                archiveProject(info.row.original._id, !showArchivedProjects)
              }
            >
              {showArchivedProjects ? "Restore" : "Archive"}
              {<Icon name={showArchivedProjects ? "rewind" : "archive"} />}
            </Button>
            <Button
              variant={"subtle"}
              size={"sm"}
              rounded={"md"}
              aria-label={"View Project"}
              onClick={() => navigate(`/projects/${info.row.original._id}`)}
            >
              View
              <Icon name={"a_right"} />
            </Button>
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const projectsTableActions: DataTableAction[] = [
    {
      label: showArchivedProjects ? "Restore Projects" : "Archive Projects",
      icon: showArchivedProjects ? "rewind" : "archive",
      action(table, rows) {
        const projectsToArchive: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          projectsToArchive.push(table.getRow(rowIndex).original._id);
        }
        archiveProjects(projectsToArchive, !showArchivedProjects);
      },
    },
  ];

  const templatesTableColumnHelper = createColumnHelper<IGenericItem>();
  const templatesTableColumns = [
    templatesTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 24}
              showArrow
            >
              <Text>
                {_.truncate(info.getValue(), {
                  length: truncateTableText ? 12 : 24,
                })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Name",
    }),
    templatesTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"} p={"0.5"} gap={"2"}>
            <Button
              size={"sm"}
              rounded={"md"}
              aria-label={"Archive Template"}
              colorPalette={"orange"}
              onClick={() =>
                archiveTemplate(info.row.original._id, !showArchivedTemplates)
              }
            >
              {showArchivedTemplates ? "Restore" : "Archive"}
              {<Icon name={showArchivedTemplates ? "rewind" : "archive"} />}
            </Button>
            <Button
              variant={"subtle"}
              size={"sm"}
              rounded={"md"}
              aria-label={"View Template"}
              onClick={() => navigate(`/templates/${info.row.original._id}`)}
            >
              View
              <Icon name={"a_right"} />
            </Button>
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const templatesTableActions: DataTableAction[] = [
    {
      label: showArchivedTemplates ? "Restore Templates" : "Archive Templates",
      icon: showArchivedTemplates ? "rewind" : "archive",
      action(table, rows) {
        const templatesToArchive: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          templatesToArchive.push(table.getRow(rowIndex).original._id);
        }
        archiveTemplates(templatesToArchive, !showArchivedTemplates);
      },
    },
  ];

  const countersTableColumnHelper = createColumnHelper<CounterModel>();
  const countersTableColumns = [
    countersTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex py={"2"}>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 24}
              showArrow
            >
              <Text>
                {_.truncate(info.getValue(), {
                  length: truncateTableText ? 12 : 24,
                })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Name",
    }),
    countersTableColumnHelper.accessor("format", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip
              content={
                'Counter format string, where "{}" represents the position of the numeric value'
              }
              showArrow
            >
              <Code>{info.getValue()}</Code>
            </Tooltip>
          </Flex>
        );
      },
      header: "Format",
    }),
    countersTableColumnHelper.accessor("current", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip
              content={
                "Current numeric value to be substituted into the Counter format string"
              }
              showArrow
            >
              <Text fontWeight={"semibold"}>{info.getValue()}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Current",
    }),
    countersTableColumnHelper.accessor("increment", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip
              content={
                "After a Counter value is consumed, the numeric value is increment by this value"
              }
              showArrow
            >
              <Text fontWeight={"semibold"}>{info.getValue()}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Increment",
    }),
  ];

  return (
    <Content
      isError={
        !_.isUndefined(workspaceDataError) || !_.isUndefined(workspaceError)
      }
      isLoaded={!workspaceDataLoading && !workspaceLoading}
    >
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
          align={"center"}
          gap={"2"}
          p={"2"}
          border={"2px solid"}
          rounded={"md"}
        >
          <Icon name={"workspace"} size={"md"} />
          <Heading fontWeight={"semibold"} size={"md"}>
            {name}
          </Heading>
        </Flex>
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Button
            size={"sm"}
            rounded={"md"}
            colorPalette={"red"}
            onClick={() => navigate("/")}
          >
            Cancel
            <Icon name={"cross"} />
          </Button>
          <Button
            id={"modalWorkspaceCreateButton"}
            size={"sm"}
            rounded={"md"}
            colorPalette={"green"}
            disabled={name === ""}
            loading={
              workspaceUpdateLoading ||
              archiveEntitiesLoading ||
              archiveProjectsLoading ||
              archiveTemplatesLoading
            }
            onClick={() => handleUpdateClick()}
          >
            Save
            <Icon name={"save"} />
          </Button>
        </Flex>
      </Flex>

      <Flex direction={"column"} gap={"2"} p={"2"}>
        <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"}>
          {/* Workspace name */}
          <Flex
            direction={"column"}
            p={"2"}
            h={"fit-content"}
            w={{ base: "100%", md: "50%" }}
            gap={"2"}
            bg={"gray.100"}
            rounded={"md"}
          >
            <Flex direction={"row"} gap={"2"}>
              <Flex grow={"1"}>
                <Fieldset.Root>
                  <Fieldset.Content>
                    <Field.Root required>
                      <Field.Label>
                        Name
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"modalWorkspaceName"}
                        bg={"white"}
                        size={"sm"}
                        rounded={"md"}
                        placeholder={"Name"}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
              </Flex>

              <TimestampTag timestamp={created} description={"Created"} />
            </Flex>

            {/* "Visibility" and "Owner" fields */}
            <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
              <Flex direction={"column"} gap={"1"}>
                <Text fontWeight={"semibold"} fontSize={"sm"}>
                  Visibility
                </Text>
                <VisibilityTag isPublic={isPublic} setIsPublic={setIsPublic} />
              </Flex>

              <Flex direction={"column"} gap={"1"}>
                <Text fontWeight={"semibold"} fontSize={"sm"}>
                  Owner
                </Text>
                <Flex>
                  <ActorTag
                    orcid={owner}
                    fallback={"Unknown User"}
                    size={"md"}
                  />
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          {/* Workspace description */}
          <Flex
            direction={"row"}
            p={"2"}
            h={"fit-content"}
            gap={"2"}
            border={"1px solid"}
            borderColor={"gray.300"}
            rounded={"md"}
            grow={"1"}
          >
            <Fieldset.Root>
              <Fieldset.Content>
                <Field.Root>
                  <Field.Label>Description</Field.Label>
                  <MDEditor
                    height={150}
                    minHeight={100}
                    maxHeight={400}
                    style={{ width: "100%" }}
                    value={description}
                    preview={"edit"}
                    extraCommands={[]}
                    onChange={(value) => {
                      setDescription(value || "");
                    }}
                  />
                </Field.Root>
              </Fieldset.Content>
            </Fieldset.Root>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"}>
          {/* Workspace collaborators */}
          <Flex w={{ base: "100%", md: "50%" }}>
            <Collaborators
              editing={true}
              projectCollaborators={collaborators}
              setProjectCollaborators={setCollaborators}
            />
          </Flex>

          {/* Workspace Entities */}
          <Flex
            direction={"column"}
            p={"2"}
            h={"fit-content"}
            gap={"2"}
            border={"1px solid"}
            borderColor={"gray.300"}
            rounded={"md"}
            grow={"1"}
          >
            <Flex w={"100%"} align={"center"} justify={"space-between"}>
              <Text fontSize={"sm"} fontWeight={"semibold"}>
                {showArchivedEntities ? "Archived " : ""}Entities
              </Text>
              <Button
                colorPalette={"blue"}
                size={"sm"}
                rounded={"md"}
                onClick={() => setShowArchivedEntities(!showArchivedEntities)}
              >
                {showArchivedEntities ? "Hide" : "Show"} Archived
                <Icon name={"archive"} />
              </Button>
            </Flex>
            <Flex
              w={"100%"}
              justify={"center"}
              align={shownEntities.length > 0 ? "" : "center"}
              minH={shownEntities.length > 0 ? "fit-content" : "200px"}
            >
              {shownEntities.length > 0 ? (
                <DataTable
                  data={shownEntities}
                  columns={entitiesTableColumns}
                  visibleColumns={{}}
                  selectedRows={selectedEntities}
                  actions={entitiesTableActions}
                  showPagination
                  showSelection
                />
              ) : (
                <Text color={"gray.400"} fontWeight={"semibold"}>
                  No {showArchivedEntities ? "archived " : ""}Entities
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>

        <Flex direction={"row"} p={"0"} gap={"2"} wrap={"wrap"}>
          {/* Workspace Projects */}
          <Flex
            direction={"column"}
            p={"2"}
            gap={"2"}
            h={"fit-content"}
            border={"1px solid"}
            borderColor={"gray.300"}
            rounded={"md"}
            basis={"50%"}
          >
            <Flex w={"100%"} align={"center"} justify={"space-between"}>
              <Text fontSize={"sm"} fontWeight={"semibold"}>
                {showArchivedProjects ? "Archived " : ""}Projects
              </Text>
              <Button
                colorPalette={"blue"}
                size={"sm"}
                rounded={"md"}
                onClick={() => setShowArchivedProjects(!showArchivedProjects)}
              >
                {showArchivedProjects ? "Hide" : "Show"} Archived
                <Icon name={"archive"} />
              </Button>
            </Flex>
            <Flex
              w={"100%"}
              justify={"center"}
              align={shownProjects.length > 0 ? "" : "center"}
              minH={shownProjects.length > 0 ? "fit-content" : "200px"}
            >
              {shownProjects.length > 0 ? (
                <DataTable
                  data={shownProjects}
                  columns={projectsTableColumns}
                  visibleColumns={{}}
                  selectedRows={selectedProjects}
                  actions={projectsTableActions}
                  showPagination
                  showSelection
                />
              ) : (
                <Text color={"gray.400"} fontWeight={"semibold"}>
                  No {showArchivedProjects ? "archived " : ""}Projects
                </Text>
              )}
            </Flex>
          </Flex>

          {/* Workspace Templates */}
          <Flex
            direction={"column"}
            p={"2"}
            h={"fit-content"}
            gap={"2"}
            border={"1px solid"}
            borderColor={"gray.300"}
            rounded={"md"}
            grow={"1"}
          >
            <Flex w={"100%"} align={"center"} justify={"space-between"}>
              <Text fontSize={"sm"} fontWeight={"semibold"}>
                {showArchivedTemplates ? "Archived " : ""}Templates
              </Text>
              <Button
                colorPalette={"blue"}
                size={"sm"}
                rounded={"md"}
                onClick={() => setShowArchivedTemplates(!showArchivedTemplates)}
              >
                {showArchivedTemplates ? "Hide" : "Show"} Archived
                <Icon name={"archive"} />
              </Button>
            </Flex>
            <Flex
              w={"100%"}
              justify={"center"}
              align={shownTemplates.length > 0 ? "" : "center"}
              minH={shownTemplates.length > 0 ? "fit-content" : "200px"}
            >
              {shownTemplates.length > 0 ? (
                <DataTable
                  data={shownTemplates}
                  columns={templatesTableColumns}
                  visibleColumns={{}}
                  selectedRows={selectedTemplates}
                  actions={templatesTableActions}
                  showPagination
                  showSelection
                />
              ) : (
                <Text color={"gray.400"} fontWeight={"semibold"}>
                  No {showArchivedTemplates ? "archived " : ""}Templates
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>

        <Flex direction={"row"} p={"0"} gap={"2"} wrap={"wrap"}>
          {/* Workspace Counters */}
          <Flex
            direction={"column"}
            p={"2"}
            gap={"2"}
            h={"fit-content"}
            border={"1px solid"}
            borderColor={"gray.300"}
            rounded={"md"}
            basis={"50%"}
          >
            <Fieldset.Root>
              <Fieldset.Content>
                <Field.Root>
                  <Field.Label>Counters</Field.Label>
                  <Flex
                    w={"100%"}
                    justify={"center"}
                    align={counters.length > 0 ? "" : "center"}
                    minH={counters.length > 0 ? "fit-content" : "200px"}
                  >
                    {counters.length > 0 ? (
                      <DataTable
                        data={counters}
                        columns={countersTableColumns}
                        visibleColumns={{}}
                        actions={[]}
                        selectedRows={{}}
                        showPagination
                      />
                    ) : (
                      <Text color={"gray.400"} fontWeight={"semibold"}>
                        No Counters
                      </Text>
                    )}
                  </Flex>
                </Field.Root>
              </Fieldset.Content>
            </Fieldset.Root>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Workspace;
