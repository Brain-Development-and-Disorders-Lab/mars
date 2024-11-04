// React
import React from "react";
import { Flex, Text } from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";

// Utility functions and libraries
import dayjs from "dayjs";
import _ from "lodash";

const TimestampTag = (props: { timestamp: string; description?: string }) => {
  return (
    <Flex direction={"column"} gap={"1"}>
      <Flex
        align={"center"}
        gap={"2"}
        p={"2"}
        rounded={"md"}
        border={"1px"}
        borderColor={"gray.300"}
        bg={"white"}
      >
        <Icon name={"v_date"} size={"sm"} color={"orange"} />
        <Flex direction={"column"} gap={"0"}>
          <Text fontSize={"sm"} fontWeight={"semibold"}>
            {dayjs(props.timestamp).format("DD MMMM YYYY")}
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
