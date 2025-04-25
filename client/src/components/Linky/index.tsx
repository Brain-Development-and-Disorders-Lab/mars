// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Link, SkeletonText } from "@chakra-ui/react";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { IGenericItem, LinkyProps } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";
import { gql, useLazyQuery } from "@apollo/client";

const DEFAULT_LINKY_LABEL_LENGTH = 20; // Default number of shown characters

const Linky = (props: LinkyProps) => {
  const navigate = useNavigate();

  // Component state
  const [linkLabel, setLinkLabel] = useState("Invalid");
  const [tooltipLabel, setTooltipLabel] = useState("Default");
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
  const [getEntity, { loading: loadingEntity }] = useLazyQuery(GET_ENTITY);

  const GET_PROJECT = gql`
    query GetProject($_id: String) {
      project(_id: $_id) {
        _id
        name
      }
    }
  `;
  const [getProject, { loading: loadingProject }] = useLazyQuery(GET_PROJECT);

  const GET_TEMPLATE = gql`
    query GetTemplate($_id: String) {
      template(_id: $_id) {
        _id
        name
      }
    }
  `;
  const [getTemplate, { loading: loadingTemplate }] =
    useLazyQuery(GET_TEMPLATE);

  /**
   * Utility function to retrieve data of link target
   */
  const getLinkyData = async () => {
    const data: IGenericItem = {
      _id: props.id,
      name: props.fallback || "Invalid",
    };

    if (props.type === "templates") {
      const response = await getTemplate({ variables: { _id: props.id } });
      if (response.error || _.isUndefined(response.data)) {
        setShowDeleted(true);
        setTooltipLabel("Deleted or Private");
      } else {
        data.name = response.data.template.name;
        setTooltipLabel(data.name);
      }
    } else if (props.type === "entities") {
      const response = await getEntity({ variables: { _id: props.id } });
      if (response.error || _.isUndefined(response.data)) {
        setShowDeleted(true);
        setTooltipLabel("Deleted or Private");
      } else {
        data.name = response.data.entity.name;
        setTooltipLabel(data.name);
      }
    } else if (props.type === "projects") {
      const response = await getProject({ variables: { _id: props.id } });
      if (response.error || _.isUndefined(response.data)) {
        setShowDeleted(true);
        setTooltipLabel("Deleted or Private");
      } else {
        data.name = response.data.project.name;
        setTooltipLabel(data.name);
      }
    }

    // Set the label text and apply truncating where specified
    if (props.truncate === false) {
      // Do not truncate the label text
      setLinkLabel(data.name);
    } else if (_.isNumber(props.truncate)) {
      // Truncate the label text to the specified length
      setLinkLabel(_.truncate(data.name, { length: props.truncate }));
    } else {
      // Truncate the label text to a default length
      setLinkLabel(
        _.truncate(data.name, { length: DEFAULT_LINKY_LABEL_LENGTH }),
      );
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

  return (
    <Tooltip showArrow content={tooltipLabel}>
      <SkeletonText
        noOfLines={1}
        loading={loadingTemplate || loadingEntity || loadingProject}
        w={"150px"}
      >
        <Link
          onClick={onClickHandler}
          fontWeight={"semibold"}
          color={showDeleted ? "gray.400" : "black"}
          fontSize={props.size ? props.size : ""}
        >
          {linkLabel}
        </Link>
      </SkeletonText>
    </Tooltip>
  );
};

export default Linky;
