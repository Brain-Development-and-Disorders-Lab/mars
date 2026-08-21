// React
import React from "react";

// Existing and custom components
import { Text } from "@chakra-ui/react";
import Tooltip from "@components/Tooltip";

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
    <Tooltip content={dayjs(value).toISOString()} showArrow>
      <Text fontSize={fontSize} fontWeight={fontWeight} color={color}>
        {format ? format(relative) : relative}
      </Text>
    </Tooltip>
  );
};

export default RelativeTime;
