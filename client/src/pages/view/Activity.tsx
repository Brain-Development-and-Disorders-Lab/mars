// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Box,
  Flex,
  Heading,
  Text,
  Tag,
  EmptyState,
  Button,
  Checkbox,
  Input,
  Field,
  Collapsible,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import DataTable from "@components/DataTable";
import Linky from "@components/Linky";
import ActivityGraph from "@components/ActivityGraph";
import { createColumnHelper, ColumnFiltersState } from "@tanstack/react-table";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Existing and custom types
import { ActivityModel } from "@types";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { useWorkspace } from "@hooks/useWorkspace";

// Utility functions and libraries
import { gql, useQuery } from "@apollo/client";
import _ from "lodash";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const Activity = () => {
  const navigate = useNavigate();
  const [activityData, setActivityData] = useState([] as ActivityModel[]);
  // Timestamp update state to trigger re-renders for relative time display
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timestampUpdate, setTimestampUpdate] = useState(Date.now());

  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    target: true,
    user: true,
    timestamp: true,
  });

  // Column filters state for activity table
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Filter state (temporary values before applying)
  const [filterState, setFilterState] = useState({
    startDate: "",
    endDate: "",
    activityTypes: [] as string[],
    targetTypes: [] as string[],
  });

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "",
    endDate: "",
    activityTypes: [] as string[],
    targetTypes: [] as string[],
  });

  // Filtered activity data
  const [filteredActivityData, setFilteredActivityData] = useState(
    [] as ActivityModel[],
  );

  // Collapsible state for filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Update timestamp every 5 seconds to trigger relative time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestampUpdate(Date.now());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Query to retrieve Activity
  const GET_ACTIVITY = gql`
    query GetActivity($limit: Int) {
      activity(limit: $limit) {
        _id
        timestamp
        type
        actor
        details
        target {
          _id
          name
          type
        }
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery<{
    activity: ActivityModel[];
  }>(GET_ACTIVITY, {
    variables: {
      limit: 10000, // High limit to get all activity
    },
    fetchPolicy: "network-only",
    pollInterval: 5000, // Poll every 5 seconds to refresh activity
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.activity) {
      // Unpack all the Activity data
      setActivityData(data.activity);
      // Initialize filtered data with all activity
      setFilteredActivityData(data.activity);
    }
  }, [data]);

  // Apply filters to activity data
  useEffect(() => {
    let filtered = [...activityData];
    let activeFilterCount = 0;

    // Filter by date range
    if (appliedFilters.startDate) {
      const startDate = dayjs(appliedFilters.startDate).startOf("day");
      filtered = filtered.filter((activity) =>
        dayjs(activity.timestamp).isSameOrAfter(startDate),
      );
      activeFilterCount++;
    }
    if (appliedFilters.endDate) {
      const endDate = dayjs(appliedFilters.endDate).endOf("day");
      filtered = filtered.filter((activity) =>
        dayjs(activity.timestamp).isSameOrBefore(endDate),
      );
      activeFilterCount++;
    }

    // Filter by activity types
    if (appliedFilters.activityTypes.length > 0) {
      filtered = filtered.filter((activity) =>
        appliedFilters.activityTypes.includes(activity.type),
      );
      activeFilterCount += appliedFilters.activityTypes.length;
    }

    // Filter by target types
    if (appliedFilters.targetTypes.length > 0) {
      filtered = filtered.filter((activity) =>
        appliedFilters.targetTypes.includes(activity.target.type),
      );
      activeFilterCount += appliedFilters.targetTypes.length;
    }

    setActiveFilterCount(activeFilterCount);
    setFilteredActivityData(filtered);
  }, [activityData, appliedFilters]);

  const { workspace } = useWorkspace();

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

  // Update column visibility when breakpoint changes
  useEffect(() => {
    const isMobile = breakpoint === "base" || breakpoint === "sm";
    setVisibleColumns({
      target: !isMobile,
      user: !isMobile,
      timestamp: !isMobile,
    });
  }, [breakpoint]);

  // Configure table columns and data
  const columnHelper = createColumnHelper<ActivityModel>();
  const columns = [
    columnHelper.accessor("type", {
      cell: (info) => {
        const type = info.getValue();
        const displayType =
          type === "create"
            ? "created"
            : type === "update"
              ? "update"
              : type === "archived"
                ? "archived"
                : type;
        const colorPalette =
          type === "create"
            ? "green"
            : type === "update"
              ? "blue"
              : type === "archived"
                ? "red"
                : "orange";
        return (
          <Flex align={"center"} justify={"center"} w={"100%"}>
            <Tag.Root colorPalette={colorPalette} size={"sm"}>
              <Tag.Label fontSize={"xs"} textTransform={"capitalize"}>
                {displayType}
              </Tag.Label>
            </Tag.Root>
          </Flex>
        );
      },
      header: "Operation",
      meta: {
        minWidth: 120,
      },
    }),
    columnHelper.accessor("target", {
      cell: (info) => {
        const target = info.getValue();
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Linky
              id={target._id}
              type={target.type}
              fallback={target.name}
              justify={"left"}
              size={"xs"}
            />
            <Button
              size="2xs"
              variant="subtle"
              colorPalette="gray"
              aria-label={"View Target"}
              onClick={() =>
                navigate(`/${target.type.toLowerCase()}/${target._id}`)
              }
            >
              View
              <Icon name={"a_right"} size={"xs"} />
            </Button>
          </Flex>
        );
      },
      header: "Target",
      meta: {
        minWidth: 200,
      },
    }),
    columnHelper.accessor("actor", {
      cell: (info) => {
        const actor = info.getValue();
        if (!actor) {
          return (
            <Text fontSize={"xs"} color={"gray.500"}>
              Unknown
            </Text>
          );
        }
        return (
          <ActorTag
            orcid={actor}
            fallback={"Unknown User"}
            size={"sm"}
            inline
          />
        );
      },
      header: "User",
      enableHiding: true,
    }),
    columnHelper.accessor("timestamp", {
      cell: (info) => (
        <Flex direction={"row"} gap={"1"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
            {dayjs(info.getValue()).format("MMM D, YYYY h:mm A")}
          </Text>
          <Text fontSize={"xs"} color={"gray.600"}>
            ({dayjs(info.getValue()).fromNow()})
          </Text>
        </Flex>
      ),
      header: "Timestamp",
      enableHiding: true,
      meta: {
        minWidth: 180,
      },
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
        minW="0"
        maxW="100%"
      >
        <Flex
          w={"100%"}
          minW="0"
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"1"} w={"100%"} minW="0">
            <Icon name={"activity"} size={"sm"} />
            <Heading size={"md"}>Workspace Activity</Heading>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"1"} w={"100%"} minW="0" maxW="100%">
          <Text fontSize={"xs"} ml={"0.5"}>
            All activity in the current Workspace is shown below, sorted by most
            recent. Sort the activity using the column headers or use the
            filters below.
          </Text>

          {/* Activity Charts Section */}
          <Flex
            direction={{ base: "column", md: "row" }}
            gap={"1"}
            w={"100%"}
            minW="0"
            maxW="100%"
          >
            <Flex direction={"column"} flex={"1"} minW="0">
              <ActivityGraph
                activities={activityData}
                title="Overall Activity"
                height="200px"
              />
            </Flex>
            <Flex direction={"column"} flex={"1"} minW="0">
              <ActivityGraph
                activities={activityData.filter(
                  (activity) => activity.target.type === "entities",
                )}
                title="Entity Activity"
                height="200px"
              />
            </Flex>
            <Flex direction={"column"} flex={"1"} minW="0">
              <ActivityGraph
                activities={activityData.filter(
                  (activity) => activity.target.type === "projects",
                )}
                title="Project Activity"
                height="200px"
              />
            </Flex>
          </Flex>

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
                    Activity Filters
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
                      Date Range
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

                  {/* Checkbox Filters Group - Operation Type and Target Type */}
                  <Flex
                    direction={"row"}
                    gap={"4"}
                    wrap={"nowrap"}
                    flexShrink={0}
                  >
                    {/* Operation Type Filter */}
                    <Flex direction={"column"} gap={"1"} minW={"200px"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Operation Type
                      </Text>
                      <Flex direction={"column"} gap={"1"}>
                        {["create", "update", "archived"].map((type) => (
                          <Checkbox.Root
                            key={type}
                            size={"xs"}
                            colorPalette={"blue"}
                            checked={filterState.activityTypes.includes(type)}
                            onCheckedChange={(details) => {
                              const isChecked = details.checked as boolean;
                              if (isChecked) {
                                setFilterState({
                                  ...filterState,
                                  activityTypes: [
                                    ...filterState.activityTypes,
                                    type,
                                  ],
                                });
                              } else {
                                setFilterState({
                                  ...filterState,
                                  activityTypes:
                                    filterState.activityTypes.filter(
                                      (t) => t !== type,
                                    ),
                                });
                              }
                            }}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label
                              fontSize={"xs"}
                              textTransform={"capitalize"}
                            >
                              {type === "create" ? "Created" : type}
                            </Checkbox.Label>
                          </Checkbox.Root>
                        ))}
                      </Flex>
                    </Flex>

                    {/* Target Type Filter */}
                    <Flex direction={"column"} gap={"1"} minW={"200px"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Target Type
                      </Text>
                      <Flex direction={"column"} gap={"1"}>
                        {["entities", "projects", "templates"].map((type) => (
                          <Checkbox.Root
                            key={type}
                            size={"xs"}
                            colorPalette={"blue"}
                            checked={filterState.targetTypes.includes(type)}
                            onCheckedChange={(details) => {
                              const isChecked = details.checked as boolean;
                              if (isChecked) {
                                setFilterState({
                                  ...filterState,
                                  targetTypes: [
                                    ...filterState.targetTypes,
                                    type,
                                  ],
                                });
                              } else {
                                setFilterState({
                                  ...filterState,
                                  targetTypes: filterState.targetTypes.filter(
                                    (t) => t !== type,
                                  ),
                                });
                              }
                            }}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label
                              fontSize={"xs"}
                              textTransform={"capitalize"}
                            >
                              {type === "entities"
                                ? "Entity"
                                : type === "projects"
                                  ? "Project"
                                  : "Template"}
                            </Checkbox.Label>
                          </Checkbox.Root>
                        ))}
                      </Flex>
                    </Flex>
                  </Flex>
                </Flex>
              </Collapsible.Content>
            </Flex>
          </Collapsible.Root>

          {/* Buttons and Live Indicator Row */}
          <Flex
            direction={"row"}
            gap={"1"}
            align={"center"}
            justify={"space-between"}
            data-timestamp-update={timestampUpdate}
          >
            {/* Live Indicator - Far Left */}
            <Flex align={"center"} gap={"1"} ml={"0.5"}>
              <Box
                w={"8px"}
                h={"8px"}
                borderRadius={"full"}
                bg={"green.500"}
                className="live-indicator"
              />
              <Text fontSize={"xs"} color={"gray.600"} fontWeight={"semibold"}>
                Live
              </Text>
            </Flex>

            {/* Apply and Clear Buttons - Right */}
            <Flex direction={"row"} gap={"2"} align={"center"}>
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
                    activityTypes: [],
                    targetTypes: [],
                  };
                  setFilterState(clearedState);
                  setAppliedFilters(clearedState);
                }}
                disabled={activeFilterCount === 0}
              >
                Clear
              </Button>
            </Flex>
          </Flex>

          {filteredActivityData.length > 0 || activityData.length === 0 ? (
            <Box w="100%" minW="0" maxW="100%">
              <DataTable
                columns={columns}
                data={filteredActivityData}
                visibleColumns={visibleColumns}
                selectedRows={{}}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                showSelection
                showColumnSelect
                showPagination
              />
            </Box>
          ) : (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"activity"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>
                  {appliedFilters.startDate ||
                  appliedFilters.endDate ||
                  appliedFilters.activityTypes.length > 0 ||
                  appliedFilters.targetTypes.length > 0
                    ? "No activity matches the selected filters"
                    : "No Activity"}
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Activity;
