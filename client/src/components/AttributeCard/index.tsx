// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, Input, Text, Fieldset, Field, Collapsible, IconButton } from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import Icon from "@components/Icon";
import Values from "@components/Values";
import RichTextEditor from "@components/RichTextEditor";

// Existing and custom types
import { AttributeCardProps } from "@types";

// Utility functions and libraries
import { isValidValues } from "@lib/util";

// Variables
import { GLOBAL_STYLES } from "@variables";

const AttributeCard = (props: AttributeCardProps) => {
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description);
  const [values, setValues] = useState(props.values);
  const [isOpen, setIsOpen] = useState(true);

  // Attribute Validation
  const isNameError = name === "";
  const isDescriptionError = description === "";

  useEffect(() => {
    const isValid = !isNameError && !isDescriptionError && isValidValues(values) && values.length > 0;
    if (isValid && props.onUpdate) {
      props.onUpdate(attributeCardData);
    }
    if (props.onValidityChange) {
      props.onValidityChange(props._id, isValid);
    }
  }, [name, description, values]);

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
    <Collapsible.Root open={isOpen} onOpenChange={(event) => setIsOpen(event.open)}>
      <Flex
        direction={"column"}
        gap={"2"}
        border={GLOBAL_STYLES.border.style}
        borderColor={GLOBAL_STYLES.border.color}
        bg={"white"}
        rounded={"md"}
        p={"2"}
      >
        <Flex w={"100%"} direction={"row"} justify={"space-between"} align={"center"} gap={"2"}>
          <Flex direction={"row"} gap={"2"} align={"center"}>
            <Collapsible.Trigger asChild>
              <IconButton
                size={"2xs"}
                variant={"outline"}
                rounded={"md"}
                colorPalette={"gray"}
                aria-label={isOpen ? "Collapse attribute" : "Expand attribute"}
              >
                <Icon name={isOpen ? "c_down" : "c_right"} size={"xs"} />
              </IconButton>
            </Collapsible.Trigger>
            <Flex
              align={"center"}
              gap={"1"}
              p={"1"}
              border={"2px solid"}
              borderColor={GLOBAL_STYLES.template.iconColor}
              bg={"teal.50"}
              rounded={"md"}
              w={"fit-content"}
            >
              <Icon name={"template"} size={"xs"} color={GLOBAL_STYLES.template.iconColor} />
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {name !== "" ? name : "New Attribute"}
              </Text>
            </Flex>
          </Flex>

          <Flex gap={"2"}>
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
          </Flex>
        </Flex>
        <Collapsible.Content>
          <Flex direction={"column"} gap={"2"}>
            <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
              {/* Attribute name */}
              <Flex
                direction={"column"}
                p={"2"}
                h={"fit-content"}
                w={{ base: "100%", md: "50%" }}
                gap={"1"}
                rounded={"md"}
                border={GLOBAL_STYLES.border.style}
                borderColor={GLOBAL_STYLES.border.color}
              >
                <Flex direction={"row"} gap={"1"}>
                  <Flex grow={"1"}>
                    <Fieldset.Root>
                      <Fieldset.Content>
                        <Field.Root required>
                          <Field.Label fontWeight={"semibold"} fontSize={"xs"} ml={"0.5"}>
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
                      <ActorTag identifier={attributeCardData.owner} fallback={"Unknown User"} size={"sm"} />
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
                border={GLOBAL_STYLES.border.style}
                borderColor={GLOBAL_STYLES.border.color}
                rounded={"md"}
                grow={"1"}
              >
                <Fieldset.Root>
                  <Fieldset.Content>
                    <Field.Root gap={"2"} required>
                      <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Description
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <RichTextEditor value={description} onChange={(value) => setDescription(value)} />
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
              </Flex>
            </Flex>

            {/* Attribute Values */}
            <Fieldset.Root>
              <Fieldset.Content>
                <Field.Root gap={"2"} required>
                  <Flex direction={"column"} gap={"0.5"} ml={"0.5"}>
                    <Field.Label fontSize={"xs"} fontWeight={"semibold"}>
                      Template Values
                      <Field.RequiredIndicator />
                    </Field.Label>
                  </Flex>
                  {attributeCardData.restrictDataValues ? (
                    // Restrict the data to options from a drop-down
                    <Values values={values} setValues={setValues} permittedValues={props.permittedDataValues} />
                  ) : (
                    <Values values={values} setValues={setValues} />
                  )}
                </Field.Root>
              </Fieldset.Content>
            </Fieldset.Root>
          </Flex>
        </Collapsible.Content>
      </Flex>
    </Collapsible.Root>
  );
};

export default AttributeCard;
