// React
import React, { Fragment } from "react";
import { Flex, HoverCard, Portal, ScrollArea, Tag } from "@chakra-ui/react";

// Custom components
import { TagEmpty } from "@components/TagField";

// Existing and custom types
import { FieldTagListProps } from "@types";

const DEFAULT_TAG_COUNT = 5;

const FieldTagList = (props: FieldTagListProps) => {
  if (props.items.length === 0) {
    return props.emptyLabel ? (
      <Flex>
        <TagEmpty label={props.emptyLabel} />
      </Flex>
    ) : null;
  }

  const max = props.max ?? DEFAULT_TAG_COUNT;
  const overflow = props.items.length - max;

  return (
    <ScrollArea.Root w={"full"} minW={"0"}>
      <ScrollArea.Viewport justifyContent={"center"}>
        <ScrollArea.Content>
          <Flex
            direction={"row"}
            gap={"1"}
            align={"center"}
            wrap={"nowrap"}
            w={"max-content"}
            css={{ "& > *": { flexShrink: 0, maxW: "none" } }}
          >
            {props.items.slice(0, max).map((item) => (
              <Fragment key={props.getKey(item)}>{props.renderTag(item)}</Fragment>
            ))}
            {overflow > 0 && (
              <HoverCard.Root
                openDelay={200}
                closeDelay={100}
                positioning={{ placement: "top" }}
                lazyMount
                unmountOnExit
              >
                <HoverCard.Trigger asChild>
                  <Tag.Root variant={"outline"} cursor={"default"}>
                    <Tag.Label fontSize={"xs"}>+{overflow} more</Tag.Label>
                  </Tag.Root>
                </HoverCard.Trigger>
                <Portal>
                  <HoverCard.Positioner>
                    <HoverCard.Content maxW={"xs"} p={"2"}>
                      <HoverCard.Arrow />
                      <Flex gap={"1"} wrap={"wrap"}>
                        {props.items.slice(max).map((item) => (
                          <Fragment key={props.getKey(item)}>{props.renderTag(item)}</Fragment>
                        ))}
                      </Flex>
                    </HoverCard.Content>
                  </HoverCard.Positioner>
                </Portal>
              </HoverCard.Root>
            )}
          </Flex>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation={"horizontal"} position={"absolute"} bottom={"0"} left={"0"} right={"0"} />
    </ScrollArea.Root>
  );
};

export default FieldTagList;
