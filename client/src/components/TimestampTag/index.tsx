// React
import React from "react";
import { Flex, Text } from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";

// Utility functions and libraries
import dayjs from "dayjs";
import _ from "lodash";

const TimestampTag = (props: { timestamp: string; description?: string }) => {
  // Handle improperly formed timestamps
  let dateString = dayjs(props.timestamp).format("DD MMMM YYYY");
  if (
    _.isUndefined(props.timestamp) ||
    _.isEqual(props.timestamp, "") ||
    _.isEqual(dateString, "Invalid Date")
  ) {
    dateString = "No Timestamp";
  }

  return (
    <Flex direction={"column"} gap={"1"}>
      <Flex
        align={"center"}
        gap={"2"}
        p={"2"}
        rounded={"md"}
        border={"1px solid"}
        borderColor={"gray.300"}
        bg={"white"}
      >
        <Icon name={"v_date"} size={"sm"} color={"orange"} />
        <Flex direction={"column"} gap={"0"}>
          <Text fontSize={"sm"} fontWeight={"semibold"}>
            {dateString}
          </Text>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.400"}>
            {_.isUndefined(props.description) ? "Timestamp" : props.description}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default TimestampTag;
