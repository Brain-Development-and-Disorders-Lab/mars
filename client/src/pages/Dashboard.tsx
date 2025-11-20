import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Text,
  Tag,
  Avatar,
  Stat,
  Link,
  Collapsible,
  Badge,
  Stack,
  EmptyState,
} from "@chakra-ui/react";
import { createColumnHelper, ColumnFiltersState } from "@tanstack/react-table";
import { Content } from "@components/Container";
import DataTableRemix from "@components/DataTableRemix";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import ActorTag from "@components/ActorTag";
import WalkthroughBeacon from "@components/WalkthroughBeacon";
import WalkthroughTooltip from "@components/WalkthroughTooltip";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";
import Joyride, { ACTIONS, CallBackProps, EVENTS } from "react-joyride";

// Existing and custom types
import {
  ProjectModel,
  EntityModel,
  ActivityModel,
  EntityMetrics,
  ProjectMetrics,
  TemplateMetrics,
  WorkspaceMetrics,
} from "@types";

// Utility functions and libraries
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Apollo client imports
import { useQuery, gql } from "@apollo/client";

// Contexts and hooks
import { useWorkspace } from "@hooks/useWorkspace";
import { useAuthentication } from "@hooks/useAuthentication";
import { useBreakpoint } from "@hooks/useBreakpoint";

// Queries
const GET_DASHBOARD = gql`
  query GetDashboard(
    $entityLimit: Int
    $entitiesArchived: Boolean
    $projectLimit: Int
    $projectsArchived: Boolean
    $activityLimit: Int
  ) {
    projects(limit: $projectLimit, archived: $projectsArchived) {
      _id
      name
      description
      entities
    }
    projectMetrics {
      all
      addedDay
    }
    entities(limit: $entityLimit, archived: $entitiesArchived, reverse: true) {
      _id
      archived
      name
      description
      timestamp
      attributes {
        _id
      }
    }
    entityMetrics {
      all
      addedDay
    }
    templateMetrics {
      all
      addedDay
    }
    workspaceMetrics {
      collaborators
    }
    activity(limit: $activityLimit) {
      _id
      timestamp
      type
      actor
      details
      target {
        _id
        name
        type
      }
    }
  }
`;

