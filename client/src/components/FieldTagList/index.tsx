// React
import React, { Fragment } from "react";
import { Flex, Text } from "@chakra-ui/react";

// Custom components
import { EmptyTag } from "@components/FieldTag";

// Existing and custom types
import { FieldTagListProps } from "@types";

const FieldTagList = (props: FieldTagListProps) => {
  if (props.items.length === 0) {
    return props.emptyLabel ? <EmptyTag label={props.emptyLabel} /> : null;
  }

  const overflow = props.items.length - props.max;

  return (
    <Flex direction={"row"} gap={"1"} align={"center"} wrap={"wrap"}>
      {props.items.slice(0, props.max).map((item) => (
        <Fragment key={props.getKey(item)}>{props.renderTag(item)}</Fragment>
      ))}
      {overflow > 0 && <Text fontSize={"xs"}>and {overflow} more</Text>}
    </Flex>
  );
};

export default FieldTagList;
