import React from "react";

import { Box, Text } from "grommet";

import { AttributeGroupProps } from "types";
import Attribute from "../Attribute";

const AttributeGroup = (props: AttributeGroupProps) => {
  return (
    <Box gap="small">
      {props.attributes.length > 0 ? (
        // Extract and return only components
        props.attributes.map((attribute) => {
          return (
            <Attribute
              key={attribute.identifier}
              identifier={attribute.identifier}
              name={attribute.name}
              type={attribute.type}
              data={attribute.data}
              removeCallback={props.onRemove}
              dataCallback={props.onDataUpdate}
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
