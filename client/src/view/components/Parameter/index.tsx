import { Box, Form, FormField, Select, Text, TextArea, TextInput } from "grommet";

import React, { useState } from "react";
import { ParameterProps } from "types";

const validTypes = ["sample", "number", "data"];

const Parameter = (props: ParameterProps) => {
  const [name, setName] = useState(props.name);
  const [type, setType] = useState(props.type);
  const [description, setDescription] = useState(props.description);

  const parameterData: ParameterProps = {
    name: name,
    type: type,
    description: description,
  };
  console.debug("Parameter data:", parameterData);

  return (
    <Form
      onSubmit={() => {
      }}
    >
      <FormField>
        <TextInput
          placeholder={"Parameter Name"}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>
      <FormField>
        <Select
          placeholder="Type"
          options={validTypes}
          value={props.type}
          width="auto"
          onChange={({ option }) => setType(option)}
        />
      </FormField>
      <FormField>
        <TextArea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </FormField>
      <Box direction="row" align="center" gap="small">
        <Text>Parameter:</Text>
      </Box>
    </Form>
    
  );
};

export default Parameter;
