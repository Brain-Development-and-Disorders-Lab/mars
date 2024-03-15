// React
import React, { useEffect, useState } from "react";
import {
  Button,
  Flex,
  Heading,
  Spacer,
  Tag,
  Text,
  useBreakpoint,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";

// Existing and custom types
import { ProjectModel } from "@types";

// Utility functions and types
import { getData } from "@database/functions";
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const toast = useToast();
  const navigate = useNavigate();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const [projectsData, setProjectsData] = useState([] as ProjectModel[]);

  useEffect(() => {
    getData(`/projects`)
      .then((value: ProjectModel[]) => {
        setProjectsData(value);
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

  const breakpoint = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({});

  // Effect to adjust column visibility
  useEffect(() => {
    if (
      _.isEqual(breakpoint, "sm") ||
      _.isEqual(breakpoint, "base") ||
      _.isUndefined(breakpoint)
    ) {
      setVisibleColumns({
        description: false,
        owner: false,
        entities: false,
      });
    } else {
      setVisibleColumns({});
    }
  }, [breakpoint]);

  // Configure table columns and data
  const data: ProjectModel[] = projectsData;
  const columnHelper = createColumnHelper<ProjectModel>();
  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => info.getValue(),
      header: "Name",
    }),
    columnHelper.accessor("description", {
      cell: (info) => info.getValue(),
      header: "Description",
      enableHiding: true,
    }),
    columnHelper.accessor("owner", {
      cell: (info) => {
        return <Tag colorScheme={"green"}>{info.getValue()}</Tag>;
      },
      header: "Owner",
    }),
    columnHelper.accessor("entities", {
      cell: (info) => info.getValue().length,
      header: "Entity Count",
    }),
    columnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"}>
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
      <Flex
        direction={"row"}
        p={"4"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"6"}
        justify={"center"}
      >
        <Flex
          w={"100%"}
          p={"4"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"4"} w={"100%"}>
            <Icon name={"project"} size={"lg"} />
            <Heading fontWeight={"semibold"}>Projects</Heading>
            <Spacer />
            <Button
              leftIcon={<Icon name={"add"} />}
              colorScheme={"green"}
              onClick={() => navigate("/create/project")}
            >
              Create
            </Button>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"4"} w={"100%"}>
          {data.length > 0 ?
            <DataTable
              columns={columns}
              data={data}
              visibleColumns={visibleColumns}
              showPagination
            />
          :
            <Flex
              w={"100%"}
              direction={"row"}
              p={"4"}
              justify={"center"}
              align={"center"}
            >
              <Text color={"gray.400"} fontWeight={"semibold"}>You do not have any Projects.</Text>
            </Flex>
          }
        </Flex>
      </Flex>
    </Content>
  );
};

export default Projects;
