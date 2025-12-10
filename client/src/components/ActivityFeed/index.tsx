// React
import React, { useEffect, useState } from "react";

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
import { ActivityModel } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

interface ActivityFeedProps {
  activities: ActivityModel[];
}

const ActivityFeed = ({ activities }: ActivityFeedProps) => {
  const navigate = useNavigate();
  const [timestampUpdate, setTimestampUpdate] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestampUpdate(Date.now());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

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
      {activities.length > 0 ? (
        <Flex direction={"column"} gap={"1"}>
          <Stack gap={"1.5"} w={"95%"}>
            {activities.map((activity) => {
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
                      orcid={activity.actor}
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
