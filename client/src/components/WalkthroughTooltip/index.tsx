import React from "react";
import { Button, Flex, IconButton, Text } from "@chakra-ui/react";
import { TooltipRenderProps } from "react-joyride";
import Icon from "@components/Icon";

const WalkthroughTooltip = (props: TooltipRenderProps) => {
  const {
    backProps,
    closeProps,
    continuous,
    index,
    primaryProps,
    skipProps,
    step,
    tooltipProps,
  } = props;

  return (
    <Flex w={"sm"} bg={"white"} rounded={"md"} p={"1"} direction={"column"}>
      <Flex w={"100%"} justify={"space-between"} align={"center"}>
        {/* Tooltip header, with a close button */}
        {step.title && (
          <Text
            className={"tooltip__title"}
            fontWeight={"semibold"}
            fontSize={"sm"}
          >
            {step.title}
          </Text>
        )}

        <IconButton
          size={"xs"}
          rounded={"md"}
          variant={"ghost"}
          className={"tooltip__close"}
          {...closeProps}
        >
          <Icon name={"close"} size={"xs"} />
        </IconButton>
      </Flex>

      <Flex
        className={"tooltip__body"}
        direction={"column"}
        gap={"1"}
        {...tooltipProps}
      >
        {/* Tooltip content */}
        <Flex className={"tooltip__content"} w={"100%"} fontSize={"xs"}>
          {step.content}
        </Flex>

        {/* Tooltip footer */}
        <Flex
          className={"tooltip__footer"}
          w={"100%"}
          direction={"row"}
          align={"center"}
          justify={"space-between"}
        >
          {/* Skip button */}
          <Button
            size={"xs"}
            rounded={"md"}
            colorPalette={"orange"}
            className={"tooltip__button"}
            {...skipProps}
          >
            {skipProps.title}
          </Button>

          {/* Navigation button */}
          <Flex className={"tooltip__spacer"} gap={"1"}>
            {index > 0 && (
              <Button
                size={"xs"}
                rounded={"md"}
                colorPalette={"blue"}
                className={"tooltip__button"}
                {...backProps}
              >
                <Icon name={"c_left"} size={"xs"} />
                {backProps.title}
              </Button>
            )}

            {continuous && (
              <Button
                size={"xs"}
                rounded={"md"}
                colorPalette={"blue"}
                className={"tooltip__button tooltip__button--primary"}
                {...primaryProps}
              >
                {primaryProps.title}
                <Icon name={"c_right"} size={"xs"} />
              </Button>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default WalkthroughTooltip;
