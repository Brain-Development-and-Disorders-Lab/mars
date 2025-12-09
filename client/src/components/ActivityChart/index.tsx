// React
import React, { useMemo, useEffect, useState } from "react";

// Chart components
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Existing and custom components
import { Flex, Text, Box } from "@chakra-ui/react";

// Existing and custom types
import { ActivityModel } from "@types";

// Utility functions and libraries
import dayjs from "dayjs";

// Apollo client imports
import { useQuery, gql } from "@apollo/client";

// Contexts and hooks
import { useWorkspace } from "@hooks/useWorkspace";

// Query to retrieve Activity for chart (last week)
const GET_ACTIVITY_FOR_CHART = gql`
  query GetActivityForChart($limit: Int) {
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

interface ActivityChartProps {
  // This prop is now optional since we fetch our own data
  activities?: ActivityModel[];
}

const ActivityChart = ({ activities: propActivities }: ActivityChartProps) => {
  const { workspace } = useWorkspace();
  const [chartActivities, setChartActivities] = useState<ActivityModel[]>([]);

  // Fetch activity data for the chart (all activity, we'll filter to last week)
  const { data, refetch } = useQuery<{
    activity: ActivityModel[];
  }>(GET_ACTIVITY_FOR_CHART, {
    variables: {
      limit: 1000, // Limit to get last 1000 activities
    },
    fetchPolicy: "network-only",
    skip: !workspace, // Skip if no workspace
  });

  // Update chart activities when data changes
  useEffect(() => {
    if (data?.activity) {
      setChartActivities(data.activity);
    }
  }, [data]);

  // Refetch when workspace changes
  useEffect(() => {
    if (workspace && refetch) {
      refetch();
    }
  }, [workspace, refetch]);

  // Process activity data to get daily counts for the last 7 days
  const chartData = useMemo(() => {
    const today = dayjs().startOf("day");
    const weekAgo = today.subtract(7, "day");
    const days: Array<{
      date: Date;
      dateLabel: string;
      count: number;
    }> = [];

    // Create array of last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = today.subtract(i, "day");
      days.push({
        date: date.toDate(),
        dateLabel: date.format("MMM D"),
        count: 0,
      });
    }

    // Filter activities to last 7 days and count per day
    const activitiesToUse = propActivities || chartActivities;
    activitiesToUse
      .filter((activity) => {
        const activityDate = dayjs(activity.timestamp).startOf("day");
        return activityDate.isSameOrAfter(weekAgo);
      })
      .forEach((activity) => {
        const activityDate = dayjs(activity.timestamp).startOf("day");
        const dayIndex = days.findIndex((day) =>
          dayjs(day.date).isSame(activityDate, "day"),
        );

        if (dayIndex !== -1) {
          days[dayIndex].count += 1;
        }
      });

    return days;
  }, [propActivities, chartActivities]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          bg={"white"}
          border={"1px solid"}
          borderColor={"gray.300"}
          rounded={"md"}
          p={"1"}
          boxShadow={"md"}
        >
          <Text fontSize={"xs"} fontWeight={"semibold"}>
            {payload[0].payload.dateLabel}
          </Text>
          <Text fontSize={"xs"} color={"blue.600"}>
            {payload[0].value} action{payload[0].value !== 1 ? "s" : ""}
          </Text>
        </Box>
      );
    }
    return null;
  };

  // Custom tick component for X-axis
  const CustomXTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <text
        x={x}
        y={y}
        dy={16}
        textAnchor="middle"
        fill="gray.600"
        style={{ fontSize: "12px", fontWeight: "normal" }}
      >
        {payload.value}
      </text>
    );
  };

  // Custom tick component for Y-axis
  const CustomYTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <text
        x={x}
        y={y}
        dx={-4}
        textAnchor="end"
        fill="gray.600"
        style={{ fontSize: "12px", fontWeight: "normal" }}
      >
        {payload.value}
      </text>
    );
  };

  return (
    <Flex
      direction={"column"}
      gap={"1"}
      p={"1"}
      rounded={"md"}
      bg={"gray.50"}
      h={"180px"}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 15, right: 10, bottom: 5, left: -30 }}
          width={"100%"}
          height={"100%"}
        >
          <XAxis
            dataKey="dateLabel"
            tick={<CustomXTick />}
            stroke={"#52525b"} // gray.600
            tickLine={true}
          />
          <YAxis
            tick={<CustomYTick />}
            stroke={"#52525b"} // gray.600
            allowDecimals={false}
            tickLine={true}
          />
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#60a5fa" // blue.400
            strokeWidth={2}
            dot={{ r: 3, fill: "#60a5fa" }} // blue.400
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Flex>
  );
};

export default ActivityChart;
