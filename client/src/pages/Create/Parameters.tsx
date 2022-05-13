import {
  Box,
  Form,
  Heading,
} from "grommet";
import React from "react";

export const Parameters = ({}) => {
  return (
    <>
      <Heading level="2">Apply Parameters</Heading>
      <Box width="medium">
        <Form
          onChange={(value) => console.log("Change", value)}
          onReset={() => {}}
          onSubmit={(event) => console.log("Submit", event.value, event.touched)}
        >

          {/* <Box direction="row" justify="between" margin={{ top: "medium" }}>
            <Button label="Cancel" />
            <Button type="reset" label="Reset" />
            <Button type="submit" label="Update" primary />
          </Box> */}
        </Form>
      </Box>
    </>
  );
};
export default Parameters;
