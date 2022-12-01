// React and Grommet
import React, { useState } from "react";
import { Box, Button, Flex, Heading, Input, Textarea } from "@chakra-ui/react";
import ParameterGroup from "src/components/ParameterGroup";

// Navigation
import { useNavigate } from "react-router-dom";

// Utility library
import _ from "underscore";

// Consola
import consola from "consola";

// Parameter components and custom types
import { AttributeStruct, Parameters } from "types";

// Database functions
import { postData } from "src/database/functions";
import { CheckIcon } from "@chakra-ui/icons";

export const Start = ({}) => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState([] as Parameters[]);

  const attributeData: AttributeStruct = {
    name: name,
    description: description,
    parameters: parameters,
  };

  const onSubmit = () => {
    // Push the data
    consola.debug("Creating Attribute:", attributeData);
    postData(`/attributes/create`, attributeData).then(() =>
      navigate("/attributes")
    );
  };

  return (
    <Box m={"2"}>
      <Flex direction={"column"} p={"2"} pt={"8"} pb={"8"} >
        <Flex direction={"row"}>
          <Heading size={"2xl"}>Create Attribute</Heading>
        </Flex>
      </Flex>

      <Flex p={"2"} direction={"row"} w={"full"} flexWrap={"wrap"} gap={"6"}>
        <Flex direction={"column"} gap={"2"} grow={"1"}>
          <Heading size={"xl"} margin={"xs"}>
            Details
          </Heading>
          <Input
            placeholder={"Attribute Name"}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Textarea
            value={description}
            placeholder={"Attribute Description"}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Flex>
      </Flex>

      <ParameterGroup parameters={parameters} setParameters={setParameters} />

      {/* Action buttons */}
      <Flex p={"2"} direction={"row"} w={"full"} flexWrap={"wrap"} gap={"6"} justify={"space-between"}>
        <Button color="white" background={"red"} onClick={() => navigate("/attributes")}>
          Cancel
        </Button>
        <Button rightIcon={<CheckIcon />} color={"white"} background={"green"} onClick={onSubmit}>
          Finish
        </Button>
      </Flex>
    </Box>
  );
};
export default Start;
