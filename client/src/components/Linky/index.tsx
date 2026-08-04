// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, HoverCard, Portal, Separator, Skeleton, Tag, Text } from "@chakra-ui/react";
import { EmptyTag } from "@components/FieldTag";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { IconNames, IGenericItem, IValueType, LinkyProps } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import { getValueTypeIconProps } from "@lib/util";

// Variables
import { STYLES } from "@variables";

const DEFAULT_LINKY_LABEL_LENGTH = 18; // Default number of shown characters

/**
 * Utility to get the icon name, badge background, border, and icon color
 * for each Linky type
 */
const getTypeStyle = (
  type: "entities" | "projects" | "templates",
): { icon: IconNames; badgeBg: string; badgeBorder: string; iconColor: string } => {
  if (type === "projects") {
    return {
      icon: "project",
      badgeBg: STYLES.project.color.light,
      badgeBorder: STYLES.project.color.border,
      iconColor: STYLES.project.color.icon,
    };
  } else if (type === "templates") {
    return {
      icon: "template",
      badgeBg: STYLES.template.color.light,
      badgeBorder: STYLES.template.color.border,
      iconColor: STYLES.template.color.icon,
    };
  }
  // entities
  return {
    icon: "entity",
    badgeBg: STYLES.entity.color.light,
    badgeBorder: STYLES.entity.color.border,
    iconColor: STYLES.entity.color.icon,
  };
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

  /**
   * Utility function to retrieve data of link target
   */
  const getLinkyData = async () => {
    // If id is empty or missing, just use fallback without making a query
    if (!props.id || props.id.trim() === "") {
      const fallbackName = props.fallback || `Invalid ${_.capitalize(props.type).slice(0, -1)}`;
      setTooltipLabel(fallbackName);
      setShowDeleted(true);

      // Apply truncation if needed
      if (props.truncate === false) {
        setLinkLabel(fallbackName);
      } else if (_.isNumber(props.truncate)) {
        setLinkLabel(_.truncate(fallbackName, { length: props.truncate }));
      } else {
        setLinkLabel(_.truncate(fallbackName, { length: DEFAULT_LINKY_LABEL_LENGTH }));
      }
      return;
    }

    const data: IGenericItem & { description: string } = {
      _id: props.id,
      name: props.fallback || `Invalid ${_.capitalize(props.type.slice(0, -1))}`,
      description: "",
    };

    try {
      if (props.type === "templates") {
        const response = await getTemplate({ variables: { _id: props.id } });
        if (response.error || _.isUndefined(response.data)) {
          setShowDeleted(true);
          data.name = "Invalid Template";
          setTooltipLabel(`Template (ID: ${props.id}) is either inaccessible or does not exist.`);
        } else {
          data.name = response.data.template.name;
          setTooltipLabel(data.name);
          setShowArchived(response.data.template.archived);
          setNavigatorDescription(response.data.template.description);
          setNavigatorItems(response.data.template.values);
        }
      } else if (props.type === "entities") {
        const response = await getEntity({ variables: { _id: props.id } });
        if (response.error || _.isUndefined(response.data)) {
          setShowDeleted(true);
          data.name = "Invalid Entity";
          setTooltipLabel(`Entity (ID: ${props.id}) is either inaccessible or does not exist.`);
        } else {
          data.name = response.data.entity.name;
          setTooltipLabel(data.name);
          setShowArchived(response.data.entity.archived);
          setNavigatorDescription(response.data.entity.description);
          setNavigatorItems(response.data.entity.attributes);
        }
      } else if (props.type === "projects") {
        const response = await getProject({ variables: { _id: props.id } });
        if (response.error || _.isUndefined(response.data)) {
          setShowDeleted(true);
          data.name = "Invalid Project";
          setTooltipLabel(`Project (ID: ${props.id}) is either inaccessible or does not exist.`);
        } else {
          data.name = response.data.project.name;
          setTooltipLabel(data.name);
          setShowArchived(response.data.project.archived);
          setNavigatorDescription(response.data.project.description);
          setNavigatorItems(response.data.projectEntities);
        }
      }
    } catch (error) {
      // If query fails completely, use fallback
      setShowDeleted(true);
      const tooltipLabel = `${_.capitalize(props.type.slice(0, -1))} (ID: ${props.id}) is either inaccessible or does not exist.`;
      setTooltipLabel(tooltipLabel);
    }

    // Set the label text and apply truncating where specified
    if (props.truncate === false) {
      setLinkLabel(data.name);
    } else if (_.isNumber(props.truncate)) {
      setLinkLabel(_.truncate(data.name, { length: props.truncate }));
    } else {
      setLinkLabel(_.truncate(data.name, { length: DEFAULT_LINKY_LABEL_LENGTH }));
    }
  };

  const onClickHandler = () => {
    if (!showDeleted && !loadingEntity && !loadingProject && !loadingTemplate) {
      navigate(`/${props.type}/${props.id}`);
    }
  };

  useEffect(() => {
    getLinkyData();
  }, [props.id]);

  const isLoading = loadingTemplate || loadingEntity || loadingProject;
  const { icon, badgeBg, badgeBorder, iconColor } = getTypeStyle(props.type);

  /**
   * Preview tag icon and color per item
   * @param item Specific item being assigned a style
   * @return {{ icon: IconNames; color: string; palette: string; }}
   */
  const getNavigatorItemStyle = (item: { type?: IValueType }): { icon: IconNames; color: string; palette: string } => {
    if (props.type === "entities") {
      return { icon: "attribute", color: STYLES.template.color.icon, palette: "template" };
    }
    if (props.type === "projects") {
      return { icon: "entity", color: STYLES.entity.color.icon, palette: "entity" };
    }
    const { name, color } = getValueTypeIconProps(item.type);
    return { icon: name, color, palette: color.split(".")[0] };
  };
  const navigatorLabel = props.type === "entities" ? "Attributes" : props.type === "projects" ? "Entities" : "Values";
  const NAVIGATOR_PREVIEW_COUNT = 2;

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
                <Flex direction={"column"} gap={"0.5"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                    {navigatorLabel}
                  </Text>
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
              </HoverCard.Content>
            </HoverCard.Positioner>
          </Portal>
        </HoverCard.Root>
      )}
    </Tooltip>
  );
};

export default Linky;
