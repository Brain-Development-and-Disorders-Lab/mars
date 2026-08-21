// React
import React, { useEffect, useState } from "react";
import { Button, EmptyState, Flex, Text } from "@chakra-ui/react";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import DataTableFilters from "@components/DataTable/DataTableFilters";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import PageHeader from "@components/PageHeader";
import { CreatedCell, DescriptionCell, OwnerCell } from "@components/DataTable/DataTableCell";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import { IGenericItem, ProjectModel } from "@types";

// Utility functions and types
import _ from "lodash";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Routing and navigation
import { useNavigate, useParams } from "react-router-dom";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Variables
import { STYLES } from "@variables";
import { getPublicWorkspaceUrl } from "@lib/util";

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

export const Projects = () => {
  const navigate = useNavigate();
  const { id } = useParams();

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
  const { loading, error, data } = useQuery<{
    projects: ProjectModel[];
    workspace: IGenericItem;
  }>(GET_PROJECTS, {
    variables: {
      workspace: id,
    },
    fetchPolicy: "network-only",
    context: {
      uri: getPublicWorkspaceUrl(id ?? ""),
    },
  });

  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectModel[]>([]);

  // Filter state (temporary values before applying)
  const [filterState, setFilterState] = useState({
    startDate: "",
    endDate: "",
    owners: [] as string[],
    entityCountMin: "",
    entityCountMax: "",
  });

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "",
    endDate: "",
    owners: [] as string[],
    entityCountMin: "",
    entityCountMax: "",
  });

  // Collapsible state for filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.projects) {
      setProjects(data.projects);
      setFilteredProjects(data.projects);
    }
    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }
  }, [data]);

  // Apply filters to project data
  useEffect(() => {
    let filtered = [...projects];
    let activeFilterCount = 0;

    // Filter by date range
    if (appliedFilters.startDate) {
      const startDate = dayjs(appliedFilters.startDate).startOf("day");
      filtered = filtered.filter((project) => dayjs(project.created).isSameOrAfter(startDate));
      activeFilterCount++;
    }
    if (appliedFilters.endDate) {
      const endDate = dayjs(appliedFilters.endDate).endOf("day");
      filtered = filtered.filter((project) => dayjs(project.created).isSameOrBefore(endDate));
      activeFilterCount++;
    }

    // Filter by owners
    if (appliedFilters.owners.length > 0) {
      filtered = filtered.filter((project) => appliedFilters.owners.includes(project.owner));
      activeFilterCount += appliedFilters.owners.length;
    }

    // Filter by entity count range (min/max)
    if (appliedFilters.entityCountMin || appliedFilters.entityCountMax) {
      filtered = filtered.filter((project) => {
        const entityCount = project.entities.length;
        const min = appliedFilters.entityCountMin ? parseInt(appliedFilters.entityCountMin) : 0;
        const max = appliedFilters.entityCountMax ? parseInt(appliedFilters.entityCountMax) : Infinity;
        return entityCount >= min && entityCount <= max;
      });
      if (appliedFilters.entityCountMin) activeFilterCount++;
      if (appliedFilters.entityCountMax) activeFilterCount++;
    }

    setActiveFilterCount(activeFilterCount);
    setFilteredProjects(filtered);
  }, [projects, appliedFilters]);

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
            onClick={() => navigate(`/public/${id}/projects/${info.row.original._id}`)}
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
      cell: (info) => <DescriptionCell value={info.getValue()} maxLength={48} />,
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
          renderTag={(entity) => <Linky type={"entities"} id={entity} workspace={id} isPublic />}
        />
      ),
      header: "Entities",
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("created", {
      cell: (info) => <CreatedCell value={info.getValue()} />,
      header: "Created",
      enableHiding: true,
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    columnHelper.accessor("owner", {
      cell: (info) => <OwnerCell value={info.getValue()} workspace={id} isPublic />,
      header: "Owner",
    }),
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"row"} p={"1"} rounded={"md"} wrap={"wrap"} gap={"2"} justify={"center"}>
        <Flex w={"100%"} direction={"row"} justify={"space-between"} align={"center"}>
          <Flex align={"center"} gap={"1"} w={"100%"} ml={"0.5"}>
            <PageHeader
              icon={"project"}
              iconColor={STYLES.project.color.icon}
              title={"Public Projects"}
              subtitle={workspaceName}
              loading={loading}
            />
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
            filtersOpen={filtersOpen}
            onFiltersOpenChange={setFiltersOpen}
            activeFilterCount={activeFilterCount}
            startDate={filterState.startDate}
            endDate={filterState.endDate}
            onStartDateChange={(value) => setFilterState({ ...filterState, startDate: value })}
            onEndDateChange={(value) => setFilterState({ ...filterState, endDate: value })}
            owners={projects.map((p) => p.owner)}
            selectedOwners={filterState.owners}
            onOwnersChange={(owners) => setFilterState({ ...filterState, owners })}
            workspace={id}
            isPublic
            countFilter={{
              mode: "range",
              label: "Entity Count",
              min: filterState.entityCountMin,
              max: filterState.entityCountMax,
              onMinChange: (value) => setFilterState({ ...filterState, entityCountMin: value }),
              onMaxChange: (value) => setFilterState({ ...filterState, entityCountMax: value }),
            }}
            onApply={() => setAppliedFilters({ ...filterState })}
            onReset={() => {
              const clearedState = {
                startDate: "",
                endDate: "",
                owners: [],
                entityCountMin: "",
                entityCountMax: "",
              };
              setFilterState(clearedState);
              setAppliedFilters(clearedState);
            }}
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
                  {activeFilterCount > 0 ? "No projects match the selected filters" : "No Projects"}
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
