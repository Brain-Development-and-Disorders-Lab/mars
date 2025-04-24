// React
import React from "react";
import {
  Flex,
  IconButton,
  Spacer,
  Tooltip,
  Text,
  useBreakpoint,
} from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";

// Existing and custom types
import { VisibilityTagProps } from "@types";

// Utility functions and libraries
import consola from "consola";

const VisibilityTag = (props: VisibilityTagProps) => {
  // Breakpoint state
  const breakpoint = useBreakpoint();

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
      border={"1px"}
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
        {breakpoint !== "base" && (
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.400"}>
            {props.isPublic ? "Everyone" : "Workspace Users only"}
          </Text>
        )}
      </Flex>
      <Spacer />
      {props.isInherited ? (
        <Tooltip
          hasArrow
          label={
            "This visibility state is inherited and cannot be changed directly"
          }
        >
          <IconButton
            ml={"1"}
            aria-label={"set-visibility"}
            size={"sm"}
            disabled
            icon={<Icon name={props.isPublic ? "lock" : "l_globus"} />}
          />
        </Tooltip>
      ) : (
        <Tooltip
          hasArrow
          label={props.isPublic ? "Make Private" : "Make Public"}
        >
          <IconButton
            ml={"1"}
            aria-label={"set-visibility"}
            size={"sm"}
            colorPalette={"green"}
            icon={<Icon name={props.isPublic ? "lock" : "l_globus"} />}
            disabled={props.disabled}
            onClick={handleVisibilityClick}
          />
        </Tooltip>
      )}
    </Flex>
  );
};

export default VisibilityTag;
