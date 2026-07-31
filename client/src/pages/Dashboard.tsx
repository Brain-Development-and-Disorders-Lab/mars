import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, Heading, Text, Tag, Badge, EmptyState, SkeletonText } from "@chakra-ui/react";
import { createColumnHelper, ColumnFiltersState } from "@tanstack/react-table";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import ActorTag from "@components/ActorTag";
import Linky from "@components/Linky";
import WalkthroughBeacon from "@components/WalkthroughBeacon";
import WalkthroughTooltip from "@components/WalkthroughTooltip";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";
import Joyride, { ACTIONS, CallBackProps, EVENTS } from "react-joyride";
import SearchBox from "@components/SearchBox";
import ActivityFeed from "@components/ActivityFeed";

// Existing and custom types
import {
  ProjectModel,
  EntityModel,
  EntityMetrics,
  ProjectMetrics,
  TemplateMetrics,
  CollaboratorMetrics,
  IGenericItem,
} from "@types";

// Utility functions and libraries
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";

// Contexts and hooks
import { useWorkspace } from "@hooks/useWorkspace";
import { useBreakpoint } from "@hooks/useBreakpoint";

// GraphQL mutation to mark walkthrough as seen
const UPDATE_USER = gql`
  mutation UpdateUser($user: UserInput) {
    updateUser(user: $user) {
      success
      message
    }
  }
`;

// Authentication
import { auth } from "@lib/auth";

// Variables
import { STYLES } from "@variables";

// Queries
const GET_DASHBOARD = gql`
  query GetDashboard(
    $entityLimit: Int
    $entitiesArchived: Boolean
    $projectLimit: Int
    $projectsArchived: Boolean
    $workspace: String
  ) {
    projects(limit: $projectLimit, archived: $projectsArchived) {
      _id
      owner
      name
      description
      created
      entities
    }
    projectMetrics {
      all
      addedDay
    }
    entities(limit: $entityLimit, archived: $entitiesArchived, reverse: true) {
      entities {
        _id
        archived
        owner
        name
        description
        timestamp
        attributes {
          _id
          name
        }
      }
      total
    }
    workspace(_id: $workspace) {
      _id
      name
    }
    entityMetrics {
      all
      addedDay
    }
    templateMetrics {
      all
      addedDay
    }
    collaboratorMetrics {
      all
      addedDay
    }
  }
`;

