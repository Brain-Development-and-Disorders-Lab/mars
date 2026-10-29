// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Box, Flex, Heading, Text, Tag, EmptyState, SkeletonText } from "@chakra-ui/react";
import TagActor from "@components/TagActor";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import DataTable from "@components/DataTable";
import Linky from "@components/Linky";
import ActivityGraph from "@components/ActivityGraph";
import RelativeTime from "@components/RelativeTime";
import Tooltip from "@components/Tooltip";
import DataTableFilterPanel, {
  FilterCheckbox,
  FilterInput,
  FilterSection,
} from "@components/DataTable/DataTableFilterPanel";
import { createColumnHelper, ColumnFiltersState } from "@tanstack/react-table";

// Existing and custom types
import { ActivityFilterValues, ActivityModel, IGenericItem, ISelectOption } from "@types";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { useWorkspace } from "@hooks/useWorkspace";
import { useWatchQuery } from "@hooks/useWatchQuery";

// Utility functions and libraries
import { gql } from "@apollo/client";
import _ from "lodash";
import { toggleArrayValue } from "@lib/util";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Variables
import { STYLES } from "@variables";

// Filter options
const OPERATION_TYPE_OPTIONS: ISelectOption[] = [
  { value: "create", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "archived", label: "Archived" },
];
const TARGET_TYPE_OPTIONS: ISelectOption[] = [
  { value: "entities", label: "Entity" },
  { value: "projects", label: "Project" },
  { value: "attributes", label: "Attribute" },
];
const MEDIUM_OPTIONS: ISelectOption[] = [
  { value: "api", label: "API" },
  { value: "web", label: "Web" },
];
const EMPTY_FILTERS: ActivityFilterValues = {
  startDate: "",
  endDate: "",
  activityTypes: [],
  targetTypes: [],
  mediums: [],
};

// Query to retrieve Activity
const GET_ACTIVITY = gql`
  query GetActivity($limit: Int, $workspace: String) {
    activity(limit: $limit) {
      _id
      timestamp
      type
      actor
      details
      medium
      target {
        _id
        name
        type
      }
    }
    workspace(_id: $workspace) {
      _id
      name
    }
  }
`;

