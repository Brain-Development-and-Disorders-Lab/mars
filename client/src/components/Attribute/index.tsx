// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Values from "@components/Values";

// Existing and custom types
import { AttributeProps } from "@types";

// Utility functions and libraries
import { checkValues } from "src/functions";

const Attribute = (props: AttributeProps) => {
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description);
  const [values, setValues] = useState(props.values);
  const [finished, setFinished] = useState(false);

  const isNameError = name === "";
  const isDescriptionError = description === "";
  const [validValues, setValidValues] = useState(false);

  const isAttributesError = isNameError || isDescriptionError || !validValues;

  useEffect(() => {
    setValidValues(checkValues(values));
  }, [values]);

  const attributeData: AttributeProps = {
    identifier: props.identifier,
    name: name,
    description: description,
    values: values,
  };

  return (
    <Card variant={"outline"} p={"2"}>
      <CardHeader p={"2"}>
        <Heading fontWeight={"semibold"} size={"md"}>
          Attribute Details
        </Heading>
      </CardHeader>

      <CardBody p={"2"}>
        <Flex direction={"column"}>
          <Flex direction={"row"} gap={"4"} wrap={["wrap", "nowrap"]}>
            <FormControl isRequired isInvalid={isNameError}>
              <FormLabel>Name</FormLabel>
              <Input
                placeholder={"Attribute name"}
                value={name}
                disabled={finished}
                onChange={(event) => setName(event.target.value)}
              />
            </FormControl>

            <FormControl isRequired isInvalid={isDescriptionError}>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                placeholder={"Attribute description"}
                disabled={finished}
                onChange={(event) => setDescription(event.target.value)}
              />
            </FormControl>
          </Flex>

          <Values
            collection={values}
            viewOnly={finished}
            setValues={setValues}
          />
        </Flex>
      </CardBody>

      <CardFooter>
        <Flex direction={"row"} gap={"2"} grow={"1"} justify={"right"}>
          <Button
            colorScheme={"red"}
            onClick={() => {
              if (props.onRemove) {
                props.onRemove(props.identifier);
              }
            }}
            rightIcon={<Icon name={"delete"} />}
          >
            Remove
          </Button>

          <Button
            rightIcon={<Icon name={"check"} />}
            colorScheme={"green"}
            onClick={() => {
              setFinished(true);
              if (props.onUpdate) {
                props.onUpdate(attributeData);
              }
            }}
            isDisabled={finished || isAttributesError}
          >
            Save
          </Button>
        </Flex>
      </CardFooter>
    </Card>
  );
};

export default Attribute;
