// React
import React, { useMemo } from "react";

// Existing and custom components
import { Flex, Text, Button, Avatar, Stack, EmptyState, Box } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import TagActor from "@components/TagActor";
import ActivityGraph from "@components/ActivityGraph";
import RelativeTime from "@components/RelativeTime";

// Existing and custom types
import { ActivityModel, ActivityFeedProps } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Apollo client imports
import { gql } from "@apollo/client";

// Hooks
import { useWatchQuery } from "@hooks/useWatchQuery";
import { useTick } from "@hooks/useTick";

// Utility functions and libraries
import dayjs from "dayjs";

// Variables
import { STYLES } from "@variables";

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

/**
 * Isolated so only this text re-renders on each tick, not the whole feed
 */
const LastUpdated = () => {
  useTick();

  return (
    <Text fontSize={"xs"} fontWeight={"semibold"} color={"text.subtle"}>
      {dayjs(Date.now()).format("D MMM YYYY[ at ]h:mm A")}
    </Text>
  );
};

const ActivityFeed = ({ activities: activitiesProp, feedLimit = 5 }: ActivityFeedProps) => {
  const navigate = useNavigate();

  const { data } = useWatchQuery<{ activity: ActivityModel[] }>(GET_ACTIVITY, { limit: 200 });

  const activities = data?.activity ?? activitiesProp ?? [];

  // Use all activities for the chart, but limit the feed display
  const feedActivities = useMemo(() => {
    return activities.slice(0, feedLimit);
  }, [activities, feedLimit]);

  return (
    <Flex direction={"column"} gap={"2"}>
      {/* Activity heading */}
      <Flex id={"recentActivityHeader"} align={"center"} gap={"2"} ml={"0.5"} justify={"space-between"}>
        <Flex align={"center"} gap={"1"} py={"1.5"}>
          <Icon name={"activity"} size={"xs"} />
          <Text fontSize={"sm"} fontWeight={"semibold"}>
            Workspace Activity
          </Text>
        </Flex>
        <Flex align={"center"} gap={"1"} mr={"0.5"}>
          <Box w={"8px"} h={"8px"} borderRadius={"full"} bg={"status.success.default"} className="live-indicator" />
          <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} fontWeight={"semibold"}>
            Live
          </Text>
        </Flex>
      </Flex>

      <Flex direction={"row"} gap={"1"} ml={"0.5"}>
        <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
          Last Update:
        </Text>
        <LastUpdated />
      </Flex>

      {/* Activity Chart */}
      <Flex direction={"row"} gap={"1"} ml={"0.5"}>
        <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
          Activity Range:
        </Text>
        <Text fontSize={"xs"} fontWeight={"semibold"} color={"text.subtle"}>
          {dayjs().subtract(6, "day").format("MMM D, YYYY")} - {dayjs().format("MMM D, YYYY")}
        </Text>
      </Flex>
      <ActivityGraph activities={activities} height="180px" />

      <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"} ml={"0.5"}>
        Activity Feed
      </Text>

      {/* Activity list */}
      {feedActivities.length > 0 ? (
        <Flex direction={"column"} gap={"1"}>
          <Stack gap={"1"} w={"98%"}>
            {feedActivities.map((activity: ActivityModel) => {
              return (
                <Flex direction={"row"} width={"100%"} gap={"2"} key={`activity-${activity._id}`} align={"center"}>
                  {activity.actor ? (
                    <TagActor identifier={activity.actor} fallback={"Unknown User"} size={"sm"} avatarOnly />
                  ) : (
                    <Avatar.Root size={"xs"} colorPalette={"blue"}>
                      <Avatar.Fallback name={"Unknown"} />
                    </Avatar.Root>
                  )}
                  <Flex direction={"column"} w={"100%"} gap={"0.5"}>
                    <Flex direction={"row"} w={"100%"} gap={"1"} justify={"space-between"}>
                      <Text fontSize={"xs"}>
                        {activity.details}
                        {activity.target.type !== "workspaces" ? ":" : ""}
                      </Text>
                      <RelativeTime
                        value={activity.timestamp}
                        fontSize={"xs"}
                        fontWeight={"semibold"}
                        color={"text.subtle"}
                      />
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
            <Button size={"xs"} rounded={"md"} colorPalette={"blue"} onClick={() => navigate("/activity")}>
              All Activity
              <Icon name={"a_right"} size={"xs"} />
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
