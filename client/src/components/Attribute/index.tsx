// React
import React, { useState } from "react";
import { Button, Flex, Heading, Input, Textarea } from "@chakra-ui/react";

// Types
import { AttributeProps } from "types";
import ParameterGroup from "../ParameterGroup";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";

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
    <Flex direction="row" align="center" gap={"2"} p={"2"}>
      <Flex p={"2"} pb={"6"} direction={"row"} wrap={"wrap"} gap={"6"}>
        <Flex direction={"column"} gap={"2"} maxW={"md"} p={"2"} rounded={"2xl"} grow={"1"}>
          <Heading size={"xl"} margin={"xs"}>
            Details
          </Heading>
          <Input
            placeholder={"Attribute Name"}
            value={name}
            disabled={finished}
            onChange={(event) => setName(event.target.value)}
          />
          <Textarea
            value={description}
            placeholder={"Attribute Description"}
            disabled={finished}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Flex>

        <Flex grow={"1"} maxW={"2xl"}>
          <ParameterGroup parameters={parameters} viewOnly={finished} setParameters={setParameters} />
        </Flex>
      </Flex>

      <Flex direction="column" width="small" gap="small">
        <Button
          rightIcon={<CheckIcon />}
          colorScheme={"green"}
          onClick={() => {
            setFinished(true);
            if (props.onUpdate) {
              props.onUpdate(attributeData);
            }
          }}
          disabled={finished}
        >
          Save
        </Button>
        <Button
          colorScheme={"red"}
          onClick={() => {
            if (props.onRemove) {
              props.onRemove(props.identifier);
            }
          }}
          rightIcon={<CloseIcon />}
        >
          Remove
        </Button>
      </Flex>
    </Flex>
  );
};

export default Attribute;
