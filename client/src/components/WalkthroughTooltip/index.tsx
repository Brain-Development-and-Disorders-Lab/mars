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
    <Flex w={"sm"} bg={"white"} rounded={"md"} p={"2"} direction={"column"}>
      <Flex w={"100%"} justify={"space-between"} align={"center"}>
        {/* Tooltip header, with a close button */}
        {step.title && (
          <Text
            className={"tooltip__title"}
            fontWeight={"semibold"}
            fontSize={"md"}
          >
            {step.title}
          </Text>
        )}
        <IconButton
          size={"sm"}
          colorPalette={"red"}
          className={"tooltip__close"}
          {...closeProps}
        >
          <Icon name={"cross"} />
        </IconButton>
      </Flex>

      <Flex
        className={"tooltip__body"}
        direction={"column"}
        gap={"2"}
        {...tooltipProps}
      >
        {/* Tooltip content */}
        <Flex className={"tooltip__content"} w={"100%"}>
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
          <Button size={"sm"} className={"tooltip__button"} {...skipProps}>
            {skipProps.title}
          </Button>

          {/* Navigation button */}
          <Flex className={"tooltip__spacer"} gap={"2"}>
            {index > 0 && (
              <Button
                size={"sm"}
                variant={"outline"}
                className={"tooltip__button"}
                {...backProps}
                colorPalette={"orange"}
              >
                <Icon name={"c_left"} />
                {backProps.title}
              </Button>
            )}

            {continuous && (
              <Button
                size={"sm"}
                colorPalette={"blue"}
                className={"tooltip__button tooltip__button--primary"}
                {...primaryProps}
              >
                {primaryProps.title}
                <Icon name={"c_right"} />
              </Button>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default WalkthroughTooltip;
