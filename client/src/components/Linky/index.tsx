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
      as={Link}
      href={`/${props.type}/${props.id}`}
    >
      {linkData.name}
    </Button>
  );
};

export default Linky;
