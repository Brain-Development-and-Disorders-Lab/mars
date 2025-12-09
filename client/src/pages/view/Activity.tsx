// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Box, Flex, Heading, Text, Tag, EmptyState } from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import DataTable from "@components/DataTable";
import Linky from "@components/Linky";
import { createColumnHelper, ColumnFiltersState } from "@tanstack/react-table";

// Existing and custom types
import { ActivityModel } from "@types";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { useWorkspace } from "@hooks/useWorkspace";

// Utility functions and libraries
import { gql, useQuery } from "@apollo/client";
import _ from "lodash";
import dayjs from "dayjs";

const Activity = () => {
  const [activityData, setActivityData] = useState([] as ActivityModel[]);

  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    target: true,
    user: true,
    timestamp: true,
  });

  // Column filters state for activity table
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.activity) {
      // Unpack all the Activity data
      setActivityData(data.activity);
    }
  }, [data]);

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
              : type === "delete"
                ? "delete"
                : type;
        const colorPalette =
          type === "create"
            ? "green"
            : type === "update"
              ? "blue"
              : type === "delete"
                ? "red"
                : "orange";
        return (
          <Tag.Root colorPalette={colorPalette} size={"sm"}>
            <Tag.Label fontSize={"xs"} textTransform={"capitalize"}>
              {displayType}
            </Tag.Label>
          </Tag.Root>
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
          <Flex align={"center"} gap={"1"}>
            <Linky
              id={target._id}
              type={target.type}
              fallback={target.name}
              justify={"left"}
              size={"xs"}
            />
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
        <Flex direction={"column"} gap={"0.5"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
            {dayjs(info.getValue()).fromNow()}
          </Text>
          <Text fontSize={"xs"} color={"gray.500"}>
            {dayjs(info.getValue()).format("MMM D, YYYY h:mm A")}
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
        <Flex direction={"column"} gap={"2"} w={"100%"} minW="0" maxW="100%">
          <Text fontSize={"xs"} ml={"0.5"}>
            All activity in the current Workspace is shown below, sorted by most
            recent. Sort the activity using the column headers.
          </Text>
          {activityData.length > 0 ? (
            <Box w="100%" minW="0" maxW="100%">
              <DataTable
                columns={columns}
                data={activityData}
                visibleColumns={visibleColumns}
                selectedRows={{}}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
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
                <EmptyState.Description>No Activity</EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Activity;
