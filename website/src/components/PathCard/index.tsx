// React
import React from "react";

// Existing components
import { Button, Flex, Link, Spacer, Text } from "@chakra-ui/react";
import Icon from "../Icon";

// Existing and custom types
import { PathCardProps } from "types";

// One way to start using Metadatify, with a single main action
const PathCard = (props: PathCardProps) => {
  let variant = "outline";
  if (props.primary) {
    variant = "solid";
  }

  return (
    <Flex
      direction={"column"}
      gap={"4"}
      p={"6"}
      flex={"1"}
      minW={["100%", "16rem"]}
      maxW={"sm"}
      rounded={"xl"}
      border={"1px"}
      borderColor={props.primary ? "blue.200" : "border.default"}
      bg={"white"}
      boxShadow={props.primary ? "cardHover" : "card"}
    >
      <Flex align={"center"} justify={"center"} w={"12"} h={"12"} rounded={"md"} bg={"blue.50"}>
        <Icon name={props.icon} size={"md"} color={"blue.600"} />
      </Flex>
      <Text fontWeight={"bold"} fontSize={"lg"}>
        {props.title}
      </Text>
      <Text color={"text.muted"}>{props.description}</Text>
      <Spacer />
      <Button
        as={Link}
        href={props.action.href}
        colorScheme={"blue"}
        variant={variant}
        rounded={"full"}
        rightIcon={<Icon name={"a_right"} size={"xs"} />}
        _hover={{ textDecoration: "none" }}
      >
        {props.action.label}
      </Button>
      {props.secondary && (
        <Link color={"blue.700"} fontSize={"sm"} textAlign={"center"} href={props.secondary.href}>
          {props.secondary.label}
        </Link>
      )}
    </Flex>
  );
};

export default PathCard;
