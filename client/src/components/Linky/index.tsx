// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Link, Spinner } from "@chakra-ui/react";

// Existing and custom types
import { LinkyProps } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { getData } from "@database/functions";

const Linky = (props: LinkyProps) => {
  const navigate = useNavigate();

  const [linkIsValid, setLinkIsValid] = useState(false);
  const [linkLabel, setLinkLabel] = useState("Invalid");

  useEffect(() => {
    getData(`/${props.type}/${props.id}`)
      .then((value) => {
        setLinkIsValid(true);
        setLinkLabel(value.name);
      })
      .catch((_error) => {
        setLinkIsValid(false);
        if (props.fallback) {
          setLinkLabel(props.fallback);
        }
      });
  }, []);

  const onClickHandler = () => {
    if (linkIsValid) navigate(`/${props.type}/${props.id}`);
  };

  return (
    <Button
      variant={"link"}
      color={props.color ? props.color : "gray.700"}
      as={Link}
      onClick={onClickHandler}
    >
      {linkIsValid ? linkLabel : <Spinner size={"sm"} />}
    </Button>
  );
};

export default Linky;
