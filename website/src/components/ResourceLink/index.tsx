// React
import React from "react";

// Existing components
import { Flex, Link, Text } from "@chakra-ui/react";
import Icon from "../Icon";

// Existing and custom types
import { ResourceLinkProps } from "types";

// Compact, fully clickable link to a documentation page or resource
const ResourceLink = (props: ResourceLinkProps) => {
  return (
    <Link
      href={props.href}
      isExternal={props.isExternal}
      display={"flex"}
      gap={"4"}
      p={"4"}
      rounded={"lg"}
      border={"1px"}
      borderColor={"border.default"}
      bg={"white"}
      transition={"border-color 0.2s ease, box-shadow 0.2s ease"}
      _hover={{ textDecoration: "none", borderColor: "blue.300", boxShadow: "card" }}
    >
      <Flex align={"center"} justify={"center"} flexShrink={0} w={"10"} h={"10"} rounded={"md"} bg={"blue.50"}>
        <Icon name={props.icon} color={"blue.600"} />
      </Flex>
      <Flex direction={"column"} gap={"1"}>
        <Text fontWeight={"semibold"} color={"blue.700"}>
          {props.title}
        </Text>
        <Text fontSize={"sm"} color={"text.muted"}>
          {props.description}
        </Text>
      </Flex>
    </Link>
  );
};

export default ResourceLink;
