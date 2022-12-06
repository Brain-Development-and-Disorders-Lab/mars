import React from "react";
import { Tag, TagLabel, TagRightIcon } from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";

const WarningLabel = (props: { key: string, text: string }) => {
  return (
    <Tag size={"md"} key={`warn-${props.key}`} colorScheme={"orange"}>
      <TagLabel>{props.text}</TagLabel>
      <TagRightIcon as={WarningIcon} />
    </Tag>
  );
};

export { WarningLabel };