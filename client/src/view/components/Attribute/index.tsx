import React from "react";

import { Box, Text } from "grommet";
import { AttributeProps } from "types";

const Attribute = (props: AttributeProps) => {
  return (
    <Box direction="row">
      <Text>{props.name}</Text>
      <Text>{props.type}</Text>
      <Text>{props.data}</Text>
    </Box>
  );
}

export default Attribute;
