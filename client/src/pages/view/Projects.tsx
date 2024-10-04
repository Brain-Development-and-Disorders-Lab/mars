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
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Workspace context
import { useWorkspace } from "src/hooks/useWorkspace";

// Apollo client imports
import { useQuery, gql } from "@apollo/client";

// Queries
const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      _id
      archived
      name
      description
      owner
      entities
    }
  }
`;

const Projects = () => {
  const toast = useToast();
  const navigate = useNavigate();

  // Effect to adjust column visibility
  const breakpoint = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({});
  useEffect(() => {
    if (_.includes(["sm", "base"], breakpoint) || _.isUndefined(breakpoint)) {
      setVisibleColumns({
        description: false,
        owner: false,
        entities: false,
      });
    } else {
      setVisibleColumns({});
    }
  }, [breakpoint]);

  // Execute GraphQL query both on page load and navigation
  const { loading, error, data, refetch } = useQuery(GET_PROJECTS);

  const [projects, setProjects] = useState<ProjectModel[]>([]);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.projects) {
      setProjects(data.projects);
    }
  }, [data]);

  const { workspace } = useWorkspace();

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

  // Display error messages from GraphQL usage
  useEffect(() => {
    if ((!loading && _.isUndefined(data)) || error) {
      // Raised GraphQL error
      toast({
        title: "Error",
        description: "Unable to retrieve Projects",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [error, loading]);

  // Setup table view
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
              size={"sm"}
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
      <Flex
        direction={"row"}
        p={"4"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"4"}
        justify={"center"}
      >
        <Flex
          w={"100%"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"project"} size={"md"} />
            <Heading fontWeight={"bold"} size={"md"}>
              Projects
            </Heading>
            <Spacer />
            <Button
              rightIcon={<Icon name={"add"} />}
              colorScheme={"green"}
              onClick={() => navigate("/create/project")}
              size={"sm"}
            >
              Create
            </Button>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"4"} w={"100%"}>
          {projects.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.projects}
              visibleColumns={visibleColumns}
              selectedRows={{}}
              showColumnSelect
              showPagination
              showSelection
              showItemCount
            />
          ) : (
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
        </Flex>
      </Flex>
    </Content>
  );
};

export default Projects;
