import React, { useEffect, useState } from "react";
import { Button, Link, Spinner } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "@database/functions";
import {
  LinkyProps
} from "@types";

const Linky = (props: LinkyProps) => {
  const navigate = useNavigate();

  const [linkIsValid, setLinkIsValid] = useState(false);
  const [linkLabel, setLinkLabel] = useState("Invalid");

  useEffect(() => {
    getData(`/${props.type}/${props.id}`).then((value) => {
      setLinkIsValid(true);
      setLinkLabel(value.name);
    }).catch((_error) => {
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
      {linkIsValid ? linkLabel : <Spinner size={"sm"}/>}
    </Button>
  );
};

export default Linky;
