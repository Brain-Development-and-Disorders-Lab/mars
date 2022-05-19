import React, { useEffect, useState } from "react";

import { Box, DateInput, FileInput, Select, Text, TextInput } from "grommet";
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
  }, [data]);

  let dataElement = (
    <Text>Data:</Text>
  );

  // Set the data input field depending on the selected type
  if (type === "file") {
    // File input
    dataElement = (
      <FileInput
        name="file"
        onChange={event => {
          const fileList = event.target.files;
          if (fileList) {
            for (let i = 0; i < fileList.length; i += 1) {
              const file = fileList[i];
              console.debug("File:", file);
            }
          }
        }}
      />
    )
  } else if (type === "date") {
    // Date picker
    dataElement = (
      <DateInput
        name="date"
        format="mm/dd/yyyy"
        value={data as string}
        onChange={({ value }) => setData(value.toString())}
      />
    );
  } else {
    // Basic data is displayed as-is
    dataElement = (
      <TextInput
        name="data"
        value={data as string | number}
        onChange={(event) => setData(event.target.value)}
      />
    );
  }

  return (
    <Box direction="row" gap="small" align="center">
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
      {dataElement}
    </Box>
  );
};

export default Attribute;
