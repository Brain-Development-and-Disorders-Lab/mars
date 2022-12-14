import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Button, useToast } from "@chakra-ui/react";

// Database and models
import { getData } from "src/database/functions";
import {
  LinkyProps,
  AttributeStruct,
  CollectionStruct,
  EntityStruct,
} from "types";

const Linky = (props: LinkyProps) => {
  const toast = useToast();

  const [linkData, setLinkData] = useState({} as AttributeStruct | CollectionStruct | EntityStruct);

  useEffect(() => {
    const data = getData(`/${props.type}/${props.id}`);

    // Handle the response from the database
    data.then((value) => {
      setLinkData(value);

      // Check the contents of the response
      if (value["error"] !== undefined) {
        toast({
          title: "Database Error",
          description: value["error"],
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
    });
    return;
  }, []);

  return (
    <Button
      variant={"link"}
      color={props.color ? props.color : "gray.600"}
      as={RouterLink}
      to={`/${props.type}/${props.id}`}
    >
      {linkData.name}
    </Button>
  );
};

export default Linky;
