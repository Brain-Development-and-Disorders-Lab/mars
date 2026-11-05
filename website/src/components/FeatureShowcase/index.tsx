// React
import React from "react";

// Existing components
import { Flex, Heading, Image, Link, Text } from "@chakra-ui/react";
import Icon from "../Icon";

// Existing and custom types
import { FeatureShowcaseProps } from "types";

// Stacked on small screens, side by side from md, optionally with the screenshot first
const LAYOUT = ["column", "column", "row"] as const;
const LAYOUT_REVERSE = ["column", "column", "row-reverse"] as const;

// Feature description and bullet points beside a framed screenshot
const FeatureShowcase = (props: FeatureShowcaseProps) => {
  return (
    <Flex
      direction={props.reverse ? LAYOUT_REVERSE : LAYOUT}
      gap={["6", "8", "12"]}
      align={"center"}
      w={"100%"}
      maxW={"6xl"}
    >
      <Flex direction={"column"} gap={"4"} flex={"1"} minW={"0"}>
        <Text fontSize={"sm"} fontWeight={"bold"} color={"blue.700"} textTransform={"uppercase"} letterSpacing={"wide"}>
          {props.eyebrow}
        </Text>
        <Heading size={"lg"} color={"brand.navy"}>
          {props.title}
        </Heading>
        <Text color={"text.muted"} fontSize={"lg"}>
          {props.description}
        </Text>
        <Flex as={"ul"} listStyleType={"none"} direction={"column"} gap={"2"}>
          {props.points.map((point) => (
            <Flex as={"li"} key={point} gap={"3"} align={"flex-start"}>
              {/* Box one line tall, so the icon centers on the first line of text */}
              <Flex h={"1.5em"} align={"center"} flexShrink={0}>
                <Icon name={"check"} size={"sm"} color={"teal.500"} />
              </Flex>
              <Text lineHeight={"1.5"}>{point}</Text>
            </Flex>
          ))}
        </Flex>
        <Flex gap={"1"} align={"center"}>
          <Link color={"blue.700"} fontWeight={"semibold"} href={props.link.href}>
            {props.link.label}
          </Link>
          <Icon name={"a_right"} size={"xs"} color={"blue.700"} />
        </Flex>
      </Flex>
      <Flex
        flex={["none", "none", "1.3"]}
        w={"100%"}
        minW={"0"}
        rounded={"xl"}
        overflow={"hidden"}
        border={"1px"}
        borderColor={"border.default"}
        boxShadow={"cardHover"}
        bg={"white"}
      >
        <Image
          src={props.image}
          alt={props.imageAlt}
          htmlWidth={String(props.imageWidth)}
          htmlHeight={String(props.imageHeight)}
          loading={"lazy"}
          w={"100%"}
          h={"auto"}
        />
      </Flex>
    </Flex>
  );
};

export default FeatureShowcase;
