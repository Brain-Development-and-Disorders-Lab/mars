// React and Grommet
import React from "react";
import { Box, Text } from "grommet/components";

// Types
import { AttributeGroupProps } from "types";

// Custom components
import Attribute from "src/components/Attribute";

const AttributeGroup = (props: AttributeGroupProps) => {
  return (
    <Box gap="small">
      {props.attributes.length > 0 ? (
        // Extract and return only components
        props.attributes.map((attribute) => {
          return (
            <Attribute
              key={attribute._id}
              identifier={attribute._id}
              name={attribute.name}
              description={attribute.description}
              type={attribute.type}
              removeCallback={props.onRemove}
              dataCallback={props.onDataUpdate}
              parameters={attribute.parameters}
            />
          );
        })
      ) : (
        <Text>No attributes have been added yet.</Text>
      )}
    </Box>
  );
};

export default AttributeGroup;
