// React
import React from "react";
import { Flex, Text } from "@chakra-ui/react";

// Custom components
import ActorTag from "@components/ActorTag";
import { EmptyTag } from "@components/FieldTag";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { CreatedCellProps, DescriptionCellProps, OwnerCellProps } from "@types";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

// Variables
import { STYLES } from "@variables";

// Shared `DataTable` cell renderers repeated across the Entities, Projects, and Templates list pages

export const CreatedCell = (props: CreatedCellProps) => (
  <Tooltip content={dayjs(props.value).format("[Created:] DD MMMM YYYY, HH:MM A")} showArrow>
    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
      {dayjs(props.value).fromNow()}
    </Text>
  </Tooltip>
);

export const OwnerCell = (props: OwnerCellProps) => (
  <ActorTag identifier={props.value} fallback={"Unknown User"} size={"sm"} inline />
);

export const DescriptionCell = (props: DescriptionCellProps) => {
  const maxLength = props.maxLength ?? 64;
  if (!props.value) return <EmptyTag label={"Description"} />;
  return (
    <Flex>
      <Tooltip content={props.value} disabled={props.value.length < maxLength} showArrow>
        <Text fontSize={"xs"}>{_.truncate(props.value, { length: maxLength })}</Text>
      </Tooltip>
    </Flex>
  );
};
