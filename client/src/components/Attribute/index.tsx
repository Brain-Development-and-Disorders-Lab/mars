import React, { useState } from "react";
import { Button, Card, CardBody, CardFooter, Divider, Flex, Icon, Input, Textarea } from "@chakra-ui/react";
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
    <Card variant={"outline"}>
      <CardBody>
        <Flex direction={"row"} gap={"2"}>
          <Flex direction={"column"} gap={"2"}>
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

          <ParameterGroup
            parameters={parameters}
            viewOnly={finished}
            setParameters={setParameters}
          />
        </Flex>
      </CardBody>

      <Divider />

      <CardFooter justify={"right"}>
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
      </CardFooter>
    </Card>
  );
};

export default Attribute;
