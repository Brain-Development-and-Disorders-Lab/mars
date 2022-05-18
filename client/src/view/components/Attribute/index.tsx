import React, { useState } from "react";

import { Box, Select, TextInput } from "grommet";
import { AttributeProps } from "types";

const VALID_TYPES = ["number", "file", "url", "date", "string"];

const Attribute = (props: AttributeProps) => {
  const [name, setName] = useState(props.name);
  const [type, setType] = useState(props.type);
  const [data, setData] = useState(props.data);

  return (
    <Box direction="row" gap="small">
      <Box width="medium">
        <TextInput
          width="small"
          placeholder="Attribute name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Box>
      <Select
        options={VALID_TYPES}
        value={type}
        onChange={({ option }) => setType(option)}
      />
      <TextInput
        width="small"

        placeholder={"Value"}
        value={data}
        onChange={(event) => setData(event.target.value)}
      />
    </Box>
  );
}

export default Attribute;
