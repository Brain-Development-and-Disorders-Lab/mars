// React and Grommet
import React, { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  TextArea,
  TextInput,
} from "grommet/components";
import { Add, Close, Save, SettingsOption } from "grommet-icons";

// Types
import { ParameterStruct, AttributeProps } from "types";
import Parameter from "../Parameter";

// Constants
const Attribute = (props: AttributeProps) => {
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description);
  const [parameters, setParameters] = useState(props.parameters);
  const [finished, setFinished] = useState(false);

  const attributeData: AttributeProps = {
    identifier: props.identifier,
    name: name,
    description: description,
    parameters: parameters,
  };

  const onUpdate = (data: ParameterStruct) => {
    // Store the received Parameter information
    // Get the relevant Parameter
    setParameters(parameters.filter((parameter) => {
      if (parameter.identifier === data.identifier) {
        parameter.name = data.name;
        parameter.type = data.type;
        parameter.data = data.data;
      }
      return parameter;
    }));
  };

  const onRemove = (identifier: string) => {
    setParameters(parameters.filter((parameter) => {
      return parameter.identifier !== identifier;
    }));
  };

  return (
    <Box
      direction="row"
      align="center"
      gap="small"
      pad="small"
      background="light-1"
      round
      fill
    >
      <SettingsOption />
      <Box direction="column" margin="small" gap="small" width="medium">
        <TextInput
          placeholder={"Attribute Name"}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={finished}
          required
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
        align="center"
        fill
      >
        <Box direction="row" align="center" justify="between" fill>
          <Heading level="4" margin="xsmall">
            Parameters
          </Heading>
          <Button
            icon={<Add />}
            label="Add a Parameter"
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
        <Box direction="column" gap="small" margin="small" align="center">
          {parameters.length > 0 ?
            parameters.map((parameter) => {
              return (
                <Parameter
                  identifier={parameter.identifier}
                  name={parameter.name}
                  type={parameter.type}
                  data={parameter.data}
                  disabled={false}
                  onRemove={onRemove}
                  onUpdate={onUpdate}
                  showRemove
                />
              )
            })
          :
            <Text>No parameters have been added.</Text>
          }
        </Box>
      </Box>
      <Box direction="column" width="small" gap="small">
        <Button
          label="Save"
          color="status-ok"
          primary
          icon={<Save />}
          onClick={() => {
            setFinished(true);
            if (props.onUpdate) {
              props.onUpdate(attributeData);
            }
          }}
          reverse
          disabled={finished}
        />
        <Button
          label="Remove"
          color="status-critical"
          primary
          onClick={() => {
            if (props.onRemove) {
              props.onRemove(props.identifier);
            }
          }}
          icon={<Close />}
          reverse
        />
      </Box>
    </Box>
  );
};

export default Attribute;
