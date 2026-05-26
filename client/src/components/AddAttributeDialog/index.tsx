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
  createListCollection,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Values from "@components/Values";
import RichTextEditor from "@components/RichTextEditor";

// Existing and custom types
import { AddAttributeDialogProps, AttributeModel, ISelectOption, IValue } from "@types";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import { createSelectOptions } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

// Variables
import { GLOBAL_STYLES } from "@variables";

const SUGGEST_TEMPLATE = gql`
  query SuggestTemplate($name: String!, $description: String, $templates: [TemplateSuggestionInput!]!) {
    suggestTemplate(name: $name, description: $description, templates: $templates)
  }
`;

/**
 * Dialog for adding a new Attribute to an Entity, used in both the create and view flows.
 * Handles template selection, AI-powered template suggestions, and optional "Save as Template".
 */
const AddAttributeDialog = (props: AddAttributeDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [values, setValues] = useState<IValue[]>([]);

  // When a template is selected, track its ID so we can generate a unique attribute ID later
  const [usingTemplate, setUsingTemplate] = useState(false);
  const [templateId, setTemplateId] = useState("");

  // AI template suggestion state: undefined = not yet run, null = ran with no match, string = matched ID
  const [suggestedTemplateId, setSuggestedTemplateId] = useState<string | null | undefined>(undefined);
  const [isSuggestingTemplate, setIsSuggestingTemplate] = useState(false);

  // Tracks loading state for the "Save as Template" action
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Controlled select value, reset after each selection so the same template can be applied again
  const [selectedTemplateValue, setSelectedTemplateValue] = useState<string[]>([]);

  const isNameError = name === "";
  const isDescriptionError = description === "";
  const [isValueError, setIsValueError] = useState(true);
  const isError = isNameError || isDescriptionError || isValueError;

  const [runSuggestTemplate] = useLazyQuery<{ suggestTemplate: string | null }>(SUGGEST_TEMPLATE, {
    fetchPolicy: "network-only",
  });

  const templatesCollection = useMemo(() => {
    const items = createSelectOptions<AttributeModel>(props.templates, "_id", "name");
    return createListCollection<ISelectOption>({ items: items || [] });
  }, [props.templates]);

  // Run AI suggestion when the dialog opens, if templates are available
  useEffect(() => {
    if (!props.open || props.templates.length === 0) return;

    setSuggestedTemplateId(undefined);
    setIsSuggestingTemplate(true);

    const fetchSuggestion = async () => {
      try {
        const result = await runSuggestTemplate({
          variables: {
            name: props.entityName,
            description: props.entityDescription,
            templates: props.templates.map((t) => ({ _id: t._id, name: t.name, description: t.description })),
          },
        });
        setSuggestedTemplateId(result.data?.suggestTemplate ?? null);
      } catch {
        // Silently ignore, AI may not be configured
      } finally {
        setIsSuggestingTemplate(false);
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
    setUsingTemplate(false);
    setTemplateId("");
    setSuggestedTemplateId(undefined);
    setSelectedTemplateValue([]);
  };

  const handleClose = () => {
    reset();
    props.onClose();
  };

  const applyTemplate = (id: string) => {
    const template = props.templates.find((t) => t._id === id);
    if (!template) return;
    setUsingTemplate(true);
    setTemplateId(template._id);
    setName(template.name);
    setDescription(template.description);
    setValues([...template.values]);
  };

  const handleAdd = () => {
    const newAttribute: AttributeModel = {
      _id: usingTemplate ? `${templateId}-${nanoid(6)}` : `a-${nanoid(6)}`,
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

  const handleSaveAsTemplate = async () => {
    if (!props.onSaveAsTemplate) return;
    setIsSavingTemplate(true);
    try {
      await props.onSaveAsTemplate({ name, owner: props.owner, archived: false, description, values });
    } finally {
      setIsSavingTemplate(false);
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
            <Dialog.Header p={"2"} roundedTop={"md"} bg={GLOBAL_STYLES.dialog.header.bg}>
              <Flex direction={"row"} gap={"0.5"} align={"center"} ml={"0.5"}>
                <Icon name={"attribute"} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Add Attribute
                </Text>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton size={"2xs"} top={"6px"} onClick={handleClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={"2"}>
              <Flex direction={"column"} gap={"2"}>
                {/* Template selector with AI suggestion */}
                <Select.Root
                  key={"select-template"}
                  size={"xs"}
                  rounded={"md"}
                  collection={templatesCollection}
                  disabled={templatesCollection.items.length === 0 || usingTemplate}
                  value={selectedTemplateValue}
                  onValueChange={(details) => {
                    const id = details.value[0];
                    if (id && !_.isEqual(id, "")) {
                      applyTemplate(id);
                      setSelectedTemplateValue([]);
                    }
                  }}
                >
                  <Select.Label fontSize={"xs"} ml={"0.5"}>
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Use Template ({templatesCollection.items.length} available)
                      </Text>
                      {isSuggestingTemplate && (
                        <Flex direction={"row"} gap={"1"} align={"center"}>
                          <Icon name={"lightning"} size={"xs"} color={"purple.300"} />
                          <Text fontSize={"xs"} color={"purple.300"}>
                            Suggesting...
                          </Text>
                        </Flex>
                      )}
                      {!isSuggestingTemplate && suggestedTemplateId && (
                        <Flex direction={"row"} gap={"1"} align={"center"}>
                          <Icon name={"lightning"} size={"xs"} color={"purple.600"} />
                          <Text
                            fontSize={"xs"}
                            color={"purple.600"}
                            cursor={"pointer"}
                            _hover={{ textDecoration: "underline" }}
                            onClick={() => applyTemplate(suggestedTemplateId)}
                          >
                            Suggested: {props.templates.find((t) => t._id === suggestedTemplateId)?.name}
                          </Text>
                        </Flex>
                      )}
                      {!isSuggestingTemplate && suggestedTemplateId === null && (
                        <Flex direction={"row"} gap={"1"} align={"center"}>
                          <Icon name={"lightning"} size={"xs"} color={"gray.400"} />
                          <Text fontSize={"xs"} color={"gray.400"}>
                            No Suggestions
                          </Text>
                        </Flex>
                      )}
                    </Flex>
                  </Select.Label>
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger rounded={"md"} bg={"white"}>
                      <Flex direction={"row"} gap={"2"} align={"center"}>
                        <Icon name={"template"} size={"xs"} color={GLOBAL_STYLES.template.color.light} />
                        <Text fontSize={"xs"} color={"gray.500"}>
                          Select Template
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
                        {templatesCollection.items.map((template: ISelectOption) => (
                          <Select.Item item={template} key={template.value} fontSize={"xs"}>
                            <Flex direction={"row"} gap={"2"} align={"center"}>
                              <Icon name={"template"} size={"xs"} color={GLOBAL_STYLES.template.color.icon} />
                              {template.label}
                            </Flex>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>

                {/* Link back to the base template when one is selected */}
                {usingTemplate && (
                  <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                    <Text fontWeight={"semibold"} fontSize={"xs"}>
                      Base Template:
                    </Text>
                    <Linky id={templateId} type={"templates"} size={"xs"} />
                  </Flex>
                )}

                {/* Name and Description side by side */}
                <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                  <Flex
                    direction={"column"}
                    p={"2"}
                    gap={"2"}
                    rounded={"md"}
                    bg={GLOBAL_STYLES.card.bg}
                    border={GLOBAL_STYLES.border.style}
                    borderColor={GLOBAL_STYLES.border.color}
                    w={{ base: "100%", md: "calc(50% - 4px)" }}
                  >
                    <Field.Root required>
                      <Field.Label fontSize={"xs"} ml={"0.5"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
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
                    <Flex direction={"column"} gap={"1"}>
                      <Text fontSize={"xs"} ml={"0.5"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                        Owner
                      </Text>
                      <ActorTag identifier={props.owner} fallback={"Unknown User"} size={"sm"} />
                    </Flex>
                  </Flex>

                  <Flex
                    direction={"column"}
                    p={"2"}
                    gap={"2"}
                    rounded={"md"}
                    bg={GLOBAL_STYLES.card.bg}
                    border={GLOBAL_STYLES.border.style}
                    borderColor={GLOBAL_STYLES.border.color}
                    grow={"1"}
                  >
                    <Field.Root required>
                      <Field.Label fontSize={"xs"} ml={"0.5"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                        Description
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <RichTextEditor value={description} onChange={(value) => setDescription(value)} />
                    </Field.Root>
                  </Flex>
                </Flex>

                {/* Values */}
                <Field.Root required>
                  <Field.Label fontSize={"xs"} ml={"0.5"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                    Values
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Values values={values} setValues={setValues} permittedValues={props.permittedDataValues} />
                </Field.Root>
              </Flex>
            </Dialog.Body>

            <Dialog.Footer p={"2"} bg={GLOBAL_STYLES.dialog.footer.bg} roundedBottom={"md"}>
              <Flex direction={"row"} gap={"2"} justify={"space-between"} w={"100%"}>
                <Button variant={"solid"} size={"xs"} rounded={"md"} colorPalette={"red"} onClick={handleClose}>
                  Cancel
                  <Icon name={"cross"} size={"xs"} />
                </Button>
                <Flex direction={"row"} gap={"2"}>
                  {props.onSaveAsTemplate && (
                    <Button
                      variant={"solid"}
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"green"}
                      onClick={handleSaveAsTemplate}
                      disabled={isError || usingTemplate}
                      loading={isSavingTemplate}
                    >
                      Save as Template
                      <Icon name={"template"} size={"xs"} />
                    </Button>
                  )}
                  <Button
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

export default AddAttributeDialog;
