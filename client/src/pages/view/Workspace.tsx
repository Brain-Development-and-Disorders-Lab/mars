// React and Chakra UI components
import React, { useEffect, useRef, useState } from "react";
import {
  Flex,
  Input,
  Button,
  Text,
  Heading,
  Code,
  EmptyState,
  Textarea,
  Tabs,
  Breadcrumb,
  Tag,
  useDisclosure,
  Spacer,
  Dialog,
  CloseButton,
  IconButton,
} from "@chakra-ui/react";

// Custom components
import TagActor from "@components/TagActor";
import Collaborators from "@components/Collaborators";
import DialogCreateCounter from "@components/DialogCreateCounter";
import DialogCreateIdentifierFormat from "@components/DialogCreateIdentifierFormat";
import Icon from "@components/Icon";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import TagTimestamp from "@components/TagTimestamp";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";
import { DialogUnsavedChanges } from "@components/DialogUnsavedChanges";
import TagVisibility from "@components/TagVisibility";
import { createColumnHelper } from "@tanstack/react-table";

// Custom types
import {
  Collaborator,
  CounterModel,
  DataTableAction,
  IdentifierFormatModel,
  IGenericItem,
  IResponseMessage,
  WorkspaceModel,
} from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery, useMutation } from "@apollo/client/react";

// Navigation
import { useNavigate, useBlocker } from "react-router-dom";

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
import QRCode from "react-qr-code";

