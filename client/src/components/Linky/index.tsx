// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Link, Skeleton, Text, Tooltip } from "@chakra-ui/react";

// Existing and custom types
import { AttributeModel, EntityModel, LinkyProps, ProjectModel } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { request } from "@database/functions";
import _ from "lodash";

const Linky = (props: LinkyProps) => {
  const navigate = useNavigate();

  // Component state
  const [isLoaded, setIsLoaded] = useState(false);
  const [linkLabel, setLinkLabel] = useState("Invalid");
  const [showDeleted, setShowDeleted] = useState(false);

  /**
   * Utility function to retrieve data of link target
   */
  const getLinkyData = async () => {
    const response = await request<EntityModel | AttributeModel | ProjectModel>(
      "GET",
      `/${props.type}/${props.id}`,
    );
    if (response.success) {
      setLinkLabel(response.data.name);
      if (_.isEqual(props.type, "entities")) {
        // We can be confident the response data `EntityModel`
        setShowDeleted((response.data as EntityModel).deleted);
      }
    } else {
      if (props.fallback) {
        setLinkLabel(props.fallback);
      }
    }
    setIsLoaded(true);
  };

  const onClickHandler = () => {
    if (isLoaded && !props.fallback) navigate(`/${props.type}/${props.id}`);
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
        <Skeleton isLoaded={isLoaded}>
          <Text as={showDeleted ? "s" : "p"}>
            {_.truncate(linkLabel, { length: 20 })}
          </Text>
        </Skeleton>
      </Button>
    </Tooltip>
  );
};

export default Linky;
