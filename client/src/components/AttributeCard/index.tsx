// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, Input, Text, Fieldset, Field } from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import Icon from "@components/Icon";
import ValuesRemix from "@components/ValuesRemix";
import MDEditor from "@uiw/react-md-editor";

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
    owner: props.owner,
    archived: false,
    description: description,
    values: values,
    restrictDataValues: props.restrictDataValues,
  };

  return (
    <Flex
      direction={"column"}
      gap={"2"}
      border={"1px solid"}
      borderColor={"gray.300"}
      rounded={"md"}
      p={"2"}
    >
      <Flex
        w={"100%"}
        direction={"row"}
        justify={"space-between"}
        align={"center"}
        gap={"2"}
      >
        <Flex direction={"row"} gap={"2"} align={"center"}>
          <Flex
            align={"center"}
            gap={"2"}
            p={"2"}
            border={"2px solid"}
            rounded={"md"}
            w={"fit-content"}
          >
            <Icon name={"template"} size={"sm"} />
            <Text fontSize={"sm"} fontWeight={"semibold"}>
              Attribute{name !== "" ? `: ${name}` : ""}
            </Text>
          </Flex>
        </Flex>

        <Flex gap={"2"}>
          <Button
            size={"sm"}
            rounded={"md"}
            colorPalette={"red"}
            onClick={() => {
              if (props.onRemove) {
                props.onRemove(props._id);
              }
            }}
          >
            Remove
            <Icon name={"delete"} />
          </Button>
          <Button
            size={"sm"}
            rounded={"md"}
            colorPalette={"green"}
            onClick={() => {
              setFinished(true);
              if (props.onUpdate) {
                props.onUpdate(attributeCardData);
              }
            }}
            disabled={finished || !validAttributes}
          >
            Save
            <Icon name={"check"} />
          </Button>
        </Flex>
      </Flex>
      <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
        {/* Attribute name */}
        <Flex
          direction={"column"}
          p={"2"}
          h={"fit-content"}
          w={{ base: "100%", md: "50%" }}
          gap={"2"}
          rounded={"md"}
          border={"1px solid"}
          borderColor={"gray.300"}
        >
          <Flex direction={"row"} gap={"2"}>
            <Flex grow={"1"}>
              <Fieldset.Root>
                <Fieldset.Content>
                  <Field.Root required>
                    <Field.Label>
                      Name
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      bg={"white"}
                      size={"sm"}
                      rounded={"md"}
                      placeholder={"Name"}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </Field.Root>
                </Fieldset.Content>
              </Fieldset.Root>
            </Flex>
          </Flex>

          {/* "Owner" field */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
            <Flex direction={"column"} gap={"1"}>
              <Text fontWeight={"semibold"} fontSize={"sm"}>
                Owner
              </Text>
              <Flex>
                <ActorTag
                  orcid={attributeCardData.owner}
                  fallback={"Unknown User"}
                  size={"md"}
                />
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Attribute description */}
        <Flex
          direction={"row"}
          p={"2"}
          h={"fit-content"}
          gap={"2"}
          border={"1px solid"}
          borderColor={"gray.300"}
          rounded={"md"}
          grow={"1"}
        >
          <Fieldset.Root>
            <Fieldset.Content>
              <Field.Root>
                <Field.Label>Description</Field.Label>
                <MDEditor
                  height={150}
                  minHeight={100}
                  maxHeight={400}
                  style={{ width: "100%" }}
                  value={description}
                  preview={"edit"}
                  extraCommands={[]}
                  onChange={(value) => {
                    setDescription(value || "");
                  }}
                />
              </Field.Root>
            </Fieldset.Content>
          </Fieldset.Root>
        </Flex>
      </Flex>

      {attributeCardData.restrictDataValues ? (
        // Restrict the data to options from a drop-down
        <ValuesRemix
          viewOnly={finished}
          values={values}
          setValues={setValues}
          permittedValues={props.permittedDataValues}
          requireData
        />
      ) : (
        <ValuesRemix
          viewOnly={finished}
          values={values}
          setValues={setValues}
          requireData
        />
      )}
    </Flex>
  );
};

export default AttributeCard;
