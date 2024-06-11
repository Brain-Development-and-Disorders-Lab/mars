import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Text,
  useToast,
  Spacer,
  useBreakpoint,
  Tag,
  VStack,
  StackDivider,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Loading from "@components/Loading";

// Existing and custom types
import { ProjectModel, EntityModel, ActivityModel, IconNames } from "@types";

// Utility functions and libraries
import { request } from "src/database/functions";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  // Enable navigation
  const navigate = useNavigate();

  // Toast to show errors
  const toast = useToast();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const breakpoint = useBreakpoint({ ssr: false });

  // Page data
  const [entityData, setEntityData] = useState([] as EntityModel[]);
  const [projectData, setProjectData] = useState([] as ProjectModel[]);
  const [activityData, setActivityData] = useState([] as ActivityModel[]);

  const [visibleColumns, setVisibleColumns] = useState({});

  // Effect to adjust column visibility
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

  /**
   * Utility function to retrieve all Entities
   */
  const getEntities = async () => {
    const response = await request<EntityModel[]>("GET", "/entities");
    if (response.success) {
      setEntityData(response.data.reverse());
      setIsLoaded(true);
    } else {
      toast({
        title: "Network Error",
        status: "error",
        description: "Could not retrieve Entities.\n" + response.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }
  };

  /**
   * Utility function to retrieve all Projects
   */
  const getProjects = async () => {
    const response = await request<ProjectModel[]>("GET", "/projects");
    if (response.success) {
      setProjectData(response.data.reverse());
      setIsLoaded(true);
    } else {
      toast({
        title: "Network Error",
        status: "error",
        description: "Could not retrieve Projects.\n" + response.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }
  };

  /**
   * Utility function to retrieve all Activity
   */
  const getActivity = async () => {
    const response = await request<ActivityModel[]>("GET", "/activity");
    if (response.success) {
      setActivityData(response.data.reverse());
      setIsLoaded(true);
    } else {
      toast({
        title: "Network Error",
        status: "error",
        description: "Could not retrieve Activity.\n" + response.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }
  };

  // Effect to retrieve all information required to render Dashboard
  useEffect(() => {
    getEntities();
    getProjects();
    getActivity();
  }, []);

  // Configure Entity table
  const entityTableData: EntityModel[] = entityData;
  const entityTableColumnHelper = createColumnHelper<EntityModel>();
  const entityTableColumns = [
    entityTableColumnHelper.accessor("name", {
      cell: (info) => (
        <Linky
          id={info.row.original._id}
          type={"entities"}
          fallback={info.row.original.name}
        />
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
  const projectTableData: ProjectModel[] = projectData;
  const projectTableColumnHelper = createColumnHelper<ProjectModel>();
  const projectTableColumns = [
    projectTableColumnHelper.accessor("name", {
      cell: (info) => info.getValue(),
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
    <Content isError={isError} isLoaded={isLoaded}>
      <Flex direction={"row"} wrap={"wrap"} gap={"4"} p={"4"}>
        <Flex direction={"column"} gap={"4"} grow={"1"} basis={"60%"}>
          {/* Projects and Entities */}
          <Flex
            direction={"column"}
            p={"4"}
            background={"white"}
            rounded={"md"}
            gap={"2"}
            border={"2px"}
            borderColor={"gray.200"}
          >
            {/* Projects heading */}
            <Flex direction={"row"} align={"center"} gap={"4"}>
              <Icon name={"project"} size={"md"} />
              <Heading size={"lg"} fontWeight={"semibold"}>
                Projects
              </Heading>
            </Flex>

            {/* Projects table */}
            {/* Condition: Loaded and content present */}
            {isLoaded && projectData.length > 0 && (
              <DataTable
                columns={projectTableColumns}
                data={projectTableData}
                visibleColumns={visibleColumns}
              />
            )}

            {/* Condition: Loaded and no content present */}
            {isLoaded && _.isEmpty(projectData) && (
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

            {/* Condition: Not loaded */}
            {!isLoaded && <Loading />}

            <Spacer />

            <Flex justify={"right"}>
              <Button
                key={`view-projects-all`}
                colorScheme={"teal"}
                rightIcon={<Icon name={"c_right"} />}
                onClick={() => navigate(`/projects`)}
              >
                All Projects
              </Button>
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            p={"4"}
            background={"white"}
            rounded={"md"}
            gap={"2"}
            border={"2px"}
            borderColor={"gray.200"}
          >
            {/* Entities heading */}
            <Flex direction={"row"} align={"center"} gap={"4"}>
              <Icon name={"entity"} size={"md"} />
              <Heading size={"lg"} fontWeight={"semibold"}>
                Entities
              </Heading>
            </Flex>

            {/* Entities table */}
            {/* Condition: Loaded and content present */}
            {isLoaded && entityData.length > 0 && (
              <DataTable
                columns={entityTableColumns}
                data={entityTableData.filter((entity) =>
                  _.isEqual(entity.deleted, false),
                )}
                visibleColumns={visibleColumns}
              />
            )}

            {/* Condition: Loaded and no content present */}
            {isLoaded && _.isEmpty(entityData) && (
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

            {/* Condition: Not loaded */}
            {!isLoaded && <Loading />}

            <Spacer />

            <Flex justify={"right"}>
              <Button
                key={`view-entity-all`}
                colorScheme={"teal"}
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
          p={"4"}
          gap={"2"}
          grow={"1"}
          rounded={"md"}
          border={"2px"}
          borderColor={"gray.200"}
          maxH={"80vh"}
        >
          {/* Activity heading */}
          <Flex align={"center"} gap={"4"}>
            <Icon name={"activity"} size={"md"} />
            <Heading size={"lg"} fontWeight={"semibold"}>
              Activity
            </Heading>
          </Flex>

          {/* Activity list */}
          {activityData.length > 0 ? (
            <Flex overflowY={"auto"} p={"0"} w={"100%"} h={"100%"}>
              <VStack
                divider={<StackDivider borderColor={"gray.200"} />}
                spacing={"2"}
                w={"95%"}
              >
                {activityData.slice(0, 20).map((activity) => {
                  // Configure the badge
                  let operationIcon: IconNames = "entity";
                  let operationIconColor = "white";

                  switch (activity.type) {
                    case "create":
                      operationIcon = "add";
                      operationIconColor = "green.400";
                      break;
                    case "update":
                      operationIcon = "edit";
                      operationIconColor = "blue.400";
                      break;
                    case "delete":
                      operationIcon = "delete";
                      operationIconColor = "red.400";
                      break;
                  }

                  return (
                    <Flex
                      direction={"row"}
                      width={"100%"}
                      gap={"2"}
                      key={`activity-${activity._id}`}
                    >
                      <Flex
                        rounded={"full"}
                        p={"2"}
                        mr={"2"}
                        alignSelf={"center"}
                      >
                        <Icon
                          size={"sm"}
                          name={operationIcon}
                          color={operationIconColor}
                        />
                      </Flex>

                      <Flex direction="column" align={"baseline"}>
                        <Text display={{ base: "none", sm: "block" }}>
                          {activity.details}
                        </Text>

                        <Linky
                          id={activity.target._id}
                          type={activity.target.type}
                          fallback={activity.target.name}
                          justify={"left"}
                        />
                      </Flex>

                      <Spacer />

                      <Text
                        fontSize={"xs"}
                        fontWeight={"semibold"}
                        color={"gray.500"}
                      >
                        {dayjs(activity.timestamp).fromNow()}
                      </Text>
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
