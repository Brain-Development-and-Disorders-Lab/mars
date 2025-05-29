// React
import React from "react";
import { Flex, IconButton, Spacer, Text } from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Custom hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Existing and custom types
import { VisibilityTagProps } from "@types";

// Utility functions and libraries
import consola from "consola";

const VisibilityTag = (props: VisibilityTagProps) => {
  // Breakpoint state
  const { isBreakpointActive } = useBreakpoint();

  /**
   * Handler function for visibility toggle button
   */
  const handleVisibilityClick = () => {
    if (props.setIsPublic) {
      props.setIsPublic(!props.isPublic);
    } else {
      consola.warn("`setIsPublic` not specified for component");
    }
  };

  return (
    <Flex
      align={"center"}
      gap={"2"}
      p={"2"}
      rounded={"md"}
      border={"1px solid"}
      borderColor={"gray.300"}
      bg={"white"}
      minW={"120px"}
    >
      <Icon
        name={props.isPublic ? "l_globus" : "lock"}
        size={"sm"}
        color={"green.400"}
      />
      <Flex direction={"column"} gap={"0"}>
        <Text fontSize={"sm"} fontWeight={"semibold"}>
          {props.isPublic ? "Public" : "Private"}
        </Text>
        {isBreakpointActive("xl", "up") && (
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.400"}>
            {props.isPublic ? "Everyone" : "Workspace Users only"}
          </Text>
        )}
      </Flex>
      <Spacer />
      {props.isInherited ? (
        <Tooltip
          content={
            "This visibility state is inherited and cannot be changed directly"
          }
          showArrow
        >
          <IconButton
            ml={"1"}
            aria-label={"set-visibility"}
            size={"sm"}
            disabled
          >
            <Icon name={props.isPublic ? "lock" : "l_globus"} />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip
          content={props.isPublic ? "Make Private" : "Make Public"}
          showArrow
        >
          <IconButton
            ml={"1"}
            aria-label={"set-visibility"}
            size={"sm"}
            colorPalette={"green"}
            disabled={props.disabled}
            onClick={handleVisibilityClick}
          >
            <Icon name={props.isPublic ? "lock" : "l_globus"} />
          </IconButton>
        </Tooltip>
      )}
    </Flex>
  );
};

export default VisibilityTag;
