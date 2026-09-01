// React
import React, { useState } from "react";

// Existing and custom components
import {
  Button,
  Collapsible,
  CloseButton,
  createListCollection,
  Drawer,
  EmptyState,
  Field,
  Flex,
  Input,
  Portal,
  Tag,
  Text,
  Timeline,
} from "@chakra-ui/react";
import TagActor from "@components/TagActor";
import { AttributeTag, EmptyTag, ValueTag } from "@components/TagField";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Select from "@components/Select";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { AttributeHistory, EntityHistory, HistoryDrawerProps, ProjectHistory } from "@types";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

// Custom hooks
import { useHistorySort } from "@hooks/useHistorySort";

// Variables
import { STYLES } from "@variables";

const TITLES = {
  entity: "Entity History",
  project: "Project History",
  template: "Template History",
};

const SORT_OPTIONS = createListCollection({
  items: [
    { value: "newest-first", label: "Newest → Oldest" },
    { value: "oldest-first", label: "Oldest → Newest" },
  ],
});

/**
 * Renders the type-specific detail panel for a single version, switched on `HistoryDrawerProps.type`.
 * The three history shapes only diverge here; everything else about a version row is identical
 */
const HistoryDetails = (props: {
  type: HistoryDrawerProps["type"];
  version: HistoryDrawerProps["history"][number];
}) => {
  if (props.type === "entity") {
    const version = props.version as EntityHistory;
    return (
      <Flex direction={"row"} gap={"1"}>
        <Flex
          direction={"column"}
          gap={"1"}
          p={"2"}
          rounded={"md"}
          border={STYLES.border.style}
          borderColor={STYLES.border.color}
          bg={"white"}
          grow={"1"}
        >
          <Text fontSize={"xs"} fontWeight={"semibold"}>
            Attributes
          </Text>
          <FieldTagList
            items={version.attributes}
            max={1}
            emptyLabel={"Attributes"}
            getKey={(attribute) => attribute._id}
            renderTag={(attribute) => <AttributeTag attribute={attribute} />}
          />
        </Flex>

        <Flex
          direction={"column"}
          gap={"1"}
          p={"2"}
          rounded={"md"}
          border={STYLES.border.style}
          borderColor={STYLES.border.color}
          bg={"white"}
          grow={"1"}
        >
          <Text fontSize={"xs"} fontWeight={"semibold"}>
            Attachments
          </Text>
          <FieldTagList
            items={version.attachments}
            max={3}
            emptyLabel={"Attachments"}
            getKey={(attachment) => attachment._id}
            renderTag={(attachment) => (
              <Tooltip content={attachment.name} showArrow>
                <Tag.Root size={"sm"}>
                  <Tag.Label fontSize={"xs"}>{_.truncate(attachment.name, { length: 20 })}</Tag.Label>
                </Tag.Root>
              </Tooltip>
            )}
          />
        </Flex>
      </Flex>
    );
  }

  if (props.type === "project") {
    const version = props.version as ProjectHistory;
    return (
      <Flex
        direction={"column"}
        gap={"1"}
        p={"2"}
        rounded={"md"}
        border={STYLES.border.style}
        borderColor={STYLES.border.color}
        bg={"white"}
        grow={"1"}
      >
        <Text fontSize={"xs"} fontWeight={"semibold"}>
          Entities
        </Text>
        <FieldTagList
          items={version.entities}
          max={3}
          emptyLabel={"Entities"}
          getKey={(entityId) => entityId}
          renderTag={(entityId) => <Linky type={"entities"} id={entityId} size={"xs"} />}
        />
      </Flex>
    );
  }

  const version = props.version as AttributeHistory;
  return (
    <Flex
      direction={"column"}
      gap={"1"}
      p={"2"}
      rounded={"md"}
      border={STYLES.border.style}
      borderColor={STYLES.border.color}
      bg={"white"}
    >
      <Text fontSize={"xs"} fontWeight={"semibold"}>
        Values
      </Text>
      <FieldTagList
        items={version.values}
        max={2}
        emptyLabel={"Values"}
        getKey={(value) => value._id}
        renderTag={(value) => <ValueTag value={value} />}
      />
    </Flex>
  );
};

