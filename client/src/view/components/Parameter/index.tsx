import { Box, Select, Text, TextInput } from "grommet";

import React, { useState } from "react";
import { ParameterProps } from "types";

const validTypes = ["sample", "number", "data"];

const Parameter = (props: ParameterProps) => {
  const [name, setName] = useState(props.name);

  return (
    <Box direction="row" align="center" gap="small">
      <Text>Parameter:</Text>
      <TextInput placeholder={"Parameter Name"} value={name} onChange={(event) => setName(event.target.value)} disabled/>
      <Select
        placeholder="Type"
        options={validTypes}
        value={props.type}
        width="auto"
        disabled
      />
      <>
        {props.attributes &&
          props.attributes.map((attribute) => {
            return (
              <>
                <Text>{attribute.name}:</Text>
                <TextInput
                  placeholder="Define value"
                />
              </>
            );
          })
        }
      </>
    </Box>
  );
};

export default Parameter;
