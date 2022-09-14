// React and Grommet
import React, { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Select,
  TextArea,
  TextInput,
} from "grommet/components";
import { Add, Save, SettingsOption, StatusDisabled } from "grommet-icons";

// Types
import { ParameterStruct, AttributeProps } from "types";

// Custom components
import ParameterGroup from "src/view/components/ParameterGroup";

// Constants
const VALID_TYPES = ["physical", "digital"];

const Attribute = (props: AttributeProps) => {
  const [name, setName] = useState(props.name);
  const [type, setType] = useState(props.type);
  const [description, setDescription] = useState(props.description);
  const [parameters, setParameters] = useState(props.parameters);
  const [finished, setFinished] = useState(false);

  const attributeData: AttributeProps = {
    identifier: props.identifier,
    name: name,
    type: type,
    description: description,
    parameters: parameters,
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
          placeholder={"Attribute Name"}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={finished}
        />
        <Select
          placeholder="Type"
          options={VALID_TYPES}
          value={type}
          width="auto"
          onChange={({ option }) => setType(option)}
          disabled={finished}
        />
        <TextArea
          value={description}
          placeholder={"Attribute description"}
          onChange={(event) => setDescription(event.target.value)}
          disabled={finished}
        />
      </Box>
      <Box
        direction="column"
        margin="small"
        gap="small"
        pad="small"
        color="light-2"
        align="center"
        fill
        round
        border
      >
        <Box direction="row" align="center">
          <Heading level="4" margin="xsmall">
            Parameters
          </Heading>
          <Button
            icon={<Add />}
            label="Create new Parameter"
            primary
            onClick={() => {
              // Create a unique identifier
              const identifier = `attribute_${Math.round(performance.now())}`;

              // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
              setParameters([
                ...parameters,
                {
                  identifier: identifier,
                  name: "",
                  type: "string",
                  data: "",
                },
              ]);
            }}
            disabled={finished}
          />
        </Box>
        <Box direction="column" gap="small" margin="small" fill>
          <ParameterGroup
            parameters={parameters}
            disabled={finished}
            onDataUpdate={(data: ParameterStruct) => {
              // Store the received Parameter information
              // Get the relevant Parameter
              setParameters(
                parameters.filter((parameter) => {
                  if (parameter.identifier === data.identifier) {
                    parameter.name = data.name;
                    parameter.type = data.type;
                    parameter.data = data.data;
                  }
                  return parameter;
                })
              );
            }}
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
              props.dataCallback(attributeData);
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
        />
      </Box>
    </Box>
  );
};

export default Attribute;
