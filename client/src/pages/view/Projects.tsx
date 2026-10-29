// React
import React, { useEffect, useState } from "react";
import { Button, EmptyState, Flex, Spacer, Text } from "@chakra-ui/react";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import DataTableFilters from "@components/DataTable/DataTableFilters";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import PageHeader from "@components/PageHeader";
import { CellCreatedField, CellDescriptionField, CellOwnerField } from "@components/DataTable/DataTableCell";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import { DataTableFilterValues, IGenericItem, ProjectModel } from "@types";

// Utility functions and types
import _ from "lodash";
import { countActiveFilters, createEmptyFilterValues, filterTableData } from "@lib/util";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { usePermissions } from "@hooks/usePermissions";
import { useWorkspace } from "@hooks/useWorkspace";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Variables
import { STYLES } from "@variables";

// Queries
const GET_PROJECTS = gql`
  query GetProjects($workspace: String) {
    projects {
      _id
      archived
      name
      created
      description
      owner
      entities
    }
    workspace(_id: $workspace) {
      _id
      name
    }
  }
`;

const Projects = () => {
  const navigate = useNavigate();

  // Permissions
  const { workspacePermissions } = usePermissions();

  const { workspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");

  // Effect to adjust column visibility
  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    created: true,
    owner: true,
    entities: true,
  });

  useEffect(() => {
    const isMobile = breakpoint === "base" || breakpoint === "sm" || breakpoint === "md";
    const isTablet = breakpoint === "lg";

    setVisibleColumns({
      description: !isMobile && !isTablet,
      created: !isMobile && !isTablet,
      owner: !isMobile,
      entities: !isMobile,
    });
  }, [breakpoint]);

  // Execute GraphQL query both on page load and navigation
  const { loading, error, data, previousData } = useQuery<{
    projects: ProjectModel[];
    workspace: IGenericItem;
  }>(GET_PROJECTS, {
    variables: {
      workspace: workspace,
    },
    fetchPolicy: "network-only",
  });

  const [projects, setProjects] = useState<ProjectModel[]>([]);

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState<DataTableFilterValues>(createEmptyFilterValues);
  const filteredProjects = filterTableData(projects, appliedFilters, {
    created: (project) => project.created,
    owner: (project) => project.owner,
    counts: { entities: (project) => project.entities.length },
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.projects) {
      setProjects(data.projects);
    }
    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }
  }, [data]);

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
          <Tooltip content={info.getValue()} disabled={info.getValue().length < 48} showArrow>
            <Flex gap={"1"} align={"center"}>
              <Icon name={"project"} color={STYLES.project.color.icon} size={"xs"} />
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 48 })}
              </Text>
            </Flex>
          </Tooltip>
          <Button
            size="2xs"
            mx={"1"}
            variant="subtle"
            colorPalette="gray"
            aria-label={"View Project"}
            onClick={() => navigate(`/projects/${info.row.original._id}`)}
          >
            View
            <Icon name={"a_right"} size={"xs"} />
          </Button>
        </Flex>
      ),
      header: "Name",
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("description", {
      cell: (info) => <CellDescriptionField value={info.getValue()} maxLength={48} />,
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("entities", {
      cell: (info) => (
        <FieldTagList
          items={info.row.original.entities}
          max={1}
          emptyLabel={"Entities"}
          getKey={(entity) => entity}
          renderTag={(entity) => <Linky type={"entities"} id={entity} />}
        />
      ),
      header: "Entities",
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("created", {
      cell: (info) => <CellCreatedField value={info.getValue()} />,
      header: "Created",
      enableHiding: true,
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    columnHelper.accessor("owner", {
      cell: (info) => <CellOwnerField value={info.getValue()} />,
      header: "Owner",
    }),
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading || !_.isUndefined(previousData)}>
      <Flex direction={"row"} p={"1"} rounded={"md"} wrap={"wrap"} gap={"2"} justify={"center"}>
        <Flex w={"100%"} direction={"row"} justify={"space-between"} align={"center"}>
          <Flex align={"center"} gap={"1"} w={"100%"} ml={"0.5"}>
            <PageHeader
              icon={"project"}
              iconColor={STYLES.project.color.icon}
              title={"Projects"}
              subtitle={workspaceName}
              loading={loading}
            />
            <Spacer />
            <Tooltip
              content={"You do not have permission to do this in this Workspace"}
              disabled={workspacePermissions.projects.create}
              showArrow
            >
              <Button
                colorPalette={"green"}
                onClick={() => navigate("/create/project")}
                size={"xs"}
                rounded={"md"}
                disabled={!workspacePermissions.projects.create}
              >
                Create Project
                <Icon name={"add"} size={"xs"} />
              </Button>
            </Tooltip>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"2"} w={"100%"}>
          <Text fontSize={"xs"} ml={"0.5"}>
            All Projects in the current Workspace are shown below. Sort the Projects using the column headers or use the
            filters below.
          </Text>

          {/* Filter Section */}
          <DataTableFilters
            entityLabel={"Project"}
            owners={projects.map((p) => p.owner)}
            ranges={[{ key: "entities", label: "Entity Count" }]}
            values={appliedFilters}
            onApply={setAppliedFilters}
          />

          {filteredProjects.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredProjects}
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
                  <Icon name={"project"} size={"lg"} color={STYLES.project.color.default} />
                </EmptyState.Indicator>
                <EmptyState.Description>
                  {countActiveFilters(appliedFilters) > 0 ? "No projects match the selected filters" : "No Projects"}
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Projects;
