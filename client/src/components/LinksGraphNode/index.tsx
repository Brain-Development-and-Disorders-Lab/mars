// React
import React from "react";

// Existing and custom components
import { Button, Flex, Tag, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import RelativeTime from "@components/RelativeTime";
import TagActor from "@components/TagActor";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { LinksGraphNodeProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

/** Card rendered inside a `LinksGraph` node, showing an Entity's key details */
const LinksGraphNode = (props: LinksGraphNodeProps): React.JSX.Element => (
  <Flex direction={"column"} w={"100%"} h={"100%"} justify={"space-between"} gap={"1"} p={"1"}>
    <Flex align={"center"} gap={"1.5"} w={"100%"}>
      <Icon name={"entity"} size={"sm"} color={STYLES.entity.color.icon} />
      <Tooltip content={props.name} disabled={props.name.length < 22}>
        <Text fontWeight={"semibold"} fontSize={"xs"} truncate>
          {_.truncate(props.name, { length: 22 })}
        </Text>
      </Tooltip>
      {props.archived && (
        <Tag.Root size={"sm"} colorPalette={"orange"} ml={"auto"} flexShrink={0}>
          <Tag.Label>Archived</Tag.Label>
        </Tag.Root>
      )}
    </Flex>

    {props.owner && (
      <Flex align={"center"} gap={"1"}>
        <Icon name={"person"} size={"xs"} color={"text.subtle"} />
        <Flex ml={"-1.5"}>
          <TagActor identifier={props.owner} fallback={"Unknown"} size={"sm"} inlineNoAvatar />
        </Flex>
      </Flex>
    )}

    <Flex align={"center"} gap={"2"} w={"100%"} wrap={"wrap"}>
      {props.linkCount !== undefined && (
        <Flex align={"center"} gap={"1"}>
          <Icon name={"graph"} size={"xs"} color={"text.subtle"} />
          <Text fontSize={"xs"} color={"text.subtle"}>
            {props.linkCount} link{props.linkCount !== 1 ? "s" : ""}
          </Text>
        </Flex>
      )}
      {props.attributeCount !== undefined && (
        <Flex align={"center"} gap={"1"}>
          <Icon name={"attribute"} size={"xs"} color={"text.subtle"} />
          <Text fontSize={"xs"} color={"text.subtle"}>
            {props.attributeCount} attribute{props.attributeCount !== 1 ? "s" : ""}
          </Text>
        </Flex>
      )}
      {props.projectCount !== undefined && (
        <Flex align={"center"} gap={"1"}>
          <Icon name={"project"} size={"xs"} color={"text.subtle"} />
          <Text fontSize={"xs"} color={"text.subtle"}>
            {props.projectCount} project{props.projectCount !== 1 ? "s" : ""}
          </Text>
        </Flex>
      )}
    </Flex>

    <Flex align={"center"} w={"100%"} gap={"1"}>
      {props.created && (
        <Flex align={"center"} gap={"1"}>
          <Icon name={"v_date"} size={"xs"} color={"text.faint"} />
          <RelativeTime value={props.created} fontSize={"2xs"} color={"text.faint"} />
        </Flex>
      )}
      {props.isPrimary ? (
        <Tag.Root size={"sm"} colorPalette={"entity"} ml={"auto"} flexShrink={0}>
          <Tag.Label>Current</Tag.Label>
        </Tag.Root>
      ) : (
        <Button
          size={"2xs"}
          ml={"auto"}
          flexShrink={0}
          onClick={(e) => {
            e.stopPropagation();
            props.onView(props.id);
          }}
        >
          View <Icon name={"a_right"} size={"xs"} />
        </Button>
      )}
    </Flex>
  </Flex>
);

export default LinksGraphNode;
