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
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import ActorTag from "@components/ActorTag";

// Existing and custom types
import {
  ProjectModel,
  EntityModel,
  ActivityModel,
  EntityMetrics,
  ProjectMetrics,
  AttributeMetrics,
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
    }
    projectMetrics {
      all
      addedDay
    }
    entities(limit: $entityLimit, archived: $entitiesArchived) {
      _id
      archived
      name
      description
    }
    entityMetrics {
      all
      addedDay
    }
    attributeMetrics {
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
  const { token } = useAuthentication();

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
  const [attributeMetrics, setAttributeMetrics] = useState(
    {} as AttributeMetrics,
  );
  const [workspaceMetrics, setWorkspaceMetrics] = useState(
    {} as WorkspaceMetrics,
  );
  const [lastUpdate] = useState(
    dayjs(Date.now()).format("DD MMMM YYYY[ at ]h:mm a"),
  );

  // Execute GraphQL query both on page load and navigation
  const { loading, error, data, refetch } = useQuery(GET_DASHBOARD, {
    variables: {
      projectsLimit: 8,
      entitiesLimit: 8,
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
    if (data?.attributeMetrics) {
      setAttributeMetrics(data.attributeMetrics);
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
      setVisibleColumns({ description: false });
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
        <Text noOfLines={1} fontWeight={"semibold"}>
          {info.getValue()}
        </Text>
      ),
      header: "Name",
    }),
    entityTableColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <Tag colorScheme={"orange"}>No Description</Tag>;
        }
        return <Text noOfLines={1}>{info.getValue()}</Text>;
      },
      header: "Description",
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
      cell: (info) => (
        <Text noOfLines={1} fontWeight={"semibold"}>
          {info.getValue()}
        </Text>
      ),
      header: "Name",
    }),
    projectTableColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <Tag colorScheme={"orange"}>No Description</Tag>;
        }
        return <Text noOfLines={1}>{info.getValue()}</Text>;
      },
      header: "Description",
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

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"column"} w={"100%"} p={"2"} gap={"2"}>
        <Flex direction={"column"} basis={"70%"} gap={"2"}>
          <Flex direction={"row"} gap={"2"} align={"center"}>
            <Flex direction={"column"}>
              <Flex direction={"row"} align={"center"} gap={"2"}>
                <Icon name={"dashboard"} size={"md"} />
                <Heading size={"lg"}>Workspace Dashboard</Heading>
              </Flex>
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
            </Flex>
            <Spacer />
            <Flex>
              <ActorTag orcid={token.orcid} fallback={"Unknown User"} />
            </Flex>
          </Flex>

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
                <StatLabel>Total Workspace Attributes</StatLabel>
                <StatNumber>{attributeMetrics.all}</StatNumber>
                <StatHelpText>
                  {attributeMetrics.addedDay > 0 && (
                    <StatArrow type={"increase"} />
                  )}
                  {attributeMetrics.addedDay} in last 24 hours
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Total Workspace Collaborators</StatLabel>
                <StatNumber>{workspaceMetrics.collaborators}</StatNumber>
              </Stat>
            </StatGroup>
          </Flex>
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
                <Heading size={"md"}>Projects</Heading>
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
                <Heading size={"md"}>Entities</Heading>
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
            maxW={"sm"}
            p={"2"}
            gap={"2"}
            grow={"1"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.300"}
            h={"fit-content"}
          >
            {/* Activity heading */}
            <Flex align={"center"} gap={"2"} my={"2"}>
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
