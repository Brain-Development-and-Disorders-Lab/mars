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
          colorScheme={"red"}
          icon={<Icon name={"cross"} />}
          className={"tooltip__close"}
          {...closeProps}
        />
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
                leftIcon={<Icon name={"c_left"} />}
                className={"tooltip__button"}
                {...backProps}
                colorScheme={"orange"}
              >
                {backProps.title}
              </Button>
            )}

            {continuous && (
              <Button
                size={"sm"}
                rightIcon={<Icon name={"c_right"} />}
                colorScheme={"blue"}
                className={"tooltip__button tooltip__button--primary"}
                {...primaryProps}
              >
                {primaryProps.title}
              </Button>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default WalkthroughTooltip;
