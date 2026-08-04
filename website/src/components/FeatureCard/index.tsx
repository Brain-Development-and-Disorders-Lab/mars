// React
import React from "react";

// Existing components
import { Flex, Text } from "@chakra-ui/react";
import Icon from "../Icon";

// Existing and custom types
import { IconNames } from "types";

// Accent color pairings for the icon chip
const ACCENTS = {
  blue: { bg: "blue.50", fg: "blue.600", border: "border.default" },
  ai: { bg: "ai.light", fg: "ai.default", border: "ai.border" },
};

const FeatureCard = (props: { icon: IconNames; title: string; description: string; accent?: "blue" | "ai" }) => {
  const { bg, fg, border } = ACCENTS[props.accent ?? "blue"];

  return (
    <Flex
      direction={"column"}
      rounded={"lg"}
      border={"1px"}
      borderColor={border}
      bg={"white"}
      p={"6"}
      gap={"3"}
      maxW={"sm"}
      boxShadow={"card"}
      transition={"transform 0.2s ease, box-shadow 0.2s ease"}
      _hover={{ boxShadow: "cardHover", transform: "translateY(-4px)" }}
    >
      <Flex align={"center"} justify={"center"} w={"12"} h={"12"} rounded={"md"} bg={bg}>
        <Icon name={props.icon} size={"md"} color={fg} />
      </Flex>
      <Text fontWeight={"bold"} fontSize={"lg"}>
        {props.title}
      </Text>
      <Text color={"text.muted"}>{props.description}</Text>
    </Flex>
  );
};

export default FeatureCard;
