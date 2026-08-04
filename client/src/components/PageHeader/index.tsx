// React
import React from "react";
import { Flex, Heading, SkeletonText, Text } from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";

// Existing and custom types
import { PageHeaderProps } from "@types";

const PageHeader = (props: PageHeaderProps) => (
  <Flex direction={"column"} gap={"0"} align={"start"}>
    <Flex direction={"row"} align={"center"} gap={"1"}>
      <Icon name={props.icon} size={"sm"} color={props.iconColor} />
      <Heading size={"xl"}>{props.title}</Heading>
    </Flex>
    <SkeletonText noOfLines={1} my={"0.5"} h={"22px"} loading={props.loading} asChild>
      <Text fontSize={"sm"} fontWeight={"semibold"} color={"text.subtle"}>
        {props.subtitle}
      </Text>
    </SkeletonText>
  </Flex>
);

export default PageHeader;
