import React, { useEffect, useState } from "react";

import { Box, Select, TextInput } from "grommet";
import { AttributeProps, AttributeStruct } from "types";

const VALID_TYPES = ["number", "file", "url", "date", "string"];

const Attribute = (props: AttributeProps) => {
  const [name, setName] = useState(props.name);
  const [type, setType] = useState(props.type);
  const [data, setData] = useState(props.data);

  const attributeData: AttributeStruct = {
    identifier: props.identifier,
    name: name,
    type: type,
    data: data,
  };

  const updateData = () => {
    if (props.dataCallback) {
      props.dataCallback(attributeData);
    }
  };

  useEffect(() => {
    updateData();
  }, [name, type, data])

  return (
    <Box direction="row" gap="small">
      <Box width="medium">
        <TextInput
          width="small"
          placeholder="Attribute name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          disabled={props.disabled}
        />
      </Box>
      <Select
        options={VALID_TYPES}
        value={type}
        onChange={({ option }) => {
          setType(option);
        }}
        disabled={props.disabled}
      />
      <TextInput
        width="small"
        placeholder={"Value"}
        value={data}
        onChange={(event) => {
          setData(event.target.value);
        }}
        disabled={props.disabled}
      />
    </Box>
  );
}

export default Attribute;
