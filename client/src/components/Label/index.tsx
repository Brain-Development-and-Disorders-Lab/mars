// React
import React from "react";

// Existing and custom components
import { Tag } from "@chakra-ui/react";
import Icon from "@components/Icon";

const Information = (props: { text: string }) => {
  return (
    <Tag.Root colorPalette={"blue"} w={"fit-content"} alignContent={"center"}>
      <Tag.StartElement alignContent={"center"}>
        <Icon name={"info"} size={"xs"} color={"blue.600"} />
      </Tag.StartElement>
      <Tag.Label fontSize={"xs"}>{props.text}</Tag.Label>
    </Tag.Root>
  );
};

const Warning = (props: { text: string }) => {
  return (
    <Tag.Root colorPalette={"orange"} w={"fit-content"} alignContent={"center"}>
      <Tag.StartElement alignContent={"center"}>
        <Icon name={"warning"} size={"xs"} color={"orange.600"} />
      </Tag.StartElement>
      <Tag.Label fontSize={"xs"}>{props.text}</Tag.Label>
    </Tag.Root>
  );
};

export { Information, Warning };