const HistoryDrawer = (props: HistoryDrawerProps) => {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const {
    sorted,
    sortOrder,
    setSortOrder,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    applyDateFilter,
    resetDateFilter,
  } = useHistorySort(props.history);

  const toggleExpanded = (version: string) => {
    const next = new Set(expandedVersions);
    if (next.has(version)) {
      next.delete(version);
    } else {
      next.add(version);
    }
    setExpandedVersions(next);
  };

  return (
    <Drawer.Root
      open={props.open}
      size={"lg"}
      onOpenChange={(event) => props.onOpenChange(event.open)}
      closeOnEscape
      closeOnInteractOutside
    >
      <Drawer.Trigger asChild>
        <Button
          variant={"subtle"}
          colorPalette={"gray"}
          size={"xs"}
          rounded={"md"}
          onClick={() => props.onOpenChange(true)}
        >
          History
          <Icon name={"clock"} size={"xs"} />
        </Button>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner padding={"4"}>
          <Drawer.Content rounded={"md"}>
            <Drawer.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={() => props.onOpenChange(false)} />
            </Drawer.CloseTrigger>
            <Drawer.Header p={"2"} bg={STYLES.dialog.header.bg} roundedTop={"md"}>
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Icon name={"clock"} size={"xs"} />
                <Text fontSize={"sm"} fontWeight={"semibold"}>
                  {TITLES[props.type]}
                </Text>
              </Flex>
            </Drawer.Header>

            <Drawer.Body pt={"0"} p={"2"} px={"2"} gap={"2"}>
              <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"} mx={"0.5"} mb={"2"}>
                <Flex direction={"row"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Last modified:
                  </Text>
                  <Text fontSize={"xs"} fontWeight={"normal"}>
                    {props.history.length > 0 ? dayjs(props.history[0].timestamp).fromNow() : "never"}
                  </Text>
                </Flex>
                <Flex direction={"row"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Versions:
                  </Text>
                  <Text fontSize={"xs"} fontWeight={"normal"}>
                    {props.history.length}
                  </Text>
                </Flex>
              </Flex>

              <Flex
                direction={"row"}
                gap={"2"}
                align={"start"}
                rounded={"md"}
                bg={"surface.muted"}
                p={"2"}
                justify={"space-between"}
                wrap={"wrap"}
              >
                <Flex direction={"column"} gap={"1"} align={"center"} justify={"left"} ml={"0.5"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} w={"100%"} ml={"0.5"}>
                    Sort
                  </Text>
                  <Select
                    collection={SORT_OPTIONS}
                    value={[sortOrder]}
                    onValueChange={(details) => setSortOrder(details.value[0] as "newest-first" | "oldest-first")}
                    width={"240px"}
                  />
                </Flex>

                <Flex direction={"column"} gap={"1"} align={"center"} wrap={"wrap"} ml={"0.5"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} w={"100%"} ml={"0.5"}>
                    Edited Between
                  </Text>

                  <Flex direction={"row"} gap={"2"} align={"center"}>
                    <Field.Root gap={"0"}>
                      <Field.Label fontSize={"xs"} ml={"0.5"}>
                        Start
                      </Field.Label>
                      <Input
                        type={"date"}
                        size={"xs"}
                        rounded={"md"}
                        w={"140px"}
                        bg={"white"}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root gap={"0"}>
                      <Field.Label fontSize={"xs"} ml={"0.5"}>
                        End
                      </Field.Label>
                      <Input
                        type={"date"}
                        size={"xs"}
                        rounded={"md"}
                        w={"140px"}
                        bg={"white"}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </Field.Root>
                  </Flex>
                  <Flex direction={"row"} gap={"2"} align={"center"} justify={"flex-end"} w={"100%"}>
                    <Button
                      size={"xs"}
                      rounded={"md"}
                      variant={"solid"}
                      colorPalette={"blue"}
                      alignSelf={"end"}
                      onClick={applyDateFilter}
                    >
                      Apply Filter
                    </Button>
                    <Button
                      size={"xs"}
                      rounded={"md"}
                      variant={"outline"}
                      alignSelf={"end"}
                      bg={"white"}
                      _hover={{ bg: "gray.50" }}
                      onClick={resetDateFilter}
                    >
                      Reset Filter
                    </Button>
                  </Flex>
                </Flex>
              </Flex>

              {sorted.length > 0 ? (
                <Timeline.Root size={"sm"} variant={"subtle"} mt={"2"}>
                  {sorted.map((version) => {
                    const isExpanded = expandedVersions.has(version.version);
                    return (
                      <Timeline.Item key={`v_${version.timestamp}`}>
                        <Timeline.Connector>
                          <Timeline.Separator />
                          <Timeline.Indicator />
                        </Timeline.Connector>
                        <Timeline.Content>
                          <Flex direction={"column"} gap={"2"} w={"100%"}>
                            <Flex
                              direction={{ base: "column", sm: "row" }}
                              gap={"2"}
                              align={{ base: "start", sm: "center" }}
                              justify={"space-between"}
                            >
                              <Flex direction={"column"} gap={"0.5"} grow={"1"}>
                                <Flex direction={"row"} gap={"1"} align={"center"}>
                                  <Tag.Root size={"sm"} colorPalette={"green"}>
                                    <Tag.Label fontSize={"xs"}>{version.version.slice(0, 6)}</Tag.Label>
                                  </Tag.Root>
                                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                                    {version.name}
                                  </Text>
                                  <Text fontSize={"xs"} color={"text.subtle"}>
                                    {dayjs(version.timestamp).fromNow()}
                                  </Text>
                                </Flex>
                                <Flex direction={"row"} gap={"1"} align={"center"}>
                                  {version.message ? (
                                    <Tooltip
                                      content={version.message}
                                      disabled={version.message.length <= 40}
                                      showArrow
                                    >
                                      <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
                                        {_.truncate(version.message, { length: 40 })}
                                      </Text>
                                    </Tooltip>
                                  ) : (
                                    <Tag.Root size={"sm"} colorPalette={"orange"}>
                                      <Tag.Label fontSize={"xs"}>No message</Tag.Label>
                                    </Tag.Root>
                                  )}
                                </Flex>
                              </Flex>
                              <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
                                <Collapsible.Root
                                  open={isExpanded}
                                  onOpenChange={() => toggleExpanded(version.version)}
                                >
                                  <Collapsible.Trigger asChild>
                                    <Button
                                      size={"xs"}
                                      variant={"subtle"}
                                      colorPalette={"gray"}
                                      rounded={"md"}
                                      aria-label={isExpanded ? "Collapse details" : "Expand details"}
                                    >
                                      Details
                                      <Icon name={isExpanded ? "c_up" : "c_down"} size={"xs"} />
                                    </Button>
                                  </Collapsible.Trigger>
                                </Collapsible.Root>
                                <Button
                                  variant={"solid"}
                                  size={"xs"}
                                  rounded={"md"}
                                  colorPalette={"blue"}
                                  onClick={() => props.onPreview(version)}
                                  disabled={props.archived}
                                >
                                  Preview
                                  <Icon name={"expand"} size={"xs"} />
                                </Button>
                                <Tooltip
                                  content={"Insufficient permissions in this Workspace"}
                                  disabled={props.canRestore}
                                  showArrow
                                >
                                  <Button
                                    variant={"solid"}
                                    size={"xs"}
                                    rounded={"md"}
                                    colorPalette={"orange"}
                                    onClick={() => props.onRestore(version)}
                                    disabled={props.archived || props.previewActive || !props.canRestore}
                                  >
                                    Restore
                                    <Icon name={"rewind"} size={"xs"} />
                                  </Button>
                                </Tooltip>
                              </Flex>
                            </Flex>

                            <Collapsible.Root open={isExpanded} onOpenChange={() => toggleExpanded(version.version)}>
                              <Collapsible.Content>
                                <Flex
                                  direction={"column"}
                                  gap={"2"}
                                  mt={"1"}
                                  p={"2"}
                                  bg={"surface.subtle"}
                                  rounded={"md"}
                                >
                                  <Flex direction={"row"} gap={"2"} align={"center"}>
                                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                                      Author:
                                    </Text>
                                    <TagActor identifier={version.author} fallback={"Unknown User"} size={"sm"} />
                                  </Flex>

                                  <Flex direction={"column"} gap={"0.5"}>
                                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                                      Description:
                                    </Text>
                                    {version.description ? (
                                      <Text fontSize={"xs"}>{version.description}</Text>
                                    ) : (
                                      <Flex>
                                        <EmptyTag label={"Description"} size={"sm"} />
                                      </Flex>
                                    )}
                                  </Flex>

                                  <HistoryDetails type={props.type} version={version} />
                                </Flex>
                              </Collapsible.Content>
                            </Collapsible.Root>
                          </Flex>
                        </Timeline.Content>
                      </Timeline.Item>
                    );
                  })}
                </Timeline.Root>
              ) : (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon name={"clock"} size={"lg"} />
                    </EmptyState.Indicator>
                    <EmptyState.Description>No History</EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};

export default HistoryDrawer;
