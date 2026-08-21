// React
import React from "react";

// Existing and custom components
import { Breadcrumb, Flex, Heading, SkeletonText } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { ProjectBreadcrumbProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Variables
import { STYLES } from "@variables";

const ProjectBreadcrumb = ({
  loading,
  workspaceName,
  onNavigateHome,
  onNavigateProjects,
  archived,
  name,
}: ProjectBreadcrumbProps) => {
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
            onClick={onNavigateProjects}
            _hover={{
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            <Icon size={"xs"} name={"project"} color={STYLES.project.color.icon} />
            Projects
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
        </Breadcrumb.List>
      </Breadcrumb.Root>

      <Flex direction={"row"} gap={"2"} align={"center"} p={"0"} m={"0"}>
        <Flex
          id={"projectNameTag"}
          align={"center"}
          gap={"1"}
          p={"1"}
          border={"2px solid"}
          borderColor={archived ? "gray.500" : STYLES.project.color.icon}
          bg={archived ? STYLES.card.bg : STYLES.project.color.light}
          rounded={"md"}
        >
          <Icon name={"project"} size={"sm"} color={archived ? "gray.500" : STYLES.project.color.icon} />
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

export default ProjectBreadcrumb;
