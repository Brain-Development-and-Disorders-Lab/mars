// React
import React from "react";

// Existing and custom components
import { IconButton, Flex, Text, Tooltip, Spacer } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Utility functions and libraries
import _ from "lodash";

const Attachment = (props: { text: string }) => {
  return (
    <Flex shadow={"md"} maxW={"2xs"} direction={"column"} rounded={"md"} p={"4"} gap={"4"} align={"center"}>
      <Tooltip label={props.text}>
        <Text noOfLines={3}>{_.truncate(props.text, { length: 48 })}</Text>
      </Tooltip>
      <Flex gap={"4"} w={"100%"}>
        <Spacer />
        <IconButton aria-label={"Preview file"} icon={<Icon name={"view"} />} />
        <IconButton aria-label={"Download file"} icon={<Icon name={"download"} />} colorScheme={"blue"} />
      </Flex>
    </Flex>
  );
};

export default Attachment;
