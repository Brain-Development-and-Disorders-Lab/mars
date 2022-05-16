import { Heading } from "grommet";

import React from "react";
import { useParams } from "react-router-dom";

export const Sample = () => {
  const { id } = useParams();

  return (
    <Heading level="2">Sample {id}</Heading>
  );
}

export default Sample;
