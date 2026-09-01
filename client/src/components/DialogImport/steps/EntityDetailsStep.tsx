// React
import React from "react";

// Components
import { Button, Field, Fieldset, Flex, Input, Portal, Select, Text } from "@chakra-ui/react";
import TagActor from "@components/TagActor";
import Icon from "@components/Icon";
import SelectCounter from "@components/SelectCounter";
import SelectIdentifierFormat from "@components/SelectIdentifierFormat";
import { SELECT_BG, SELECT_ROUNDED, SELECT_SIZE } from "@components/Select";

// Existing and custom types
import { EntityDetailsStepProps, IGenericItem } from "@types";

// Utility functions and libraries
import { isSpreadsheetFile } from "@lib/util";

// Variables
import { JSON_MIME_TYPE, STYLES } from "@variables";

const EntityDetailsStep = ({
  fileType,
  columns,
  namePrefixField,
  onNamePrefixFieldChange,
  nameField,
  onNameFieldChange,
  nameUseCounter,
  onNameUseCounterChange,
  counter,
  onCounterChange,
  onContinueDisabledChange,
  suggestions,
  isSuggesting,
  descriptionField,
  onDescriptionFieldChange,
  identifierField,
  onIdentifierFieldChange,
  identifierFormat,
  onIdentifierFormatChange,
  projectField,
  onProjectFieldChange,
  projectsCollection,
  ownerField,
  getSelectComponent,
}: EntityDetailsStepProps) => (
  <Flex
    w={"100%"}
    direction={"column"}
    gap={"2"}
    p={"2"}
    bg={STYLES.card.bg}
    border={STYLES.border.style}
    borderColor={STYLES.border.color}
    rounded={"md"}
  >
    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
      Setup
    </Text>
    {isSpreadsheetFile(fileType) && (
      <Fieldset.Root>
        <Fieldset.Content>
          <Flex direction={"row"} gap={"1"}>
            <Field.Root gap={"0.5"}>
              <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Name Prefix
              </Field.Label>
              <Input
                value={namePrefixField}
                placeholder={"Name Prefix"}
                bg={"white"}
                size={"xs"}
                rounded={"md"}
                onChange={(event) => onNamePrefixFieldChange(event.target.value)}
              />
              <Field.HelperText fontSize={"xs"} ml={"0.5"}>
                Append a prefix to each Entity name
              </Field.HelperText>
            </Field.Root>

            <Field.Root
              gap={"0.5"}
              invalid={(!nameUseCounter && nameField === undefined) || (nameUseCounter && counter === "")}
              required
            >
              <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Name
                <Field.RequiredIndicator />
              </Field.Label>
              <Flex direction={"row"} gap={"1"} w={"100%"}>
                {!nameUseCounter && getSelectComponent("name", nameField, onNameFieldChange)}
                {nameUseCounter && <SelectCounter counter={counter} setCounter={onCounterChange} showCreate />}
                <Button
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"blue"}
                  onClick={() => {
                    onNameUseCounterChange(!nameUseCounter);
                    // Reset state of name and counter fields
                    onNameFieldChange(undefined);
                    onCounterChange("");
                    // Disable 'Continue' button
                    onContinueDisabledChange(true);
                  }}
                >
                  Use {nameUseCounter ? "Column" : "Counter"}
                  <Icon name={nameUseCounter ? "v_text" : "counter"} size={"xs"} />
                </Button>
              </Flex>
              {!nameUseCounter && (
                <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                  {isSuggesting && (
                    <>
                      <Icon name={"lightning"} size={"xs"} color={"purple.300"} />
                      <Text fontSize={"xs"} color={"purple.300"}>
                        Suggesting...
                      </Text>
                    </>
                  )}
                  {!isSuggesting && suggestions?.name && suggestions.name !== nameField?.name && (
                    <>
                      <Icon name={"lightning"} size={"xs"} color={"purple.600"} />
                      <Text
                        fontSize={"xs"}
                        color={"purple.600"}
                        cursor={"pointer"}
                        _hover={{ textDecoration: "underline" }}
                        onClick={() => onNameFieldChange(columns.find((c) => c.name === suggestions.name))}
                      >
                        Suggested Column: {suggestions.name}
                      </Text>
                    </>
                  )}
                </Flex>
              )}
            </Field.Root>
          </Flex>
        </Fieldset.Content>
      </Fieldset.Root>
    )}

    {fileType === JSON_MIME_TYPE && (
      <Fieldset.Root>
        <Fieldset.Content>
          <Flex direction={"row"} gap={"1"}>
            <Field.Root gap={"0.5"}>
              <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Name Prefix
              </Field.Label>
              <Input
                value={namePrefixField}
                placeholder={"Name Prefix"}
                size={"xs"}
                bg={"white"}
                rounded={"md"}
                onChange={(event) => onNamePrefixFieldChange(event.target.value)}
              />
              <Field.HelperText fontSize={"xs"} ml={"0.5"}>
                Append a prefix to each Entity name
              </Field.HelperText>
            </Field.Root>

            <Field.Root gap={"0.5"}>
              <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Name
              </Field.Label>
              <Input size={"xs"} bg={"white"} rounded={"md"} placeholder={'JSON: "name"'} disabled readOnly />
            </Field.Root>
          </Flex>
        </Fieldset.Content>
      </Fieldset.Root>
    )}

    <Flex direction={"row"} gap={"1"}>
      <Fieldset.Root>
        <Fieldset.Content>
          <Flex direction={"row"} gap={"1"}>
            {/* Secondary Identifier */}
            <Field.Root w={"50%"} gap={"0.5"}>
              <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Secondary Identifier
              </Field.Label>
              {isSpreadsheetFile(fileType) ? (
                getSelectComponent("identifier", identifierField, onIdentifierFieldChange)
              ) : (
                <Input
                  size={"xs"}
                  bg={"white"}
                  rounded={"md"}
                  placeholder={'JSON: "secondaryIdentifier.value"'}
                  disabled
                  readOnly
                />
              )}
            </Field.Root>

            {/* Identifier Format */}
            <Field.Root w={"50%"} gap={"0.5"}>
              <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Identifier Format
              </Field.Label>
              <SelectIdentifierFormat format={identifierFormat} setFormat={onIdentifierFormatChange} showCreate />
            </Field.Root>
          </Flex>
        </Fieldset.Content>
      </Fieldset.Root>
    </Flex>

    <Flex direction={"row"} gap={"1"}>
      <Fieldset.Root>
        <Fieldset.Content>
          <Flex direction={"row"} gap={"1"}>
            {/* Description */}
            <Field.Root w={"50%"} gap={"0.5"}>
              <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Description
              </Field.Label>
              {isSpreadsheetFile(fileType) ? (
                getSelectComponent("description", descriptionField, onDescriptionFieldChange)
              ) : (
                <Input size={"xs"} bg={"white"} rounded={"md"} placeholder={'JSON: "description"'} disabled readOnly />
              )}
              <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                {isSpreadsheetFile(fileType) && isSuggesting && (
                  <>
                    <Icon name={"lightning"} size={"xs"} color={"purple.300"} />
                    <Text fontSize={"xs"} color={"purple.300"}>
                      Suggesting...
                    </Text>
                  </>
                )}
                {isSpreadsheetFile(fileType) &&
                  !isSuggesting &&
                  suggestions?.description &&
                  suggestions.description !== descriptionField?.name && (
                    <Flex direction={"row"} align={"center"} gap={"1"} py={"0"}>
                      <Icon name={"lightning"} size={"xs"} color={"purple.600"} />
                      <Text
                        fontSize={"xs"}
                        color={"purple.600"}
                        cursor={"pointer"}
                        _hover={{ textDecoration: "underline" }}
                        onClick={() =>
                          onDescriptionFieldChange(columns.find((c) => c.name === suggestions.description))
                        }
                      >
                        Suggested Column: {suggestions.description}
                      </Text>
                    </Flex>
                  )}
              </Flex>
            </Field.Root>

            {/* Project */}
            <Field.Root w={"50%"} gap={"0.5"}>
              <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
                Project
              </Field.Label>
              <Select.Root
                key={"select-project"}
                size={SELECT_SIZE}
                bg={SELECT_BG}
                rounded={SELECT_ROUNDED}
                collection={projectsCollection}
                value={[projectField]}
                onValueChange={(details) => onProjectFieldChange(details.items[0]._id)}
                disabled={projectsCollection.items.length === 0}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger data-testid={"import-column-select-trigger-project"} rounded={"md"}>
                    <Flex direction={"row"} gap={"2"} align={"center"}>
                      <Icon
                        name={"project"}
                        size={"xs"}
                        color={projectField ? STYLES.project.color.icon : STYLES.project.color.light}
                      />
                      <Text fontSize={"xs"} color={projectField ? "black" : "gray.500"}>
                        {(projectField &&
                          projectsCollection.items.filter((project) => project._id === projectField)[0].name) ||
                          "Select Project"}
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
                      {projectsCollection.items?.map((project: IGenericItem) => (
                        <Select.Item item={project} key={project._id}>
                          <Flex direction={"row"} gap={"2"} align={"center"}>
                            <Icon name={"project"} size={"xs"} color={STYLES.project.color.icon} />
                            {project.name}
                          </Flex>
                          <Select.ItemIndicator />
                        </Select.Item>
                      )) || []}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
          </Flex>
        </Fieldset.Content>
      </Fieldset.Root>
    </Flex>

    <Flex direction={"row"} gap={"2"} w={"50%"}>
      {/* Owner */}
      <Fieldset.Root>
        <Fieldset.Content>
          <Field.Root gap={"0.5"}>
            <Field.Label fontSize={"xs"} ml={"0.5"} color={STYLES.font.secondaryHeader.color}>
              Owner
            </Field.Label>
            <Flex>
              <TagActor identifier={ownerField} fallback={"Unknown"} size={"md"} />
            </Flex>
          </Field.Root>
        </Fieldset.Content>
      </Fieldset.Root>
    </Flex>
  </Flex>
);

export default EntityDetailsStep;
