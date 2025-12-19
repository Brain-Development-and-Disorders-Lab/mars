// React
import React, { useEffect, useMemo, useState } from "react";

// Existing and custom components
import {
  Flex,
  Text,
  Button,
  Avatar,
  Stack,
  EmptyState,
  Box,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import ActorTag from "@components/ActorTag";
import ActivityGraph from "@components/ActivityGraph";

// Existing and custom types
import { ActivityModel, ActivityFeedProps } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Context and hooks
import { useWorkspace } from "@hooks/useWorkspace";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Utility functions and libraries
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

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

const ActivityFeed = ({
  activities: activitiesProp,
  feedLimit = 5,
}: ActivityFeedProps) => {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const [timestampUpdate, setTimestampUpdate] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestampUpdate(Date.now());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const { data, refetch } = useQuery<{
    activity: ActivityModel[];
  }>(GET_ACTIVITY, {
    variables: {
      limit: 200,
    },
    fetchPolicy: "network-only",
    pollInterval: 5000,
  });

  // Refetch when workspace changes
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

  const activities = data?.activity ?? activitiesProp ?? [];

  // Use all activities for the chart, but limit the feed display
  const feedActivities = useMemo(() => {
    return activities.slice(0, feedLimit);
  }, [activities, feedLimit]);

  return (
    <Flex
      direction={"column"}
      maxW={{ lg: "md" }}
      p={"1"}
      gap={"1"}
      grow={"1"}
      rounded={"md"}
      border={"1px solid"}
      borderColor={"gray.300"}
      h={"fit-content"}
      data-timestamp-update={timestampUpdate}
    >
      {/* Activity heading */}
      <Flex
        id={"recentActivityHeader"}
        align={"center"}
        gap={"1"}
        ml={"0.5"}
        justify={"space-between"}
      >
        <Flex align={"center"} gap={"1"}>
          <Icon name={"activity"} size={"xs"} />
          <Text fontSize={"sm"} fontWeight={"semibold"}>
            Workspace Activity
          </Text>
        </Flex>
        <Flex align={"center"} gap={"1"} mr={"0.5"}>
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
      </Flex>

      <Flex direction={"row"} gap={"1"} ml={"0.5"}>
        <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
          Last Update:
        </Text>
        <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.500"}>
          {dayjs(Date.now()).format("D MMM YYYY[ at ]h:mm A")}
        </Text>
      </Flex>

      {/* Activity Chart */}
      <Flex direction={"row"} gap={"1"} ml={"0.5"}>
        <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
          Activity:
        </Text>
        <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.500"}>
          {dayjs().subtract(6, "day").format("MMM D, YYYY")} -{" "}
          {dayjs().format("MMM D, YYYY")}
        </Text>
      </Flex>
      <ActivityGraph activities={activities} height="180px" />

      <Text
        fontSize={"xs"}
        fontWeight={"semibold"}
        color={"gray.700"}
        ml={"0.5"}
      >
        Activity Feed
      </Text>

      {/* Activity list */}
      {feedActivities.length > 0 ? (
        <Flex direction={"column"} gap={"1"}>
          <Stack gap={"1.5"} w={"95%"}>
            {feedActivities.map((activity: ActivityModel) => {
              return (
                <Flex
                  direction={"row"}
                  width={"100%"}
                  gap={"2"}
                  key={`activity-${activity._id}`}
                  align={"center"}
                >
                  {activity.actor ? (
                    <ActorTag
                      identifier={activity.actor}
                      fallback={"Unknown User"}
                      size={"sm"}
                      avatarOnly
                    />
                  ) : (
                    <Avatar.Root size={"xs"} colorPalette={"blue"}>
                      <Avatar.Fallback name={"Unknown"} />
                    </Avatar.Root>
                  )}
                  <Flex direction={"column"} w={"100%"} gap={"0.5"}>
                    <Flex direction={"row"} gap={"1"} justify={"space-between"}>
                      <Text fontSize={"xs"}>{activity.details}:</Text>
                      <Text
                        fontSize={"xs"}
                        fontWeight={"semibold"}
                        color={"gray.500"}
                      >
                        {dayjs(activity.timestamp).fromNow()}
                      </Text>
                    </Flex>
                    <Flex>
                      <Linky
                        id={activity.target._id}
                        type={activity.target.type}
                        fallback={activity.target.name}
                        justify={"left"}
                        size={"xs"}
                        truncate={20}
                      />
                    </Flex>
                  </Flex>
                </Flex>
              );
            })}
          </Stack>

          <Flex justify={"right"} pr={"0.5"} pb={"0.5"}>
            <Button
              size={"xs"}
              rounded={"md"}
              colorPalette={"blue"}
              onClick={() => navigate("/activity")}
            >
              View All
              <Icon name={"c_right"} size={"xs"} />
            </Button>
          </Flex>
        </Flex>
      ) : (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon name={"activity"} size={"lg"} />
            </EmptyState.Indicator>
            <EmptyState.Description>No recent Activity.</EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      )}
    </Flex>
  );
};

export default ActivityFeed;
