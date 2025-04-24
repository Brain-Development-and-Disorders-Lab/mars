// React
import React from "react";

// Existing and custom components
import { Flex, Tag, TagLabel, Text } from "@chakra-ui/react";
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
    <Tag size={"md"} colorPalette={"orange"} gap={"2"} w={"fit-content"}>
      <Icon name={"warning"} />
      <TagLabel>{props.text}</TagLabel>
    </Tag>
  );
};

export { Information, Warning };
