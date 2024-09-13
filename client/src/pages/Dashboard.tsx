import React, { useContext, useEffect, useState } from "react";

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

// Workspace context
import { WorkspaceContext } from "../Context";

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
      archived
      name
      description
    }
    activity(limit: $activity) {
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
  const { workspace, workspaceLoading } = useContext(WorkspaceContext);

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

  // Execute GraphQL query both on page load and navigation
  const { loading, error, data, refetch } = useQuery(GET_DASHBOARD, {
    variables: {
      projects: 5,
      entities: 5,
      activity: 20,
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
  }, [data]);

  // If the workspace changes, refetch the data
  useEffect(() => {
    if (refetch) {
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
    <Content
      isError={!_.isUndefined(error)}
      isLoaded={!loading && !workspaceLoading}
    >
      <Flex direction={"row"} wrap={"wrap"} gap={"2"} p={"2"}>
        <Flex direction={"column"} gap={"2"} grow={"1"}>
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
              <Heading size={"md"}>Projects</Heading>
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
        >
          {/* Activity heading */}
          <Flex align={"center"} gap={"2"} my={"2"}>
            <Icon name={"activity"} size={"md"} />
            <Heading size={"md"} color={"gray.700"}>
              Workspace Activity
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
                      <Tooltip label={activity.actor}>
                        <Avatar name={activity.actor} size={"sm"} />
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
    </Content>
  );
};

export default Dashboard;
