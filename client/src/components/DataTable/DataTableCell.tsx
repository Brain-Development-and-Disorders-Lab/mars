// React
import React from "react";
import { Flex, Text } from "@chakra-ui/react";

// Custom components
import TagActor from "@components/TagActor";
import { TagEmpty } from "@components/TagField";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { CellCreatedFieldProps, CellGenericProps, CellDescriptionFieldProps, CellOwnerFieldProps } from "@types";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

// Variables
import { STYLES } from "@variables";

// Shared `DataTable` cell renderers repeated across the Entities, Projects, and Attributes list pages

// Renders cell content through a generic component that blocks unnecessary re-renders
export const CellGeneric = ({ cell }: CellGenericProps) => {
  const content = cell.column.columnDef.cell;
  return <>{typeof content === "function" ? content(cell.getContext()) : content}</>;
};

export const CellCreatedField = (props: CellCreatedFieldProps) => (
  <Tooltip content={dayjs(props.value).format("[Created:] DD MMMM YYYY, HH:MM A")} showArrow>
    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
      {dayjs(props.value).fromNow()}
    </Text>
  </Tooltip>
);

export const CellOwnerField = (props: CellOwnerFieldProps) => (
  <TagActor
    identifier={props.value}
    fallback={"Unknown User"}
    size={"sm"}
    inline
    workspace={props.workspace}
    isPublic={props.isPublic}
  />
);

export const CellDescriptionField = (props: CellDescriptionFieldProps) => {
  const maxLength = props.maxLength ?? 64;
  if (!props.value) return <TagEmpty label={"Description"} />;
  return (
    <Flex>
      <Tooltip content={props.value} disabled={props.value.length < maxLength} showArrow>
        <Text fontSize={"xs"}>{_.truncate(props.value, { length: maxLength })}</Text>
      </Tooltip>
    </Flex>
  );
};

// Default export is generic cell
export default CellGeneric;
