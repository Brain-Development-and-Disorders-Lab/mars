import React, { useState } from "react";
import { Button, Flex, Icon, Input, Textarea } from "@chakra-ui/react";
import { AttributeProps } from "@types";
import ParameterGroup from "@components/ParameterGroup";
import { CloseIcon } from "@chakra-ui/icons";
import { AiOutlineSave } from "react-icons/ai";

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
    <Flex
      direction={"row"}
      align={"center"}
      gap={"2"}
      p={"2"}
      bg={"gray.50"}
      rounded={"lg"}
    >
      <Flex p={"2"} pb={"6"} direction={"row"} wrap={"wrap"} gap={"6"}>
        <Flex
          direction={"column"}
          gap={"2"}
          maxW={"md"}
          p={"2"}
          rounded={"2xl"}
          grow={"1"}
        >
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
          <Flex direction={"row"} gap={"2"}>
            <Button
              colorScheme={"red"}
              variant={"outline"}
              onClick={() => {
                if (props.onRemove) {
                  props.onRemove(props.identifier);
                }
              }}
              rightIcon={<CloseIcon />}
            >
              Remove
            </Button>
            <Button
              rightIcon={<Icon as={AiOutlineSave} />}
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
          </Flex>
        </Flex>

        <ParameterGroup
          parameters={parameters}
          viewOnly={finished}
          setParameters={setParameters}
        />
      </Flex>
    </Flex>
  );
};

export default Attribute;
