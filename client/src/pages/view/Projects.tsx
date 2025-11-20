// React
import React, { useEffect, useState } from "react";
import {
  Button,
  EmptyState,
  Flex,
  Heading,
  Spacer,
  Tag,
  Text,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import DataTableRemix from "@components/DataTableRemix";
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
        <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
          <Tooltip
            content={info.getValue()}
            disabled={info.getValue().length < 20}
            showArrow
          >
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              {_.truncate(info.getValue(), { length: 20 })}
            </Text>
          </Tooltip>
          <Button
            size="2xs"
            mx={"1"}
            variant="outline"
            colorPalette="gray"
            aria-label={"View Project"}
            onClick={() => navigate(`/projects/${info.row.original._id}`)}
          >
            View
            <Icon name={"a_right"} />
          </Button>
        </Flex>
      ),
      header: "Name",
    }),
    columnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>Empty</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Flex>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 32}
              showArrow
            >
              <Text fontSize={"xs"}>
                {_.truncate(info.getValue(), { length: 32 })}
              </Text>
            </Tooltip>
          </Flex>
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
            inline
          />
        );
      },
      header: "Owner",
    }),
    columnHelper.accessor("created", {
      cell: (info) => {
        return (
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
            {dayjs(info.getValue()).fromNow()}
          </Text>
        );
      },
      header: "Created",
      enableHiding: true,
    }),
    columnHelper.accessor("entities", {
      cell: (info) => {
        return (
          <Tag.Root colorPalette={"green"} size={"sm"}>
            <Tag.Label fontSize={"xs"}>{info.getValue().length}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "Entities",
    }),
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex
        direction={"row"}
        p={"2"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"2"}
        justify={"center"}
      >
        <Flex
          w={"100%"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"project"} size={"sm"} />
            <Heading fontWeight={"bold"} size={"md"}>
              Projects
            </Heading>
            <Spacer />
            <Button
              colorPalette={"green"}
              onClick={() => navigate("/create/project")}
              size={"xs"}
              rounded={"md"}
            >
              Create Project
              <Icon name={"add"} size={"xs"} />
            </Button>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"2"} w={"100%"}>
          <Text fontSize={"xs"} ml={"0.5"}>
            All Projects in the current Workspace are shown below. Sort the
            Projects using the column headers.
          </Text>
          {projects.length > 0 ? (
            <DataTableRemix
              columns={columns}
              data={data.projects}
              visibleColumns={visibleColumns}
              selectedRows={{}}
              showColumnSelect
              showPagination
              showSelection
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
