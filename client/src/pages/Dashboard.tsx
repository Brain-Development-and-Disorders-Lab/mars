import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Text,
  useToast,
  Spacer,
  List,
  ListItem,
  useBreakpoint,
  Tag,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Loading from "@components/Loading";

// Existing and custom types
import { ProjectModel, EntityModel, ActivityModel } from "@types";

// Utility functions and libraries
import { getData } from "src/database/functions";
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

  // Get all Entities
  useEffect(() => {
    getData(`/entities`)
      .then((result) => {
        setEntityData(result.reverse());
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Entities data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  // Get all Projects
  useEffect(() => {
    getData(`/projects`)
      .then((value) => {
        setProjectData(value.reverse());
        setIsLoaded(true);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Projects data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  // Get all Updates
  useEffect(() => {
    getData(`/activity`)
      .then((value) => {
        setActivityData(value.reverse());
        setIsLoaded(true);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Updates data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
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
          return <Tag colorScheme={"orange"}>Empty</Tag>
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
              colorScheme={"blackAlpha"}
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
    projectTableColumnHelper.accessor("entities", {
      cell: (info) => info.getValue().length,
      header: "Entity Count",
      enableHiding: true,
    }),
    projectTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"}>
            <Button
              key={`view-entity-${info.getValue()}`}
              colorScheme={"blackAlpha"}
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
      <Flex direction={"row"} wrap={"wrap"} gap={"4"} p={"4"} h={"100%"}>
        <Flex direction={"column"} gap={"4"} grow={"2"} h={"100%"}>
          {/* Projects and Entities */}
          <Flex
            direction={"column"}
            p={"4"}
            background={"white"}
            rounded={"md"}
            gap={"2"}
            border={"1px"}
            borderColor={"gray.100"}
          >
            {/* Projects heading */}
            <Flex direction={"row"} align={"center"} gap={"4"}>
              <Icon name={"project"} size={"lg"} />
              <Heading fontWeight={"semibold"}>Projects</Heading>
            </Flex>

            {/* Projects table */}
            {/* Condition: Loaded and content present */}
            {isLoaded && projectData.length > 0 &&
              <DataTable
                columns={projectTableColumns}
                data={projectTableData}
                visibleColumns={visibleColumns}
                hidePagination
                hideSelection
              />
            }

            {/* Condition: Loaded and no content present */}
            {isLoaded && _.isEmpty(projectData) &&
              <Flex w={"100%"} direction={"row"} p={"4"} justify={"center"} align={"center"}>
                <Text fontWeight={"bold"}>No Projects yet</Text>
              </Flex>
            }

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
                View All
              </Button>
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            p={"4"}
            background={"white"}
            rounded={"md"}
            gap={"2"}
            border={"1px"}
            borderColor={"gray.100"}
          >
            {/* Entities heading */}
            <Flex direction={"row"} align={"center"} gap={"4"}>
              <Icon name={"entity"} size={"lg"} />
              <Heading fontWeight={"semibold"}>Entities</Heading>
            </Flex>

            {/* Entities table */}
            {/* Condition: Loaded and content present */}
            {isLoaded && entityData.length > 0 &&
              <DataTable
                columns={entityTableColumns}
                data={entityTableData.filter((entity) =>
                  _.isEqual(entity.deleted, false)
                )}
                visibleColumns={visibleColumns}
                hidePagination
                hideSelection
              />
            }

            {/* Condition: Loaded and no content present */}
            {isLoaded && _.isEmpty(entityData) &&
              <Flex w={"100%"} direction={"row"} p={"4"} justify={"center"} align={"center"}>
                <Text fontWeight={"bold"}>No Entities yet</Text>
              </Flex>
            }

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
                View All
              </Button>
            </Flex>
          </Flex>
        </Flex>

        {/* Activity */}
        <Flex
          direction={"column"}
          gap={"4"}
          grow={"1"}
          h={"100%"}
          rounded={"md"}
          border={"1px"}
          borderColor={"gray.100"}
        >
          <Flex
            background={"white"}
            direction={"column"}
            rounded={"md"}
            h={"fit-content"}
            p={"4"}
            gap={"2"}
          >
            {/* Activity heading */}
            <Flex align={"center"} gap={"4"} p={"2"}>
              <Icon name={"activity"} size={"lg"} />
              <Heading fontWeight={"semibold"}>Activity</Heading>
            </Flex>

            {/* Activity list */}
            {activityData.length > 0 ? (
              <List>
                {activityData.slice(0, 10).map((activity) => {
                // Configure the badge
                let operationIcon = <Icon name={"entity"} color={"white"} />;

                switch (activity.type) {
                  case "create":
                    operationIcon = <Icon name={"add"} color={"green.400"} />;
                    break;
                  case "update":
                    operationIcon = <Icon name={"edit"} color={"blue.400"} />;
                    break;
                  case "delete":
                    operationIcon = <Icon name={"delete"} color={"red.400"} />;
                    break;
                }

                return (
                  <ListItem key={`activity-${activity._id}`}>
                    <Flex
                      direction={"row"}
                      p={"2"}
                      gap={"2"}
                      mt={"2"}
                      mb={"2"}
                      align={"center"}
                      background={"white"}
                      rounded={"md"}
                      border={"2px"}
                      borderColor={"gray.100"}
                    >
                      <Flex
                        rounded={"full"}
                        bg={"white"}
                        p={"1.5"}
                      >
                        {operationIcon}
                      </Flex>

                      <Text display={{ base: "none", sm: "block" }}>
                        {activity.details}
                      </Text>

                      <Linky
                        id={activity.target.id}
                        type={activity.target.type}
                        fallback={activity.target.name}
                      />

                      <Spacer />

                      <Text color={"gray.400"}>
                        {dayjs(activity.timestamp).fromNow()}
                      </Text>
                    </Flex>
                  </ListItem>
                );
                })}
              </List>
            ) : (
              <Flex w={"100%"} justify={"center"}>
                <Text fontSize={"md"} fontWeight={"bold"}>No Activity yet</Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Dashboard;
