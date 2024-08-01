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
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";

// Existing and custom types
import { ProjectModel, EntityModel, ActivityModel } from "@types";

// Utility functions and libraries
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Apollo client imports
import { useQuery, gql } from "@apollo/client";

// Queries
const GET_DASHBOARD = gql`
  query GetDashboard($projects: Int, $entities: Int, $activity: Int) {
    projects(limit: $projects) {
      _id
      name
      description
    }
    entities(limit: $entities) {
      _id
      deleted
      name
      description
    }
    activity(limit: $activity) {
      _id
      timestamp
      type
      actor {
        _id
        name
      }
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

  // Page data
  const [entityData, setEntityData] = useState(
    [] as {
      _id: string;
      deleted: boolean;
      name: string;
      description: string;
    }[],
  );
  const [projectData, setProjectData] = useState(
    [] as { _id: string; name: string; description: string }[],
  );
  const [activityData, setActivityData] = useState([] as ActivityModel[]);

  // Execute GraphQL query both on page load and navigation
  const { loading, error, data, refetch } = useQuery(GET_DASHBOARD, {
    variables: {
      projects: 5,
      entities: 5,
      activity: 20,
    },
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
  }, [data]);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  // Display error messages from GraphQL usage
  useEffect(() => {
    if (!loading && _.isUndefined(data)) {
      // Raised if invalid query
      toast({
        title: "Error",
        description: "Could not retrieve data.",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    } else if (error) {
      // Raised GraphQL error
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [error, loading]);

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
    deleted: boolean;
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
          return <Tag colorScheme={"orange"}>Empty</Tag>;
        }
        return <Text noOfLines={1}>{info.getValue()}</Text>;
      },
      header: "Description",
      enableHiding: true,
    }),
    entityTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"}>
            <Button
              key={`view-entity-${info.getValue()}`}
              size={"sm"}
              colorScheme={"gray"}
              rightIcon={<Icon name={"c_right"} />}
              onClick={() => navigate(`/entities/${info.getValue()}`)}
            >
              View
            </Button>
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
          return <Tag colorScheme={"orange"}>Empty</Tag>;
        }
        return <Text noOfLines={1}>{info.getValue()}</Text>;
      },
      header: "Description",
      enableHiding: true,
    }),
    projectTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"}>
            <Button
              key={`view-entity-${info.getValue()}`}
              size={"sm"}
              colorScheme={"gray"}
              rightIcon={<Icon name={"c_right"} />}
              onClick={() => navigate(`/projects/${info.getValue()}`)}
            >
              View
            </Button>
          </Flex>
        );
      },
      header: "",
    }),
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"row"} wrap={"wrap"} gap={"2"} p={"2"}>
        <Flex direction={"column"} gap={"2"} grow={"1"} basis={"60%"}>
          {/* Projects and Entities */}
          <Flex
            direction={"column"}
            p={"2"}
            background={"white"}
            rounded={"md"}
            gap={"2"}
            border={"1px"}
            borderColor={"gray.200"}
          >
            {/* Projects heading */}
            <Flex direction={"row"} align={"center"} gap={"2"} my={"2"}>
              <Icon name={"project"} size={"md"} />
              <Heading size={"md"} fontWeight={"bold"}>
                Projects
              </Heading>
            </Flex>

            {/* Projects table */}
            {/* Condition: Loaded and content present */}
            {!loading && projectData.length > 0 && (
              <DataTable
                columns={projectTableColumns}
                data={projectTableData}
                visibleColumns={visibleColumns}
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
            borderColor={"gray.200"}
          >
            {/* Entities heading */}
            <Flex direction={"row"} align={"center"} gap={"2"} my={"2"}>
              <Icon name={"entity"} size={"md"} />
              <Heading size={"md"} fontWeight={"bold"}>
                Entities
              </Heading>
            </Flex>

            {/* Entities table */}
            {/* Condition: Loaded and content present */}
            {!loading && entityData.length > 0 && (
              <DataTable
                columns={entityTableColumns}
                data={entityTableData.filter(
                  (entity) =>
                    _.isEqual(entity.deleted, false) ||
                    _.isEqual(entity.deleted, null),
                )}
                visibleColumns={visibleColumns}
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
          p={"2"}
          gap={"2"}
          grow={"1"}
          rounded={"md"}
          border={"1px"}
          borderColor={"gray.200"}
          maxH={"97vh"}
        >
          {/* Activity heading */}
          <Flex align={"center"} gap={"2"} my={"2"}>
            <Icon name={"activity"} size={"md"} />
            <Heading size={"md"} fontWeight={"semibold"} color={"gray.700"}>
              Recent Activity
            </Heading>
          </Flex>

          {/* Activity list */}
          {activityData.length > 0 ? (
            <Flex overflowY={"auto"} p={"0"} w={"100%"} h={"100%"}>
              <VStack spacing={"2"} w={"95%"}>
                {activityData.map((activity) => {
                  return (
                    <Flex
                      direction={"row"}
                      width={"100%"}
                      gap={"2"}
                      key={`activity-${activity._id}`}
                      align={"center"}
                    >
                      <Tooltip
                        label={
                          activity.actor ? activity.actor.name : "Unknown User"
                        }
                      >
                        <Avatar
                          name={
                            activity.actor
                              ? activity.actor.name
                              : "Unknown User"
                          }
                          size={"sm"}
                        />
                      </Tooltip>
                      <Flex direction={"column"}>
                        <Flex direction={"row"} gap={"1"}>
                          <Text fontSize={"sm"}>{activity.details}</Text>
                          <Linky
                            id={activity.target._id}
                            type={activity.target.type}
                            fallback={activity.target.name}
                            justify={"left"}
                            size={"sm"}
                            truncate={20}
                          />
                        </Flex>
                        <Text
                          fontSize={"xs"}
                          fontWeight={"semibold"}
                          color={"gray.500"}
                        >
                          {dayjs(activity.timestamp).fromNow()}
                        </Text>
                      </Flex>
                    </Flex>
                  );
                })}
              </VStack>
            </Flex>
          ) : (
            <Flex w={"100%"} h={"100%"} justify={"center"} align={"center"}>
              <Text color={"gray.400"} fontWeight={"semibold"}>
                No Activity yet.
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Dashboard;
