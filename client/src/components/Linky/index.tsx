// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, HoverCard, Portal, Separator, Skeleton, Tag, Text } from "@chakra-ui/react";
import { EmptyTag } from "@components/TagField";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { IconNames, IGenericItem, LinkyData, LinkyProps, LinkyType, IValueType } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import { getPublicWorkspaceUrl, getValueTypeIconProps } from "@lib/util";

// Variables
import { STYLES } from "@variables";

const DEFAULT_LINKY_LABEL_LENGTH = 16; // Default number of shown characters

// Singular display name for each Linky type, used in fallback and error labels
const TYPE_LABEL: Record<LinkyType, string> = {
  entities: "Entity",
  projects: "Project",
  templates: "Template",
  workspaces: "Workspace",
};

// Icon name, badge background, border, and icon color for each Linky type
const TYPE_STYLE: Record<LinkyType, { icon: IconNames; badgeBg: string; badgeBorder: string; iconColor: string }> = {
  entities: {
    icon: "entity",
    badgeBg: STYLES.entity.color.light,
    badgeBorder: STYLES.entity.color.border,
    iconColor: STYLES.entity.color.icon,
  },
  projects: {
    icon: "project",
    badgeBg: STYLES.project.color.light,
    badgeBorder: STYLES.project.color.border,
    iconColor: STYLES.project.color.icon,
  },
  templates: {
    icon: "template",
    badgeBg: STYLES.template.color.light,
    badgeBorder: STYLES.template.color.border,
    iconColor: STYLES.template.color.icon,
  },
  workspaces: {
    icon: "workspace",
    badgeBg: "gray.300",
    badgeBorder: "gray.300",
    iconColor: "gray.700",
  },
};

// Label for the navigator preview list, per Linky type
const NAVIGATOR_LABEL: Record<LinkyType, string> = {
  entities: "Attributes",
  projects: "Entities",
  templates: "Values",
  workspaces: "Values",
};

// Icon, color, and color palette for navigator preview tags that don't depend on the item itself
const NAVIGATOR_ITEM_STYLE: Partial<Record<LinkyType, { icon: IconNames; color: string; palette: string }>> = {
  entities: { icon: "attribute", color: STYLES.template.color.icon, palette: "template" },
  projects: { icon: "entity", color: STYLES.entity.color.icon, palette: "entity" },
  workspaces: { icon: "workspace", color: "black", palette: "gray" },
};

const NAVIGATOR_PREVIEW_COUNT = 2;

/**
 * Apply Linky's truncation rules to a label
 */
const truncateLabel = (label: string, truncate: LinkyProps["truncate"]): string => {
  if (truncate === false) return label;
  const length = _.isNumber(truncate) ? truncate : DEFAULT_LINKY_LABEL_LENGTH;
  return _.truncate(label, { length });
};

