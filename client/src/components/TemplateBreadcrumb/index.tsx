// React
import React from "react";

// Existing and custom components
import { Breadcrumb, Flex, Heading, SkeletonText } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { TemplateBreadcrumbProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Variables
import { STYLES } from "@variables";

const TemplateBreadcrumb = ({
  loading,
  workspaceName,
  onNavigateHome,
  onNavigateTemplates,
  archived,
  name,
}: TemplateBreadcrumbProps) => {
  const { isBreakpointActive } = useBreakpoint();

  return (
    <Flex align={"center"} gap={"2"} ml={"0.5"}>
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item
            gap={"1"}
            onClick={onNavigateHome}
            _hover={{
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            <Icon name={"workspace"} size={"xs"} color={"black"} />
            {loading ? (
              <SkeletonText noOfLines={1} w={"80px"} my={"0.5"} h={"16px"} loading={loading} />
            ) : (
              _.truncate(workspaceName, { length: isBreakpointActive("md", "down") ? 12 : 24 })
            )}
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item
            gap={"1"}
            onClick={onNavigateTemplates}
            _hover={{
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            <Icon size={"xs"} name={"template"} color={STYLES.template.color.icon} />
            Templates
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
        </Breadcrumb.List>
      </Breadcrumb.Root>

      <Flex direction={"row"} gap={"2"} align={"center"} p={"0"} m={"0"}>
        <Flex
          id={"templateNameTag"}
          align={"center"}
          gap={"1"}
          p={"1"}
          border={"2px solid"}
          borderColor={archived ? "gray.500" : STYLES.template.color.icon}
          bg={archived ? STYLES.card.bg : STYLES.template.color.light}
          rounded={"md"}
        >
          <Icon name={"template"} size={"sm"} color={archived ? "gray.500" : STYLES.template.color.icon} />
          <Tooltip content={`${archived ? "Archived: " : ""}${name}`} showArrow>
            <Heading fontWeight={"semibold"} size={"sm"}>
              {_.truncate(name, { length: isBreakpointActive("md", "down") ? 12 : 24 })}
            </Heading>
          </Tooltip>
          {archived && <Icon name={"archive"} size={"sm"} color={"text.subtle"} />}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default TemplateBreadcrumb;
