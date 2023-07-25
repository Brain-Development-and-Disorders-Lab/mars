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
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Error from "@components/Error";
import Linky from "@components/Linky";
import Loading from "@components/Loading";

// Existing and custom types
import { CollectionModel, EntityModel, ActivityModel } from "@types";

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
  const [collectionData, setCollectionData] = useState([] as CollectionModel[]);
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

  // Get all Collections
  useEffect(() => {
    getData(`/collections`)
      .then((value) => {
        setCollectionData(value.reverse());
        setIsLoaded(true);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Collections data.",
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

  // Configure Collections table
  const collectionTableData: CollectionModel[] = collectionData;
  const collectionTableColumnHelper = createColumnHelper<CollectionModel>();
  const collectionTableColumns = [
    collectionTableColumnHelper.accessor("name", {
      cell: (info) => info.getValue(),
      header: "Name",
    }),
    collectionTableColumnHelper.accessor("entities", {
      cell: (info) => info.getValue().length,
      header: "Entity Count",
      enableHiding: true,
    }),
    collectionTableColumnHelper.accessor("collections", {
      cell: (info) => info.getValue().length,
      header: "Collection Count",
    }),
    collectionTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"}>
            <Button
              key={`view-entity-${info.getValue()}`}
              colorScheme={"blackAlpha"}
              rightIcon={<Icon name={"c_right"} />}
              onClick={() => navigate(`/collections/${info.getValue()}`)}
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
    <Content vertical={isError || !isLoaded}>
      {isLoaded ? (
        isError ? (
          <Error />
        ) : (
          <Flex direction={"row"} wrap={"wrap"} gap={"4"}>
            {/* Entities and Collections */}
            <Flex direction={"column"} gap={"4"} grow={"2"}>
              <Flex
                direction={"column"}
                p={"4"}
                background={"white"}
                rounded={"md"}
                gap={"2"}
              >
                {/* Collections heading */}
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  align={"center"}
                >
                  <Flex align={"center"} gap={"4"} p={"2"}>
                    <Icon name={"collection"} size={"lg"} />
                    <Heading fontWeight={"semibold"}>Collections</Heading>
                  </Flex>
                </Flex>

                {/* Collections table */}
                {isLoaded && collectionData.length > 0 ? (
                  <Tabs variant={"soft-rounded"}>
                    <TabList>
                      <Tab>Standard</Tab>
                      <Tab>Projects</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel>
                        <DataTable
                          columns={collectionTableColumns}
                          data={collectionTableData.filter((collection) =>
                            _.isEqual(collection.type, "collection")
                          )}
                          visibleColumns={visibleColumns}
                          hidePagination
                          hideSelection
                        />
                      </TabPanel>
                      <TabPanel>
                        <DataTable
                          columns={collectionTableColumns}
                          data={collectionTableData.filter((collection) =>
                            _.isEqual(collection.type, "project")
                          )}
                          visibleColumns={visibleColumns}
                          hidePagination
                          hideSelection
                        />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                ) : (
                  <Text>There are no Collections to display.</Text>
                )}

                <Spacer />

                <Flex justify={"right"}>
                  <Button
                    key={`view-collection-all`}
                    colorScheme={"teal"}
                    rightIcon={<Icon name={"c_right"} />}
                    onClick={() => navigate(`/collections`)}
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
              >
                {/* Entities heading */}
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  align={"center"}
                >
                  <Flex align={"center"} gap={"4"} p={"2"}>
                    <Icon name={"entity"} size={"lg"} />
                    <Heading fontWeight={"semibold"}>Entities</Heading>
                  </Flex>
                </Flex>

                {/* Entities table */}
                {isLoaded && entityData.length > 0 ? (
                  <DataTable
                    columns={entityTableColumns}
                    data={entityTableData.filter((entity) =>
                      _.isEqual(entity.deleted, false)
                    )}
                    visibleColumns={visibleColumns}
                    hidePagination
                    hideSelection
                  />
                ) : (
                  <Text>There are no Entities to display.</Text>
                )}

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
            <Flex direction={"column"} gap={"4"} grow={"1"}>
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
                <List>
                  {activityData.length > 0 ? (
                    activityData.slice(0, 10).map((activity) => {
                      // Configure the badge
                      let operationBadgeColor = "green.400";
                      let operationIcon = (
                        <Icon name={"entity"} color={"white"} />
                      );

                      switch (activity.type) {
                        case "create":
                          operationBadgeColor = "green.400";
                          operationIcon = <Icon name={"add"} color={"white"} />;
                          break;
                        case "update":
                          operationBadgeColor = "blue.400";
                          operationIcon = (
                            <Icon name={"edit"} color={"white"} />
                          );
                          break;
                        case "delete":
                          operationBadgeColor = "red.400";
                          operationIcon = (
                            <Icon name={"delete"} color={"white"} />
                          );
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
                              bg={operationBadgeColor}
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
                    })
                  ) : (
                    <Text fontSize={"md"}>No recent activity to show.</Text>
                  )}
                </List>
              </Flex>
            </Flex>
          </Flex>
        )
      ) : (
        <Loading />
      )}
    </Content>
  );
};

export default Dashboard;
