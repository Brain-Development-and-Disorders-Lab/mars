// React
import React, { useEffect, useMemo, useState } from "react";

// Existing and custom components
import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Flex,
  Input,
  Portal,
  Select,
  Text,
  Textarea,
  createListCollection,
} from "@chakra-ui/react";
import TagActor from "@components/TagActor";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import { SELECT_BG, SELECT_ROUNDED, SELECT_SIZE } from "@components/Select";
import Values from "@components/Values";

// Existing and custom types
import { DialogAddAttributeProps, AttributeModel, ISelectOption, IValue } from "@types";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import { createSelectOptions } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

// Hooks
import { usePermissions } from "@hooks/usePermissions";

// Variables
import { STYLES } from "@variables";

const SUGGEST_ATTRIBUTE = gql`
  query SuggestAttribute($name: String!, $description: String, $attributes: [AttributeSuggestionInput!]!) {
    suggestAttribute(name: $name, description: $description, attributes: $attributes)
  }
`;

/**
 * Dialog for adding a new Attribute to an Entity, used in both the create and view flows.
 * Handles Attribute selection, AI-powered Attribute suggestions, and optional "Save as Attribute".
 */
const DialogAddAttribute = (props: DialogAddAttributeProps) => {
  const { globalPermissions } = usePermissions();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [values, setValues] = useState<IValue[]>([]);

  // When a Attribute is selected, track its ID so we can generate a unique attribute ID later
  const [usingAttribute, setUsingAttribute] = useState(false);
  const [attributeId, setAttributeId] = useState("");

  // AI Attribute suggestion state: undefined = not yet run, null = ran with no match, string = matched ID
  const [suggestedAttributeId, setSuggestedAttributeId] = useState<string | null | undefined>(undefined);
  const [isSuggestingAttribute, setIsSuggestingAttribute] = useState(false);

  // Tracks loading state for the "Save as Attribute" action
  const [isSavingAttribute, setIsSavingAttribute] = useState(false);

  // Controlled select value, reset after each selection so the same Attribute can be applied again
  const [selectedAttributeValue, setSelectedAttributeValue] = useState<string[]>([]);

  const isNameError = name === "";
  const isDescriptionError = description === "";
  const [isValueError, setIsValueError] = useState(true);
  const isError = isNameError || isDescriptionError || isValueError;

  const [runSuggestAttribute] = useLazyQuery<{ suggestAttribute: string | null }>(SUGGEST_ATTRIBUTE, {
    fetchPolicy: "network-only",
  });

  const attributesCollection = useMemo(() => {
    const items = createSelectOptions<AttributeModel>(props.attributes, "_id", "name");
    return createListCollection<ISelectOption>({ items: items || [] });
  }, [props.attributes]);

  // Run AI suggestion when the dialog opens, if Attributes are available
  useEffect(() => {
    if (!globalPermissions.features.ai || !props.open || props.attributes.length === 0) return;

    setSuggestedAttributeId(undefined);
    setIsSuggestingAttribute(true);

    const fetchSuggestion = async () => {
      try {
        const result = await runSuggestAttribute({
          variables: {
            name: props.entityName,
            description: props.entityDescription,
            attributes: props.attributes.map((a) => ({ _id: a._id, name: a.name, description: a.description })),
          },
        });
        setSuggestedAttributeId(result.data?.suggestAttribute ?? null);
      } catch {
        // Silently ignore, AI may not be configured
      } finally {
        setIsSuggestingAttribute(false);
      }
    };

    fetchSuggestion();
  }, [props.open]);

  useEffect(() => {
    setIsValueError(values.length === 0 || values.some((v) => v.name === ""));
  }, [values]);

  const reset = () => {
    setName("");
    setDescription("");
    setValues([]);
    setUsingAttribute(false);
    setAttributeId("");
    setSuggestedAttributeId(undefined);
    setSelectedAttributeValue([]);
  };

  const handleClose = () => {
    reset();
    props.onClose();
  };

  const applyAttribute = (id: string) => {
    const attribute = props.attributes.find((t) => t._id === id);
    if (!attribute) return;
    setUsingAttribute(true);
    setAttributeId(attribute._id);
    setName(attribute.name);
    setDescription(attribute.description);
    setValues([...attribute.values]);
  };

  const handleAdd = () => {
    const newAttribute: AttributeModel = {
      _id: usingAttribute ? `${attributeId}-${nanoid(6)}` : `a-${nanoid(6)}`,
      name,
      owner: props.owner,
      timestamp: dayjs(Date.now()).toISOString(),
      archived: false,
      description,
      values,
    };
    props.onAdd(newAttribute);
    handleClose();
  };

  const handleSaveAsAttribute = async () => {
    if (!props.onSaveAsAttribute) return;
    setIsSavingAttribute(true);
    try {
      await props.onSaveAsAttribute({ name, owner: props.owner, archived: false, description, values });
    } finally {
      setIsSavingAttribute(false);
    }
  };

  return (
    <Dialog.Root
      open={props.open}
      onOpenChange={(event) => {
        if (!event.open) handleClose();
      }}
      size={"xl"}
      placement={"center"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header p={"2"} roundedTop={"md"} bg={"entity.light"} color={"entity.dark"}>
              <Flex direction={"row"} gap={"0.5"} align={"center"} ml={"0.5"}>
                <Icon name={"attribute"} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Add Attribute
                </Text>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton size={"2xs"} top={"6px"} onClick={handleClose} colorPalette={"entity"} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={"2"}>
              <Flex direction={"column"} gap={"2"}>
                {/* Attribute selector with AI suggestion */}
                <Select.Root
                  key={"select-attribute"}
                  size={SELECT_SIZE}
                  rounded={SELECT_ROUNDED}
                  bg={SELECT_BG}
                  collection={attributesCollection}
                  disabled={attributesCollection.items.length === 0 || usingAttribute}
                  value={selectedAttributeValue}
                  onValueChange={(details) => {
                    const id = details.value[0];
                    if (id && !_.isEqual(id, "")) {
                      applyAttribute(id);
                      setSelectedAttributeValue([]);
                    }
                  }}
                >
                  <Select.Label fontSize={"xs"} ml={"0.5"}>
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Use Attribute ({attributesCollection.items.length} available)
                      </Text>
                      {globalPermissions.features.ai && (
                        <Flex direction={"row"} gap={"1"} align={"center"}>
                          {isSuggestingAttribute && (
                            <React.Fragment>
                              <Icon name={"lightning"} size={"xs"} color={"purple.300"} />
                              <Text fontSize={"xs"} color={"purple.300"}>
                                Suggesting...
                              </Text>
                            </React.Fragment>
                          )}

                          {!isSuggestingAttribute && suggestedAttributeId && (
                            <React.Fragment>
                              <Icon name={"lightning"} size={"xs"} color={"purple.600"} />
                              <Text
                                fontSize={"xs"}
                                color={"purple.600"}
                                cursor={"pointer"}
                                _hover={{ textDecoration: "underline" }}
                                onClick={() => applyAttribute(suggestedAttributeId)}
                              >
                                Suggested: {props.attributes.find((t) => t._id === suggestedAttributeId)?.name}
                              </Text>
                            </React.Fragment>
                          )}

                          {!isSuggestingAttribute && suggestedAttributeId === null && (
                            <React.Fragment>
                              <Icon name={"lightning"} size={"xs"} color={"text.faint"} />
                              <Text fontSize={"xs"} color={"text.faint"}>
                                No Suggestions
                              </Text>
                            </React.Fragment>
                          )}
                        </Flex>
                      )}
                    </Flex>
                  </Select.Label>
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger rounded={"md"} bg={"white"}>
                      <Flex direction={"row"} gap={"2"} align={"center"}>
                        <Icon name={"attribute"} size={"xs"} color={STYLES.attribute.color.light} />
                        <Text fontSize={"xs"} color={"text.subtle"}>
                          Select Attribute
                        </Text>
                      </Flex>
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {attributesCollection.items.map((attribute: ISelectOption) => (
                          <Select.Item item={attribute} key={attribute.value} fontSize={"xs"}>
                            <Flex direction={"row"} gap={"2"} align={"center"}>
                              <Icon name={"attribute"} size={"xs"} color={STYLES.attribute.color.icon} />
                              {attribute.label}
                            </Flex>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>

                {/* Link back to the base Attribute when one is selected */}
                {usingAttribute && (
                  <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                    <Text fontWeight={"semibold"} fontSize={"xs"}>
                      Base Attribute:
                    </Text>
                    <Linky id={attributeId} type={"attributes"} size={"xs"} />
                  </Flex>
                )}

                {/* Name and Description side by side */}
                <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                  <Flex
                    direction={"column"}
                    p={"2"}
                    gap={"2"}
                    rounded={"md"}
                    bg={STYLES.card.bg}
                    border={STYLES.border.style}
                    borderColor={STYLES.border.color}
                    w={{ base: "100%", md: "calc(50% - 4px)" }}
                  >
                    <Field.Root required>
                      <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                        Name
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        data-testid={"create-attribute-name"}
                        bg={"white"}
                        size={"xs"}
                        rounded={"md"}
                        placeholder={"Name"}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </Field.Root>
                    <Flex direction={"column"} gap={"1"}>
                      <Text fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                        Owner
                      </Text>
                      <TagActor identifier={props.owner} fallback={"Unknown User"} size={"sm"} />
                    </Flex>
                  </Flex>

                  <Flex
                    direction={"column"}
                    p={"2"}
                    gap={"2"}
                    rounded={"md"}
                    bg={STYLES.card.bg}
                    border={STYLES.border.style}
                    borderColor={STYLES.border.color}
                    grow={"1"}
                  >
                    <Field.Root h={"100%"} required>
                      <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                        Description
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Textarea
                        data-testid={"create-attribute-description"}
                        value={description}
                        size={"xs"}
                        h={"100%"}
                        bg={"white"}
                        onChange={(event) => setDescription(event.target.value)}
                      />
                    </Field.Root>
                  </Flex>
                </Flex>

                {/* Values */}
                <Field.Root required>
                  <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                    Values
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Values values={values} setValues={setValues} permittedValues={props.permittedDataValues} />
                </Field.Root>
              </Flex>
            </Dialog.Body>

            <Dialog.Footer p={"2"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
              <Flex direction={"row"} gap={"2"} justify={"space-between"} w={"100%"}>
                <Button variant={"solid"} size={"xs"} rounded={"md"} colorPalette={"red"} onClick={handleClose}>
                  Cancel
                  <Icon name={"cross"} size={"xs"} />
                </Button>
                <Flex direction={"row"} gap={"2"}>
                  {props.onSaveAsAttribute && (
                    <Button
                      variant={"solid"}
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"green"}
                      onClick={handleSaveAsAttribute}
                      disabled={isError || usingAttribute}
                      loading={isSavingAttribute}
                    >
                      Save as Attribute
                      <Icon name={"attribute"} size={"xs"} />
                    </Button>
                  )}
                  <Button
                    data-testid={"save-add-attribute-button"}
                    variant={"solid"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={handleAdd}
                    disabled={isError}
                  >
                    Add
                    <Icon name={"add"} size={"xs"} />
                  </Button>
                </Flex>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default DialogAddAttribute;
