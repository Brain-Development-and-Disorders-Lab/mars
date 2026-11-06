// React
import React, { useState } from "react";

// Existing and custom components
import { Button, Flex, HoverCard, Portal, Separator, Skeleton, Tag, Text } from "@chakra-ui/react";
import { TagEmpty } from "@components/TagField";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { IconNames, IGenericItem, LinkyData, LinkyProps, LinkyType, IValueType } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import { getPublicWorkspaceUrl, getValueTypeIconProps } from "@lib/util";

// Variables
import { STYLES } from "@variables";

// Singular display name for each Linky type, used in fallback and error labels
const TYPE_LABEL: Record<LinkyType, string> = {
  entities: "Entity",
  projects: "Project",
  attributes: "Attribute",
  workspaces: "Workspace",
};

// Icon name, archived badge border, and badge color for each Linky type
const TYPE_STYLE: Record<LinkyType, { icon: IconNames; badgeBorder: string; iconColor: string }> = {
  entities: {
    icon: "entity",
    badgeBorder: STYLES.entity.color.border,
    iconColor: STYLES.entity.color.icon,
  },
  projects: {
    icon: "project",
    badgeBorder: STYLES.project.color.border,
    iconColor: STYLES.project.color.icon,
  },
  attributes: {
    icon: "attribute",
    badgeBorder: STYLES.attribute.color.border,
    iconColor: STYLES.attribute.color.icon,
  },
  workspaces: {
    icon: "workspace",
    badgeBorder: "gray.300",
    iconColor: "gray.700",
  },
};

// Label for the navigator preview list, per Linky type
const NAVIGATOR_LABEL: Record<LinkyType, string> = {
  entities: "Attributes",
  projects: "Entities",
  attributes: "Values",
  workspaces: "Values",
};

// Icon, color, and color palette for navigator preview tags that don't depend on the item itself
const NAVIGATOR_ITEM_STYLE: Partial<Record<LinkyType, { icon: IconNames; color: string; palette: string }>> = {
  entities: { icon: "attribute", color: STYLES.attribute.color.icon, palette: "attribute" },
  projects: { icon: "entity", color: STYLES.entity.color.icon, palette: "entity" },
  workspaces: { icon: "workspace", color: "black", palette: "gray" },
};

const NAVIGATOR_PREVIEW_COUNT = 2;

/**
 * Cap the label at a fixed number of characters when requested
 */
const truncateLabel = (label: string, truncate: LinkyProps["truncate"]): string => {
  if (!_.isNumber(truncate)) return label;
  return _.truncate(label, { length: truncate });
};

