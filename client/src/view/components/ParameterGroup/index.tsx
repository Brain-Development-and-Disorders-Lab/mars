import React from "react";

import { Box, Text } from "grommet";

import { ParameterGroupProps } from "types";
import Parameter from "../Parameter";

const ParameterGroup = (props: ParameterGroupProps) => {
  return (
    <Box gap="small">
      {props.parameters.length > 0 ?
        // Extract and return only components
        props.parameters.map((parameter) => {
          return (
            <Parameter
              key={parameter._id}
              identifier={parameter._id}
              name={parameter.name}
              description={parameter.description}
              type={parameter.type}
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