const Workspace = () => {
  const navigate = useNavigate();

  // Permissions
  const { workspacePermissions } = usePermissions();

  // Enabling the "Edit" button requires one of the Workspace editing permissions
  const canEditWorkspace =
    workspacePermissions.administration.edit ||
    workspacePermissions.administration.invite ||
    workspacePermissions.entities.archive ||
    workspacePermissions.projects.archive ||
    workspacePermissions.templates.archive;

  // Query to get a Workspace
  const GET_WORKSPACE = gql`
    query GetWorkspace($_id: String) {
      workspace(_id: $_id) {
        _id
        name
        owner
        isPublic
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
  const [getWorkspaceData, { loading: workspaceDataLoading, error: workspaceDataError }] = useLazyQuery<{
    entities: {
      entities: (IGenericItem & { archived: boolean })[];
      total: number;
    };
    projects: (IGenericItem & { archived: boolean })[];
    templates: (IGenericItem & { archived: boolean })[];
    counters: CounterModel[];
    identifierFormats: IdentifierFormatModel[];
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

  // State for Workspace editing
  const [editing, setEditing] = useState(false);

  // Navigation blocker to prompt for unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => editing && currentLocation.pathname !== nextLocation.pathname,
  );
  const { onClose: onBlockerClose } = useDisclosure();
  const cancelBlockerRef = useRef(null);

  // State for Workspace details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [created, setCreated] = useState("");

  // State for Workspace contents
  const [activeTab, setActiveTab] = useState<"entities" | "projects" | "templates">("entities");
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
  const { data: session } = auth.useSession();
  const currentUser = session?.user.id ?? "";

  // State for Workspace collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // State for Workspace Counters
  const [counters, setCounters] = useState<CounterModel[]>([]);
  const [openCreateCounter, setOpenCreateCounter] = useState(false);

  // State for Workspace Custom Identifier Formats
  const [identifierFormats, setIdentifierFormats] = useState<IdentifierFormatModel[]>([]);
  const [openCreateIdentifierFormat, setOpenCreateIdentifierFormat] = useState(false);

  // State for Workspace privacy
  const [isPublic, setIsPublic] = useState(false);

  // Share dialog
  const [shareOpen, setShareOpen] = useState(false);

  const { workspace } = useWorkspace();

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
      setIsPublic(workspaceResult.data.workspace.isPublic);
    }

    const workspaceData = await getWorkspaceData({
      variables: {
        projectsArchived: true,
        entitiesArchived: true,
      },
    });
    if (workspaceData.data?.entities?.entities) {
      setEntities(workspaceData.data.entities.entities);
      // Filter to only show archived Entities
      setShownEntities([...workspaceData.data.entities.entities].filter((entity) => entity.archived === true));
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
    if (workspaceData.data?.identifierFormats) {
      setIdentifierFormats(workspaceData.data.identifierFormats);
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

  useEffect(() => {
    // Refresh the Workspace information when the identifier changes
    refreshWorkspace();
  }, [workspace]);

  // Effect to manage what contents are shown
  useEffect(() => {
    setShownEntities([...entities.filter((entity) => entity.archived === true)]);
    setSelectedEntities({});
    setShownProjects([...projects.filter((project) => project.archived === true)]);
    setSelectedProjects({});
    setShownTemplates([...templates.filter((template) => template.archived === true)]);
    setSelectedTemplates({});
  }, [entities, projects, templates]);

  /**
   * Handler function for the `Cancel` button, discard any unsaved edits by re-fetching the Workspace
   */
  const handleCancelClick = async () => {
    await refreshWorkspace();
    setEditing(false);
  };

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
          isPublic: isPublic,
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
      setEditing(false);
    }
  };

  /**
   * Handler function for the Counter creation dialog
   */
  const handleCounterCreated = async () => {
    const workspaceData = await getWorkspaceData({
      variables: {
        projectsArchived: true,
        entitiesArchived: true,
      },
    });
    if (workspaceData.data?.counters) {
      setCounters(workspaceData.data.counters);
    }
  };

  /**
   * Handler function for the Identifier Format creation dialog
   */
  const handleIdentifierFormatCreated = async () => {
    const workspaceData = await getWorkspaceData({
      variables: {
        projectsArchived: true,
        entitiesArchived: true,
      },
    });
    if (workspaceData.data?.identifierFormats) {
      setIdentifierFormats(workspaceData.data.identifierFormats);
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
              <Flex direction={"row"} gap={"1"}>
                <Icon name={"entity"} size={"xs"} color={STYLES.entity.color.icon} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(info.getValue(), {
                    length: truncateTableText ? 12 : 24,
                  })}
                </Text>
              </Flex>
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
                  disabled={!workspacePermissions.entities.archive || !editing}
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
      disabled: !workspacePermissions.entities.archive || !editing,
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
              <Flex direction={"row"} gap={"1"}>
                <Icon name={"project"} size={"xs"} color={STYLES.project.color.icon} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(info.getValue(), {
                    length: truncateTableText ? 12 : 24,
                  })}
                </Text>
              </Flex>
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
                  disabled={!workspacePermissions.projects.archive || !editing}
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
      disabled: !workspacePermissions.projects.archive || !editing,
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
              <Flex direction={"row"} gap={"1"}>
                <Icon name={"template"} size={"xs"} color={STYLES.template.color.icon} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(info.getValue(), {
                    length: truncateTableText ? 12 : 24,
                  })}
                </Text>
              </Flex>
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
                  disabled={!workspacePermissions.templates.archive || !editing}
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
      disabled: !workspacePermissions.templates.archive || !editing,
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
              <Flex direction={"row"} gap={"1"}>
                <Icon name={"counter"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(info.getValue(), {
                    length: truncateTableText ? 12 : 24,
                  })}
                </Text>
              </Flex>
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
      header: "Current Value",
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

  const identifierFormatsTableColumnHelper = createColumnHelper<IdentifierFormatModel>();
  const identifierFormatTableColumns = [
    identifierFormatsTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex p={"0.5"}>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 24} showArrow>
              <Flex direction={"row"} gap={"1"}>
                <Icon name={"format"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(info.getValue(), {
                    length: truncateTableText ? 12 : 24,
                  })}
                </Text>
              </Flex>
            </Tooltip>
          </Flex>
        );
      },
      header: "Name",
    }),
    identifierFormatsTableColumnHelper.accessor("fixedLength", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip content={"Required length of the identifier"} showArrow>
              <Text fontSize={"xs"}>{info.getValue()}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Fixed Length",
      meta: {
        maxWidth: 20,
      },
    }),
    identifierFormatsTableColumnHelper.accessor("alphanumericOnly", {
      cell: (info) => {
        const formatOptions = info.row.original;
        const specifications = [];
        if (formatOptions.alphanumericOnly) {
          specifications.push("Alphanumeric");
        }
        if (formatOptions.lettersOnly) {
          specifications.push("Letters");
        }
        if (formatOptions.numbersOnly) {
          specifications.push("Numbers");
        }
        if (formatOptions.allowSpecialCharacters) {
          specifications.push("Special Characters");
        }
        if (formatOptions.uppercaseRequired) {
          specifications.push("Uppercase");
        }
        return (
          <Flex direction={"row"} gap={"1"}>
            {specifications.map((specification) => {
              return (
                <Tag.Root colorPalette={"blue"}>
                  <Tag.Label>{specification}</Tag.Label>
                </Tag.Root>
              );
            })}
          </Flex>
        );
      },
      header: "Requirements",
      meta: {
        minWidth: 300,
      },
    }),
  ];

  return (
    <Content
      isError={!_.isUndefined(workspaceDataError) || !_.isUndefined(workspaceError)}
      isLoaded={!workspaceDataLoading && !workspaceLoading}
    >
      <Flex direction={"column"}>
        <Flex gap={"2"} p={"1"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          <Flex direction={"row"} gap={"2"} align={"center"} p={"0"} m={"0"} ml={"0.5"}>
            <Breadcrumb.Root>
              <Breadcrumb.List>
                <Breadcrumb.Item gap={"1"}>
                  <Icon name={"workspace"} size={"xs"} color={"black"} />
                  Workspaces
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
              </Breadcrumb.List>
            </Breadcrumb.Root>
            <Flex align={"center"} gap={"1"} p={"1"} border={"2px solid"} rounded={"md"}>
              <Icon name={"workspace"} size={"sm"} />
              <Heading fontWeight={"semibold"} size={"sm"}>
                {_.truncate(name, { length: isBreakpointActive("md", "down") ? 12 : 24 })}
              </Heading>
            </Flex>
          </Flex>

          <Spacer />

          {!editing && (
            <Flex direction={"row"} align={"center"} gap={"2"}>
              <Tooltip content={"Insufficient permissions in this Workspace"} disabled={canEditWorkspace} showArrow>
                <Button
                  id={"dialogWorkspaceEditButton"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"blue"}
                  disabled={!canEditWorkspace}
                  onClick={() => setEditing(!editing)}
                >
                  Edit
                  <Icon name={"edit"} size={"xs"} />
                </Button>
              </Tooltip>
            </Flex>
          )}

          {editing && (
            <Flex direction={"row"} align={"center"} gap={"2"}>
              <Button size={"xs"} rounded={"md"} colorPalette={"red"} onClick={() => handleCancelClick()}>
                Cancel
                <Icon name={"cross"} size={"xs"} />
              </Button>
              <Button
                id={"dialogWorkspaceSaveButton"}
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

          <Flex direction={"row"} align={"center"} gap={"2"}>
            <Tooltip content={"Workspace visibility must be set to Public"} disabled={isPublic} showArrow>
              <Button
                id={"dialogWorkspaceShareButton"}
                size={"xs"}
                rounded={"md"}
                colorPalette={"teal"}
                disabled={!isPublic}
                onClick={() => setShareOpen(!shareOpen)}
              >
                Share
                <Icon name={"share"} size={"xs"} />
              </Button>
            </Tooltip>
          </Flex>
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
                    disabled={!workspacePermissions.administration.edit || !editing}
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
                  <TagActor identifier={owner} fallback={"Unknown User"} size={"sm"} />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Timestamp
                  </Text>
                  <TagTimestamp timestamp={created} description={"Created"} />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Visibility
                  </Text>
                  <Tooltip
                    content={"Only Workspace owners can modify visibility"}
                    disabled={currentUser === owner}
                    showArrow
                  >
                    <TagVisibility
                      isPublic={isPublic}
                      setIsPublic={setIsPublic}
                      disabled={!editing || currentUser !== owner}
                    />
                  </Tooltip>
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
                disabled={!workspacePermissions.administration.edit || !editing}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Flex>
          </Flex>

          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"}>
            {/* Workspace collaborators */}
            <Flex w={{ base: "100%", md: "50%" }}>
              <Collaborators
                editing={editing}
                currentUser={currentUser}
                owner={owner}
                collaborators={collaborators}
                setCollaborators={setCollaborators}
              />
            </Flex>

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
                <Icon name={"archive"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                  Archived
                </Text>
              </Flex>

              <Tabs.Root
                w={"100%"}
                value={activeTab}
                onValueChange={(details) => setActiveTab(details.value as "entities" | "projects" | "templates")}
              >
                <Flex
                  bg={"surface.muted"}
                  rounded={"md"}
                  p={"0.5"}
                  gap={"0.5"}
                  w={"fit-content"}
                  mb={"1"}
                  border={"1px solid"}
                  borderColor={"border.default"}
                >
                  <Button
                    size={"xs"}
                    rounded={"sm"}
                    variant={"ghost"}
                    colorPalette={"gray"}
                    bg={activeTab === "entities" ? "white" : "transparent"}
                    color={"text.default"}
                    fontWeight={activeTab === "entities" ? "semibold" : "medium"}
                    shadow={activeTab === "entities" ? "xs" : "none"}
                    _hover={{ bg: activeTab === "entities" ? "white" : "surface.card" }}
                    onClick={() => setActiveTab("entities")}
                  >
                    <Icon name={"entity"} size={"xs"} color={STYLES.entity.color.icon} />
                    Archived Entities
                  </Button>
                  <Button
                    size={"xs"}
                    rounded={"sm"}
                    variant={"ghost"}
                    colorPalette={"gray"}
                    bg={activeTab === "projects" ? "white" : "transparent"}
                    color={"text.default"}
                    fontWeight={activeTab === "projects" ? "semibold" : "medium"}
                    shadow={activeTab === "projects" ? "xs" : "none"}
                    _hover={{ bg: activeTab === "projects" ? "white" : "surface.card" }}
                    onClick={() => setActiveTab("projects")}
                  >
                    <Icon name={"project"} size={"xs"} color={STYLES.project.color.icon} />
                    Archived Projects
                  </Button>
                  <Button
                    size={"xs"}
                    rounded={"sm"}
                    variant={"ghost"}
                    colorPalette={"gray"}
                    bg={activeTab === "templates" ? "white" : "transparent"}
                    color={"text.default"}
                    fontWeight={activeTab === "templates" ? "semibold" : "medium"}
                    shadow={activeTab === "templates" ? "xs" : "none"}
                    _hover={{ bg: activeTab === "templates" ? "white" : "surface.card" }}
                    onClick={() => setActiveTab("templates")}
                  >
                    <Icon name={"template"} size={"xs"} color={STYLES.template.color.icon} />
                    Archived Templates
                  </Button>
                </Flex>

                {/* Archived Entities */}
                <Tabs.Content value={"entities"} p={"0"} pt={"1"}>
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
                </Tabs.Content>

                {/* Archived Projects */}
                <Tabs.Content value={"projects"} p={"0"} pt={"1"}>
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
                </Tabs.Content>

                {/* Archived Templates */}
                <Tabs.Content value={"templates"} p={"0"} pt={"1"}>
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
                </Tabs.Content>
              </Tabs.Root>
            </Flex>
          </Flex>

          <Flex direction={"row"} p={"0"} gap={"2"} wrap={"wrap"}>
            {/* Workspace Identifier Formats */}
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
              <Flex
                w={"100%"}
                direction={"row"}
                justify={"space-between"}
                gap={"1"}
                align={"center"}
                ml={"0.5"}
                p={"0"}
              >
                <Flex direction={"row"} align={"center"}>
                  <Icon name={"format"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Custom Identifier Formats
                  </Text>
                </Flex>

                <Button
                  id={"dialogWorkspaceAddCustomIdentifierFormatButton"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  disabled={!editing}
                  onClick={() => setOpenCreateIdentifierFormat(true)}
                >
                  Create
                  <Icon name={"add"} size={"xs"} />
                </Button>
              </Flex>

              <Flex
                w={"100%"}
                minW={"0"}
                justify={"flex-start"}
                align={identifierFormats.length > 0 ? "" : "center"}
                minH={identifierFormats.length > 0 ? "fit-content" : "200px"}
              >
                {identifierFormats.length > 0 ? (
                  <DataTable
                    data={identifierFormats}
                    columns={identifierFormatTableColumns}
                    visibleColumns={{}}
                    actions={[]}
                    selectedRows={{}}
                    showPagination
                  />
                ) : (
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"format"} size={"lg"} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No Custom Identifier Formats</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                )}
              </Flex>
            </Flex>

            {/* Workspace Counters */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              rounded={"md"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex
                w={"100%"}
                direction={"row"}
                gap={"1"}
                align={"center"}
                justify={"space-between"}
                ml={"0.5"}
                pb={"1"}
              >
                <Flex direction={"row"} align={"center"}>
                  <Icon name={"counter"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Counters
                  </Text>
                </Flex>

                <Button
                  id={"dialogWorkspaceAddCounterButton"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  disabled={!editing}
                  onClick={() => setOpenCreateCounter(true)}
                >
                  Create
                  <Icon name={"add"} size={"xs"} />
                </Button>
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
                  Share Workspace
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
                      value={`https://app.metadatify.com/public/${workspace}`}
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
                      await navigator.clipboard.writeText(`https://app.metadatify.com/public/${workspace}`);
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
                      value={workspace}
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
                      await navigator.clipboard.writeText(`${workspace}`);
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
                    <QRCode id={`${workspace}_qr`} value={`${workspace}`} size={80} />
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

      {/* Create Counter dialog */}
      <DialogCreateCounter
        open={openCreateCounter}
        onClose={() => setOpenCreateCounter(false)}
        onCreated={handleCounterCreated}
      />

      {/* Create identifier format dialog */}
      <DialogCreateIdentifierFormat
        open={openCreateIdentifierFormat}
        onClose={() => setOpenCreateIdentifierFormat(false)}
        onCreated={handleIdentifierFormatCreated}
      />

      {/* Blocker warning message */}
      <DialogUnsavedChanges
        blocker={blocker}
        cancelBlockerRef={cancelBlockerRef}
        onClose={onBlockerClose}
        callback={onBlockerClose}
      />
    </Content>
  );
};

export default Workspace;