const Linky = (props: LinkyProps) => {
  const navigate = useNavigate();

  // Component state
  const [linkLabel, setLinkLabel] = useState("Loading...");
  const [tooltipLabel, setTooltipLabel] = useState("Default");
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  // Navigator state
  const [showNavigator, setShowNavigator] = useState(false);
  const [navigatorDescription, setNavigatorDescription] = useState("");
  const [navigatorItems, setNavigatorItems] = useState<{ _id: string; name: string; type?: IValueType }[]>([]);

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
  const [getEntity, { loading: loadingEntity }] = useLazyQuery<{
    entity: IGenericItem & { archived: boolean; description: string; attributes: { _id: string; name: string }[] };
  }>(GET_ENTITY);

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
  const [getProject, { loading: loadingProject }] = useLazyQuery<{
    project: IGenericItem & { archived: boolean; description: string; entities: string[] };
    projectEntities: { _id: string; name: string }[];
  }>(GET_PROJECT);

  const GET_TEMPLATE = gql`
    query GetTemplate($_id: String) {
      template(_id: $_id) {
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
  const [getTemplate, { loading: loadingTemplate }] = useLazyQuery<{
    template: IGenericItem & {
      archived: boolean;
      description: string;
      values: { _id: string; name: string; type: IValueType }[];
    };
  }>(GET_TEMPLATE);

  const GET_WORKSPACE = gql`
    query GetWorkspace($_id: String) {
      workspace(_id: $_id) {
        _id
        name
        description
      }
    }
  `;
  const [getWorkspace, { loading: loadingWorkspace }] = useLazyQuery<{
    workspace: IGenericItem & { description: string };
  }>(GET_WORKSPACE);

  // Query context is shared across all types, routing to the public Workspace endpoint if required
  const queryContext = props.isPublic ? { uri: getPublicWorkspaceUrl(props.workspace || "") } : undefined;

  // Fetches and normalizes data for each Linky type, returning `null` if the item is inaccessible
  const fetchers: Record<LinkyType, () => Promise<LinkyData | null>> = {
    entities: async () => {
      const { data, error } = await getEntity({ variables: { _id: props.id }, context: queryContext });
      if (error || !data) return null;
      return {
        name: data.entity.name,
        archived: data.entity.archived,
        description: data.entity.description,
        items: data.entity.attributes,
      };
    },
    projects: async () => {
      const { data, error } = await getProject({ variables: { _id: props.id }, context: queryContext });
      if (error || !data) return null;
      return {
        name: data.project.name,
        archived: data.project.archived,
        description: data.project.description,
        items: data.projectEntities,
      };
    },
    templates: async () => {
      const { data, error } = await getTemplate({ variables: { _id: props.id }, context: queryContext });
      if (error || !data) return null;
      return {
        name: data.template.name,
        archived: data.template.archived,
        description: data.template.description,
        items: data.template.values,
      };
    },
    workspaces: async () => {
      const { data, error } = await getWorkspace({ variables: { _id: props.id }, context: queryContext });
      if (error || !data) return null;
      return { name: data.workspace.name, archived: false, description: data.workspace.description, items: [] };
    },
  };

  /**
   * Utility function to retrieve data of link target
   */
  const getLinkyData = async () => {
    const fallbackName = props.fallback || `Invalid ${TYPE_LABEL[props.type]}`;

    if (!props.id || props.id.trim() === "") {
      setTooltipLabel(fallbackName);
      setShowDeleted(true);
      setLinkLabel(truncateLabel(fallbackName, props.truncate));
      return;
    }

    const notFoundTooltip = `${TYPE_LABEL[props.type]} (ID: ${props.id}) is either inaccessible or does not exist.`;

    // On a GraphQL-level error the fallback is ignored, but a thrown error keeps it, matching prior behaviour
    let name = fallbackName;
    try {
      const result = await fetchers[props.type]();
      if (result) {
        name = result.name;
        setTooltipLabel(name);
        setShowArchived(result.archived);
        setNavigatorDescription(result.description);
        setNavigatorItems(result.items);
      } else {
        name = `Invalid ${TYPE_LABEL[props.type]}`;
        setShowDeleted(true);
        setTooltipLabel(notFoundTooltip);
      }
    } catch {
      setShowDeleted(true);
      setTooltipLabel(notFoundTooltip);
    }

    setLinkLabel(truncateLabel(name, props.truncate));
  };

  const onClickHandler = () => {
    if (!showDeleted && !loadingEntity && !loadingProject && !loadingTemplate && !loadingWorkspace) {
      if (props.isPublic && props.type !== "workspaces") {
        navigate(`/public/${props.workspace}/${props.type}/${props.id}`);
      } else {
        navigate(`/${props.type}/${props.id}`);
      }
    }
  };

  useEffect(() => {
    getLinkyData();
  }, [props.id]);

  const isLoading = loadingTemplate || loadingEntity || loadingProject;
  const { icon, badgeBg, badgeBorder, iconColor } = TYPE_STYLE[props.type];
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
          flexShrink={0}
        >
          {/* Warning badge */}
          <Flex
            align={"center"}
            justify={"center"}
            bg={"status.warning.subtle"}
            px={"1.5"}
            h={"100%"}
            borderRight={"1px solid"}
            borderColor={"orange.200"}
          >
            <Icon name={"warning"} size={"xs"} color={"orange.500"} />
          </Flex>
          {/* Deleted label */}
          <Flex px={"2"} align={"center"} h={"100%"} bg={"white"}>
            <Text fontSize={"xs"} fontWeight={"medium"} color={"text.subtle"}>
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
              flexShrink={0}
              _hover={{
                borderColor: iconColor,
                boxShadow: `0 0 0 1px ${iconColor}4D`,
              }}
            >
              {/* Type icon badge */}
              <Flex
                align={"center"}
                justify={"center"}
                bg={showArchived ? STYLES.card.bg : badgeBg}
                px={"1.5"}
                h={"100%"}
                borderRight={"1px solid"}
                borderColor={badgeBorder}
              >
                <Icon name={icon} size={"xs"} color={showArchived ? "gray.500" : iconColor} />
              </Flex>
              {/* Name */}
              <Flex px={"2"} align={"center"} h={"100%"} bg={"white"}>
                <Text fontSize={"xs"} fontWeight={"medium"} color={"gray.700"}>
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
                  <Flex>
                    {_.isUndefined(navigatorDescription) || navigatorDescription === "" ? (
                      <EmptyTag label={"Description"} />
                    ) : (
                      <Tooltip disabled={navigatorDescription.length < 32} content={navigatorDescription}>
                        <Text fontSize={"xs"}>{_.truncate(navigatorDescription, { length: 32 })}</Text>
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
