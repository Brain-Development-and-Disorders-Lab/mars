// React
import React from "react";

// Existing and custom components
import { Tag, TagLabel } from "@chakra-ui/react";
import Icon from "@components/Icon";

const Warning = (props: { text: string }) => {
  return (
    <Tag size={"md"} colorScheme={"orange"}>
      <TagLabel>{props.text}</TagLabel>
      <Icon name={"warning"} />
    </Tag>
  );
};

export { Warning };
