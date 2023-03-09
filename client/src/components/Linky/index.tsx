import React, { useEffect, useState } from "react";
import { Button, Link, useToast } from "@chakra-ui/react";

// Database and models
import { getData } from "@database/functions";
import {
  LinkyProps,
  Attribute,
  Collection,
  Entity,
} from "@types";

const Linky = (props: LinkyProps) => {
  const toast = useToast();

  const [linkData, setLinkData] = useState(
    {} as Attribute | Collection | Entity
  );

  useEffect(() => {
    getData(`/${props.type}/${props.id}`).then((value) => {
      setLinkData(value);
    }).catch((_error) => {
      toast({
        title: "Link Error",
        status: "error",
        description: "Could not retrieve information for Link.",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    });
  }, []);

  return (
    <Button
      variant={"link"}
      color={props.color ? props.color : "gray.600"}
      as={Link}
      href={`/${props.type}/${props.id}`}
    >
      {linkData.name}
    </Button>
  );
};

export default Linky;
