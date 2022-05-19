import React from "react";

import { Box, Text } from "grommet";

import { BlockGroupProps } from "types";
import Block from "../Block";

const BlockGroup = (props: BlockGroupProps) => {
  return (
    <Box gap="small" align="center">
      {props.blocks.length > 0 ? (
        // Extract and return only components
        props.blocks.map((block) => {
          return (
            <Block
              key={block.identifier}
              identifier={block.identifier}
              name={block.name}
              type={block.type}
              data={block.data}
              removeCallback={props.onRemove}
              dataCallback={props.onDataUpdate}
              disabled={props.disabled}
            />
          );
        })
      ) : (
        <Text>No blocks have been added yet.</Text>
      )}
    </Box>
  );
};

export default BlockGroup;
