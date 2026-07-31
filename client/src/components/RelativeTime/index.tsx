// React
import React from "react";

// Existing and custom components
import { Text } from "@chakra-ui/react";

// Existing and custom types
import { RelativeTimeProps } from "@types";

// Hooks
import { useTick } from "@hooks/useTick";

// Utility functions and libraries
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const RelativeTime = ({ value, format, fontSize, fontWeight, color }: RelativeTimeProps) => {
  // Re-render only this component to keep the relative time fresh
  useTick();

  const relative = dayjs(value).fromNow();

  return (
    <Text fontSize={fontSize} fontWeight={fontWeight} color={color}>
      {format ? format(relative) : relative}
    </Text>
  );
};

export default RelativeTime;
