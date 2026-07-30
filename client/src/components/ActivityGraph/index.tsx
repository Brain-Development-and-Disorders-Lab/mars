// React
import React, { useMemo } from "react";

// Chart components
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// Existing and custom components
import { Flex, Text, Box, useToken } from "@chakra-ui/react";

// Existing and custom types
import { ActivityModel } from "@types";

// Utility functions and libraries
import dayjs from "dayjs";

// Variables
import { STYLES } from "@variables";

interface ActivityGraphProps {
  activities: ActivityModel[];
  title?: string;
  height?: string;
}

interface ChartDataPoint {
  date: Date;
  dateLabel: string;
  count: number;
}

const ActivityGraph = ({ activities, title, height = "180px" }: ActivityGraphProps) => {
  // recharts renders into SVG, where Chakra token strings don't resolve, so
  // the actual CSS values are resolved once here via useToken, keeping
  // STYLES as the single source for these colors.
  const [chartAxis, chartGrid, chartLine] = useToken("colors", ["chart.axis", "chart.grid", "chart.line"]);

  // Process activity data to get daily counts for the last 7 days
  const chartData = useMemo(() => {
    const today = dayjs().startOf("day");
    const weekAgo = today.subtract(7, "day");
    const days: ChartDataPoint[] = [];

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
    activities
      .filter((activity) => {
        const activityDate = dayjs(activity.timestamp).startOf("day");
        return activityDate.isSameOrAfter(weekAgo);
      })
      .forEach((activity) => {
        const activityDate = dayjs(activity.timestamp).startOf("day");
        const dayIndex = days.findIndex((day) => dayjs(day.date).isSame(activityDate, "day"));

        if (dayIndex !== -1) {
          days[dayIndex].count += 1;
        }
      });

    return days;
  }, [activities]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          bg={"white"}
          border={STYLES.border.style}
          borderColor={STYLES.border.color}
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
      <text x={x} y={y} dy={16} textAnchor="middle" fill={chartAxis} style={{ fontSize: "12px", fontWeight: "normal" }}>
        {payload.value}
      </text>
    );
  };

  // Custom tick component for Y-axis
  const CustomYTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <text x={x} y={y} dx={-4} textAnchor="end" fill={chartAxis} style={{ fontSize: "12px", fontWeight: "normal" }}>
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
      bg={STYLES.card.bg}
      h={height}
      w={"100%"}
      border={STYLES.border.style}
      borderColor={STYLES.border.color}
    >
      {title && (
        <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
          {title}
        </Text>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 15, right: 10, bottom: 5, left: -20 }}
          width={"100%"}
          height={"100%"}
        >
          <XAxis dataKey="dateLabel" tick={<CustomXTick />} stroke={chartAxis} tickLine={true} />
          <YAxis tick={<CustomYTick />} stroke={chartAxis} allowDecimals={false} tickLine={true} />
          <CartesianGrid stroke={chartGrid} strokeDasharray="5 5" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke={chartLine}
            strokeWidth={2}
            dot={{ r: 3, fill: chartLine }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Flex>
  );
};

export default ActivityGraph;
