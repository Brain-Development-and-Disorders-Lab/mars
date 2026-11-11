// React
import React from "react";

// Existing and custom components
import { Breadcrumb, Flex, Heading, SkeletonText, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { AttributeBreadcrumbProps } from "@types";

// Variables
import { STYLES } from "@variables";

const AttributeBreadcrumb = ({
  loading,
  workspaceName,
  onNavigateHome,
  onNavigateAttributes,
  archived,
  name,
}: AttributeBreadcrumbProps) => {
  return (
    <Flex align={"center"} gap={"2"} ml={"0.5"} minW={0} maxW={"100%"}>
      <Breadcrumb.Root minW={0}>
        <Breadcrumb.List flexWrap={"nowrap"}>
          <Breadcrumb.Item
            gap={"1"}
            minW={0}
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
              <Tooltip content={workspaceName} showArrow>
                <Text minW={0} truncate>
                  {workspaceName}
                </Text>
              </Tooltip>
            )}
          </Breadcrumb.Item>
          <Breadcrumb.Separator flexShrink={0} />
          <Breadcrumb.Item
            gap={"1"}
            flexShrink={0}
            whiteSpace={"nowrap"}
            onClick={onNavigateAttributes}
            _hover={{
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            <Icon size={"xs"} name={"attribute"} color={STYLES.attribute.color.icon} />
            Attributes
          </Breadcrumb.Item>
          <Breadcrumb.Separator flexShrink={0} />
        </Breadcrumb.List>
      </Breadcrumb.Root>

      <Flex direction={"row"} gap={"2"} align={"center"} p={"0"} m={"0"} minW={0}>
        <Flex
          id={"attributeNameTag"}
          align={"center"}
          minW={0}
          gap={"1"}
          p={"1"}
          border={"2px solid"}
          borderColor={archived ? "gray.500" : STYLES.attribute.color.icon}
          bg={archived ? STYLES.card.bg : STYLES.attribute.color.light}
          rounded={"md"}
        >
          <Icon name={"attribute"} size={"sm"} color={archived ? "gray.500" : STYLES.attribute.color.icon} />
          <Tooltip content={`${archived ? "Archived: " : ""}${name}`} showArrow>
            <Heading fontWeight={"semibold"} size={"sm"} minW={0} truncate>
              {name}
            </Heading>
          </Tooltip>
          {archived && <Icon name={"archive"} size={"sm"} color={"text.subtle"} />}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default AttributeBreadcrumb;
