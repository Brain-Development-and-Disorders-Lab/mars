// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Spacer,
  Textarea,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Values from "@components/Values";

// Existing and custom types
import { AttributeCardProps } from "@types";

// Utility functions and libraries
import { isValidValues } from "src/util";

const AttributeCard = (props: AttributeCardProps) => {
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description);
  const [values, setValues] = useState(props.values);
  const [finished, setFinished] = useState(false);

  const isNameError = name === "";
  const isDescriptionError = description === "";
  const [validValues, setValidValues] = useState(false);

  const validAttributes =
    !isNameError && !isDescriptionError && validValues && values.length > 0;

  useEffect(() => {
    setValidValues(isValidValues(values));
  }, [values]);

  const attributeCardData: AttributeCardProps = {
    _id: props._id,
    name: name,
    description: description,
    values: values,
    restrictDataValues: props.restrictDataValues,
  };

  return (
    <Card variant={"outline"} w={"100%"}>
      <CardBody p={"2"}>
        <Flex direction={"column"} gap={"2"}>
          <Flex direction={"row"} gap={"2"} wrap={["wrap", "nowrap"]}>
            <FormControl isRequired isInvalid={isNameError}>
              <FormLabel>Attribute Name</FormLabel>
              <Input
                size={"sm"}
                placeholder={"Name"}
                value={name}
                isDisabled={finished}
                onChange={(event) => setName(event.target.value)}
              />
            </FormControl>

            <FormControl isRequired isInvalid={isDescriptionError}>
              <FormLabel>Attribute Description</FormLabel>
              <Textarea
                size={"sm"}
                value={description}
                placeholder={"Description"}
                isDisabled={finished}
                w={"100%"}
                onChange={(event) => setDescription(event.target.value)}
              />
            </FormControl>
          </Flex>

          {attributeCardData.restrictDataValues ? (
            // Restrict the data to options from a drop-down
            <Values
              viewOnly={finished}
              values={values}
              setValues={setValues}
              permittedValues={props.permittedDataValues}
              requireData
            />
          ) : (
            <Values
              viewOnly={finished}
              values={values}
              setValues={setValues}
              requireData
            />
          )}
        </Flex>
      </CardBody>

      <CardFooter p={"2"}>
        <Button
          size={"sm"}
          colorScheme={"red"}
          onClick={() => {
            if (props.onRemove) {
              props.onRemove(props._id);
            }
          }}
          rightIcon={<Icon name={"delete"} />}
        >
          Remove
        </Button>

        <Spacer />

        <Button
          size={"sm"}
          rightIcon={<Icon name={"check"} />}
          colorScheme={"green"}
          onClick={() => {
            setFinished(true);
            if (props.onUpdate) {
              props.onUpdate(attributeCardData);
            }
          }}
          isDisabled={finished || !validAttributes}
        >
          Save
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AttributeCard;
