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
    <Flex
      align={"center"}
      gap={"2"}
      p={"1"}
      rounded={"md"}
      border={"1px solid"}
      borderColor={"gray.300"}
      bg={"white"}
      h={"54px"}
    >
      <Icon name={"v_date"} size={"xs"} color={"orange"} />
      <Flex direction={"column"} gap={"0"}>
        <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
          {_.isUndefined(props.description) ? "Timestamp" : props.description}
        </Text>
        <Text fontSize={"xs"} fontWeight={"semibold"}>
          {dateString}
        </Text>
      </Flex>
    </Flex>
  );
};

export default TimestampTag;
