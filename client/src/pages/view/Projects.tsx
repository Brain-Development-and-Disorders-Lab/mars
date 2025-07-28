// React
import React, { useEffect, useState } from "react";
import {
  Button,
  EmptyState,
  Flex,
  Heading,
  Link,
  Spacer,
  Tag,
  Text,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import { ProjectModel } from "@types";

// Utility functions and types
import _ from "lodash";
import dayjs from "dayjs";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
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
  const navigate = useNavigate();

  // Effect to adjust column visibility
  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    created: true,
    owner: true,
    entities: true,
  });

  useEffect(() => {
    const isMobile =
      breakpoint === "base" || breakpoint === "sm" || breakpoint === "md";
    const isTablet = breakpoint === "lg";

    setVisibleColumns({
      description: !isMobile && !isTablet,
      created: !isMobile && !isTablet,
      owner: !isMobile,
      entities: !isMobile,
    });
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
      toaster.create({
        title: "Error",
        description: "Unable to retrieve Projects",
        type: "error",
        duration: 4000,
        closable: true,
      });
    }
  }, [error, loading]);

  // Setup table view
  const columnHelper = createColumnHelper<ProjectModel>();
  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => (
        <Tooltip
          content={info.getValue()}
          disabled={info.getValue().length < 36}
        >
          <Text lineClamp={1} fontWeight={"semibold"}>
            {_.truncate(info.getValue(), { length: 36 })}
          </Text>
        </Tooltip>
      ),
      header: "Name",
    }),
    columnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label>Empty</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Tooltip
            content={info.getValue()}
            disabled={info.getValue().length < 36}
          >
            <Text lineClamp={1}>
              {_.truncate(info.getValue(), { length: 36 })}
            </Text>
          </Tooltip>
        );
      },
      header: "Description",
      enableHiding: true,
    }),
    columnHelper.accessor("owner", {
      cell: (info) => {
        return (
          <ActorTag
            orcid={info.getValue()}
            fallback={"Unknown User"}
            size={"sm"}
          />
        );
      },
      header: "Owner",
    }),
    columnHelper.accessor("created", {
      cell: (info) => dayjs(info.getValue()).fromNow(),
      header: "Created",
      enableHiding: true,
    }),
    columnHelper.accessor("entities", {
      cell: (info) => {
        return (
          <Tag.Root colorPalette={"green"}>
            <Tag.Label>{info.getValue().length}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "Entities",
    }),
    columnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"} p={"2"} align={"center"} gap={"1"}>
            <Link
              fontWeight={"semibold"}
              color={"black"}
              onClick={() => navigate(`/projects/${info.getValue()}`)}
            >
              View
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
              colorPalette={"green"}
              onClick={() => navigate("/create/project")}
              size={"sm"}
              rounded={"md"}
            >
              Create
              <Icon name={"add"} />
            </Button>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"4"} w={"100%"}>
          <Text fontSize={"sm"}>
            All Projects in the current Workspace are shown below. Sort the
            Projects using the column headers.
          </Text>
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
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"project"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>No Projects</EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Projects;
