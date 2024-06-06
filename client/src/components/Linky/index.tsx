// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Link, Skeleton, Text, Tooltip } from "@chakra-ui/react";

// Existing and custom types
import { LinkyProps } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { getData } from "@database/functions";
import _ from "lodash";

const Linky = (props: LinkyProps) => {
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [linkLabel, setLinkLabel] = useState("Invalid");
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    getData(`/${props.type}/${props.id}`)
      .then((value) => {
        setLinkLabel(value.name);
        if (_.isEqual(props.type, "entities")) {
          setShowDeleted(value.deleted);
        }
      })
      .catch((_error) => {
        if (props.fallback) {
          setLinkLabel(props.fallback);
        }
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, [props.id]);

  const onClickHandler = () => {
    if (isLoaded && !props.fallback) navigate(`/${props.type}/${props.id}`);
  };

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
