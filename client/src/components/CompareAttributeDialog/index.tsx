// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Flex, Text, CloseButton, Spinner, Checkbox, Collapsible, Dialog, Spacer } from "@chakra-ui/react";
import AlertDialog from "@components/AlertDialog";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import {
  AttributeModel,
  CompareAttributeDialogCollapsibleProps,
  CompareAttributeDialogProps,
  CompareAttributeFieldDiffProps,
  IValue,
} from "@types";

// GraphQL imports
import { useLazyQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

// Utility functions
import { getValueTypeIconProps, isValueEqual } from "@lib/util";
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

const CompareAttributeDialog = (props: CompareAttributeDialogProps) => {
  const [templateAttribute, setTemplateAttribute] = useState<AttributeModel>();
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);

  // Collapsible sections state (all expanded by default)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Selection state
  const [useTemplateName, setUseTemplateName] = useState(false);
  const [useTemplateDescription, setUseTemplateDescription] = useState(false);
  const [adoptModifiedValueIds, setAdoptModifiedValueIds] = useState<Set<string>>(new Set());
  const [pullTemplateValueIds, setPullTemplateValueIds] = useState<Set<string>>(new Set());
  const [removeEntityValueIds, setRemoveEntityValueIds] = useState<Set<string>>(new Set());

  const GET_TEMPLATE = gql`
    query GetTemplate($_id: String) {
      template(_id: $_id) {
        _id
        name
        timestamp
        owner
        archived
        description
        values {
          _id
          name
          type
          data
        }
        history {
          author
          message
          timestamp
          version
          _id
          name
          owner
          archived
          description
          values {
            _id
            name
            type
            data
          }
        }
      }
    }
  `;
  const [getTemplate] = useLazyQuery<{
    template: AttributeModel;
  }>(GET_TEMPLATE);

  /**
   * Utility function to configure state prior to displaying comparison view
   */
  const prepareComparison = async () => {
    // Reset state
    setLoadingComparison(true);
    setUseTemplateName(false);
    setUseTemplateDescription(false);
    setAdoptModifiedValueIds(new Set());
    setPullTemplateValueIds(new Set());
    setRemoveEntityValueIds(new Set());

    // Retreive the latest version of the Template for comparison
    const templateAttributeResult = await getTemplate({
      variables: {
        _id: props.templateAttributeId,
      },
    });

    if (templateAttributeResult.data?.template) {
      const template = templateAttributeResult.data.template;
      setTemplateAttribute(template);

      // Apply operations and selections if `defaultApplyAll` is `true`
      if (props.defaultApplyAll) {
        if (props.modifiedAttribute.name !== template.name) {
          setUseTemplateName(true);
        }
        if (props.modifiedAttribute.description !== template.description) {
          setUseTemplateDescription(true);
        }

        const entityValueMap = new Map(props.modifiedAttribute.values.map((value) => [value._id, value]));
        const templateValueMap = new Map(template.values.map((value) => [value._id, value]));

        // Create Sets and determine exact differences between Template and current Entity Attribute
        const adoptModifiedSet = new Set<string>();
        const pullTemplateSet = new Set<string>();
        const removeEntitySet = new Set<string>();

        for (const [id, templateValue] of templateValueMap) {
          const entityValue = entityValueMap.get(id);
          if (entityValue && !isValueEqual(entityValue, templateValue)) {
            // Modified Value from Template
            adoptModifiedSet.add(id);
          } else if (!entityValue) {
            // Added Value from Template
            pullTemplateSet.add(id);
          }
        }

        // Removed Values from Template
        for (const [id] of entityValueMap) {
          if (!templateValueMap.has(id)) {
            removeEntitySet.add(id);
          }
        }

        setAdoptModifiedValueIds(adoptModifiedSet);
        setPullTemplateValueIds(pullTemplateSet);
        setRemoveEntityValueIds(removeEntitySet);
      }
    }
    setLoadingComparison(false);
  };

  useEffect(() => {
    if (props.open) {
      prepareComparison();
    }
  }, [props.open]);

  /**
   * Helper function to toggle the selected items under `CompareAttributeDialogCollapsible` sections
   * @param {React.Dispatch<React.SetStateAction<Set<string>>>} setSelected Function to dispatch and update React state
   * @param {string} selection Selection to add or remove
   */
  const toggleSet = (setSelected: React.Dispatch<React.SetStateAction<Set<string>>>, selection: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(selection)) {
        next.delete(selection);
      } else {
        next.add(selection);
      }
      return next;
    });
  };

  /**
   * Helper function to toggle the `CompareAttributeDialogCollapsible` sections that are expanded
   * @param {string} section Selected section of the Template Values diff
   */
  const toggleSection = (section: string) => {
    setExpandedSections((previous) => {
      const next = new Set(previous);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  /**
   * Helper component to represent the collapsible sections for each type of modification to the Template
   * @param props Component props
   * @return
   */
  const CompareAttributeDialogCollapsible = (props: CompareAttributeDialogCollapsibleProps) => (
    <Collapsible.Root
      open={expandedSections.has(props.sectionKey)}
      onOpenChange={() => toggleSection(props.sectionKey)}
      bg={`${props.color}.50`}
      p={"1"}
      rounded={"md"}
      disabled={props.disabled}
    >
      <Collapsible.Trigger asChild>
        <Flex direction={"row"} gap={"1"} align={"center"} cursor={props.disabled ? "not-allowed" : "pointer"}>
          <Icon
            size={"xs"}
            name={expandedSections.has(props.sectionKey) ? "c_up" : "c_down"}
            color={`${props.color}.600`}
          />
          <Icon size={"xs"} name={props.icon} color={`${props.color}.600`} />
          <Text fontWeight={"semibold"} fontSize={"xs"} color={`${props.color}.700`}>
            {props.label} ({props.count})
          </Text>
        </Flex>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Flex direction={"column"} gap={"1"} mt={"1"}>
          {props.children}
        </Flex>
      </Collapsible.Content>
    </Collapsible.Root>
  );

  /**
   * Helper component to represent the direct comparison of a single modification to the Template
   * @param props Component props
   * @return
   */
  const CompareAttributeFieldDiff = (props: CompareAttributeFieldDiffProps) => (
    <Flex
      direction={"column"}
      gap={"1"}
      p={"2"}
      rounded={"md"}
      w={"50%"}
      h={"100%"}
      border={STYLES.border.style}
      borderColor={STYLES.border.color}
    >
      <Flex direction={"row"} justify={"space-between"} align={"center"}>
        <Text fontWeight={"semibold"} fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
          {props.label}
        </Text>
        {props.isDifferent && (
          <Checkbox.Root
            size={"xs"}
            colorPalette={"blue"}
            checked={props.useOriginal}
            onCheckedChange={(e) => props.setUseOriginal(!!e.checked)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label fontSize={"xs"}>Reset to Template</Checkbox.Label>
          </Checkbox.Root>
        )}
      </Flex>

      <Flex direction={"column"} gap={"1"} rounded={"sm"} bg={"white"}>
        {props.isDifferent && (
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Text fontSize={"xs"} color={"text.subtle"}>
              Current Entity:
            </Text>
            <Tooltip disabled={props.currentValue.length < 24} content={props.currentValue} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"status.warning.emphasized"}>
                {_.truncate(props.currentValue, { length: 24 })}
              </Text>
            </Tooltip>

            <Spacer />

            <Icon name={"edit"} color={"status.warning.emphasized"} size={"xs"} />
          </Flex>
        )}
        <Flex direction={"row"} gap={"1"} align={"center"}>
          <Text fontSize={"xs"} color={"text.subtle"}>
            Template:
          </Text>
          <Tooltip disabled={props.originalValue.length < 24} content={props.originalValue} showArrow>
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              {_.truncate(props.originalValue, { length: 24 })}
            </Text>
          </Tooltip>

          <Spacer />

          {!props.isDifferent && <Icon name={"check"} color={"green.600"} size={"xs"} />}
        </Flex>
      </Flex>
    </Flex>
  );

  // Generate the differences between the Template Values and the Entity Attribute Values
  const entityValueMap = new Map(props.modifiedAttribute.values.map((v) => [v._id, v]));
  const templateValueMap = new Map(templateAttribute?.values.map((v) => [v._id, v]) || []);

  // Generate the collection of shared Values
  const sharedValues = [...entityValueMap.keys()].filter((id) => templateValueMap.has(id));

  // Generate the collections of differing Values
  const unchangedValues: { entity: IValue; template: IValue }[] = [];
  const modifiedValues: { entity: IValue; template: IValue }[] = [];
  const templateOnlyValues: IValue[] = [];
  const entityOnlyValues: IValue[] = [];

  for (const value of sharedValues) {
    const entityValue = entityValueMap.get(value)!;
    const templateValue = templateValueMap.get(value)!;
    if (isValueEqual(entityValue, templateValue)) {
      unchangedValues.push({ entity: entityValue, template: templateValue });
    } else {
      modifiedValues.push({ entity: entityValue, template: templateValue });
    }
  }

  // Values only contained in the Template
  for (const [id, value] of templateValueMap) {
    if (!entityValueMap.has(id)) {
      templateOnlyValues.push(value);
    }
  }

  // Values only contained in the Entity Attribute
  for (const [id, value] of entityValueMap) {
    if (!templateValueMap.has(id)) entityOnlyValues.push(value);
  }

  const nameIsDifferent = props.modifiedAttribute.name !== templateAttribute?.name;
  const descriptionIsDifferent = props.modifiedAttribute.description !== templateAttribute?.description;

  const hasSelection =
    useTemplateName ||
    useTemplateDescription ||
    adoptModifiedValueIds.size > 0 ||
    pullTemplateValueIds.size > 0 ||
    removeEntityValueIds.size > 0;

  const onUpdate = () => {
    // If no `onUpdate` function is specified or the `AttributeModel` is undefined, ignore
    if (!props.onUpdate || !templateAttribute) {
      return;
    }

    // Create updated Set of merged Values, applying changes based on user selections
    let mergedValues: IValue[] = props.modifiedAttribute.values.map((value) => ({ ...value }));
    mergedValues = mergedValues.filter((value) => !removeEntityValueIds.has(value._id));
    const mergedMap = new Map(mergedValues.map((v) => [v._id, v]));

    // Apply Values that are to be updated from the Template
    for (const value of templateAttribute.values) {
      if (mergedMap.has(value._id) && adoptModifiedValueIds.has(value._id)) {
        const valueId = mergedValues.findIndex((mergedValue) => mergedValue._id === value._id);
        if (valueId !== -1) {
          mergedValues[valueId] = { ...value };
        }
      }
    }

    // Add Values to be pulled from the Template
    for (const value of templateAttribute.values) {
      if (!mergedMap.has(value._id) && pullTemplateValueIds.has(value._id)) {
        mergedValues.push({ ...value });
      }
    }

    // Call the `onUpdate` function to apply changes
    props.onUpdate({
      ...props.modifiedAttribute,
      name: useTemplateName && nameIsDifferent ? templateAttribute.name : props.modifiedAttribute.name,
      description:
        useTemplateDescription && descriptionIsDifferent
          ? templateAttribute.description
          : props.modifiedAttribute.description,
      values: mergedValues,
    });
    props.setOpen(false);
  };

  return (
    <React.Fragment>
      <Dialog.Root
        open={props.open}
        scrollBehavior={"inside"}
        placement={"center"}
        onOpenChange={(event) => props.setOpen(event.open)}
        size={"lg"}
        closeOnEscape
        closeOnInteractOutside
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxH={"90vh"} display={"flex"} flexDirection={"column"} p={"0"}>
            <Dialog.Header
              p={"1"}
              flexShrink={0}
              bg={"template.light"}
              color={"template.dark"}
              borderBottom={"2px"}
              roundedTop={"md"}
            >
              <Flex align={"center"} gap={"1"} p={"1"} border={"2px"} rounded={"md"}>
                <Icon name={"diff"} size={"xs"} />
                <Flex direction={"row"} align={"center"} gap={"1.5"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Compare: {props.modifiedAttribute.name}
                  </Text>
                  <Icon name={"a_both"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    {templateAttribute?.name}
                  </Text>
                </Flex>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton size={"2xs"} top={"6px"} onClick={() => props.setOpen(false)} colorPalette={"template"} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={"2"} flex={"1"} overflow={"auto"}>
              {loadingComparison ? (
                <Flex w={"100%"} align={"center"} justify={"center"} minH={"240px"}>
                  <Flex direction={"row"} gap={"2"} align={"center"}>
                    <Spinner color={"text.muted"} />
                    <Text fontWeight={"semibold"} color={"text.muted"} fontSize={"xs"}>
                      Preparing Comparison
                    </Text>
                  </Flex>
                </Flex>
              ) : !templateAttribute ? (
                <Flex
                  w={"100%"}
                  minH={"240px"}
                  align={"center"}
                  justify={"center"}
                  rounded={"md"}
                  bg={"red.100"}
                  p={"4"}
                >
                  <Text fontWeight={"semibold"} fontSize={"xs"} color={"status.danger.emphasized"}>
                    Unable to load Template
                  </Text>
                </Flex>
              ) : (
                <Flex direction={"column"} gap={"2"}>
                  <Flex direction={"row"} gap={"2"} align={"stretch"}>
                    {/* Template Name */}
                    <CompareAttributeFieldDiff
                      label={"Name"}
                      isDifferent={!!nameIsDifferent}
                      useOriginal={useTemplateName}
                      setUseOriginal={setUseTemplateName}
                      currentValue={props.modifiedAttribute.name || "(empty)"}
                      originalValue={templateAttribute.name || "(empty)"}
                    />
                    {/* Template Description */}
                    <CompareAttributeFieldDiff
                      label={"Description"}
                      isDifferent={!!descriptionIsDifferent}
                      useOriginal={useTemplateDescription}
                      setUseOriginal={setUseTemplateDescription}
                      currentValue={props.modifiedAttribute.description || "(empty)"}
                      originalValue={templateAttribute.description || "(empty)"}
                    />
                  </Flex>

                  {/* Template Values */}
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    p={"2"}
                    rounded={"md"}
                    border={STYLES.border.style}
                    borderColor={STYLES.border.color}
                  >
                    <Text fontWeight={"semibold"} fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
                      Values
                    </Text>

                    <Flex direction={"row"} gap={"2"} align={"stretch"}>
                      {/* Left Column: Entity Attribute */}
                      <Flex
                        direction={"column"}
                        w={"50%"}
                        p={"2"}
                        rounded={"md"}
                        border={"1px solid"}
                        borderColor={STYLES.border.color}
                        gap={"2"}
                      >
                        <Flex direction={"row"} gap={"1"} justify={"space-between"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.entity.color.icon}>
                            Current Entity
                          </Text>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            {props.entityName}: {props.modifiedAttribute.name}
                          </Text>
                        </Flex>

                        <CompareAttributeDialogCollapsible
                          sectionKey={"unmodified"}
                          icon={"check"}
                          color={unchangedValues.length === 0 ? "gray" : "green"}
                          label={"Unmodified"}
                          count={unchangedValues.length}
                          disabled={unchangedValues.length === 0}
                        >
                          {unchangedValues.length === 0 && (
                            <Text fontSize={"xs"} color={"text.subtle"}>
                              No Unmodified Values
                            </Text>
                          )}
                          {unchangedValues.map(({ entity }) => (
                            <Flex
                              key={entity._id}
                              direction={"row"}
                              gap={"1"}
                              align={"center"}
                              bg={"white"}
                              p={"1"}
                              rounded={"sm"}
                              justify={"space-between"}
                            >
                              <Flex direction={"row"} gap={"1"} align={"center"}>
                                <Text fontSize={"xs"} color={"text.subtle"}>
                                  Value:
                                </Text>
                                <Icon
                                  name={getValueTypeIconProps(entity.type).name}
                                  color={getValueTypeIconProps(entity.type).color}
                                  size={"xs"}
                                />
                                <Text fontSize={"xs"} fontWeight={"semibold"}>
                                  {entity.name}
                                </Text>
                              </Flex>
                            </Flex>
                          ))}
                        </CompareAttributeDialogCollapsible>

                        <CompareAttributeDialogCollapsible
                          sectionKey={"modified"}
                          icon={"edit"}
                          color={modifiedValues.length === 0 ? "gray" : "orange"}
                          label={"Modified"}
                          count={modifiedValues.length}
                          disabled={modifiedValues.length === 0}
                        >
                          {modifiedValues.length === 0 && (
                            <Text fontSize={"xs"} color={"text.subtle"} ml={"0.5"}>
                              No Modified Values
                            </Text>
                          )}
                          {modifiedValues.map(({ entity }) => (
                            <Flex
                              key={entity._id}
                              direction={"column"}
                              gap={"0.5"}
                              bg={"white"}
                              p={"1.5"}
                              rounded={"sm"}
                              borderLeft={"3px"}
                              borderLeftColor={"orange.400"}
                            >
                              <Flex direction={"row"} gap={"1"} align={"center"}>
                                <Text fontSize={"xs"} color={"text.subtle"}>
                                  Value:
                                </Text>
                                <Icon
                                  name={getValueTypeIconProps(entity.type).name}
                                  color={getValueTypeIconProps(entity.type).color}
                                  size={"xs"}
                                />
                                <Text fontSize={"xs"} fontWeight={"semibold"}>
                                  {entity.name}
                                </Text>
                              </Flex>
                              <Flex direction={"row"} gap={"1"} align={"center"}>
                                <Text fontSize={"xs"} color={"text.subtle"}>
                                  Data:
                                </Text>
                                {entity.type === "entity" && (
                                  <Flex direction={"row"} gap={"1"}>
                                    <Icon name={"entity"} color={STYLES.entity.color.icon} size={"xs"} />
                                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                                      {JSON.parse(entity.data)["name"]}
                                    </Text>
                                  </Flex>
                                )}
                                {entity.type === "select" && (
                                  <Flex direction={"row"} gap={"1"}>
                                    <Icon name={"v_select"} color={"teal.400"} size={"xs"} />
                                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                                      {JSON.parse(entity.data)["selected"]}
                                    </Text>
                                    <Text fontSize={"xs"}>
                                      {_.truncate(`Options: ${JSON.parse(entity.data)["options"].join(", ")}`, {
                                        length: 24,
                                      })}
                                    </Text>
                                  </Flex>
                                )}
                                {(entity.type === "text" ||
                                  entity.type === "number" ||
                                  entity.type === "date" ||
                                  entity.type === "url") && (
                                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                                    {entity.data}
                                  </Text>
                                )}
                              </Flex>
                            </Flex>
                          ))}
                        </CompareAttributeDialogCollapsible>

                        <CompareAttributeDialogCollapsible
                          sectionKey={"add-remove"}
                          icon={"remove"}
                          color={entityOnlyValues.length === 0 ? "gray" : "purple"}
                          label={"Added or Removed"}
                          count={entityOnlyValues.length}
                          disabled={entityOnlyValues.length === 0}
                        >
                          {entityOnlyValues.length === 0 && templateOnlyValues.length === 0 && (
                            <Text fontSize={"xs"} color={"text.subtle"} ml={"0.5"}>
                              No Values to Add or Remove
                            </Text>
                          )}
                          {entityOnlyValues.length > 0 && (
                            <Text
                              fontSize={"xs"}
                              fontWeight={"semibold"}
                              color={"text.muted"}
                              borderBottom={"1px"}
                              borderColor={"purple.200"}
                              pb={"0.5"}
                              ml={"0.5"}
                            >
                              Added to Current Entity
                            </Text>
                          )}
                          {entityOnlyValues.map((value) => (
                            <Flex
                              key={value._id}
                              direction={"row"}
                              gap={"1"}
                              align={"center"}
                              bg={"white"}
                              p={"1"}
                              rounded={"sm"}
                              justify={"space-between"}
                            >
                              <Flex direction={"row"} gap={"1"} align={"center"}>
                                <Text fontSize={"xs"} color={"text.subtle"}>
                                  Value:
                                </Text>
                                <Icon
                                  name={getValueTypeIconProps(value.type).name}
                                  color={getValueTypeIconProps(value.type).color}
                                  size={"xs"}
                                />
                                <Text fontSize={"xs"} fontWeight={"semibold"}>
                                  {value.name}
                                </Text>
                              </Flex>
                              <Checkbox.Root
                                size={"xs"}
                                colorPalette={"blue"}
                                checked={removeEntityValueIds.has(value._id)}
                                onCheckedChange={() => toggleSet(setRemoveEntityValueIds, value._id)}
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                                <Checkbox.Label fontSize={"xs"}>Remove</Checkbox.Label>
                              </Checkbox.Root>
                            </Flex>
                          ))}
                        </CompareAttributeDialogCollapsible>
                      </Flex>

                      <Icon name={"a_both"} size={"xs"} />

                      {/* Right Column: Template Attribute */}
                      <Flex
                        direction={"column"}
                        w={"50%"}
                        p={"2"}
                        rounded={"md"}
                        border={STYLES.border.style}
                        borderColor={STYLES.border.color}
                        gap={"2"}
                      >
                        <Flex direction={"row"} gap={"1"} justify={"space-between"}>
                          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.template.color.icon}>
                            Template
                          </Text>
                          <Text fontSize={"xs"} fontWeight={"semibold"}>
                            {templateAttribute.name}
                          </Text>
                        </Flex>

                        <CompareAttributeDialogCollapsible
                          sectionKey={"unmodified"}
                          icon={"check"}
                          color={unchangedValues.length === 0 ? "gray" : "green"}
                          label={"Unmodified"}
                          count={unchangedValues.length}
                          disabled={unchangedValues.length === 0}
                        >
                          {unchangedValues.length === 0 && (
                            <Text fontSize={"xs"} color={"text.subtle"}>
                              No Unmodified Values
                            </Text>
                          )}
                          {unchangedValues.map(({ template }) => (
                            <Flex
                              key={template._id}
                              direction={"row"}
                              gap={"1"}
                              align={"center"}
                              bg={"white"}
                              p={"1"}
                              rounded={"sm"}
                              justify={"space-between"}
                            >
                              <Flex direction={"row"} gap={"1"} align={"center"}>
                                <Text fontSize={"xs"} color={"text.subtle"}>
                                  Value:
                                </Text>
                                <Icon
                                  name={getValueTypeIconProps(template.type).name}
                                  color={getValueTypeIconProps(template.type).color}
                                  size={"xs"}
                                />
                                <Text fontSize={"xs"} fontWeight={"semibold"}>
                                  {template.name}
                                </Text>
                              </Flex>
                            </Flex>
                          ))}
                        </CompareAttributeDialogCollapsible>

                        <CompareAttributeDialogCollapsible
                          sectionKey={"modified"}
                          icon={"edit"}
                          color={modifiedValues.length === 0 ? "gray" : "orange"}
                          label={"Modified"}
                          count={modifiedValues.length}
                          disabled={modifiedValues.length === 0}
                        >
                          {modifiedValues.length === 0 && (
                            <Text fontSize={"xs"} color={"text.subtle"} ml={"0.5"}>
                              No Modified Values
                            </Text>
                          )}
                          {modifiedValues.map(({ template }) => (
                            <Flex
                              key={template._id}
                              direction={"column"}
                              gap={"0.5"}
                              bg={"white"}
                              p={"1.5"}
                              rounded={"sm"}
                              borderLeft={"3px"}
                              borderLeftColor={"orange.400"}
                            >
                              <Flex direction={"row"} justify={"space-between"} gap={"0.5"}>
                                <Flex direction={"row"} gap={"1"} align={"center"}>
                                  <Text fontSize={"xs"} color={"text.subtle"}>
                                    Value:
                                  </Text>
                                  <Icon
                                    name={getValueTypeIconProps(template.type).name}
                                    color={getValueTypeIconProps(template.type).color}
                                    size={"xs"}
                                  />
                                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                                    {template.name}
                                  </Text>
                                </Flex>
                                <Checkbox.Root
                                  size={"xs"}
                                  colorPalette={"blue"}
                                  checked={adoptModifiedValueIds.has(template._id)}
                                  onCheckedChange={() => toggleSet(setAdoptModifiedValueIds, template._id)}
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label fontSize={"xs"}>Reset to Template</Checkbox.Label>
                                </Checkbox.Root>
                              </Flex>
                              <Flex direction={"row"} gap={"1"} align={"center"}>
                                <Text fontSize={"xs"} color={"text.subtle"}>
                                  Data:
                                </Text>
                                <Tooltip disabled={template.data.length < 24} content={template.data} showArrow>
                                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                                    {_.truncate(template.data, { length: 24 })}
                                  </Text>
                                </Tooltip>
                              </Flex>
                            </Flex>
                          ))}
                        </CompareAttributeDialogCollapsible>

                        <CompareAttributeDialogCollapsible
                          sectionKey={"add-remove"}
                          icon={"add"}
                          color={templateOnlyValues.length === 0 ? "gray" : "teal"}
                          label={"Added or Removed"}
                          count={templateOnlyValues.length}
                          disabled={templateOnlyValues.length === 0}
                        >
                          {entityOnlyValues.length === 0 && templateOnlyValues.length === 0 && (
                            <Text fontSize={"xs"} color={"text.subtle"} ml={"0.5"}>
                              No Values to Add or Remove
                            </Text>
                          )}
                          {templateOnlyValues.length > 0 && (
                            <Text
                              fontSize={"xs"}
                              fontWeight={"semibold"}
                              color={"text.muted"}
                              borderBottom={"1px"}
                              borderColor={"teal.200"}
                              pb={"0.5"}
                              ml={"0.5"}
                            >
                              Available in Template
                            </Text>
                          )}
                          {templateOnlyValues.map((value) => (
                            <Flex
                              key={value._id}
                              direction={"row"}
                              gap={"1"}
                              align={"center"}
                              bg={"white"}
                              p={"1"}
                              rounded={"sm"}
                              justify={"space-between"}
                            >
                              <Flex direction={"row"} gap={"1"} align={"center"}>
                                <Text fontSize={"xs"} color={"text.subtle"}>
                                  Value:
                                </Text>
                                <Icon
                                  name={getValueTypeIconProps(value.type).name}
                                  color={getValueTypeIconProps(value.type).color}
                                  size={"xs"}
                                />
                                <Text fontSize={"xs"} fontWeight={"semibold"}>
                                  {value.name}
                                </Text>
                              </Flex>
                              <Checkbox.Root
                                size={"xs"}
                                colorPalette={"blue"}
                                checked={pullTemplateValueIds.has(value._id)}
                                onCheckedChange={() => toggleSet(setPullTemplateValueIds, value._id)}
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                                <Checkbox.Label fontSize={"xs"}>Add</Checkbox.Label>
                              </Checkbox.Root>
                            </Flex>
                          ))}
                        </CompareAttributeDialogCollapsible>
                      </Flex>
                    </Flex>
                  </Flex>
                </Flex>
              )}
            </Dialog.Body>

            <Dialog.Footer
              p={"1"}
              flexShrink={0}
              bg={STYLES.dialog.footer.bg}
              borderTop={"1px"}
              borderColor={"border.subtle"}
              roundedBottom={"md"}
            >
              <Flex direction={"row"} justify={"space-between"} gap={"2"} w={"100%"}>
                <Button size={"xs"} rounded={"md"} colorPalette={"red"} onClick={() => props.setOpen(false)}>
                  Cancel
                  <Icon name={"cross"} size={"xs"} />
                </Button>
                <Button
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  disabled={!hasSelection}
                  onClick={() => setWarningOpen(true)}
                >
                  Apply
                  <Icon name={"check"} size={"xs"} />
                </Button>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <AlertDialog
        header={"Modify Template"}
        open={warningOpen}
        setOpen={setWarningOpen}
        leftButtonLabel={"Cancel"}
        leftButtonAction={() => setWarningOpen(false)}
        rightButtonLabel={"Apply"}
        rightButtonAction={() => {
          setWarningOpen(false);
          onUpdate();
        }}
      >
        <Flex direction={"column"} gap={"2"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"status.warning.emphasized"}>
            These operations are potentially destructive!
          </Text>
          <Text fontSize={"xs"}>
            Ensure you review all changes to {props.modifiedAttribute.name} before saving. You will be able to preview
            changes.
          </Text>
        </Flex>
      </AlertDialog>
    </React.Fragment>
  );
};

export default CompareAttributeDialog;
