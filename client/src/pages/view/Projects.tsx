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
  SkeletonText,
  Separator,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
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
  const { loading, error, data } = useQuery<{
    projects: ProjectModel[];
    workspace: IGenericItem;
  }>(GET_PROJECTS, {
    variables: {
      workspace: workspace,
    },
    fetchPolicy: "network-only",
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
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>No Description</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Flex>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 64} showArrow>
              <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 64 })}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("entities", {
      cell: (info) => {
        const entities = info.row.original.entities;

        // 0 Entities
        if (entities.length === 0) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>No Entities</Tag.Label>
            </Tag.Root>
          );
        }

        // Multiple Entities
        if (entities.length > 1) {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {entities.slice(0, 1).map((entity) => (
                <Linky type={"entities"} id={entity} />
              ))}
              <Text fontSize={"xs"}>
                and {entities.length - 1} other{entities.length - 1 !== 1 ? "s" : ""}
              </Text>
            </Flex>
          );
        } else {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {entities.map((entity) => (
                <Linky type={"entities"} id={entity} />
              ))}
            </Flex>
          );
        }
      },
      header: "Entities",
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("created", {
      cell: (info) => {
        return (
          <Tooltip content={dayjs(info.getValue()).format("[Created:] DD MMMM YYYY, HH:MM A")} showArrow>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
              {dayjs(info.getValue()).fromNow()}
            </Text>
          </Tooltip>
        );
      },
      header: "Created",
      enableHiding: true,
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    columnHelper.accessor("owner", {
      cell: (info) => {
        return <ActorTag identifier={info.getValue()} fallback={"Unknown User"} size={"sm"} inline />;
      },
      header: "Owner",
    }),
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"row"} p={"1"} rounded={"md"} wrap={"wrap"} gap={"2"} justify={"center"}>
        <Flex w={"100%"} direction={"row"} justify={"space-between"} align={"center"}>
          <Flex align={"center"} gap={"1"} w={"100%"} ml={"0.5"}>
            <Flex direction={"column"} gap={"0"} align={"start"}>
              <Flex direction={"row"} align={"center"} gap={"1"}>
                <Icon name={"project"} size={"sm"} color={STYLES.project.color.icon} />
                <Heading size={"xl"}>Projects</Heading>
              </Flex>
              <SkeletonText noOfLines={1} my={"0.5"} h={"22px"} loading={loading} asChild>
                <Text fontSize={"sm"} fontWeight={"semibold"} color={"text.subtle"}>
                  {workspaceName}
                </Text>
              </SkeletonText>
            </Flex>
            <Spacer />
            <Tooltip
              content={"Insufficient permissions in this Workspace"}
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
          <Collapsible.Root open={filtersOpen} onOpenChange={(event) => setFiltersOpen(event.open)}>
            <Flex
              direction={"column"}
              gap={"2"}
              p={"2"}
              rounded={"md"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
            >
              <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"}>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"filter"} size={"sm"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Project Filters:
                  </Text>
                  <Text fontWeight={"semibold"} fontSize={"xs"} color={activeFilterCount >= 1 ? "green.700" : "black"}>
                    {activeFilterCount} Active
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
                <Flex direction={"column"} gap={"2"}>
                  <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                    {/* Date Range Filter */}
                    <Flex direction={"column"} gap={"1"} minW={"200px"} flexShrink={0}>
                      <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Created Between
                      </Text>
                      <Flex direction={"row"} gap={"2"} align={"center"}>
                        <Field.Root gap={"0"}>
                          <Field.Label
                            fontSize={"xs"}
                            fontWeight={"semibold"}
                            ml={"0.5"}
                            color={STYLES.font.secondaryHeader.color}
                          >
                            Start (optional)
                          </Field.Label>
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
                          <Field.Label
                            fontSize={"xs"}
                            fontWeight={"semibold"}
                            ml={"0.5"}
                            color={STYLES.font.secondaryHeader.color}
                          >
                            End (optional)
                          </Field.Label>
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

                    <Separator orientation={"vertical"} />

                    {/* Owner Filter */}
                    <Flex direction={"column"} gap={"1"} minW={"200px"} flexShrink={0}>
                      <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Owner
                      </Text>
                      <Flex direction={"column"} gap={"2"} maxH={"200px"} overflowY={"auto"} ml={"1"}>
                        {projects.length > 0 &&
                          _.uniq(projects.map((p) => p.owner))
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
                                      owners: filterState.owners.filter((o) => o !== owner),
                                    });
                                  }
                                }}
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                                <Checkbox.Label fontSize={"xs"}>
                                  <ActorTag identifier={owner} fallback={"Unknown User"} size={"sm"} inline />
                                </Checkbox.Label>
                              </Checkbox.Root>
                            ))}

                        {projects.length === 0 && (
                          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                            No Project Owners
                          </Text>
                        )}
                      </Flex>
                    </Flex>

                    <Separator orientation={"vertical"} />

                    {/* Entity Count Range Filter */}
                    <Flex direction={"column"} gap={"1"} minW={"200px"} flexShrink={0}>
                      <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Entity Count
                      </Text>
                      <Flex direction={"row"} gap={"2"} align={"center"}>
                        <Field.Root gap={"0"}>
                          <Field.Label
                            fontSize={"xs"}
                            fontWeight={"semibold"}
                            ml={"0.5"}
                            color={STYLES.font.secondaryHeader.color}
                          >
                            Minimum
                          </Field.Label>
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
                          <Field.Label
                            fontSize={"xs"}
                            fontWeight={"semibold"}
                            ml={"0.5"}
                            color={STYLES.font.secondaryHeader.color}
                          >
                            Maximum
                          </Field.Label>
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

                  {/* Filter control buttons */}
                  <Flex direction={"row"} gap={"2"} align={"center"} justify={"flex-end"}>
                    <Button
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"blue"}
                      onClick={() => {
                        setAppliedFilters({ ...filterState });
                      }}
                    >
                      Apply Filters
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
                      Reset Filters
                    </Button>
                  </Flex>
                </Flex>
              </Collapsible.Content>
            </Flex>
          </Collapsible.Root>

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
