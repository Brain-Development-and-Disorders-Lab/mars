// React
import React from "react";
import { Flex, Text } from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";

// Utility functions and libraries
import dayjs from "dayjs";
import _ from "lodash";

// Variables
import { GLOBAL_STYLES } from "@variables";

const TimestampTag = (props: { timestamp: string; description?: string }) => {
  // Handle improperly formed timestamps
  let dateString = dayjs(props.timestamp).format("DD MMMM YYYY");
  if (_.isUndefined(props.timestamp) || _.isEqual(props.timestamp, "") || _.isEqual(dateString, "Invalid Date")) {
    dateString = "No Timestamp";
  }

  return (
    <Flex
      direction={"row"}
      align={"center"}
      h={"52px"}
      w={"fit-content"}
      border={GLOBAL_STYLES.border.style}
      borderColor={"blue.200"}
      rounded={"md"}
      overflow={"hidden"}
      cursor={"not-allowed"}
      flexShrink={0}
    >
      {/* Timestamp badge */}
      <Flex
        align={"center"}
        justify={"center"}
        bg={"blue.50"}
        px={"1.5"}
        h={"100%"}
        borderRight={"1px solid"}
        borderColor={"blue.200"}
      >
        <Icon name={"clock"} size={"xs"} color={"blue.500"} />
      </Flex>

      {/* Timestamp label */}
      <Flex direction={"column"} p={"2"} gap={"0.5"} align={"start"} justify={"center"} h={"100%"} bg={"white"}>
        <Text fontSize={"xs"} fontWeight={"semibold"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
          {dateString}
        </Text>
        <Text fontSize={"xs"} fontWeight={"medium"} mr={"0.5"} color={"gray.400"}>
          {_.isUndefined(props.description) ? "Timestamp" : props.description}
        </Text>
      </Flex>
    </Flex>
  );
};

export default TimestampTag;
