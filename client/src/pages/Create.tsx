import {
  Box,
  Button,
  CheckBox,
  Form,
  FormField,
  Heading,
  MaskedInput,
  RadioButtonGroup,
  RangeInput,
  Select,
  Text,
  TextArea,
  TextInput,
} from "grommet";
import React, { useState } from "react";

export const Create = ({}) => {
  const [name, setName] = useState("");

  return (
    <Box fill align="center" justify="center">
      <Heading level="2">Create</Heading>
      <Text>Create or update samples here.</Text>
      <Box width="medium">
        <Form
          onChange={(value) => console.log("Change", value)}
          onReset={() => {
            setName("");
          }}
          onSubmit={(event) => console.log("Submit", event.value, event.touched)}
        >
          <FormField label="Sample Name" name="name">
            <TextInput
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </FormField>
          <Box direction="row" justify="between" margin={{ top: "medium" }}>
            <Button label="Cancel" />
            <Button type="reset" label="Reset" />
            <Button type="submit" label="Update" primary />
          </Box>
        </Form>
      </Box>
    </Box>
  );
};
export default Create;
