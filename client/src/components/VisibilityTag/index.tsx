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

// Variables
import { STYLES } from "@variables";

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
      direction={"row"}
      align={"center"}
      h={"52px"}
      w={"fit-content"}
      border={STYLES.border.style}
      borderColor={"green.200"}
      rounded={"md"}
      overflow={"hidden"}
      cursor={"not-allowed"}
      flexShrink={0}
    >
      {/* Timestamp badge */}
      <Flex
        align={"center"}
        justify={"center"}
        bg={"green.50"}
        px={"1.5"}
        h={"100%"}
        borderRight={"1px solid"}
        borderColor={"green.200"}
      >
        <Icon name={props.isPublic ? "l_globus" : "lock"} size={"xs"} color={"green.500"} />
      </Flex>

      <Flex direction={"row"} p={"2"} gap={"0.5"} align={"start"} justify={"center"} h={"100%"} bg={"white"}>
        <Flex direction={"column"} gap={"0"} alignSelf={"center"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
            {props.isPublic ? "Public" : "Private"}
          </Text>
          {isBreakpointActive("xl", "up") && (
            <Text fontSize={"xs"} fontWeight={"medium"} color={"text.faint"}>
              {props.isPublic ? "Everyone" : "Workspace Users only"}
            </Text>
          )}
        </Flex>
        <Spacer />
        {props.isInherited ? (
          <Tooltip content={"Visibility is inherited and cannot be changed directly"} showArrow>
            <IconButton ml={"1"} aria-label={"set-visibility"} size={"xs"} colorPalette={"green"} disabled>
              <Icon name={props.isPublic ? "l_globus" : "lock"} size={"xs"} />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip content={props.isPublic ? "Make Private" : "Make Public"} showArrow>
            <IconButton
              ml={"1"}
              aria-label={"set-visibility"}
              size={"xs"}
              colorPalette={"green"}
              disabled={props.disabled}
              onClick={handleVisibilityClick}
            >
              <Icon name={props.isPublic ? "l_globus" : "lock"} size={"xs"} />
            </IconButton>
          </Tooltip>
        )}
      </Flex>
    </Flex>
  );
};

export default VisibilityTag;
