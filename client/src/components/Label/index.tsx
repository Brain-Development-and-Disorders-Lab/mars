// React
import React from "react";

// Existing and custom components
import { Flex, Tag, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";

const Information = (props: { text: string }) => {
  return (
    <Flex
      direction={"row"}
      gap={"2"}
      p={"2"}
      rounded={"md"}
      bg={"blue.100"}
      align={"center"}
      w={"fit-content"}
    >
      <Icon name={"info"} color={"blue.300"} />
      <Text fontWeight={"semibold"} fontSize={"sm"} color={"blue.700"}>
        {props.text}
      </Text>
    </Flex>
  );
};

const Warning = (props: { text: string }) => {
  return (
    <Tag.Root colorPalette={"orange"} w={"fit-content"}>
      <Tag.StartElement>
        <Icon name={"warning"} />
      </Tag.StartElement>
      <Tag.Label>{props.text}</Tag.Label>
    </Tag.Root>
  );
};

export { Information, Warning };
