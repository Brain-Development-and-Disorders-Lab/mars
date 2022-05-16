import { Box, Select, Text, TextInput } from "grommet";

import React from "react";

const validTypes = ["Sample", "Number", "Data"];

const Parameter = (props: ParameterStruct) => {
  return (
    <Box direction="row" align="center" gap="small">
      <Text>Parameter:</Text>
      <TextInput placeholder={"Name"} value={props.name} />
      <Select
        placeholder="Type"
        options={validTypes}
      />
      {/* <Select
        placeholder="Value"
        options={[""]}
      /> */}
    </Box>
  );
};

export default Parameter;
