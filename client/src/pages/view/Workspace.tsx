// React and Chakra UI components
import React, { useEffect, useState } from "react";
import { Flex, Input, Button, Text, Heading, Code, EmptyState, Textarea } from "@chakra-ui/react";

// Custom components
import ActorTag from "@components/ActorTag";
import Collaborators from "@components/Collaborators";
import Icon from "@components/Icon";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import TimestampTag from "@components/TimestampTag";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";
import VisibilityTag from "@components/VisibilityTag";
import { createColumnHelper } from "@tanstack/react-table";

// Custom types
import { Collaborator, CounterModel, DataTableAction, IGenericItem, IResponseMessage, WorkspaceModel } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery, useMutation } from "@apollo/client/react";

// Navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";
import { removeTypename } from "@lib/util";

// Authentication
import { auth } from "@lib/auth";

// Contexts and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { usePermissions } from "@hooks/usePermissions";
import { useWorkspace } from "@hooks/useWorkspace";

// Variables
import { STYLES } from "@variables";

const Workspace = () => {
  const navigate = useNavigate();

  // Permissions
  const { workspacePermissions } = usePermissions();

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
        collaborators {
          _id
          permissions {
            administration {
              edit
              invite
            }
            entities {
              create
              edit
              archive
            }
            projects {
              create
              edit
              archive
            }
            templates {
              create
              edit
              archive
            }
          }
        }
      }
    }
  `;
  const [getWorkspace, { loading: workspaceLoading, error: workspaceError }] = useLazyQuery<{
    workspace: WorkspaceModel;
  }>(GET_WORKSPACE, { fetchPolicy: "network-only" });

  // Queries
  const GET_WORKSPACE_DATA = gql`
    query GetWorkspaceData($projectsArchived: Boolean, $entitiesArchived: Boolean) {
      projects(archived: $projectsArchived) {
        _id
        name
        archived
      }
      entities(archived: $entitiesArchived, limit: 10000) {
        entities {
          _id
          name
          archived
        }
        total
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
  const [getWorkspaceData, { loading: workspaceDataLoading, error: workspaceDataError }] = useLazyQuery<{
    entities: {
      entities: (IGenericItem & { archived: boolean })[];
      total: number;
    };
    projects: (IGenericItem & { archived: boolean })[];
    templates: (IGenericItem & { archived: boolean })[];
    counters: CounterModel[];
  }>(GET_WORKSPACE_DATA, {
    fetchPolicy: "network-only",
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
  const [archiveEntitiesQuery, { error: archiveEntitiesError, loading: archiveEntitiesLoading }] =
    useMutation(ARCHIVE_ENTITIES);

  // Mutation to archive Projects
  const ARCHIVE_PROJECTS = gql`
    mutation ArchiveProjects($toArchive: [String], $state: Boolean) {
      archiveProjects(toArchive: $toArchive, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveProjectsQuery, { error: archiveProjectsError, loading: archiveProjectsLoading }] =
    useMutation(ARCHIVE_PROJECTS);

  // Mutation to archive Templates
  const ARCHIVE_TEMPLATES = gql`
    mutation ArchiveTemplates($toArchive: [String], $state: Boolean) {
      archiveTemplates(toArchive: $toArchive, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveTemplatesQuery, { error: archiveTemplatesError, loading: archiveTemplatesLoading }] =
    useMutation(ARCHIVE_TEMPLATES);

  // Mutation to update Workspace
  const UPDATE_WORKSPACE = gql`
    mutation UpdateWorkspace($workspace: WorkspaceUpdateInput) {
      updateWorkspace(workspace: $workspace) {
        success
        message
      }
    }
  `;
  const [updateWorkspace, { loading: workspaceUpdateLoading, error: workspaceUpdateError }] =
    useMutation<IResponseMessage>(UPDATE_WORKSPACE);

  // State for Workspace details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [created, setCreated] = useState("");

  // State for Workspace contents
  const [entities, setEntities] = useState([] as (IGenericItem & { archived: boolean })[]);
  const [projects, setProjects] = useState([] as (IGenericItem & { archived: boolean })[]);
  const [templates, setTemplates] = useState([] as (IGenericItem & { archived: boolean })[]);
  const [shownEntities, setShownEntities] = useState([] as (IGenericItem & { archived: boolean })[]);
  const [selectedEntities, setSelectedEntities] = useState({});
  const [shownProjects, setShownProjects] = useState([] as (IGenericItem & { archived: boolean })[]);
  const [selectedProjects, setSelectedProjects] = useState({});
  const [shownTemplates, setShownTemplates] = useState([] as (IGenericItem & { archived: boolean })[]);
  const [selectedTemplates, setSelectedTemplates] = useState({});

  // State for current user
  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    auth.getSession().then(({ data: session }) => {
      if (session?.user) setCurrentUser(session.user.id);
    });
  }, []);

  // State for Workspace collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // State for Workspace Counters
  const [counters, setCounters] = useState<CounterModel[]>([]);

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

      const workspaceData = await getWorkspaceData({
        variables: {
          projectsArchived: true,
          entitiesArchived: true,
        },
      });
      if (workspaceData.data?.entities?.entities) {
        setEntities(workspaceData.data.entities.entities);
        setShownEntities([...workspaceData.data.entities.entities]);
        setSelectedEntities({});
      }
      if (workspaceData.data?.projects) {
        setProjects(workspaceData.data.projects);
        // Filter to only show archived projects
        setShownProjects([...workspaceData.data.projects.filter((project) => project.archived === true)]);
        setSelectedProjects({});
      }
      if (workspaceData.data?.templates) {
        setTemplates(workspaceData.data.templates);
        // Filter to only show archived templates
        setShownTemplates([...workspaceData.data.templates.filter((template) => template.archived === true)]);
        setSelectedTemplates({});
      }
      if (workspaceData.data?.counters) {
        setCounters(workspaceData.data.counters);
      }

      if (workspaceError || workspaceDataError || workspaceData.error) {
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

  // Effect to manage what contents are shown
  useEffect(() => {
    setShownEntities([...entities]);
    setSelectedEntities({});
    setShownProjects([...projects.filter((project) => project.archived === true)]);
    setSelectedProjects({});
    setShownTemplates([...templates.filter((template) => template.archived === true)]);
    setSelectedTemplates({});
  }, [entities, projects, templates]);

  /**
   * Handler function for dialog `Done` button, apply updates to the Workspace
   */
  const handleUpdateClick = async () => {
    await updateWorkspace({
      variables: {
        workspace: removeTypename({
          _id: workspace,
          name: name,
          description: description,
          owner: owner,
          public: isPublic,
          collaborators: collaborators,
        }),
      },
    });

    // Update Entity, Project, and Template archive state; each pair of calls is mutually exclusive so all six can run concurrently
    await Promise.all([
      archiveEntitiesQuery({
        variables: {
          toArchive: entities.filter((entity) => entity.archived === true).map((entity) => entity._id),
          state: true,
        },
      }),
      archiveEntitiesQuery({
        variables: {
          toArchive: entities.filter((entity) => entity.archived === false).map((entity) => entity._id),
          state: false,
        },
      }),
      archiveProjectsQuery({
        variables: {
          toArchive: projects.filter((project) => project.archived === true).map((project) => project._id),
          state: true,
        },
      }),
      archiveProjectsQuery({
        variables: {
          toArchive: projects.filter((project) => project.archived === false).map((project) => project._id),
          state: false,
        },
      }),
      archiveTemplatesQuery({
        variables: {
          toArchive: templates.filter((template) => template.archived === true).map((template) => template._id),
          state: true,
        },
      }),
      archiveTemplatesQuery({
        variables: {
          toArchive: templates.filter((template) => template.archived === false).map((template) => template._id),
          state: false,
        },
      }),
    ]);

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
          <Flex w={"100%"} justify={"space-between"} p={"0.5"} gap={"2"} align={"center"}>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 24} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), {
                  length: truncateTableText ? 12 : 24,
                })}
              </Text>
            </Tooltip>
            <Flex p={"0.5"} gap={"1"} align={"center"}>
              <Tooltip
                content={"Insufficient permissions in this Workspace"}
                disabled={workspacePermissions.entities.archive}
                showArrow
              >
                <Button
                  size={"2xs"}
                  rounded={"md"}
                  aria-label={"Restore"}
                  colorPalette={"orange"}
                  variant={"subtle"}
                  disabled={!workspacePermissions.entities.archive}
                  onClick={() => archiveEntity(info.row.original._id, false)}
                >
                  Restore
                  {<Icon name={"rewind"} size={"xs"} />}
                </Button>
              </Tooltip>
              <Button
                variant={"subtle"}
                size={"2xs"}
                rounded={"md"}
                aria-label={"View Entity"}
                onClick={() => navigate(`/entities/${info.row.original._id}`)}
              >
                View
                <Icon name={"a_right"} size={"xs"} />
              </Button>
            </Flex>
          </Flex>
        );
      },
      header: "Name",
    }),
  ];
  const entitiesTableActions: DataTableAction[] = [
    {
      label: "Restore Entities",
      icon: "rewind",
      action(table, rows) {
        const entitiesToRestore: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          entitiesToRestore.push(table.getRow(rowIndex).original._id);
        }
        archiveEntities(entitiesToRestore, false);
      },
    },
  ];

  const projectsTableColumnHelper = createColumnHelper<IGenericItem>();
  const projectsTableColumns = [
    projectsTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"space-between"} p={"0.5"} gap={"2"} align={"center"}>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 24} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), {
                  length: truncateTableText ? 12 : 24,
                })}
              </Text>
            </Tooltip>
            <Flex p={"0.5"} gap={"1"}>
              <Tooltip
                content={"Insufficient permissions in this Workspace"}
                disabled={workspacePermissions.projects.archive}
                showArrow
              >
                <Button
                  size={"2xs"}
                  rounded={"md"}
                  aria-label={"Restore Project"}
                  colorPalette={"orange"}
                  variant={"subtle"}
                  disabled={!workspacePermissions.projects.archive}
                  onClick={() => archiveProject(info.row.original._id, false)}
                >
                  Restore
                  {<Icon name={"rewind"} size={"xs"} />}
                </Button>
              </Tooltip>
              <Button
                variant={"subtle"}
                size={"2xs"}
                rounded={"md"}
                aria-label={"View Project"}
                onClick={() => navigate(`/projects/${info.row.original._id}`)}
              >
                View
                <Icon name={"a_right"} size={"xs"} />
              </Button>
            </Flex>
          </Flex>
        );
      },
      header: "Name",
    }),
  ];
  const projectsTableActions: DataTableAction[] = [
    {
      label: "Restore Projects",
      icon: "rewind",
      action(table, rows) {
        const projectsToRestore: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          projectsToRestore.push(table.getRow(rowIndex).original._id);
        }
        archiveProjects(projectsToRestore, false);
      },
    },
  ];

  const templatesTableColumnHelper = createColumnHelper<IGenericItem>();
  const templatesTableColumns = [
    templatesTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"space-between"} p={"0.5"} gap={"2"} align={"center"}>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 24} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), {
                  length: truncateTableText ? 12 : 24,
                })}
              </Text>
            </Tooltip>
            <Flex p={"0.5"} gap={"1"}>
              <Tooltip
                content={"Insufficient permissions in this Workspace"}
                disabled={workspacePermissions.templates.archive}
                showArrow
              >
                <Button
                  size={"2xs"}
                  rounded={"md"}
                  aria-label={"Restore Template"}
                  colorPalette={"orange"}
                  variant={"subtle"}
                  disabled={!workspacePermissions.templates.archive}
                  onClick={() => archiveTemplate(info.row.original._id, false)}
                >
                  Restore
                  {<Icon name={"rewind"} size={"xs"} />}
                </Button>
              </Tooltip>
              <Button
                variant={"subtle"}
                size={"2xs"}
                rounded={"md"}
                aria-label={"View Template"}
                onClick={() => navigate(`/templates/${info.row.original._id}`)}
              >
                View
                <Icon name={"a_right"} size={"xs"} />
              </Button>
            </Flex>
          </Flex>
        );
      },
      header: "Name",
    }),
  ];
  const templatesTableActions: DataTableAction[] = [
    {
      label: "Restore Templates",
      icon: "rewind",
      action(table, rows) {
        const templatesToRestore: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          templatesToRestore.push(table.getRow(rowIndex).original._id);
        }
        archiveTemplates(templatesToRestore, false);
      },
    },
  ];

  const countersTableColumnHelper = createColumnHelper<CounterModel>();
  const countersTableColumns = [
    countersTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex p={"0.5"}>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 24} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
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
              content={'Counter format string, where "{}" represents the position of the numeric value'}
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
            <Tooltip content={"Current numeric value to be substituted into the Counter format string"} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {info.getValue()}
              </Text>
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
              content={"After a Counter value is consumed, the numeric value is increment by this value"}
              showArrow
            >
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {info.getValue()}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Increment",
    }),
  ];

  return (
    <Content
      isError={!_.isUndefined(workspaceDataError) || !_.isUndefined(workspaceError)}
      isLoaded={!workspaceDataLoading && !workspaceLoading}
    >
      <Flex direction={"column"}>
        <Flex gap={"2"} p={"1"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          <Flex direction={"row"} gap={"2"} align={"center"} p={"0"} m={"0"}>
            <Flex align={"center"} gap={"1"} p={"1"} border={"2px solid"} rounded={"md"}>
              <Icon name={"workspace"} size={"sm"} />
              <Heading fontWeight={"semibold"} size={"sm"}>
                {name}
              </Heading>
            </Flex>
          </Flex>

          {workspacePermissions.administration.edit && (
            <Flex direction={"row"} align={"center"} gap={"2"}>
              <Button size={"xs"} rounded={"md"} colorPalette={"red"} onClick={() => navigate("/")}>
                Cancel
                <Icon name={"cross"} size={"xs"} />
              </Button>
              <Button
                id={"dialogWorkspaceCreateButton"}
                size={"xs"}
                rounded={"md"}
                colorPalette={"green"}
                disabled={name === ""}
                loading={
                  workspaceUpdateLoading || archiveEntitiesLoading || archiveProjectsLoading || archiveTemplatesLoading
                }
                onClick={() => handleUpdateClick()}
              >
                Save
                <Icon name={"save"} size={"xs"} />
              </Button>
            </Flex>
          )}
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Workspace Overview and Description */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Overview */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              bg={STYLES.card.bg}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              rounded={"md"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Flex direction={"column"} gap={"1"} grow={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Name
                  </Text>
                  <Input
                    id={"dialogWorkspaceName"}
                    bg={"white"}
                    size={"xs"}
                    rounded={"md"}
                    placeholder={"Name"}
                    value={name}
                    disabled={!workspacePermissions.administration.edit}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Flex>
              </Flex>

              {/* "Owner", "Timestamp", and "Visibility" fields */}
              <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Owner
                  </Text>
                  <ActorTag identifier={owner} fallback={"Unknown User"} size={"sm"} />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Timestamp
                  </Text>
                  <TimestampTag timestamp={created} description={"Created"} />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Visibility
                  </Text>
                  <VisibilityTag isPublic={isPublic} setIsPublic={setIsPublic} />
                </Flex>
              </Flex>
            </Flex>

            {/* Description */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"100%"}
              gap={"2"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              rounded={"md"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Description
              </Text>
              <Textarea
                value={description}
                size={"xs"}
                h={"100%"}
                disabled={!workspacePermissions.administration.edit}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Flex>
          </Flex>

          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"}>
            {/* Workspace collaborators */}
            <Flex w={{ base: "100%", md: "50%" }}>
              <Collaborators
                editing={true}
                currentUser={currentUser}
                owner={owner}
                collaborators={collaborators}
                setCollaborators={setCollaborators}
              />
            </Flex>

            {/* Workspace Entities */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"1"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              rounded={"md"}
              grow={"1"}
              minW={"0"}
            >
              <Flex w={"100%"} direction={"row"} gap={"1"} align={"center"} ml={"0.5"} py={"1.5"}>
                <Icon name={"entity"} size={"xs"} color={STYLES.entity.color.icon} />
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                  Archived Entities ({shownEntities.length})
                </Text>
              </Flex>
              <Flex
                w={"100%"}
                minW={"0"}
                justify={"flex-start"}
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
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"entity"} size={"lg"} color={STYLES.entity.color.default} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No Archived Entities</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                )}
              </Flex>
            </Flex>
          </Flex>

          <Flex direction={"row"} p={"0"} gap={"2"} wrap={"wrap"}>
            {/* Workspace Projects */}
            <Flex
              direction={"column"}
              p={"1"}
              gap={"1"}
              h={"fit-content"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              rounded={"md"}
              w={{ base: "100%", md: "50%" }}
              minW={"0"}
            >
              <Flex w={"100%"} direction={"row"} gap={"1"} align={"center"} ml={"0.5"} py={"1.5"}>
                <Icon name={"project"} size={"xs"} color={STYLES.project.color.icon} />
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                  Archived Projects ({shownProjects.length})
                </Text>
              </Flex>
              <Flex
                w={"100%"}
                minW={"0"}
                justify={"flex-start"}
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
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"project"} size={"lg"} color={STYLES.project.color.default} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No Archived Projects</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                )}
              </Flex>
            </Flex>

            {/* Workspace Templates */}
            <Flex
              direction={"column"}
              p={"1"}
              h={"fit-content"}
              gap={"1"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              rounded={"md"}
              grow={"1"}
              minW={"0"}
            >
              <Flex w={"100%"} direction={"row"} gap={"1"} align={"center"} ml={"0.5"} py={"1.5"}>
                <Icon name={"template"} size={"xs"} color={STYLES.template.color.icon} />
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                  Archived Templates ({shownTemplates.length})
                </Text>
              </Flex>
              <Flex
                w={"100%"}
                minW={"0"}
                justify={"flex-start"}
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
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"template"} size={"lg"} color={STYLES.template.color.default} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No Archived Templates</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                )}
              </Flex>
            </Flex>
          </Flex>

          <Flex direction={"row"} p={"0"} gap={"2"} wrap={"wrap"}>
            {/* Workspace Counters */}
            <Flex
              direction={"column"}
              p={"1"}
              gap={"1"}
              h={"fit-content"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              rounded={"md"}
              w={{ base: "100%", md: "50%" }}
              minW={"0"}
            >
              <Flex w={"100%"} direction={"row"} gap={"1"} align={"center"} ml={"0.5"} py={"1.5"}>
                <Icon name={"counter"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                  Counters
                </Text>
              </Flex>
              <Flex
                w={"100%"}
                minW={"0"}
                justify={"flex-start"}
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
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"counter"} size={"lg"} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No Counters</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Workspace;
