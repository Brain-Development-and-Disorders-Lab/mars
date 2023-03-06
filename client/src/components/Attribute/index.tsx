import React, { useState } from "react";
import { Button, Card, CardBody, CardFooter, Divider, Flex, Icon, Input, Textarea } from "@chakra-ui/react";
import { AttributeProps } from "@types";
import ParameterGroup from "@components/ParameterGroup";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";

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
              placeholder={"Name"}
              value={name}
              disabled={finished}
              onChange={(event) => setName(event.target.value)}
            />
            <Textarea
              value={description}
              placeholder={"Description"}
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
            rightIcon={<Icon as={CheckIcon} />}
            colorScheme={"green"}
            onClick={() => {
              setFinished(true);
              if (props.onUpdate) {
                props.onUpdate(attributeData);
              }
            }}
            disabled={finished}
          >
            Done
          </Button>
        </Flex>
      </CardFooter>
    </Card>
  );
};

export default Attribute;
