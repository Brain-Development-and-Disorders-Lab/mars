import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Text,
  useToast,
  useBreakpoint,
  Tag,
  VStack,
  Avatar,
  Tooltip,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Spacer,
  Link,
  useDisclosure,
  Collapse,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import ActorTag from "@components/ActorTag";
import WalkthroughBeacon from "@components/WalkthroughBeacon";
import WalkthroughTooltip from "@components/WalkthroughTooltip";
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

// Contexts
import { useWorkspace } from "@hooks/useWorkspace";
import { useAuthentication } from "@hooks/useAuthentication";

// Queries
const GET_DASHBOARD = gql`
  query GetDashboard(
    $projectLimit: Int
    $entityLimit: Int
    $entitiesArchived: Boolean
    $activityLimit: Int
  ) {
    projects(limit: $projectLimit) {
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

  // Toast to show errors
  const toast = useToast();

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
  const { isOpen, onToggle } = useDisclosure();

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
      toast({
        title: "Error",
        description: "Could not retrieve data for Dashboard",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [error]);

  // Effect to adjust column visibility
  const breakpoint = useBreakpoint({ ssr: false });
  const [visibleColumns, setVisibleColumns] = useState({});
  useEffect(() => {
    if (
      _.isEqual(breakpoint, "sm") ||
      _.isEqual(breakpoint, "base") ||
      _.isUndefined(breakpoint)
    ) {
      setVisibleColumns({ description: false, attributes: false });
    } else {
      setVisibleColumns({});
    }
  }, [breakpoint]);

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
        <Tooltip label={info.getValue()} placement={"top"}>
          <Text noOfLines={1} fontWeight={"semibold"}>
            {_.truncate(info.getValue(), { length: 24 })}
          </Text>
        </Tooltip>
      ),
      header: "Name",
    }),
    entityTableColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <Tag colorScheme={"orange"}>No Description</Tag>;
        }
        return (
          <Tooltip
            label={info.getValue()}
            placement={"top"}
            isDisabled={info.getValue().length < 30}
          >
            <Text noOfLines={1}>
              {_.truncate(info.getValue(), { length: 30 })}
            </Text>
          </Tooltip>
        );
      },
      header: "Description",
      enableHiding: true,
    }),
    entityTableColumnHelper.accessor("attributes", {
      cell: (info) => {
        if (_.isEqual(info.getValue().length, 0)) {
          return <Tag colorScheme={"orange"}>None</Tag>;
        }
        return <Tag colorScheme={"green"}>{info.getValue().length}</Tag>;
      },
      header: "Attributes",
      enableHiding: true,
    }),
    entityTableColumnHelper.accessor("timestamp", {
      cell: (info) => {
        return (
          <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.600"}>
            {dayjs(info.getValue()).fromNow()}
          </Text>
        );
      },
      header: "Created",
      enableHiding: true,
    }),
    entityTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"} p={"2"} align={"center"} gap={"1"}>
            <Link onClick={() => navigate(`/entities/${info.getValue()}`)}>
              <Text fontWeight={"semibold"}>View</Text>
            </Link>
            <Icon name={"a_right"} />
          </Flex>
        );
      },
      header: "",
    }),
  ];

  // Configure Projects table
  const projectTableData: { _id: string; name: string; description: string }[] =
    projectData;
  const projectTableColumnHelper = createColumnHelper<ProjectModel>();
  const projectTableColumns = [
    projectTableColumnHelper.accessor("name", {
      cell: (info) => {
        if (_.isEqual(info.getValue().length, 0)) {
          return <Tag colorScheme={"orange"}>None</Tag>;
        }
        return (
          <Text noOfLines={1} fontWeight={"semibold"}>
            {info.getValue()}
          </Text>
        );
      },
      header: "Name",
    }),
    projectTableColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <Tag colorScheme={"orange"}>No Description</Tag>;
        }
        return (
          <Tooltip
            label={info.getValue()}
            placement={"top"}
            isDisabled={info.getValue().length < 30}
          >
            <Text noOfLines={1}>
              {_.truncate(info.getValue(), { length: 30 })}
            </Text>
          </Tooltip>
        );
      },
      header: "Description",
      enableHiding: true,
    }),
    projectTableColumnHelper.accessor("entities", {
      cell: (info) => {
        if (_.isEqual(info.getValue().length, 0)) {
          return <Tag colorScheme={"orange"}>None</Tag>;
        }
        return <Tag colorScheme={"green"}>{info.getValue().length}</Tag>;
      },
      header: "Entities",
      enableHiding: true,
    }),
    projectTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"} p={"2"} align={"center"} gap={"1"}>
            <Link onClick={() => navigate(`/projects/${info.getValue()}`)}>
              <Text fontWeight={"semibold"}>View</Text>
            </Link>
            <Icon name={"a_right"} />
          </Flex>
        );
      },
      header: "",
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
      <Flex direction={"column"} w={"100%"} p={"2"} gap={"2"}>
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
        <Flex direction={"column"} basis={"70%"} gap={"2"}>
          <Flex direction={"row"} gap={"2"} align={"center"}>
            <Flex direction={"column"}>
              <Flex direction={"row"} align={"center"} gap={"2"}>
                <Icon name={"dashboard"} size={"md"} />
                <Heading size={"lg"}>Dashboard</Heading>
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
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Link onClick={onToggle}>
                    <Text
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      color={"gray.700"}
                    >
                      {isOpen ? "Hide" : "Show"} stats{" "}
                    </Text>
                  </Link>
                  <Icon name={isOpen ? "c_up" : "c_down"} size={"xs"} />
                </Flex>
              </Flex>
            </Flex>
            <Spacer />
            <Flex>
              <ActorTag orcid={token.orcid} fallback={"Unknown User"} />
            </Flex>
          </Flex>

          <Collapse in={isOpen} animateOpacity>
            <Flex
              p={"2"}
              gap={"2"}
              rounded={"md"}
              basis={"30%"}
              align={"center"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <StatGroup w={"100%"}>
                <Stat>
                  <StatLabel>Total Workspace Entities</StatLabel>
                  <StatNumber>{entityMetrics.all}</StatNumber>
                  <StatHelpText>
                    {entityMetrics.addedDay > 0 && (
                      <StatArrow type={"increase"} />
                    )}
                    {entityMetrics.addedDay} in last 24 hours
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>Total Workspace Projects</StatLabel>
                  <StatNumber>{projectMetrics.all}</StatNumber>
                  <StatHelpText>
                    {projectMetrics.addedDay > 0 && (
                      <StatArrow type={"increase"} />
                    )}
                    {projectMetrics.addedDay} in last 24 hours
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>Total Workspace Templates</StatLabel>
                  <StatNumber>{templateMetrics.all}</StatNumber>
                  <StatHelpText>
                    {templateMetrics.addedDay > 0 && (
                      <StatArrow type={"increase"} />
                    )}
                    {templateMetrics.addedDay} in last 24 hours
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>Total Workspace Collaborators</StatLabel>
                  <StatNumber>{workspaceMetrics.collaborators}</StatNumber>
                </Stat>
              </StatGroup>
            </Flex>
          </Collapse>
        </Flex>

        <Flex direction={"row"} wrap={"wrap"} gap={"2"} p={"0"}>
          <Flex direction={"column"} gap={"2"} grow={"1"}>
            {/* Projects and Entities */}
            <Flex
              direction={"column"}
              p={"2"}
              background={"white"}
              rounded={"md"}
              gap={"2"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              {/* Projects heading */}
              <Flex direction={"row"} align={"center"} gap={"2"} my={"2"}>
                <Icon name={"project"} size={"md"} />
                <Heading size={"md"}>Recent Projects</Heading>
              </Flex>

              {/* Projects table */}
              {/* Condition: Loaded and content present */}
              {!loading && projectData.length > 0 && (
                <DataTable
                  columns={projectTableColumns}
                  data={projectTableData}
                  visibleColumns={visibleColumns}
                  selectedRows={{}}
                />
              )}

              {/* Condition: Loaded and no content present */}
              {!loading && _.isEmpty(projectData) && (
                <Flex
                  w={"100%"}
                  direction={"row"}
                  p={"4"}
                  justify={"center"}
                  align={"center"}
                >
                  <Text color={"gray.400"} fontWeight={"semibold"}>
                    You do not have any Projects.
                  </Text>
                </Flex>
              )}

              <Flex justify={"right"}>
                <Button
                  key={`view-projects-all`}
                  size={"sm"}
                  colorScheme={"blue"}
                  rightIcon={<Icon name={"c_right"} />}
                  onClick={() => navigate(`/projects`)}
                >
                  All Projects
                </Button>
              </Flex>
            </Flex>

            <Flex
              direction={"column"}
              p={"2"}
              background={"white"}
              rounded={"md"}
              gap={"2"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              {/* Entities heading */}
              <Flex direction={"row"} align={"center"} gap={"2"} my={"2"}>
                <Icon name={"entity"} size={"md"} />
                <Heading size={"md"}>Recent Entities</Heading>
              </Flex>

              {/* Entities table */}
              {/* Condition: Loaded and content present */}
              {!loading && entityData.length > 0 && (
                <DataTable
                  columns={entityTableColumns}
                  data={entityTableData.filter(
                    (entity) =>
                      _.isEqual(entity.archived, false) ||
                      _.isEqual(entity.archived, null),
                  )}
                  visibleColumns={visibleColumns}
                  selectedRows={{}}
                />
              )}

              {/* Condition: Loaded and no content present */}
              {!loading && _.isEmpty(entityData) && (
                <Flex
                  w={"100%"}
                  direction={"row"}
                  p={"4"}
                  justify={"center"}
                  align={"center"}
                >
                  <Text color={"gray.400"} fontWeight={"semibold"}>
                    You do not have any Entities.
                  </Text>
                </Flex>
              )}

              <Flex justify={"right"}>
                <Button
                  key={`view-entity-all`}
                  size={"sm"}
                  colorScheme={"blue"}
                  rightIcon={<Icon name={"c_right"} />}
                  onClick={() => navigate(`/entities`)}
                >
                  All Entities
                </Button>
              </Flex>
            </Flex>
          </Flex>

          {/* Activity */}
          <Flex
            direction={"column"}
            maxW={{ lg: "md" }}
            p={"2"}
            gap={"2"}
            grow={"1"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.300"}
            h={"fit-content"}
          >
            {/* Activity heading */}
            <Flex
              id={"recentActivityHeader"}
              align={"center"}
              gap={"2"}
              my={"2"}
            >
              <Icon name={"activity"} size={"md"} />
              <Heading size={"md"} color={"gray.700"}>
                Recent Activity
              </Heading>
            </Flex>

            {/* Activity list */}
            {activityData.length > 0 ? (
              <Flex p={"0"} w={"100%"} overflowY={"auto"}>
                <VStack spacing={"3"} w={"95%"}>
                  {activityData.map((activity) => {
                    return (
                      <Flex
                        direction={"row"}
                        width={"100%"}
                        gap={"2"}
                        key={`activity-${activity._id}`}
                        align={"center"}
                      >
                        <Tooltip label={activity.actor} hasArrow>
                          <Avatar name={activity.actor} size={"sm"} />
                        </Tooltip>
                        <Flex direction={"column"} w={"100%"}>
                          <Flex direction={"row"} gap={"1"}>
                            <Text fontSize={"sm"}>{activity.details}</Text>
                            <Spacer />
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
                              size={"sm"}
                              truncate={20}
                            />
                          </Flex>
                        </Flex>
                      </Flex>
                    );
                  })}
                </VStack>
              </Flex>
            ) : (
              <Flex
                w={"100%"}
                h={"100%"}
                justify={"center"}
                align={"center"}
                minH={"200px"}
              >
                <Text color={"gray.400"} fontWeight={"semibold"}>
                  No Activity yet.
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Dashboard;
