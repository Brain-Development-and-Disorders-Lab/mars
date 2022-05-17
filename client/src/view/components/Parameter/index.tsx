import { Box, Select, Text, TextInput } from "grommet";

import React, { useState } from "react";

const validTypes = ["sample", "number", "data"];

const Parameter = (props: ParameterProps) => {
  const [name, setName] = useState(props.name);

  return (
    <Box direction="row" align="center" gap="small">
      <Text>Parameter:</Text>
      <TextInput placeholder={"Parameter Name"} value={name} onChange={(event) => setName(event.target.value)}/>
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
