// React and Grommet
import React from "react";
import { Box, Text } from "grommet/components";

// Types
import { ParameterGroupProps } from "types";

// Custom components
import Parameter from "src/view/components/Parameter";

const ParameterGroup = (props: ParameterGroupProps) => {
  return (
    <Box gap="small" align="center">
      {props.parameters.length > 0 ? (
        // Extract and return only components
        props.parameters.map((parameter) => {
          return (
            <Parameter
              key={parameter.identifier}
              identifier={parameter.identifier}
              name={parameter.name}
              type={parameter.type}
              data={parameter.data}
              removeCallback={props.onRemove}
              dataCallback={props.onDataUpdate}
              disabled={props.disabled}
            />
          );
        })
      ) : (
        <Text>No Parameters have been added yet.</Text>
      )}
    </Box>
  );
};

export default ParameterGroup;