const Dashboard = () => {
  // Enable navigation
  const navigate = useNavigate();

  // Workspace context
  const { workspace } = useWorkspace();

  // Mutation to persist walkthrough completion
  const [updateUser] = useMutation(UPDATE_USER);

  // Authentication
  const { data: session, isPending: isSessionPending } = auth.useSession();
  const [user, setUser] = useState("");
  useEffect(() => {
    if (!isSessionPending && session) {
      setUser(session.user.id);
    }
  }, [isSessionPending]);

  // Page data
  const [entityData, setEntityData] = useState(
    [] as {
      _id: string;
      archived: boolean;
      name: string;
      description: string;
    }[],
  );
  const [projectData, setProjectData] = useState(
    [] as { _id: string; name: string; description: string; created: string }[],
  );

  // Display state
  const [workspaceName, setWorkspaceName] = useState<string>();

  // Metrics
  const [entityMetrics, setEntityMetrics] = useState<EntityMetrics>({} as EntityMetrics);
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics>({} as ProjectMetrics);
  const [templateMetrics, setTemplateMetrics] = useState<TemplateMetrics>({} as TemplateMetrics);
  const [collaboratorMetrics, setCollaboratorMetrics] = useState<CollaboratorMetrics>({} as CollaboratorMetrics);

  // Use custom breakpoint hook
  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    attributes: true,
    created: true,
  });

  // Column filters state for entity table
  const [entityColumnFilters, setEntityColumnFilters] = useState<ColumnFiltersState>([]);

  // Update column visibility when breakpoint changes
  useEffect(() => {
    const isMobile = breakpoint === "base" || breakpoint === "sm";
    setVisibleColumns({
      description: !isMobile,
      attributes: !isMobile,
      created: !isMobile,
    });
  }, [breakpoint]);

  // Execute GraphQL query both on page load and navigation
  const { loading, error, data } = useQuery<{
    projects: ProjectModel[];
    projectMetrics: ProjectMetrics;
    entities: { entities: EntityModel[]; total: number };
    workspace: IGenericItem;
    entityMetrics: EntityMetrics;
    templateMetrics: TemplateMetrics;
    collaboratorMetrics: CollaboratorMetrics;
  }>(GET_DASHBOARD, {
    variables: {
      projectLimit: 10,
      entityLimit: 10,
      entitiesArchived: false,
      workspace,
    },
    fetchPolicy: "network-only",
    skip: !workspace,
  });

  // Assign data
  useEffect(() => {
    if (data?.entities?.entities) {
      setEntityData(data.entities.entities);
    }
    if (data?.projects) {
      setProjectData(data.projects);
    }

    // Display state
    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }

    // Metrics
    if (data?.entityMetrics) {
      setEntityMetrics(data.entityMetrics);
    }
    if (data?.projectMetrics) {
      setProjectMetrics(data.projectMetrics);
    }
    if (data?.templateMetrics) {
      setTemplateMetrics(data.templateMetrics);
    }
    if (data?.collaboratorMetrics) {
      setCollaboratorMetrics(data.collaboratorMetrics);
    }
  }, [data]);

  // Display error messages from GraphQL usage
  useEffect(() => {
    if (error) {
      // Raised GraphQL error
      toaster.create({
        title: "Error",
        description: "Could not retrieve data for Dashboard",
        type: "error",
        duration: 4000,
        closable: true,
      });
    }
  }, [error]);

  // Configure Entity table
  const entityTableData: {
    _id: string;
    archived: boolean;
    name: string;
    description: string;
  }[] = entityData;
  const entityTableColumnHelper = createColumnHelper<EntityModel>();
  const entityTableColumns = [
    entityTableColumnHelper.accessor("name", {
      cell: (info) => (
        <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
          <Tooltip content={info.getValue()} disabled={info.getValue().length < 48} showArrow>
            <Flex gap={"1"} align={"center"}>
              <Icon name={"entity"} color={STYLES.entity.color.icon} size={"xs"} />
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 48 })}
              </Text>
            </Flex>
          </Tooltip>
          <Button
            size="2xs"
            mx={"1"}
            variant="subtle"
            colorPalette="gray"
            aria-label={"View Entity"}
            onClick={() => navigate(`/entities/${info.row.original._id}`)}
          >
            View
            <Icon name={"a_right"} />
          </Button>
        </Flex>
      ),
      header: "Name",
      meta: {
        minWidth: 300,
      },
    }),
    entityTableColumnHelper.accessor("owner", {
      cell: (info) => {
        return <ActorTag identifier={info.getValue()} fallback={"Unknown User"} size={"sm"} inline />;
      },
      header: "Owner",
      enableHiding: true,
    }),
    entityTableColumnHelper.accessor("timestamp", {
      cell: (info) => {
        return (
          <Tooltip content={dayjs(info.getValue()).format("[Created:] DD MMMM YYYY, HH:MM A")} showArrow>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
              {dayjs(info.getValue()).fromNow()}
            </Text>
          </Tooltip>
        );
      },
      header: "Created",
      enableHiding: true,
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    entityTableColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>No Description</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Flex>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 64} showArrow>
              <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 64 })}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 300,
      },
    }),
    entityTableColumnHelper.accessor("attributes", {
      cell: (info) => {
        const attributes = info.row.original.attributes;

        // 0 Attributes
        if (attributes.length === 0) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>No Attributes</Tag.Label>
            </Tag.Root>
          );
        }

        // Multiple Attributes
        if (attributes.length > 1) {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {attributes.slice(0, 1).map((attribute) => (
                <Tag.Root colorPalette={"template"}>
                  <Tag.StartElement>
                    <Icon name={"attribute"} color={STYLES.template.color.icon} size={"xs"} />
                  </Tag.StartElement>
                  <Tag.Label fontSize={"xs"}>{attribute.name}</Tag.Label>
                </Tag.Root>
              ))}
              <Text fontSize={"xs"}>
                and {attributes.length - 1} other{attributes.length - 1 !== 1 ? "s" : ""}
              </Text>
            </Flex>
          );
        } else {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {attributes.map((attribute) => (
                <Tag.Root colorPalette={"template"}>
                  <Tag.StartElement>
                    <Icon name={"attribute"} color={STYLES.template.color.icon} size={"xs"} />
                  </Tag.StartElement>
                  <Tag.Label fontSize={"xs"}>{attribute.name}</Tag.Label>
                </Tag.Root>
              ))}
            </Flex>
          );
        }
      },
      header: "Attributes",
      enableHiding: true,
      meta: {
        minWidth: 300,
      },
    }),
  ];

  // Configure Projects table
  const projectTableData: { _id: string; name: string; description: string }[] = projectData;
  const projectTableColumnHelper = createColumnHelper<ProjectModel>();
  const projectTableColumns = [
    projectTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 48} showArrow>
              <Flex gap={"1"} align={"center"}>
                <Icon name={"project"} color={STYLES.project.color.icon} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(info.getValue(), { length: 48 })}
                </Text>
              </Flex>
            </Tooltip>
            <Button
              size="2xs"
              mx={"1"}
              variant="subtle"
              colorPalette="gray"
              aria-label={"View Project"}
              onClick={() => navigate(`/projects/${info.row.original._id}`)}
            >
              View
              <Icon name={"a_right"} />
            </Button>
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 300,
      },
    }),
    projectTableColumnHelper.accessor("owner", {
      cell: (info) => {
        return <ActorTag identifier={info.getValue()} fallback={"Unknown User"} size={"sm"} inline />;
      },
      header: "Owner",
      enableHiding: true,
    }),
    projectTableColumnHelper.accessor("created", {
      cell: (info) => {
        return (
          <Tooltip content={dayjs(info.getValue()).format("[Created:] DD MMMM YYYY, HH:MM A")} showArrow>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
              {dayjs(info.getValue()).fromNow()}
            </Text>
          </Tooltip>
        );
      },
      header: "Created",
      enableHiding: true,
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    projectTableColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>No Description</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Flex>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 64} showArrow>
              <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 64 })}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 300,
      },
    }),
    projectTableColumnHelper.accessor("entities", {
      cell: (info) => {
        const entities = info.row.original.entities;

        // 0 Entities
        if (entities.length === 0) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>No Entities</Tag.Label>
            </Tag.Root>
          );
        }

        // Multiple Entities
        if (entities.length > 1) {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {entities.slice(0, 1).map((entity) => (
                <Linky type={"entities"} id={entity} />
              ))}
              <Text fontSize={"xs"}>
                and {entities.length - 1} other{entities.length - 1 !== 1 ? "s" : ""}
              </Text>
            </Flex>
          );
        } else {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {entities.map((entity) => (
                <Linky type={"entities"} id={entity} />
              ))}
            </Flex>
          );
        }
      },
      header: "Entities",
      enableHiding: true,
      meta: {
        minWidth: 300,
      },
    }),
  ];

  const walkthroughSteps = [
    {
      target: "#navDashboardButtonDesktop",
      content:
        "This the Workspace Dashboard, showing an overview of all Entities, Projects, and Activity within the Workspace.",
      title: "Dashboard",
    },
    {
      target: "#recentActivityHeader",
      content: "You can see all recent activity in the Workspace here.",
      title: "Recent Activity",
    },
    {
      target: "#navEntitiesButtonDesktop",
      content: "Here you can view all Entities in the current Workspace.",
      title: "Entities",
    },
    {
      target: "#navProjectsButtonDesktop",
      content: "Here you can view all Projects in the current Workspace.",
      title: "Projects",
    },
    {
      target: "#navTemplatesButtonDesktop",
      content: "Here you can view all Template Attributes in the current Workspace.",
      title: "Templates",
    },
    {
      target: "#workspaceSwitcherDesktop",
      content: "This shows all Workspaces you have access to and allows you to edit Workspace and account information.",
      title: "Workspace Switcher",
    },
    {
      target: "#navSearchButtonDesktop",
      content:
        "The Search page allows you to run text-based searches or construct advanced search queries on all stored metadata.",
      title: "Search",
    },
    {
      target: "#navCreateButtonDesktop",
      content: "The Create portal allows you to manually create Entities, Projects, and Template Attributes.",
      title: "Create",
    },
    {
      target: "#navImportButtonDesktop",
      content:
        breakpoint === "base"
          ? "On desktop, upload and import CSV or JSON files to create or modify Entities and Templates."
          : "Upload and import CSV or JSON files to create or modify Entities and Templates.",
      title: "Import",
    },
    {
      target: "#navScanButtonDesktop",
      content:
        "Opens an interface to accept input from a scanner. Alternatively, an Entity identifier can be specified manually.",
      title: "Scan",
    },
  ];

  /**
   * Handle events during the Joyride walkthrough
   * @param {CallBackProps} data Joyride callback function data
   */
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, type } = data;
    if ((action === ACTIONS.SKIP || type === EVENTS.TOUR_END) && session?.user) {
      updateUser({ variables: { user: { _id: session.user.id, hasSeenWalkthrough: true } } });
      auth.updateUser({ hasSeenWalkthrough: true });
    }
  };

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!!workspace && !loading}>
      <Flex direction={"column"} w={"100%"} p={"1"} gap={"2"}>
        {session?.user?.hasSeenWalkthrough !== true && !isSessionPending && breakpoint !== "base" && (
          <Joyride
            continuous
            showProgress
            steps={walkthroughSteps}
            callback={handleJoyrideCallback}
            beaconComponent={WalkthroughBeacon}
            tooltipComponent={WalkthroughTooltip}
          />
        )}

        {/* Header */}
        <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"} p={"0"}>
          <Flex direction={"column"} gap={"0"} align={"start"}>
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <Icon name={"dashboard"} size={"sm"} />
              <Heading size={"xl"}>Dashboard</Heading>
            </Flex>
            <SkeletonText noOfLines={1} my={"0.5"} h={"22px"} loading={loading} asChild>
              <Text fontSize={"sm"} fontWeight={"semibold"} color={"text.subtle"}>
                {workspaceName}
              </Text>
            </SkeletonText>
          </Flex>

          <ActorTag identifier={user} fallback={"Unknown User"} size={"md"} />
        </Flex>

        {/* Quick Search */}
        <SearchBox />

        {/* Metrics */}
        <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            flex={"1"}
            minW={"120px"}
            p={"2"}
            gap={"1"}
            bg={STYLES.card.bg}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
            rounded={"md"}
          >
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <Icon name={"entity"} size={"xs"} color={STYLES.entity.color.icon} />
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                Entities
              </Text>
            </Flex>
            <Text fontSize={"2xl"} fontWeight={"bold"} lineHeight={"1"}>
              {entityMetrics.all ?? "-"}
            </Text>
            <Badge
              px={"0"}
              variant={"plain"}
              colorPalette={entityMetrics.addedDay > 0 ? "green" : "gray"}
              fontSize={"xs"}
            >
              {entityMetrics.addedDay > 0 && <Icon name={"sort_up"} size={"xs"} />}
              {entityMetrics.addedDay > 0 ? `+${entityMetrics.addedDay} today` : "No new today"}
            </Badge>
          </Flex>

          <Flex
            direction={"column"}
            flex={"1"}
            minW={"120px"}
            p={"2"}
            gap={"1"}
            bg={STYLES.card.bg}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
            rounded={"md"}
          >
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <Icon name={"project"} size={"xs"} color={STYLES.project.color.icon} />
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                Projects
              </Text>
            </Flex>
            <Text fontSize={"2xl"} fontWeight={"bold"} lineHeight={"1"}>
              {projectMetrics.all ?? "-"}
            </Text>
            <Badge
              px={"0"}
              variant={"plain"}
              colorPalette={projectMetrics.addedDay > 0 ? "green" : "gray"}
              fontSize={"xs"}
            >
              {projectMetrics.addedDay > 0 && <Icon name={"sort_up"} size={"xs"} />}
              {projectMetrics.addedDay > 0 ? `+${projectMetrics.addedDay} today` : "No new today"}
            </Badge>
          </Flex>

          <Flex
            direction={"column"}
            flex={"1"}
            minW={"120px"}
            p={"2"}
            gap={"1"}
            bg={STYLES.card.bg}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
            rounded={"md"}
          >
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <Icon name={"template"} size={"xs"} color={STYLES.template.color.icon} />
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                Templates
              </Text>
            </Flex>
            <Text fontSize={"2xl"} fontWeight={"bold"} lineHeight={"1"}>
              {templateMetrics.all ?? "-"}
            </Text>
            <Badge
              px={"0"}
              variant={"plain"}
              colorPalette={templateMetrics.addedDay > 0 ? "green" : "gray"}
              fontSize={"xs"}
            >
              {templateMetrics.addedDay > 0 && <Icon name={"sort_up"} size={"xs"} />}
              {templateMetrics.addedDay > 0 ? `+${templateMetrics.addedDay} today` : "No new today"}
            </Badge>
          </Flex>

          {breakpoint !== "base" && breakpoint !== "sm" && (
            <Flex
              direction={"column"}
              flex={"1"}
              minW={"120px"}
              p={"2"}
              gap={"1"}
              bg={STYLES.card.bg}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              rounded={"md"}
            >
              <Flex direction={"row"} align={"center"} gap={"1"}>
                <Icon name={"person"} size={"xs"} color={"text.subtle"} />
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                  Collaborators
                </Text>
              </Flex>
              <Text fontSize={"2xl"} fontWeight={"bold"} lineHeight={"1"}>
                {collaboratorMetrics.all ?? "-"}
              </Text>
              <Badge
                px={"0"}
                variant={"plain"}
                colorPalette={collaboratorMetrics.addedDay > 0 ? "green" : "gray"}
                fontSize={"xs"}
              >
                {collaboratorMetrics.addedDay > 0 && <Icon name={"sort_up"} size={"xs"} />}
                {collaboratorMetrics.addedDay > 0 ? `+${collaboratorMetrics.addedDay} today` : "No new today"}
              </Badge>
            </Flex>
          )}
        </Flex>

        <Flex direction={"row"} wrap={{ base: "wrap", lg: "nowrap" }} gap={"2"}>
          <Flex direction={"column"} gap={"2"} flex={{ base: "1 1 100%", lg: "0 0 70%" }} minW={"0"}>
            {/* Recent Projects */}
            <Flex
              direction={"column"}
              p={"2"}
              rounded={"md"}
              gap={"2"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              minW={"0"}
              maxW={"100%"}
            >
              <Flex direction={"row"} align={"center"} gap={"1"} py={"1.5"} ml={"0.5"}>
                <Icon name={"project"} size={"xs"} color={STYLES.project.color.icon} />
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                  Recent Projects
                </Text>
              </Flex>

              {!loading && projectData.length > 0 && (
                <DataTable
                  columns={projectTableColumns}
                  data={projectTableData}
                  visibleColumns={visibleColumns}
                  selectedRows={{}}
                  fill
                />
              )}

              {!loading && _.isEmpty(projectData) && (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon name={"project"} size={"lg"} color={STYLES.project.color.default} />
                    </EmptyState.Indicator>
                    <EmptyState.Description>No Projects</EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}

              <Flex justify={"flex-end"}>
                <Button
                  size={"xs"}
                  rounded={"md"}
                  variant={"solid"}
                  colorPalette={"blue"}
                  onClick={() => navigate(`/projects`)}
                >
                  All Projects
                  <Icon name={"a_right"} size={"xs"} />
                </Button>
              </Flex>
            </Flex>

            {/* Recent Entities */}
            <Flex
              direction={"column"}
              p={"2"}
              rounded={"md"}
              gap={"2"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              minW={"0"}
              maxW={"100%"}
            >
              <Flex direction={"row"} align={"center"} gap={"1"} py={"1.5"} ml={"1.5"}>
                <Icon name={"entity"} size={"xs"} color={STYLES.entity.color.icon} />
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                  Recent Entities
                </Text>
              </Flex>

              {!loading && entityData.length > 0 && (
                <DataTable
                  columns={entityTableColumns}
                  data={entityTableData.filter(
                    (entity) => _.isEqual(entity.archived, false) || _.isEqual(entity.archived, null),
                  )}
                  visibleColumns={visibleColumns}
                  selectedRows={{}}
                  columnFilters={entityColumnFilters}
                  onColumnFiltersChange={setEntityColumnFilters}
                  fill
                />
              )}

              {!loading && _.isEmpty(entityData) && (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon name={"entity"} size={"lg"} color={STYLES.entity.color.default} />
                    </EmptyState.Indicator>
                    <EmptyState.Description>No Entities</EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}

              <Flex justify={"flex-end"}>
                <Button
                  size={"xs"}
                  rounded={"md"}
                  variant={"solid"}
                  colorPalette={"blue"}
                  onClick={() => navigate(`/entities`)}
                >
                  All Entities
                  <Icon name={"a_right"} size={"xs"} />
                </Button>
              </Flex>
            </Flex>
          </Flex>

          {/* Activity */}
          <Flex
            direction={"column"}
            gap={"2"}
            flex={{ base: "1 1 100%", lg: "0 0 30%" }}
            minW={"0"}
            pr={{ base: "", lg: "2" }}
          >
            <Flex
              direction={"column"}
              p={"2"}
              gap={"1"}
              rounded={"md"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              h={"fit-content"}
              bg={"surface.card"}
            >
              <ActivityFeed />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Dashboard;
