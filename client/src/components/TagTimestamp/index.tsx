// React
import React from "react";
import { Flex, Text } from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Custom types
import { TagTimestampProps } from "@types";

// Utility functions and libraries
import dayjs from "dayjs";
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

const TagTimestamp = (props: TagTimestampProps) => {
  // Handle improperly formed timestamps
  let dateString = dayjs(props.timestamp).format("DD MMMM YYYY");
  if (_.isUndefined(props.timestamp) || _.isEqual(props.timestamp, "") || _.isEqual(dateString, "Invalid Date")) {
    dateString = "No Timestamp";
  }

  return (
    <Tooltip content={`${props.description ?? "Created"}: ${props.timestamp}`} showArrow>
      <Flex
        direction={"row"}
        align={"center"}
        h={"52px"}
        w={"fit-content"}
        border={STYLES.border.style}
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
          <Icon name={"clock"} size={"xs"} color={"status.info.default"} />
        </Flex>

        {/* Timestamp label */}
        <Flex direction={"column"} p={"2"} gap={"0.5"} align={"start"} justify={"center"} h={"100%"} bg={"white"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
            {dateString}
          </Text>
          <Text fontSize={"xs"} fontWeight={"medium"} mr={"0.5"} color={"text.faint"}>
            {_.isUndefined(props.description) ? "Timestamp" : props.description}
          </Text>
        </Flex>
      </Flex>
    </Tooltip>
  );
};

export default TagTimestamp;