const Dashboard = () => {
  // Enable navigation
  const navigate = useNavigate();

  // Workspace context
  const { workspace } = useWorkspace();
  const { token, setToken } = useAuthentication();

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
    [] as { _id: string; name: string; description: string }[],
  );
  const [activityData, setActivityData] = useState([] as ActivityModel[]);

  // Metrics
  const [entityMetrics, setEntityMetrics] = useState({} as EntityMetrics);
  const [projectMetrics, setProjectMetrics] = useState({} as ProjectMetrics);
  const [templateMetrics, setTemplateMetrics] = useState({} as TemplateMetrics);
  const [workspaceMetrics, setWorkspaceMetrics] = useState(
    {} as WorkspaceMetrics,
  );
  const [lastUpdate] = useState(
    dayjs(Date.now()).format("DD MMMM YYYY[ at ]h:mm a"),
  );
  const [openStats, setOpenStats] = useState(false);

  // Use custom breakpoint hook
  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    attributes: true,
    created: true,
  });

  // Column filters state for entity table
  const [entityColumnFilters, setEntityColumnFilters] =
    useState<ColumnFiltersState>([]);

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
  const { loading, error, data, refetch } = useQuery(GET_DASHBOARD, {
    variables: {
      projectLimit: 8,
      entityLimit: 8,
      entitiesArchived: false,
      activityLimit: 12,
    },
    fetchPolicy: "network-only",
  });

  // Assign data
  useEffect(() => {
    if (data?.entities) {
      setEntityData(data.entities);
    }
    if (data?.projects) {
      setProjectData(data.projects);
    }
    if (data?.activity) {
      setActivityData(data.activity);
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
    if (data?.workspaceMetrics) {
      setWorkspaceMetrics(data.workspaceMetrics);
    }
  }, [data]);

  // If the workspace changes, refetch the data
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

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
          <Tooltip
            content={info.getValue()}
            disabled={info.getValue().length < 18}
            showArrow
          >
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              {_.truncate(info.getValue(), { length: 18 })}
            </Text>
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
    }),
    entityTableColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>Empty</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Flex>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 32}
              showArrow
            >
              <Text fontSize={"xs"}>
                {_.truncate(info.getValue(), { length: 32 })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
    }),
    entityTableColumnHelper.accessor("timestamp", {
      cell: (info) => {
        return (
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
            {dayjs(info.getValue()).fromNow()}
          </Text>
        );
      },
      header: "Created",
      enableHiding: true,
    }),
    entityTableColumnHelper.accessor("attributes", {
      cell: (info) => {
        if (_.isEqual(info.getValue().length, 0)) {
          return (
            <Tag.Root colorPalette={"orange"} size={"sm"}>
              <Tag.Label fontSize={"xs"}>None</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Tag.Root colorPalette={"green"} size={"sm"}>
            <Tag.Label fontSize={"xs"}>{info.getValue().length}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "Attributes",
      enableHiding: true,
    }),
  ];

  // Configure Projects table
  const projectTableData: { _id: string; name: string; description: string }[] =
    projectData;
  const projectTableColumnHelper = createColumnHelper<ProjectModel>();
  const projectTableColumns = [
    projectTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 20}
              showArrow
            >
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 20 })}
              </Text>
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
    }),
    projectTableColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>Empty</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Flex>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 32}
              showArrow
            >
              <Text fontSize={"xs"}>
                {_.truncate(info.getValue(), { length: 32 })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
    }),
    projectTableColumnHelper.accessor("timestamp", {
      cell: (info) => {
        return (
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
            {dayjs(info.getValue()).fromNow()}
          </Text>
        );
      },
      header: "Created",
      enableHiding: true,
    }),
    projectTableColumnHelper.accessor("entities", {
      cell: (info) => {
        if (_.isEqual(info.getValue().length, 0)) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label>None</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Tag.Root colorPalette={"green"}>
            <Tag.Label>{info.getValue().length}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "Entities",
      enableHiding: true,
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
      content:
        "Here you can view all Template Attributes in the current Workspace.",
      title: "Templates",
    },
    {
      target: "#workspaceSwitcherDesktop",
      content:
        "This shows all Workspaces you have access to and allows you to edit Workspace and account information.",
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
      content:
        "The Create portal allows you to manually create Entities, Projects, and Template Attributes.",
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
    if (action === ACTIONS.SKIP || type === EVENTS.TOUR_END) {
      // Update the token and set the `firstLogin` flag to `false`
      setToken({
        orcid: token.orcid,
        token: token.token,
        setup: token.setup,
        firstLogin: false,
      });
    }
  };

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"column"} w={"100%"} p={"2"} gap={"1"}>
        {token.firstLogin === true && breakpoint !== "base" && (
          <Joyride
            continuous
            showProgress
            steps={walkthroughSteps}
            callback={handleJoyrideCallback}
            beaconComponent={WalkthroughBeacon}
            tooltipComponent={WalkthroughTooltip}
          />
        )}
        <Flex direction={"column"} basis={"70%"} gap={"0"}>
          <Flex
            direction={"row"}
            gap={"1"}
            align={"center"}
            justify={"space-between"}
          >
            <Flex direction={"column"}>
              <Flex direction={"row"} align={"center"} gap={"2"}>
                <Icon name={"dashboard"} size={"sm"} />
                <Heading size={"xl"}>Dashboard</Heading>
              </Flex>
              <Flex direction={"column"} gap={"1"}>
                {/* Display last update when on desktop */}
                {breakpoint !== "base" && (
                  <Flex direction={"row"} gap={"1"}>
                    <Text
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      color={"gray.700"}
                    >
                      Last Update:
                    </Text>
                    <Text
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      color={"gray.400"}
                    >
                      {lastUpdate}
                    </Text>
                  </Flex>
                )}
                {/* Display toggle for stats */}
              </Flex>
            </Flex>
            <Flex>
              <ActorTag
                orcid={token.orcid}
                fallback={"Unknown User"}
                size={"md"}
              />
            </Flex>
          </Flex>

          <Collapsible.Root onOpenChange={(event) => setOpenStats(event.open)}>
            <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
              <Collapsible.Trigger>
                <Link
                  fontSize={"xs"}
                  fontWeight={"semibold"}
                  color={"gray.700"}
                >
                  {openStats ? "Hide" : "Show"} Workspace Metrics{" "}
                </Link>
              </Collapsible.Trigger>
              <Flex pt={"1"}>
                <Icon name={openStats ? "c_up" : "c_down"} size={"xs"} />
              </Flex>
            </Flex>

            <Collapsible.Content>
              <Flex
                p={"2"}
                gap={"2"}
                rounded={"md"}
                basis={"30%"}
                align={"center"}
                border={"1px solid"}
                borderColor={"gray.300"}
              >
                <Stat.Root>
                  <Stat.Label fontSize={"xs"}>
                    Total Workspace Entities
                  </Stat.Label>
                  <Stat.ValueText fontSize={"md"}>
                    {entityMetrics.all}
                  </Stat.ValueText>
                  <Badge
                    px={"0"}
                    variant={"plain"}
                    colorPalette={entityMetrics.addedDay > 0 ? "green" : "gray"}
                  >
                    {entityMetrics.addedDay > 0 && <Stat.UpIndicator />}
                    {entityMetrics.addedDay} in last 24 hours
                  </Badge>
                </Stat.Root>

                <Stat.Root>
                  <Stat.Label fontSize={"xs"}>
                    Total Workspace Projects
                  </Stat.Label>
                  <Stat.ValueText fontSize={"md"}>
                    {projectMetrics.all}
                  </Stat.ValueText>
                  <Badge
                    px={"0"}
                    variant={"plain"}
                    colorPalette={
                      projectMetrics.addedDay > 0 ? "green" : "gray"
                    }
                  >
                    {projectMetrics.addedDay > 0 && <Stat.UpIndicator />}
                    {projectMetrics.addedDay} in last 24 hours
                  </Badge>
                </Stat.Root>

                <Stat.Root>
                  <Stat.Label fontSize={"xs"}>
                    Total Workspace Templates
                  </Stat.Label>
                  <Stat.ValueText fontSize={"md"}>
                    {templateMetrics.all}
                  </Stat.ValueText>
                  <Badge
                    px={"0"}
                    variant={"plain"}
                    colorPalette={
                      templateMetrics.addedDay > 0 ? "green" : "gray"
                    }
                  >
                    {templateMetrics.addedDay > 0 && <Stat.UpIndicator />}
                    {templateMetrics.addedDay} in last 24 hours
                  </Badge>
                </Stat.Root>

                <Stat.Root>
                  <Stat.Label fontSize={"xs"}>
                    Total Workspace Collaborators
                  </Stat.Label>
                  <Stat.ValueText fontSize={"md"}>
                    {workspaceMetrics.collaborators}
                  </Stat.ValueText>
                  <Badge px={"0"} variant={"plain"} colorPalette={"gray"}>
                    No change
                  </Badge>
                </Stat.Root>
              </Flex>
            </Collapsible.Content>
          </Collapsible.Root>
        </Flex>

        <Flex direction={"row"} wrap={"wrap"} gap={"2"} p={"0"}>
          <Flex
            direction={"column"}
            gap={"2"}
            grow={"1"}
            minW={"0"}
            maxW={"100%"}
          >
            {/* Projects and Entities */}
            <Flex
              direction={"column"}
              p={"2"}
              background={"white"}
              rounded={"md"}
              gap={"1"}
              border={"1px solid"}
              borderColor={"gray.300"}
              minW={"0"}
              maxW={"100%"}
            >
              {/* Projects heading */}
              <Flex direction={"row"} align={"center"} gap={"1"} ml={"0.5"}>
                <Icon name={"project"} size={"sm"} />
                <Heading size={"md"}>Recent Projects</Heading>
              </Flex>

              {/* Projects table */}
              {/* Condition: Loaded and content present */}
              {!loading && projectData.length > 0 && (
                <DataTableRemix
                  columns={projectTableColumns}
                  data={projectTableData}
                  visibleColumns={visibleColumns}
                  selectedRows={{}}
                  fill
                />
              )}

              {/* Condition: Loaded and no content present */}
              {!loading && _.isEmpty(projectData) && (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon name={"project"} size={"lg"} />
                    </EmptyState.Indicator>
                    <EmptyState.Description>No Projects</EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}

              <Flex justify={"right"}>
                <Button
                  key={`view-projects-all`}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"blue"}
                  onClick={() => navigate(`/projects`)}
                >
                  All Projects
                  <Icon name={"c_right"} size={"xs"} />
                </Button>
              </Flex>
            </Flex>

            <Flex
              direction={"column"}
              p={"2"}
              background={"white"}
              rounded={"md"}
              gap={"1"}
              border={"1px solid"}
              borderColor={"gray.300"}
              minW={"0"}
              maxW={"100%"}
            >
              {/* Entities heading */}
              <Flex direction={"row"} align={"center"} gap={"1"} ml={"0.5"}>
                <Icon name={"entity"} size={"sm"} />
                <Heading size={"md"}>Recent Entities</Heading>
              </Flex>

              {/* Entities table */}
              {/* Condition: Loaded and content present */}
              {!loading && entityData.length > 0 && (
                <DataTableRemix
                  columns={entityTableColumns}
                  data={entityTableData.filter(
                    (entity) =>
                      _.isEqual(entity.archived, false) ||
                      _.isEqual(entity.archived, null),
                  )}
                  visibleColumns={visibleColumns}
                  selectedRows={{}}
                  columnFilters={entityColumnFilters}
                  onColumnFiltersChange={setEntityColumnFilters}
                  fill
                />
              )}

              {/* Condition: Loaded and no content present */}
              {!loading && _.isEmpty(entityData) && (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon name={"entity"} size={"lg"} />
                    </EmptyState.Indicator>
                    <EmptyState.Description>No Entities</EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}

              <Flex justify={"right"}>
                <Button
                  key={`view-entity-all`}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"blue"}
                  onClick={() => navigate(`/entities`)}
                >
                  All Entities
                  <Icon name={"c_right"} />
                </Button>
              </Flex>
            </Flex>
          </Flex>

          {/* Activity */}
          <Flex
            direction={"column"}
            maxW={{ lg: "md" }}
            p={"2"}
            gap={"1"}
            grow={"1"}
            rounded={"md"}
            border={"1px solid"}
            borderColor={"gray.300"}
            h={"fit-content"}
          >
            {/* Activity heading */}
            <Flex
              id={"recentActivityHeader"}
              align={"center"}
              gap={"2"}
              ml={"0.5"}
            >
              <Icon name={"activity"} size={"sm"} />
              <Heading size={"md"} color={"gray.700"}>
                Recent Activity
              </Heading>
            </Flex>

            {/* Activity list */}
            {activityData.length > 0 ? (
              <Flex py={"1"} w={"100%"} h={"auto"} overflowY={"auto"}>
                <Stack gap={"2"} w={"95%"}>
                  {activityData.map((activity) => {
                    return (
                      <Flex
                        direction={"row"}
                        width={"100%"}
                        gap={"2"}
                        key={`activity-${activity._id}`}
                        align={"center"}
                      >
                        <Avatar.Root
                          size={"xs"}
                          key={activity.actor}
                          colorPalette={"blue"}
                        >
                          <Avatar.Fallback name={activity.actor} />
                        </Avatar.Root>
                        <Flex direction={"column"} w={"100%"} gap={"0.5"}>
                          <Flex
                            direction={"row"}
                            gap={"1"}
                            justify={"space-between"}
                          >
                            <Text fontSize={"xs"}>{activity.details}:</Text>
                            <Text
                              fontSize={"xs"}
                              fontWeight={"semibold"}
                              color={"gray.500"}
                            >
                              {dayjs(activity.timestamp).fromNow()}
                            </Text>
                          </Flex>
                          <Flex>
                            <Linky
                              id={activity.target._id}
                              type={activity.target.type}
                              fallback={activity.target.name}
                              justify={"left"}
                              size={"xs"}
                              truncate={20}
                            />
                          </Flex>
                        </Flex>
                      </Flex>
                    );
                  })}
                </Stack>
              </Flex>
            ) : (
              <EmptyState.Root>
                <EmptyState.Content>
                  <EmptyState.Indicator>
                    <Icon name={"activity"} size={"lg"} />
                  </EmptyState.Indicator>
                  <EmptyState.Description>
                    No recent Activity.
                  </EmptyState.Description>
                </EmptyState.Content>
              </EmptyState.Root>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Dashboard;
