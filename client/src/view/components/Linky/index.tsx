// React and Grommet
import React, { useEffect, useState } from "react";
import { Button } from "grommet/components";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import {
  LinkyProps,
  AttributeStruct,
  CollectionStruct,
  EntityStruct,
} from "types";

// Custom components
import ErrorLayer from "../ErrorLayer";

const Linky = (props: LinkyProps) => {
  const navigate = useNavigate();

  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

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
        setErrorMessage(value["error"]);
        setIsError(true);
      }
    });
    return;
  }, []);

  return (
    <>
      <Button
        label={linkData.name}
        color="dark-2"
        onClick={() => navigate(`/${props.type}/${props.id}`)}
        margin={{ left: "small", right: "small" }}
      />
      {isError && <ErrorLayer message={errorMessage} />}
    </>
  );
};

export default Linky;