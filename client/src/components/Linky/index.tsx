// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Link, Skeleton, Text, Tooltip } from "@chakra-ui/react";

// Existing and custom types
import { IGenericItem, LinkyProps } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";
import { gql, useLazyQuery } from "@apollo/client";

const Linky = (props: LinkyProps) => {
  const navigate = useNavigate();

  // Component state
  const [linkLabel, setLinkLabel] = useState("Invalid");
  const [showDeleted, setShowDeleted] = useState(false);

  // GraphQL operations
  const GET_ENTITY = gql`
    query GetEntity($_id: String) {
      entity(_id: $_id) {
        _id
        name
        deleted
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

  const GET_ATTRIBUTE = gql`
    query GetAttribute($_id: String) {
      attribute(_id: $_id) {
        _id
        name
      }
    }
  `;
  const [getAttribute, { loading: loadingAttribute }] =
    useLazyQuery(GET_ATTRIBUTE);

  /**
   * Utility function to retrieve data of link target
   */
  const getLinkyData = async () => {
    let data: IGenericItem = {
      _id: props.id,
      name: props.fallback || "Invalid",
    };

    if (props.type === "attributes") {
      const response = await getAttribute({ variables: { _id: props.id } });
      if (_.isNull(response.data.attribute)) {
        setShowDeleted(true);
      } else {
        data.name = response.data.attribute.name;
      }
    } else if (props.type === "entities") {
      const response = await getEntity({ variables: { _id: props.id } });
      if (_.isNull(response.data.entity)) {
        setShowDeleted(true);
      } else {
        data.name = response.data.entity.name;
      }
    } else if (props.type === "projects") {
      const response = await getProject({ variables: { _id: props.id } });
      if (_.isNull(response.data.project)) {
        setShowDeleted(true);
      } else {
        data.name = response.data.project.name;
      }
    }

    setLinkLabel(data.name);
  };

  const onClickHandler = () => {
    if (
      !showDeleted &&
      !loadingAttribute &&
      !loadingEntity &&
      !loadingProject
    ) {
      navigate(`/${props.type}/${props.id}`);
    }
  };

  useEffect(() => {
    getLinkyData();
  }, [props.id]);

  return (
    <Tooltip label={showDeleted ? "Deleted" : "View"}>
      <Button
        variant={"link"}
        color={props.color ? props.color : "gray.700"}
        justifyContent={props.justify ? props.justify : "center"}
        as={Link}
        onClick={onClickHandler}
      >
        <Skeleton
          isLoaded={!loadingAttribute && !loadingEntity && !loadingProject}
        >
          <Text as={showDeleted ? "s" : "p"}>
            {_.truncate(linkLabel, { length: 10 })}
          </Text>
        </Skeleton>
      </Button>
    </Tooltip>
  );
};

export default Linky;
