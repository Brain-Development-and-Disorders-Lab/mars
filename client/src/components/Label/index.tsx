import React from "react";
import { Tag, TagLabel, TagRightIcon } from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";

const WarningLabel = (props: { text: string }) => {
  return (
    <Tag size={"md"} colorScheme={"orange"}>
      <TagLabel>{props.text}</TagLabel>
      <TagRightIcon as={WarningIcon} />
    </Tag>
  );
};

export { WarningLabel };
