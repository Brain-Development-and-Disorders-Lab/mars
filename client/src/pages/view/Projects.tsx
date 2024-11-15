// React
import React, { useEffect, useState } from "react";
import {
  Button,
  Flex,
  Heading,
  Link,
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
import dayjs from "dayjs";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

// Apollo client imports
import { useQuery, gql } from "@apollo/client";

// Queries
const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      _id
      archived
      name
      created
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
    if (
      _.includes(["md", "sm", "base"], breakpoint) ||
      _.isUndefined(breakpoint)
    ) {
      setVisibleColumns({
        description: false,
        created: false,
        owner: false,
        entities: false,
      });
    } else if (_.includes(["lg"], breakpoint)) {
      setVisibleColumns({
        description: false,
        created: false,
        owner: true,
        entities: true,
      });
    } else {
      setVisibleColumns({
        description: true,
        created: true,
        owner: true,
        entities: true,
      });
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
      cell: (info) => <Text fontWeight={"semibold"}>{info.getValue()}</Text>,
      header: "Name",
    }),
    columnHelper.accessor("created", {
      cell: (info) => dayjs(info.getValue()).fromNow(),
      header: "Created",
      enableHiding: true,
    }),
    columnHelper.accessor("owner", {
      cell: (info) => {
        return <Tag size={"sm"}>{info.getValue()}</Tag>;
      },
      header: "Owner",
    }),
    columnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <Tag colorScheme={"orange"}>Empty</Tag>;
        }
        return (
          <Text fontSize={"sm"}>
            {_.truncate(info.getValue(), { length: 20 })}
          </Text>
        );
      },
      header: "Description",
      enableHiding: true,
    }),
    columnHelper.accessor("entities", {
      cell: (info) => info.getValue().length,
      header: "Entities",
    }),
    columnHelper.accessor("_id", {
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
