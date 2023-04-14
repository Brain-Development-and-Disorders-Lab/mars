import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Flex,
  FormControl,
  Icon,
  Input,
  Textarea,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { BsTrash } from "react-icons/bs";
import ParameterGroup from "@components/ParameterGroup";

import { AttributeProps } from "@types";

import { validateParameters } from "src/functions";

const Attribute = (props: AttributeProps) => {
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description);
  const [parameters, setParameters] = useState(props.parameters);
  const [finished, setFinished] = useState(false);

  const isNameError = name === "";
  const isDescriptionError = description === "";
  const [validParameters, setValidParameters] = useState(false);

  const isAttributesError = isNameError || isDescriptionError || !validParameters;

  useEffect(() => {
    setValidParameters(validateParameters(parameters));
  }, [parameters]);

  const attributeData: AttributeProps = {
    identifier: props.identifier,
    name: name,
    description: description,
    parameters: parameters,
  };

  return (
    <Card variant={"outline"} p={["1", "2"]}>
      <CardBody p={["1", "2"]}>
        <Flex
          direction={"row"}
          gap={"2"}
          wrap={"wrap"}
          justify={["center", "space-between"]}
        >
          <Flex direction={"column"} gap={"2"}>
            <FormControl isRequired isInvalid={isNameError}>
              <Input
                placeholder={"Name"}
                value={name}
                disabled={finished}
                onChange={(event) => setName(event.target.value)}
              />
            </FormControl>

            <FormControl isRequired isInvalid={isDescriptionError}>
              <Textarea
                value={description}
                placeholder={"Description"}
                disabled={finished}
                onChange={(event) => setDescription(event.target.value)}
              />
            </FormControl>
          </Flex>

          <Flex grow={"1"}>
            <ParameterGroup
              parameters={parameters}
              viewOnly={finished}
              setParameters={setParameters}
            />
          </Flex>
        </Flex>
      </CardBody>

      <Divider />

      <CardFooter justify={"right"}>
        <Flex direction={"row"} gap={"2"}>
          <Button
            colorScheme={"red"}
            onClick={() => {
              if (props.onRemove) {
                props.onRemove(props.identifier);
              }
            }}
            rightIcon={<Icon as={BsTrash} />}
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
            isDisabled={finished || isAttributesError}
          >
            Done
          </Button>
        </Flex>
      </CardFooter>
    </Card>
  );
};

export default Attribute;