const Linky = (props: LinkyProps) => {
  const navigate = useNavigate();

  // Navigator state
  const [showNavigator, setShowNavigator] = useState(false);

  // Query context is shared across all types, routing to the public Workspace endpoint if required
  const hasId = !_.isEmpty(_.trim(props.id));
  const queryOptions = (type: LinkyType) => ({
    variables: { _id: props.id },
    skip: !hasId || props.type !== type,
    context: props.isPublic ? { uri: getPublicWorkspaceUrl(props.workspace || "") } : undefined,
  });

  // GraphQL operations
  const GET_ENTITY = gql`
    query GetEntity($_id: String) {
      entity(_id: $_id) {
        _id
        name
        archived
        description
        attributes {
          _id
          name
        }
      }
    }
  `;
  const entityQuery = useQuery<{
    entity: IGenericItem & { archived: boolean; description: string; attributes: { _id: string; name: string }[] };
  }>(GET_ENTITY, queryOptions("entities"));

  const GET_PROJECT = gql`
    query GetProject($_id: String) {
      project(_id: $_id) {
        _id
        name
        archived
        description
        entities
      }
      projectEntities(_id: $_id) {
        _id
        name
      }
    }
  `;
  const projectQuery = useQuery<{
    project: IGenericItem & { archived: boolean; description: string; entities: string[] };
    projectEntities: { _id: string; name: string }[];
  }>(GET_PROJECT, queryOptions("projects"));

  const GET_ATTRIBUTE = gql`
    query GetAttribute($_id: String) {
      attribute(_id: $_id) {
        _id
        name
        archived
        description
        values {
          _id
          name
          type
        }
      }
    }
  `;
  const attributeQuery = useQuery<{
    attribute: IGenericItem & {
      archived: boolean;
      description: string;
      values: { _id: string; name: string; type: IValueType }[];
    };
  }>(GET_ATTRIBUTE, queryOptions("attributes"));

  const GET_WORKSPACE = gql`
    query GetWorkspace($_id: String) {
      workspace(_id: $_id) {
        _id
        name
        description
      }
    }
  `;
  const workspaceQuery = useQuery<{
    workspace: IGenericItem & { description: string };
  }>(GET_WORKSPACE, queryOptions("workspaces"));

  const queries = {
    entities: entityQuery,
    projects: projectQuery,
    attributes: attributeQuery,
    workspaces: workspaceQuery,
  };
  const isLoading = queries[props.type].loading;

  // Normalizes the data for each Linky type, `null` if the item is inaccessible
  const getLinkyData = (): LinkyData | null => {
    if (props.type === "entities" && entityQuery.data) {
      const { entity } = entityQuery.data;
      return {
        name: entity.name,
        archived: entity.archived,
        description: entity.description,
        items: entity.attributes,
      };
    }
    if (props.type === "projects" && projectQuery.data) {
      const { project, projectEntities } = projectQuery.data;
      return {
        name: project.name,
        archived: project.archived,
        description: project.description,
        items: projectEntities,
      };
    }
    if (props.type === "attributes" && attributeQuery.data) {
      const { attribute } = attributeQuery.data;
      return {
        name: attribute.name,
        archived: attribute.archived,
        description: attribute.description,
        items: attribute.values,
      };
    }
    if (props.type === "workspaces" && workspaceQuery.data) {
      const { workspace } = workspaceQuery.data;
      return { name: workspace.name, archived: false, description: workspace.description, items: [] };
    }
    return null;
  };
  const linkyData = getLinkyData();

  // Labels, falling back when the ID is missing or the item is inaccessible
  let displayName = props.fallback || `Invalid ${TYPE_LABEL[props.type]}`;
  let tooltipLabel = `${TYPE_LABEL[props.type]} (ID: ${props.id}) is either inaccessible or does not exist.`;
  if (!hasId) {
    tooltipLabel = displayName;
  } else if (linkyData) {
    displayName = linkyData.name;
    tooltipLabel = linkyData.name;
  }
  const linkLabel = truncateLabel(displayName, props.truncate);
  const showDeleted = _.isNull(linkyData);
  const showArchived = linkyData?.archived ?? false;
  const navigatorDescription = linkyData?.description ?? "";
  const navigatorItems = linkyData?.items ?? [];

  const onClickHandler = () => {
    if (!showDeleted && !isLoading) {
      if (props.isPublic && props.type !== "workspaces") {
        navigate(`/public/${props.workspace}/${props.type}/${props.id}`);
      } else {
        navigate(`/${props.type}/${props.id}`);
      }
    }
  };

  const { icon, badgeBorder, iconColor } = TYPE_STYLE[props.type];
  const navigatorLabel = NAVIGATOR_LABEL[props.type];

  /**
   * Preview tag icon and color per item
   * @param item Specific item being assigned a style
   * @return {{ icon: IconNames; color: string; palette: string; }}
   */
  const getNavigatorItemStyle = (item: { type?: IValueType }): { icon: IconNames; color: string; palette: string } => {
    const style = NAVIGATOR_ITEM_STYLE[props.type];
    if (style) return style;
    const { name, color } = getValueTypeIconProps(item.type);
    return { icon: name, color, palette: color.split(".")[0] };
  };

  if (isLoading) {
    return <Skeleton h={"22px"} w={"80px"} rounded={"md"} />;
  }

  return (
    <Tooltip showArrow content={tooltipLabel}>
      {showDeleted ? (
        <Flex
          direction={"row"}
          align={"center"}
          h={"22px"}
          w={"fit-content"}
          border={STYLES.border.style}
          borderColor={"orange.200"}
          rounded={"md"}
          overflow={"hidden"}
          cursor={"not-allowed"}
          flexShrink={1}
          minW={0}
          maxW={"100%"}
        >
          {/* Warning badge */}
          <Flex
            align={"center"}
            justify={"center"}
            bg={"status.warning.subtle"}
            px={"1.5"}
            h={"100%"}
            flexShrink={0}
            borderRight={"1px solid"}
            borderColor={"orange.200"}
          >
            <Icon name={"warning"} size={"xs"} color={"orange.500"} />
          </Flex>
          {/* Deleted label */}
          <Flex px={"2"} align={"center"} h={"100%"} minW={0} bg={"white"}>
            <Text fontSize={"xs"} fontWeight={"medium"} color={"text.subtle"} truncate>
              {linkLabel}
            </Text>
          </Flex>
        </Flex>
      ) : (
        <HoverCard.Root open={showNavigator} onOpenChange={(event) => setShowNavigator(event.open)}>
          <HoverCard.Trigger asChild>
            <Flex
              direction={"row"}
              align={"center"}
              h={"22px"}
              w={"fit-content"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              rounded={"lg"}
              overflow={"hidden"}
              cursor={"pointer"}
              onClick={onClickHandler}
              flexShrink={1}
              minW={0}
              maxW={"100%"}
              _hover={{
                borderColor: iconColor,
                boxShadow: `0 0 0 1px ${iconColor}4D`,
              }}
            >
              {/* Type icon badge */}
              <Flex
                align={"center"}
                justify={"center"}
                bg={showArchived ? STYLES.card.bg : iconColor}
                px={"1.5"}
                h={"100%"}
                flexShrink={0}
                borderRight={"1px solid"}
                borderColor={showArchived ? badgeBorder : iconColor}
              >
                <Icon name={icon} size={"xs"} color={showArchived ? "gray.500" : "white"} />
              </Flex>
              {/* Name */}
              <Flex px={"2"} align={"center"} h={"100%"} minW={0} bg={"white"}>
                <Text fontSize={"xs"} fontWeight={"medium"} color={"gray.700"} truncate>
                  {linkLabel}
                </Text>
              </Flex>
              {/* Status icon badge */}
              {showArchived && (
                <Flex
                  align={"center"}
                  justify={"center"}
                  bg={STYLES.card.bg}
                  px={"1.5"}
                  h={"100%"}
                  flexShrink={0}
                  borderLeft={"1px solid"}
                  borderColor={"gray.100"}
                >
                  <Icon name={"archive"} size={"xs"} color={"text.subtle"} />
                </Flex>
              )}
            </Flex>
          </HoverCard.Trigger>
          <Portal>
            <HoverCard.Positioner>
              <HoverCard.Content p={"3"} gap={"2"} w={"xs"} zIndex={"max"}>
                <HoverCard.Arrow>
                  <HoverCard.ArrowTip />
                </HoverCard.Arrow>

                {/* Header */}
                <Flex direction={"row"} gap={"1.5"} align={"center"}>
                  <Icon name={icon} size={"xs"} color={iconColor} />
                  <Text fontWeight={"semibold"} fontSize={"sm"} flex={1} lineClamp={1}>
                    {tooltipLabel}
                  </Text>
                  {showArchived && (
                    <Tag.Root size={"sm"} colorPalette={"gray"}>
                      <Tag.Label fontSize={"2xs"}>Archived</Tag.Label>
                    </Tag.Root>
                  )}
                  <Flex justify={"flex-end"}>
                    <Button size={"xs"} rounded={"md"} onClick={onClickHandler} colorPalette={"blue"}>
                      View
                      <Icon name={"a_right"} size={"xs"} />
                    </Button>
                  </Flex>
                </Flex>

                <Separator />

                {/* Description */}
                <Flex direction={"column"} gap={"0.5"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                    Description
                  </Text>
                  <Flex minW={0}>
                    {_.isUndefined(navigatorDescription) || navigatorDescription === "" ? (
                      <TagEmpty label={"Description"} />
                    ) : (
                      <Tooltip content={navigatorDescription}>
                        <Text fontSize={"xs"} truncate>
                          {navigatorDescription}
                        </Text>
                      </Tooltip>
                    )}
                  </Flex>
                </Flex>

                {/* Preview */}
                {props.type !== "workspaces" && (
                  <Flex direction={"column"} gap={"0.5"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                      {navigatorLabel}
                    </Text>
                    <Flex>
                      <FieldTagList
                        items={navigatorItems}
                        max={NAVIGATOR_PREVIEW_COUNT}
                        emptyLabel={navigatorLabel}
                        getKey={(item) => item._id}
                        renderTag={(item) => {
                          const itemStyle = getNavigatorItemStyle(item);
                          return (
                            <Tag.Root colorPalette={itemStyle.palette} size={"sm"}>
                              <Tag.StartElement>
                                <Icon name={itemStyle.icon} color={itemStyle.color} size={"xs"} />
                              </Tag.StartElement>
                              <Tag.Label fontSize={"xs"}>{_.truncate(item.name, { length: 16 })}</Tag.Label>
                            </Tag.Root>
                          );
                        }}
                      />
                    </Flex>
                  </Flex>
                )}
              </HoverCard.Content>
            </HoverCard.Positioner>
          </Portal>
        </HoverCard.Root>
      )}
    </Tooltip>
  );
};

export default Linky;
