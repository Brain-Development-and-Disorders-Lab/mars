// React and Grommet
import React, { useState } from "react";
import {
  Box,
  Button,
  TextArea,
  TextInput,
} from "grommet/components";
import { Close, Save, SettingsOption } from "grommet-icons";

// Types
import { AttributeProps } from "types";
import ParameterGroup from "../ParameterGroup";

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

      <ParameterGroup parameters={parameters} viewOnly={true} setParameters={setParameters} />

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
