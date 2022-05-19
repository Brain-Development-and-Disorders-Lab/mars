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
              key={attribute._id}
              identifier={attribute._id}
              name={attribute.name}
              description={attribute.description}
              type={attribute.type}
              removeCallback={props.onRemove}
              dataCallback={props.onDataUpdate}
              blocks={attribute.blocks}
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
