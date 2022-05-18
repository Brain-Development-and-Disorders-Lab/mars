import React from "react";

import { Box, Text } from "grommet";

import { ParameterGroupProps } from "types";
import Parameter from "../Parameter";

const ParameterGroup = (props: ParameterGroupProps) => {
  return (
    <Box gap="small">
      {props.parameters.length > 0 ?
        // Extract and return only components
        props.parameters.map((value) => {
          return (
            <Parameter
              key={value.identifier}
              identifier={value.identifier}
              name=""
              description=""
              type="data"
              dataCallback={() => {}}
              removeCallback={props.onRemove}
            />
          );
        })
      :
        <Text>No parameters have been added yet.</Text>
      }
    </Box>
  );
};

export default ParameterGroup;
