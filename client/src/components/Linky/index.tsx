// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, HoverCard, Portal, Separator, Skeleton, Tag, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { IconNames, IGenericItem, LinkyProps } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";

// Variables
import { GLOBAL_STYLES } from "@variables";

const DEFAULT_LINKY_LABEL_LENGTH = 20; // Default number of shown characters

/**
 * Utility to get the icon name, badge background, border, and icon color
 * for each Linky type
 */
const getTypeStyle = (
  type: "entities" | "projects" | "templates",
): { icon: IconNames; badgeBg: string; badgeBorder: string; iconColor: string } => {
  if (type === "projects") {
    return { icon: "project", badgeBg: "blue.50", badgeBorder: "blue.100", iconColor: GLOBAL_STYLES.project.iconColor };
  } else if (type === "templates") {
    return {
      icon: "template",
      badgeBg: "teal.50",
      badgeBorder: "teal.100",
      iconColor: GLOBAL_STYLES.template.iconColor,
    };
  }
  // entities
  return { icon: "entity", badgeBg: "purple.50", badgeBorder: "purple.100", iconColor: GLOBAL_STYLES.entity.iconColor };
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
  const [navigatorCount, setNavigatorCount] = useState(0);

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
        }
      }
    }
  `;
  const [getEntity, { loading: loadingEntity }] = useLazyQuery<{
    entity: IGenericItem & { archived: boolean; description: string; attributes: { _id: string }[] };
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
    }
  `;
  const [getProject, { loading: loadingProject }] = useLazyQuery<{
    project: IGenericItem & { archived: boolean; description: string; entities: string[] };
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
        }
      }
    }
  `;
  const [getTemplate, { loading: loadingTemplate }] = useLazyQuery<{
    template: IGenericItem & { archived: boolean; description: string; values: { _id: string }[] };
  }>(GET_TEMPLATE);

  /**
   * Utility function to retrieve data of link target
   */
  const getLinkyData = async () => {
    // If id is empty or missing, just use fallback without making a query
    if (!props.id || props.id.trim() === "") {
      const fallbackName = props.fallback || "Invalid Link";
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
      name: props.fallback || "Invalid Link",
      description: "",
    };

    try {
      if (props.type === "templates") {
        const response = await getTemplate({ variables: { _id: props.id } });
        if (response.error || _.isUndefined(response.data)) {
          setShowDeleted(true);
          setTooltipLabel("Error accessing Template");
        } else {
          data.name = response.data.template.name;
          setTooltipLabel(data.name);
          setShowArchived(response.data.template.archived);
          setNavigatorDescription(response.data.template.description);
          setNavigatorCount(response.data.template.values.length);
        }
      } else if (props.type === "entities") {
        const response = await getEntity({ variables: { _id: props.id } });
        if (response.error || _.isUndefined(response.data)) {
          setShowDeleted(true);
          setTooltipLabel("Error accessing Entity");
        } else {
          data.name = response.data.entity.name;
          setTooltipLabel(data.name);
          setShowArchived(response.data.entity.archived);
          setNavigatorDescription(response.data.entity.description);
          setNavigatorCount(response.data.entity.attributes.length);
        }
      } else if (props.type === "projects") {
        const response = await getProject({ variables: { _id: props.id } });
        if (response.error || _.isUndefined(response.data)) {
          setShowDeleted(true);
          setTooltipLabel("Error accessing Project");
        } else {
          data.name = response.data.project.name;
          setTooltipLabel(data.name);
          setShowArchived(response.data.project.archived);
          setNavigatorDescription(response.data.project.description);
          setNavigatorCount(response.data.project.entities.length);
        }
      }
    } catch (error) {
      // If query fails completely, use fallback
      setShowDeleted(true);
      setTooltipLabel("Invalid Link");
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
          border={GLOBAL_STYLES.border.style}
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
            bg={"orange.50"}
            px={"1.5"}
            h={"100%"}
            borderRight={"1px solid"}
            borderColor={"orange.200"}
          >
            <Icon name={"warning"} size={"xs"} color={"orange.500"} />
          </Flex>
          {/* Deleted label */}
          <Flex px={"2"} align={"center"} h={"100%"} bg={"white"}>
            <Text fontSize={"xs"} fontWeight={"medium"} color={"gray.500"}>
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
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
              rounded={"md"}
              overflow={"hidden"}
              cursor={"pointer"}
              onClick={() => setShowNavigator(!showNavigator)}
              flexShrink={0}
              _hover={{
                borderColor: "blue.300",
                boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
              }}
            >
              {/* Type icon badge */}
              <Flex
                align={"center"}
                justify={"center"}
                bg={badgeBg}
                px={"1.5"}
                h={"100%"}
                borderRight={"1px solid"}
                borderColor={badgeBorder}
              >
                <Icon name={icon} size={"xs"} color={iconColor} />
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
                  bg={"gray.50"}
                  px={"1.5"}
                  h={"100%"}
                  borderLeft={"1px solid"}
                  borderColor={"gray.100"}
                >
                  <Icon name={"archive"} size={"xs"} color={"gray.500"} />
                </Flex>
              )}
            </Flex>
          </HoverCard.Trigger>
          <Portal>
            <HoverCard.Positioner>
              <HoverCard.Content p={"3"} gap={"2"} w={"xs"}>
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
                </Flex>

                <Separator />

                {/* Description */}
                <Flex direction={"column"} gap={"0.5"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                    Description
                  </Text>
                  <Text
                    fontSize={"xs"}
                    color={navigatorDescription ? "gray.700" : "gray.400"}
                    fontStyle={navigatorDescription ? "normal" : "italic"}
                    lineClamp={3}
                  >
                    {navigatorDescription || "No description provided"}
                  </Text>
                </Flex>

                {/* Count */}
                <Flex direction={"column"} gap={"0.5"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
                    {props.type === "entities" ? "Attributes" : props.type === "projects" ? "Entities" : "Values"}
                  </Text>
                  <Flex>
                    <Tag.Root colorPalette={navigatorCount > 0 ? "green" : "orange"} size={"sm"}>
                      <Tag.Label fontSize={"xs"}>{navigatorCount}</Tag.Label>
                    </Tag.Root>
                  </Flex>
                </Flex>

                <Flex justify={"flex-end"}>
                  <Button size={"xs"} rounded={"md"} onClick={onClickHandler} colorPalette={"blue"}>
                    View
                    <Icon name={"a_right"} size={"xs"} />
                  </Button>
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
