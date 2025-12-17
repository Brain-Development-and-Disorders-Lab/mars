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
  Input,
  Checkbox,
  Collapsible,
  Field,
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
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { useWorkspace } from "@hooks/useWorkspace";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

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
  const { loading, error, data, refetch } = useQuery<{
    projects: ProjectModel[];
  }>(GET_PROJECTS);

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
  }, [data]);

  // Apply filters to project data
  useEffect(() => {
    let filtered = [...projects];
    let activeFilterCount = 0;

    // Filter by date range
    if (appliedFilters.startDate) {
      const startDate = dayjs(appliedFilters.startDate).startOf("day");
      filtered = filtered.filter((project) =>
        dayjs(project.created).isSameOrAfter(startDate),
      );
      activeFilterCount++;
    }
    if (appliedFilters.endDate) {
      const endDate = dayjs(appliedFilters.endDate).endOf("day");
      filtered = filtered.filter((project) =>
        dayjs(project.created).isSameOrBefore(endDate),
      );
      activeFilterCount++;
    }

    // Filter by owners
    if (appliedFilters.owners.length > 0) {
      filtered = filtered.filter((project) =>
        appliedFilters.owners.includes(project.owner),
      );
      activeFilterCount += appliedFilters.owners.length;
    }

    // Filter by entity count range (min/max)
    if (appliedFilters.entityCountMin || appliedFilters.entityCountMax) {
      filtered = filtered.filter((project) => {
        const entityCount = project.entities.length;
        const min = appliedFilters.entityCountMin
          ? parseInt(appliedFilters.entityCountMin)
          : 0;
        const max = appliedFilters.entityCountMax
          ? parseInt(appliedFilters.entityCountMax)
          : Infinity;
        return entityCount >= min && entityCount <= max;
      });
      if (appliedFilters.entityCountMin) activeFilterCount++;
      if (appliedFilters.entityCountMax) activeFilterCount++;
    }

    setActiveFilterCount(activeFilterCount);
    setFilteredProjects(filtered);
  }, [projects, appliedFilters]);

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
            disabled={info.getValue().length < 48}
            showArrow
          >
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              {_.truncate(info.getValue(), { length: 48 })}
            </Text>
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
            <Icon name={"a_right"} />
          </Button>
        </Flex>
      ),
      header: "Name",
      meta: {
        minWidth: 400,
      },
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
              disabled={info.getValue().length < 64}
              showArrow
            >
              <Text fontSize={"xs"}>
                {_.truncate(info.getValue(), { length: 64 })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 400,
      },
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
        p={"1"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"1"}
        justify={"center"}
      >
        <Flex
          w={"100%"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"1"} w={"100%"}>
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
            Projects using the column headers or use the filters below.
          </Text>

          {/* Filter Section */}
          <Collapsible.Root
            open={filtersOpen}
            onOpenChange={(event) => setFiltersOpen(event.open)}
          >
            <Flex
              direction={"column"}
              gap={"1"}
              p={"1"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
            >
              <Flex
                direction={"row"}
                gap={"1"}
                align={"center"}
                justify={"space-between"}
              >
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"filter"} size={"sm"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Project Filters
                  </Text>
                </Flex>
                <Collapsible.Trigger asChild>
                  <Button size={"xs"} variant={"ghost"} colorPalette={"gray"}>
                    {filtersOpen ? "Hide" : "Show"} Filters
                    <Icon name={filtersOpen ? "c_up" : "c_down"} size={"xs"} />
                  </Button>
                </Collapsible.Trigger>
              </Flex>
              <Collapsible.Content>
                <Flex direction={"row"} gap={["1", "4"]} wrap={"wrap"}>
                  {/* Date Range Filter */}
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    minW={"200px"}
                    flexShrink={0}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Created Between
                    </Text>
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Field.Root gap={"0"}>
                        <Field.Label fontSize={"xs"}>Start</Field.Label>
                        <Input
                          type={"date"}
                          size={"xs"}
                          bg={"white"}
                          value={filterState.startDate}
                          onChange={(e) =>
                            setFilterState({
                              ...filterState,
                              startDate: e.target.value,
                            })
                          }
                        />
                      </Field.Root>
                      <Field.Root gap={"0"}>
                        <Field.Label fontSize={"xs"}>End</Field.Label>
                        <Input
                          type={"date"}
                          size={"xs"}
                          bg={"white"}
                          value={filterState.endDate}
                          onChange={(e) =>
                            setFilterState({
                              ...filterState,
                              endDate: e.target.value,
                            })
                          }
                        />
                      </Field.Root>
                    </Flex>
                  </Flex>

                  {/* Owner Filter */}
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    minW={"200px"}
                    flexShrink={0}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Owner
                    </Text>
                    <Flex
                      direction={"column"}
                      gap={"1"}
                      maxH={"200px"}
                      overflowY={"auto"}
                    >
                      {_.uniq(projects.map((p) => p.owner))
                        .filter((owner) => owner)
                        .map((owner) => (
                          <Checkbox.Root
                            key={owner}
                            size={"xs"}
                            colorPalette={"blue"}
                            checked={filterState.owners.includes(owner)}
                            onCheckedChange={(details) => {
                              const isChecked = details.checked as boolean;
                              if (isChecked) {
                                setFilterState({
                                  ...filterState,
                                  owners: [...filterState.owners, owner],
                                });
                              } else {
                                setFilterState({
                                  ...filterState,
                                  owners: filterState.owners.filter(
                                    (o) => o !== owner,
                                  ),
                                });
                              }
                            }}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize={"xs"}>
                              <ActorTag
                                orcid={owner}
                                fallback={"Unknown User"}
                                size={"sm"}
                                inline
                              />
                            </Checkbox.Label>
                          </Checkbox.Root>
                        ))}
                    </Flex>
                  </Flex>

                  {/* Entity Count Range Filter */}
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    minW={"200px"}
                    flexShrink={0}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Entity Count
                    </Text>
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Field.Root gap={"0"}>
                        <Field.Label fontSize={"xs"}>Min</Field.Label>
                        <Input
                          type={"number"}
                          size={"xs"}
                          bg={"white"}
                          min={0}
                          value={filterState.entityCountMin}
                          onChange={(e) =>
                            setFilterState({
                              ...filterState,
                              entityCountMin: e.target.value,
                            })
                          }
                          placeholder="0"
                        />
                      </Field.Root>
                      <Field.Root gap={"0"}>
                        <Field.Label fontSize={"xs"}>Max</Field.Label>
                        <Input
                          type={"number"}
                          size={"xs"}
                          bg={"white"}
                          min={0}
                          value={filterState.entityCountMax}
                          onChange={(e) =>
                            setFilterState({
                              ...filterState,
                              entityCountMax: e.target.value,
                            })
                          }
                          placeholder="∞"
                        />
                      </Field.Root>
                    </Flex>
                  </Flex>
                </Flex>
              </Collapsible.Content>
            </Flex>
          </Collapsible.Root>

          {/* Buttons and Active Filter Count */}
          <Flex
            direction={"row"}
            gap={"1"}
            align={"center"}
            justify={"flex-end"}
          >
            <Text fontWeight={"semibold"} fontSize={"xs"}>
              {activeFilterCount} Active Filter
              {activeFilterCount > 1 || activeFilterCount === 0 ? "s" : ""}
            </Text>
            <Button
              size={"xs"}
              rounded={"md"}
              colorPalette={"blue"}
              onClick={() => {
                setAppliedFilters({ ...filterState });
              }}
            >
              Apply
            </Button>
            <Button
              size={"xs"}
              variant={"outline"}
              rounded={"md"}
              onClick={() => {
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
              disabled={activeFilterCount === 0}
            >
              Clear
            </Button>
          </Flex>

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
                  <Icon name={"project"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>
                  {activeFilterCount > 0
                    ? "No projects match the selected filters"
                    : "No Projects"}
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
