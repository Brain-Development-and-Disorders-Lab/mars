import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Flex,
  Heading,
  Icon,
  Text,
  useToast,
  Spacer,
  List,
  ListItem,
} from "@chakra-ui/react";
import { AddIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { BsBox, BsChevronRight, BsClockHistory, BsFolder, BsPencil, BsPlusLg, BsTrash } from "react-icons/bs";
import { createColumnHelper } from "@tanstack/react-table";

import { ContentContainer } from "@components/ContentContainer";
import { DataTable } from "@components/DataTable";
import { Loading } from "@components/Loading";
import { Error } from "@components/Error";
import Linky from "@components/Linky";

import { getData } from "src/database/functions";
import { CollectionModel, EntityModel, UpdateModel } from "@types";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const Dashboard = () => {
  // Enable navigation
  const navigate = useNavigate();

  // Toast to show errors
  const toast = useToast();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  // Page data
  const [entityData, setEntityData] = useState([] as EntityModel[]);
  const [collectionData, setCollectionData] = useState([] as CollectionModel[]);
  const [updateData, setUpdateData] = useState([] as UpdateModel[]);

  // Get all Entities
  useEffect(() => {
    getData(`/entities`)
      .then((result) => {
        setEntityData(result.reverse());
      }).catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Entities data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      }).finally(() => {
        setIsLoaded(true);
      });
  }, []);

  // Get all Collections
  useEffect(() => {
    getData(`/collections`).then((value) => {
      setCollectionData(value.reverse());
      setIsLoaded(true);
    }).catch((_error) => {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Collections data.",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }).finally(() => {
      setIsLoaded(true);
    });
  }, []);

  // Get all Updates
  useEffect(() => {
    getData(`/updates`).then((value) => {
      setUpdateData(value.reverse());
      setIsLoaded(true);
    }).catch((_error) => {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Updates data.",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }).finally(() => {
      setIsLoaded(true);
    });
  }, []);

  // Configure Entity table
  const entityTableData: EntityModel[] = entityData;
  const entityTableColumnHelper = createColumnHelper<EntityModel>();
  const entityTableColumns = [
    entityTableColumnHelper.accessor("name", {
      cell: (info) => info.getValue(),
      header: "Name",
    }),
    entityTableColumnHelper.accessor("description", {
      cell: (info) => info.getValue(),
      header: "Description",
      enableHiding: true,
    }),
    entityTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Button
            key={`view-entity-${info.getValue()}`}
            colorScheme={"blackAlpha"}
            rightIcon={<Icon as={BsChevronRight} />}
            onClick={() => navigate(`/entities/${info.getValue()}`)}
          >
            View
          </Button>
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
    collectionTableColumnHelper.accessor("description", {
      cell: (info) => info.getValue(),
      header: "Description",
      enableHiding: true,
    }),
    collectionTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Button
            key={`view-entity-${info.getValue()}`}
            colorScheme={"blackAlpha"}
            rightIcon={<Icon as={BsChevronRight} />}
            onClick={() => navigate(`/collections/${info.getValue()}`)}
          >
            View
          </Button>
        );
      },
      header: "",
    }),
  ];

  return (
    <ContentContainer vertical={isError || !isLoaded}>
      {isLoaded ? (
        isError ? (
          <Error />
        ) : (
          <Flex
            direction={"row"}
            justify={"center"}
            p={["1", "2"]}
            gap={"6"}
            maxW={"7xl"}
            wrap={"wrap"}
          >
            {/* Entities and Collections */}
            <Flex direction={"column"} gap={"6"} grow={"2"}>
              <Flex direction={"row"} justify={"space-between"} align={"center"}>
                <Flex align={"center"} gap={"4"} p={"2"}>
                  <Icon as={BsFolder} w={"8"} h={"8"} />
                  <Heading fontWeight={"semibold"}>Collections</Heading>
                </Flex>
                <Button
                  colorScheme={"green"}
                  leftIcon={<AddIcon />}
                  onClick={() => navigate("/create/collection/start")}
                >
                  Create
                </Button>
              </Flex>

              <Flex
                direction={"column"}
                p={"4"}
                background={"white"}
                rounded={"md"}
                gap={"2"}
              >
                {/* Collections listing */}
                {isLoaded && collectionData.length > 0 ? (
                  <DataTable columns={collectionTableColumns} data={collectionTableData} hideControls />
                ) : (
                  <Text>There are no Collections to display.</Text>
                )}

                <Spacer />

                <Flex justify={"right"}>
                  <Button
                    key={`view-collection-all`}
                    colorScheme={"blackAlpha"}
                    rightIcon={<ChevronRightIcon />}
                    onClick={() => navigate(`/collections`)}
                  >
                    View All
                  </Button>
                </Flex>
              </Flex>

              <Spacer />

              <Flex direction={"row"} justify={"space-between"} align={"center"}>
                <Flex align={"center"} gap={"4"} p={"2"}>
                  <Icon as={BsBox} w={"8"} h={"8"} />
                  <Heading fontWeight={"semibold"}>Entities</Heading>
                </Flex>
                <Button
                  colorScheme={"green"}
                  leftIcon={<AddIcon />}
                  onClick={() => navigate("/create/entity/start")}
                >
                  Create
                </Button>
              </Flex>

              <Flex
                direction={"column"}
                p={"4"}
                background={"white"}
                rounded={"md"}
                gap={"2"}
              >
                {/* Entities listing */}
                {isLoaded && entityData.length > 0 ? (
                  <DataTable columns={entityTableColumns} data={entityTableData} hideControls />
                ) : (
                  <Text>There are no Entities to display.</Text>
                )}

                <Spacer />

                <Flex justify={"right"}>
                  <Button
                    key={`view-entity-all`}
                    colorScheme={"blackAlpha"}
                    rightIcon={<ChevronRightIcon />}
                    onClick={() => navigate(`/entities`)}
                  >
                    View All
                  </Button>
                </Flex>
              </Flex>
            </Flex>

            {/* Activity Feed */}
            <Flex direction={"column"} gap={"6"} grow={"1"}>
              <Flex align={"center"} gap={"4"} p={"2"}>
                <Icon as={BsClockHistory} w={"8"} h={"8"} />
                <Heading fontWeight={"semibold"}>Activity Feed</Heading>
              </Flex>

              <Flex
                background={"white"}
                direction={"column"}
                rounded={"md"}
                h={"fit-content"}
                p={"4"}
                gap={"2"}
              >
                <List>
                  {updateData.length > 0 ? (
                    updateData.slice(0, 10).map((update) => {
                      // Configure the badge
                      const iconSize = "3";
                      const iconColor = "white";
                      let operationBadgeColor = "green.400";
                      let operationIcon = <Icon as={BsBox} w={iconSize} h={iconSize} color={iconColor} />;

                      switch (update.type) {
                        case "create":
                          operationBadgeColor = "green.400";
                          operationIcon = <Icon as={BsPlusLg} w={iconSize} h={iconSize} color={iconColor} />;
                          break;
                        case "update":
                          operationBadgeColor = "blue.400";
                          operationIcon = <Icon as={BsPencil} w={iconSize} h={iconSize} color={iconColor} />;
                          break;
                        case "delete":
                          operationBadgeColor = "red.400";
                          operationIcon = <Icon as={BsTrash} w={iconSize} h={iconSize} color={iconColor} />;
                          break;
                      }

                      return (
                        <ListItem key={`update-${update._id}`}>
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
                            <Flex rounded={"full"} bg={operationBadgeColor} p={"1.5"}>
                              {operationIcon}
                            </Flex>

                            <Text display={{ base: "none", sm: "block" }}>{update.details}</Text>

                            <Linky id={update.target.id} type={update.target.type} fallback={update.target.name} />

                            <Spacer />

                            <Text color={"gray.400"}>{dayjs(update.timestamp).fromNow()}</Text>
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
    </ContentContainer>
  );
};

export default Dashboard;
