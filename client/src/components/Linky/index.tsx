// React and Grommet
import React, { useEffect, useState } from "react";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/database/functions";
import {
  LinkyProps,
  AttributeStruct,
  CollectionStruct,
  EntityStruct,
} from "types";
import { Button, useToast } from "@chakra-ui/react";

const Linky = (props: LinkyProps) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [linkData, setLinkData] = useState(
    {} as AttributeStruct | CollectionStruct | EntityStruct
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
      color={"gray.600"}
      onClick={() => navigate(`/${props.type}/${props.id}`)}
    >
      {linkData.name}
    </Button>
  );
};

export default Linky;