const Activity = () => {
  const { workspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");

  const [activityData, setActivityData] = useState([] as ActivityModel[]);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    medium: true,
  });

  // Column filters state for activity table
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Filter state
  const [filterState, setFilterState] = useState<ActivityFilterValues>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ActivityFilterValues>(EMPTY_FILTERS);

  // Filtered activity data
  const [filteredActivityData, setFilteredActivityData] = useState([] as ActivityModel[]);

  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const { loading, error, data } = useWatchQuery<{
    activity: ActivityModel[];
    workspace: IGenericItem;
  }>(GET_ACTIVITY, {
    limit: 10000, // High limit to get all activity
    workspace: workspace,
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.activity) {
      setActivityData(data.activity);
      setFilteredActivityData(data.activity);
      setInitialLoaded(true);
    }
    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }
  }, [data]);

  // Apply filters to activity data
  useEffect(() => {
    let filtered = [...activityData];
    let activeFilterCount = 0;

    // Filter by date range
    if (appliedFilters.startDate) {
      const startDate = dayjs(appliedFilters.startDate).startOf("day");
      filtered = filtered.filter((activity) => dayjs(activity.timestamp).isSameOrAfter(startDate));
      activeFilterCount++;
    }
    if (appliedFilters.endDate) {
      const endDate = dayjs(appliedFilters.endDate).endOf("day");
      filtered = filtered.filter((activity) => dayjs(activity.timestamp).isSameOrBefore(endDate));
      activeFilterCount++;
    }

    // Filter by activity types
    if (appliedFilters.activityTypes.length > 0) {
      filtered = filtered.filter((activity) => appliedFilters.activityTypes.includes(activity.type));
      activeFilterCount += appliedFilters.activityTypes.length;
    }

    // Filter by target types
    if (appliedFilters.targetTypes.length > 0) {
      filtered = filtered.filter((activity) => appliedFilters.targetTypes.includes(activity.target.type));
      activeFilterCount += appliedFilters.targetTypes.length;
    }

    // Filter by medium types
    if (appliedFilters.mediums.length > 0) {
      // Apply filters differently since not all `Activity` entries specify a medium
      if (appliedFilters.mediums.length === 1 && appliedFilters.mediums.includes("web")) {
        // Only "web" is selected
        filtered = filtered.filter((activity) => _.isNull(activity.medium) || activity.medium === "Web");
        activeFilterCount++;
      } else if (appliedFilters.mediums.length === 1 && appliedFilters.mediums.includes("api")) {
        // Only "api" is selected
        filtered = filtered.filter((activity) => activity.medium && activity.medium === "API");
        activeFilterCount++;
      } else {
        // Both are selected
        activeFilterCount += appliedFilters.mediums.length;
      }
    }

    setActiveFilterCount(activeFilterCount);
    setFilteredActivityData(filtered);
  }, [activityData, appliedFilters]);

  // Update column visibility when breakpoint changes
  useEffect(() => {
    const isMobile = breakpoint === "base" || breakpoint === "sm";
    setVisibleColumns({
      medium: !isMobile,
    });
  }, [breakpoint]);

  // Configure table columns and data
  const columnHelper = createColumnHelper<ActivityModel>();
  const columns = [
    columnHelper.accessor("type", {
      cell: (info) => {
        const type = info.getValue();
        const displayType =
          type === "create" ? "created" : type === "update" ? "update" : type === "archived" ? "archived" : type;
        const colorPalette =
          type === "create" ? "green" : type === "update" ? "blue" : type === "archived" ? "red" : "orange";
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
        if (target.type !== "workspaces") {
          return (
            <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
              <Linky id={target._id} type={target.type} fallback={target.name} justify={"left"} size={"xs"} />
            </Flex>
          );
        } else {
          return (
            <Tooltip content={target.name} disabled={target.name.length < 32}>
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Icon name={"workspace"} size={"xs"} />
                <Text fontWeight={"semibold"} fontSize={"xs"}>
                  {_.truncate(target.name, { length: 32 })}
                </Text>
              </Flex>
            </Tooltip>
          );
        }
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
            <Text fontSize={"xs"} color={"text.subtle"}>
              Unknown
            </Text>
          );
        }
        return <TagActor identifier={actor} fallback={"Unknown User"} size={"sm"} inline />;
      },
      header: "User",
      enableHiding: true,
    }),
    columnHelper.accessor("medium", {
      cell: (info) => {
        const medium = info.getValue() ?? "Web";
        return (
          <Flex align={"center"} justify={"center"} w={"100%"}>
            <Tag.Root colorPalette={medium === "API" ? "purple" : "gray"} size={"sm"}>
              <Tag.Label fontSize={"xs"}>{medium}</Tag.Label>
            </Tag.Root>
          </Flex>
        );
      },
      header: "Medium",
      enableHiding: true,
      meta: {
        minWidth: 100,
      },
    }),
    columnHelper.accessor("timestamp", {
      cell: (info) => (
        <Flex direction={"row"} gap={"1"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
            {dayjs(info.getValue()).format("MMM D, YYYY h:mm A")}
          </Text>
          <RelativeTime
            value={info.getValue()}
            format={(relative) => `(${relative})`}
            fontSize={"xs"}
            color={STYLES.font.secondaryHeader.color}
          />
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
    <Content isError={!_.isUndefined(error) && !initialLoaded} isLoaded={initialLoaded || !loading}>
      <Flex direction={"row"} p={"1"} rounded={"md"} wrap={"wrap"} gap={"2"} minW={"0"} maxW={"100%"}>
        <Flex direction={"column"} gap={"0"} align={"start"}>
          <Flex direction={"row"} align={"center"} gap={"1"}>
            <Icon name={"activity"} size={"sm"} />
            <Heading size={"xl"}>Activity</Heading>
          </Flex>
          <SkeletonText noOfLines={1} my={"0.5"} h={"22px"} loading={loading} asChild>
            <Text fontSize={"sm"} fontWeight={"semibold"} color={"text.subtle"}>
              {workspaceName}
            </Text>
          </SkeletonText>
        </Flex>
        <Flex direction={"column"} gap={"2"} w={"100%"} minW="0" maxW="100%">
          <Text fontSize={"xs"} ml={"0.5"}>
            All activity in the current Workspace is shown below, sorted by most recent. Sort the activity using the
            column headers or use the filters below.
          </Text>

          {/* Activity Charts Section */}
          <Flex direction={{ base: "column", md: "row" }} gap={"2"} w={"100%"} minW={"0"} maxW={"100%"}>
            <Flex direction={"column"} flex={"1"} minW="0">
              <ActivityGraph activities={activityData} title="Overall Activity" height="200px" />
            </Flex>
            <Flex direction={"column"} flex={"1"} minW="0">
              <ActivityGraph
                activities={activityData.filter((activity) => activity.target.type === "entities")}
                title="Entity Activity"
                height="200px"
              />
            </Flex>
            <Flex direction={"column"} flex={"1"} minW="0">
              <ActivityGraph
                activities={activityData.filter((activity) => activity.target.type === "projects")}
                title="Project Activity"
                height="200px"
              />
            </Flex>
            <Flex direction={"column"} flex={"1"} minW="0">
              <ActivityGraph
                activities={activityData.filter((activity) => activity.target.type === "workspaces")}
                title="Workspace Activity"
                height="200px"
              />
            </Flex>
          </Flex>

          {/* Filter Section */}
          <DataTableFilterPanel
            label={"Activity"}
            activeFilterCount={activeFilterCount}
            onApply={() => setAppliedFilters({ ...filterState })}
            onReset={() => {
              setFilterState(EMPTY_FILTERS);
              setAppliedFilters(EMPTY_FILTERS);
            }}
          >
            <FilterSection label={"Date Range"}>
              <Flex direction={"row"} gap={"2"}>
                <FilterInput
                  label={"Start"}
                  type={"date"}
                  value={filterState.startDate}
                  onChange={(value) => setFilterState({ ...filterState, startDate: value })}
                />
                <FilterInput
                  label={"End"}
                  type={"date"}
                  value={filterState.endDate}
                  onChange={(value) => setFilterState({ ...filterState, endDate: value })}
                />
              </Flex>
            </FilterSection>

            <FilterSection label={"Operation Type"}>
              {OPERATION_TYPE_OPTIONS.map((option) => (
                <FilterCheckbox
                  key={option.value}
                  label={option.label}
                  checked={filterState.activityTypes.includes(option.value)}
                  onChange={(checked) =>
                    setFilterState({
                      ...filterState,
                      activityTypes: toggleArrayValue(filterState.activityTypes, option.value, checked),
                    })
                  }
                />
              ))}
            </FilterSection>

            <FilterSection label={"Target Type"}>
              {TARGET_TYPE_OPTIONS.map((option) => (
                <FilterCheckbox
                  key={option.value}
                  label={option.label}
                  checked={filterState.targetTypes.includes(option.value)}
                  onChange={(checked) =>
                    setFilterState({
                      ...filterState,
                      targetTypes: toggleArrayValue(filterState.targetTypes, option.value, checked),
                    })
                  }
                />
              ))}
            </FilterSection>

            <FilterSection label={"Medium"}>
              {MEDIUM_OPTIONS.map((option) => (
                <FilterCheckbox
                  key={option.value}
                  label={option.label}
                  checked={filterState.mediums.includes(option.value)}
                  onChange={(checked) =>
                    setFilterState({
                      ...filterState,
                      mediums: toggleArrayValue(filterState.mediums, option.value, checked),
                    })
                  }
                />
              ))}
            </FilterSection>
          </DataTableFilterPanel>

          <Flex
            direction={"column"}
            p={"2"}
            gap={"2"}
            rounded={"md"}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
            bg={STYLES.surface.card}
          >
            {/* Buttons and Live Indicator Row */}
            <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"}>
              {/* Live Indicator */}
              <Flex align={"center"} gap={"1"} ml={"0.5"}>
                <Box
                  w={"8px"}
                  h={"8px"}
                  borderRadius={"full"}
                  bg={"status.success.default"}
                  className="live-indicator"
                />
                <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} fontWeight={"semibold"}>
                  Live
                </Text>
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
                    {activeFilterCount > 0 ? "No activity matches the selected filters" : "No Activity"}
                  </EmptyState.Description>
                </EmptyState.Content>
              </EmptyState.Root>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Activity;
