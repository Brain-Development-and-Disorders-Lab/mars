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
      gap={"1"}
      border={"1px solid"}
      borderColor={"gray.300"}
      rounded={"md"}
      p={"1"}
    >
      <Flex
        w={"100%"}
        direction={"row"}
        justify={"space-between"}
        align={"center"}
        gap={"1"}
      >
        <Flex direction={"row"} gap={"1"} align={"center"}>
          <Flex
            align={"center"}
            gap={"1"}
            p={"1"}
            border={"2px solid"}
            rounded={"md"}
            w={"fit-content"}
          >
            <Icon name={"template"} size={"xs"} />
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              Attribute{name !== "" ? `: ${name}` : ""}
            </Text>
          </Flex>
        </Flex>

        <Flex gap={"1"}>
          <Button
            size={"xs"}
            rounded={"md"}
            colorPalette={"red"}
            onClick={() => {
              if (props.onRemove) {
                props.onRemove(props._id);
              }
            }}
          >
            Remove
            <Icon name={"delete"} size={"xs"} />
          </Button>
          <Button
            size={"xs"}
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
            <Icon name={"save"} size={"xs"} />
          </Button>
        </Flex>
      </Flex>
      <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
        {/* Attribute name */}
        <Flex
          direction={"column"}
          p={"1"}
          h={"fit-content"}
          w={{ base: "100%", md: "50%" }}
          gap={"1"}
          rounded={"md"}
          border={"1px solid"}
          borderColor={"gray.300"}
        >
          <Flex direction={"row"} gap={"1"}>
            <Flex grow={"1"}>
              <Fieldset.Root>
                <Fieldset.Content>
                  <Field.Root required>
                    <Field.Label
                      fontWeight={"semibold"}
                      fontSize={"xs"}
                      ml={"0.5"}
                    >
                      Name
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      bg={"white"}
                      size={"xs"}
                      rounded={"md"}
                      placeholder={"Name"}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      disabled={finished}
                    />
                  </Field.Root>
                </Fieldset.Content>
              </Fieldset.Root>
            </Flex>
          </Flex>

          {/* "Owner" field */}
          <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
            <Flex direction={"column"} gap={"1"}>
              <Text fontWeight={"semibold"} fontSize={"xs"} ml={"0.5"}>
                Owner
              </Text>
              <Flex>
                <ActorTag
                  orcid={attributeCardData.owner}
                  fallback={"Unknown User"}
                  size={"sm"}
                />
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Attribute description */}
        <Flex
          direction={"row"}
          p={"1"}
          h={"fit-content"}
          gap={"1"}
          border={"1px solid"}
          borderColor={"gray.300"}
          rounded={"md"}
          grow={"1"}
        >
          <Fieldset.Root>
            <Fieldset.Content>
              <Field.Root gap={"1"}>
                <Field.Label fontSize={"xs"} ml={"0.5"}>
                  Description
                </Field.Label>
                <MDEditor
                  height={150}
                  minHeight={100}
                  maxHeight={400}
                  style={{ width: "100%" }}
                  value={description}
                  preview={finished ? "preview" : "edit"}
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
