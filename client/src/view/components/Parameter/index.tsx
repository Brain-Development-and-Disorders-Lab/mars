import {
  Box,
  Button,
  Heading,
  Paragraph,
  Select,
  TextArea,
  TextInput,
} from "grommet";
import { Add, Save, SettingsOption, StatusDisabled } from "grommet-icons";

import React, { useState } from "react";
import { ParameterProps } from "types";

const validTypes = ["sample", "number", "data"];

const Parameter = (props: ParameterProps) => {
  const [name, setName] = useState(props.name);
  const [type, setType] = useState(props.type);
  const [description, setDescription] = useState(props.description);
  const [finished, setFinished] = useState(false);

  const parameterData: ParameterProps = {
    identifier: props.identifier,
    name: name,
    type: type,
    description: description,
  };

  return (
    <Box
      direction="row"
      align="center"
      gap="small"
      pad="small"
      background="light-1"
      round
    >
      <SettingsOption />
      <Box direction="column" margin="small" gap="small" width="medium">
        <TextInput
          placeholder={"Parameter Name"}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={finished}
        />
        <Select
          placeholder="Type"
          options={validTypes}
          value={type}
          width="auto"
          onChange={({ option }) => setType(option)}
          disabled={finished}
        />
        <TextArea
          value={description}
          placeholder={"Parameter description"}
          onChange={(event) => setDescription(event.target.value)}
          disabled={finished}
        />
      </Box>
      <Box direction="column" margin="small" gap="small" align="center" fill>
        <Heading level="4" margin="xsmall">
          Blocks
        </Heading>
        <Paragraph>Placeholder for the `block` system of attributes.</Paragraph>
        <Box width="small">
          <Button
            icon={<Add />}
            label="Add block"
            primary
            disabled={finished}
          />
        </Box>
      </Box>
      <Box direction="column" width="small" gap="small">
        <Button
          label="Save"
          color="green"
          icon={<Save />}
          onClick={() => {
            setFinished(true);
            if (props.dataCallback) {
              props.dataCallback(parameterData);
            }
          }}
          reverse
          disabled={finished}
        />
        <Button
          color="red"
          label="Remove"
          onClick={() => {
            if (props.removeCallback) {
              props.removeCallback(props.identifier);
            }
          }}
          icon={<StatusDisabled />}
          reverse
          disabled={finished}
        />
      </Box>
    </Box>
  );
};

export default Parameter;
