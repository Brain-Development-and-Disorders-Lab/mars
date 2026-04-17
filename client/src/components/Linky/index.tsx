// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Flex, Skeleton, Text } from "@chakra-ui/react";
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

  // GraphQL operations
  const GET_ENTITY = gql`
    query GetEntity($_id: String) {
      entity(_id: $_id) {
        _id
        name
        archived
      }
    }
  `;
  const [getEntity, { loading: loadingEntity }] = useLazyQuery<{
    entity: IGenericItem & { archived: boolean };
  }>(GET_ENTITY);

  const GET_PROJECT = gql`
    query GetProject($_id: String) {
      project(_id: $_id) {
        _id
        name
        archived
      }
    }
  `;
  const [getProject, { loading: loadingProject }] = useLazyQuery<{
    project: IGenericItem & { archived: boolean };
  }>(GET_PROJECT);

  const GET_TEMPLATE = gql`
    query GetTemplate($_id: String) {
      template(_id: $_id) {
        _id
        name
        archived
      }
    }
  `;
  const [getTemplate, { loading: loadingTemplate }] = useLazyQuery<{
    template: IGenericItem & { archived: boolean };
  }>(GET_TEMPLATE);

  /**
   * Utility function to retrieve data of link target
   */
  const getLinkyData = async () => {
    // If id is empty or missing, just use fallback without making a query
    if (!props.id || props.id.trim() === "") {
      const fallbackName = props.fallback || "Invalid Name";
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

    const data: IGenericItem = {
      _id: props.id,
      name: props.fallback || "Invalid Name",
    };

    try {
      if (props.type === "templates") {
        const response = await getTemplate({ variables: { _id: props.id } });
        if (response.error || _.isUndefined(response.data)) {
          setShowDeleted(true);
          setTooltipLabel("Deleted or Private");
        } else {
          data.name = response.data.template.name;
          setTooltipLabel(data.name);
          setShowArchived(response.data.template.archived);
        }
      } else if (props.type === "entities") {
        const response = await getEntity({ variables: { _id: props.id } });
        if (response.error || _.isUndefined(response.data)) {
          setShowDeleted(true);
          setTooltipLabel("Deleted or Private");
        } else {
          data.name = response.data.entity.name;
          setTooltipLabel(data.name);
          setShowArchived(response.data.entity.archived);
        }
      } else if (props.type === "projects") {
        const response = await getProject({ variables: { _id: props.id } });
        if (response.error || _.isUndefined(response.data)) {
          setShowDeleted(true);
          setTooltipLabel("Deleted or Private");
        } else {
          data.name = response.data.project.name;
          setTooltipLabel(data.name);
          setShowArchived(response.data.project.archived);
        }
      }
    } catch (error) {
      // If query fails completely, use fallback
      setShowDeleted(true);
      setTooltipLabel("Deleted or Private");
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
          onClick={onClickHandler}
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
      )}
    </Tooltip>
  );
};

export default Linky;
