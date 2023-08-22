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
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";

// Existing and custom types
import { ActivityModel, ProjectModel } from "@types";

// Utility functions and libraries
import { getData } from "src/database/functions";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import _ from "lodash";

// Routing and navigation
import { useNavigate, useParams } from "react-router-dom";

const Project = () => {
  // Enable navigation
  const navigate = useNavigate();
  const { id } = useParams();

  // Toast to show errors
  const toast = useToast();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  // Page data
  const [projectData, setProjectData] = useState({} as ProjectModel);
  const [projectEntities, setProjectEntities] = useState([] as string[]);
  const [projectCollections, setProjectCollections] = useState([] as string[]);
  const [projectActivity, setProjectActivity] = useState([] as ActivityModel[]);

  // Get all Project data
  useEffect(() => {
    getData(`/projects/${id}`)
      .then((result: ProjectModel) => {
        setProjectData(result);
        setProjectEntities(result.entities);
        setProjectCollections(result.collections);
        setProjectActivity(result.activity);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Project data.",
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
  const entityTableData: string[] = projectEntities;
  const entityTableColumns = [
    {
      id: (info: any) => info.row.original._id,
      cell: (info: any) => (
        <Linky
          id={info.row.original._id}
          type={"entities"}
          fallback={info.row.original._id}
        />
      ),
    header: "Name",
    },
    {
      id: (info: any) => `n_${info.row.original._id}`,
      cell: (info: any) => {
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
    },
  ];

  // Configure Collections table
  const collectionTableData: string[] = projectCollections;
  const collectionTableColumns = [
    {
      id: (info: any) => info.row.original._id,
      cell: (info: any) => (
        <Linky
          id={info.row.original._id}
          type={"entities"}
          fallback={info.row.original._id}
        />
      ),
    header: "Name",
    },
    {
      id: (info: any) => `n_${info.row.original._id}`,
      cell: (info: any) => {
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
    },
  ];

  return (
    <Content isError={isError} isLoaded={isLoaded}>
      <Flex direction={"row"} wrap={"wrap"} gap={"4"} p={"4"} h={"100%"}>
        <Flex direction={"column"} gap={"4"} grow={"2"} h={"100%"}>
          <Flex
            gap={"4"}
            p={"4"}
            direction={"row"}
            justify={"space-between"}
            align={"center"}
            wrap={"wrap"}
          >
            <Flex
              align={"center"}
              gap={"4"}
              shadow={"lg"}
              p={"2"}
              border={"2px"}
              rounded={"md"}
            >
              <Icon
                name={"project"}
                size={"lg"}
              />
              <Heading fontWeight={"semibold"}>{projectData.name}</Heading>
            </Flex>
          </Flex>
          {/* Collections and Entities */}
          <Flex
            h={"50%"}
            direction={"column"}
            p={"4"}
            background={"white"}
            rounded={"md"}
            gap={"2"}
            border={"1px"}
            borderColor={"gray.100"}
          >
            {/* Collections heading */}
            <Flex direction={"row"} align={"center"} gap={"4"}>
              <Icon name={"collection"} size={"lg"} />
              <Heading fontWeight={"semibold"}>Collections</Heading>
            </Flex>

            {/* Collections table */}
            {projectCollections && projectCollections.length > 0 ? (
                <DataTable
                  columns={collectionTableColumns}
                  data={collectionTableData}
                  visibleColumns={{}}
                  hidePagination
                  hideSelection
                />
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
            h={"50%"}
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
            {projectEntities && projectEntities.length > 0 ? (
              <DataTable
                columns={entityTableColumns}
                data={entityTableData}
                visibleColumns={{}}
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
            <List>
              {projectActivity && projectActivity.length > 0 ? (
                projectData.activity.slice(0, 10).map((activity) => {
                  // Configure the badge
                  let operationBadgeColor = "green.400";
                  let operationIcon = <Icon name={"entity"} color={"white"} />;

                  switch (activity.type) {
                    case "create":
                      operationBadgeColor = "green.400";
                      operationIcon = <Icon name={"add"} color={"white"} />;
                      break;
                    case "update":
                      operationBadgeColor = "blue.400";
                      operationIcon = <Icon name={"edit"} color={"white"} />;
                      break;
                    case "delete":
                      operationBadgeColor = "red.400";
                      operationIcon = <Icon name={"delete"} color={"white"} />;
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
    </Content>
  );
};

export default Project;
