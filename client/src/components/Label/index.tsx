// React
import React from "react";

// Existing and custom components
import { Tag, TagLabel } from "@chakra-ui/react";
import Icon from "@components/Icon";

const Information = (props: { text: string }) => {
  return (
    <Tag size={"md"} colorScheme={"teal"} gap={"2"}>
      <Icon name={"info"} />
      <TagLabel>{props.text}</TagLabel>
    </Tag>
  );
};

const Warning = (props: { text: string }) => {
  return (
    <Tag size={"md"} colorScheme={"orange"} gap={"2"}>
      <Icon name={"warning"} />
      <TagLabel>{props.text}</TagLabel>
    </Tag>
  );
};

export { Information, Warning };
