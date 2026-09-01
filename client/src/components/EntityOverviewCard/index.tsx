// React
import React from "react";

// Existing and custom components
import { Checkbox, Field, Flex, Input, Text, Textarea } from "@chakra-ui/react";
import TagActor from "@components/TagActor";
import Icon from "@components/Icon";
import Select from "@components/Select";
import TagTimestamp from "@components/TagTimestamp";
import Tooltip from "@components/Tooltip";
import TagVisibility from "@components/TagVisibility";

// Existing and custom types
import { EntityOverviewCardProps, IdentifierFormatModel } from "@types";

// Utility functions and libraries
import {
  getBaseIdentifierFormatHelperText,
  getCustomIdentifierFormatHelperText,
  isValidBaseIdentifierFormat,
  isValidCustomIdentifierFormat,
} from "@lib/util";
import _ from "lodash";

// Variables
import { BASE_IDENTIFIER_FORMATS, STYLES } from "@variables";

const isValidSecondaryIdentifierField = (
  identifierFormat: string[],
  secondaryIdentifier: string,
  customIdentifierFormats: IdentifierFormatModel[],
): boolean => {
  if (identifierFormat.length === 0) return false;
  if (
    _.includes(
      BASE_IDENTIFIER_FORMATS.map((format) => format.value),
      identifierFormat[0],
    )
  ) {
    return isValidBaseIdentifierFormat(secondaryIdentifier, identifierFormat[0]);
  }
  const formatParameters = customIdentifierFormats.filter((format) => format._id === identifierFormat[0]);
  return isValidCustomIdentifierFormat(secondaryIdentifier, formatParameters[0]);
};

const getIdentifierFormatHelperText = (format: string, customIdentifierFormats: IdentifierFormatModel[]): string => {
  if (
    _.includes(
      BASE_IDENTIFIER_FORMATS.map((baseFormat) => baseFormat.value),
      format,
    )
  ) {
    return getBaseIdentifierFormatHelperText(format);
  }
  const formatParameters = customIdentifierFormats.filter((customFormat) => customFormat._id === format);
  return getCustomIdentifierFormatHelperText(formatParameters[0]);
};

const EntityOverviewCard = ({
  name,
  onNameChange,
  nameReadOnly,
  showSecondaryIdentifier,
  onShowSecondaryIdentifierChange,
  showSecondaryIdentifierDisabled,
  secondaryIdentifierValue,
  onSecondaryIdentifierChange,
  secondaryIdentifierReadOnly,
  secondaryIdentifierDisabled,
  identifierFormat,
  onIdentifierFormatChange,
  identifierFormats,
  identifierFormatDisabled,
  customIdentifierFormats,
  showValidationErrors,
  owner,
  created,
  visibilityIsPublic,
  description,
  onDescriptionChange,
  descriptionReadOnly,
  workspace,
  isPublic,
}: EntityOverviewCardProps) => {
  const isValidField = isValidSecondaryIdentifierField(
    identifierFormat,
    secondaryIdentifierValue,
    customIdentifierFormats,
  );

  return (
    <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
      {/* Entity Overview */}
      <Flex
        direction={"column"}
        p={"2"}
        h={"fit-content"}
        gap={"2"}
        bg={"surface.card"}
        rounded={"md"}
        grow={"1"}
        border={STYLES.border.style}
        borderColor={STYLES.border.color}
        basis={{ base: "100%", md: "calc(50% - 4px)" }}
        minW={{ base: "100%", md: "calc(50% - 4px)" }}
      >
        {/* "Name" field */}
        <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
          <Flex direction={"column"} gap={"2"} grow={"1"}>
            <Flex direction={"row"} align={"center"} justify={"space-between"}>
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Name
              </Text>
              <Tooltip
                content={
                  "If your Entity has an external identifier (such as a GUID or other identifier) associated with it, you can specify it here."
                }
                showArrow
              >
                <Checkbox.Root
                  size={"xs"}
                  colorPalette={"blue"}
                  checked={showSecondaryIdentifier}
                  onCheckedChange={
                    onShowSecondaryIdentifierChange
                      ? (event) => onShowSecondaryIdentifierChange(!!event.checked)
                      : undefined
                  }
                  disabled={showSecondaryIdentifierDisabled}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                        Specify Secondary Identifier
                      </Text>
                      <Icon name={"info"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
                    </Flex>
                  </Checkbox.Label>
                </Checkbox.Root>
              </Tooltip>
            </Flex>
            <Input
              id={"entityNameInput"}
              size={"xs"}
              value={name}
              onChange={onNameChange ? (event) => onNameChange(event.target.value || "") : undefined}
              readOnly={nameReadOnly}
              rounded={"md"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"white"}
            />
          </Flex>
        </Flex>

        {/* Secondary Identifier */}
        {showSecondaryIdentifier && (
          <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
            <Flex direction={"column"} gap={"2"} grow={"3"}>
              <Field.Root invalid={showValidationErrors && showSecondaryIdentifier && !isValidField}>
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                  Secondary Identifier
                </Text>
                <Input
                  id={"entitySecondaryIdentifierInput"}
                  size={"xs"}
                  value={secondaryIdentifierValue}
                  onChange={
                    onSecondaryIdentifierChange ? (event) => onSecondaryIdentifierChange(event.target.value) : undefined
                  }
                  readOnly={secondaryIdentifierReadOnly}
                  rounded={"md"}
                  border={STYLES.border.style}
                  borderColor={STYLES.border.color}
                  bg={"white"}
                  disabled={secondaryIdentifierDisabled}
                />
                {isValidField && (
                  <Field.HelperText>
                    <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                      {getIdentifierFormatHelperText(identifierFormat[0], customIdentifierFormats)}
                    </Text>
                  </Field.HelperText>
                )}
                {showValidationErrors && (
                  <Field.ErrorText>
                    {identifierFormat.length !== 0 && !isValidField && (
                      <Text fontSize={"xs"} ml={"0.5"}>
                        {getIdentifierFormatHelperText(identifierFormat[0], customIdentifierFormats)}
                      </Text>
                    )}
                    {identifierFormat.length === 0 && (
                      <Text fontSize={"xs"} ml={"0.5"}>
                        Please select the Identifier Format
                      </Text>
                    )}
                  </Field.ErrorText>
                )}
              </Field.Root>
            </Flex>

            <Flex direction={"column"} gap={"2"} grow={"1"}>
              <Field.Root invalid={showSecondaryIdentifier && identifierFormat.length === 0}>
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                  Identifier Format
                </Text>
                <Select
                  collection={identifierFormats}
                  value={identifierFormat}
                  onValueChange={
                    onIdentifierFormatChange ? (event) => onIdentifierFormatChange(event.value) : undefined
                  }
                  disabled={identifierFormatDisabled}
                  width={"100%"}
                  placeholder={"Select Identifier Format"}
                  groupBy={(item) => item.category}
                />
                <Field.ErrorText>
                  <Text fontSize={"xs"} ml={"0.5"}>
                    Please select an Identifier Format
                  </Text>
                </Field.ErrorText>
              </Field.Root>
            </Flex>
          </Flex>
        )}

        {/* "Owner", "Timestamp", and "Visibility" fields */}
        <Flex gap={"2"} direction={"row"} w={"100%"} wrap={"wrap"}>
          {/* Owner */}
          <Flex direction={"column"} gap={"2"}>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
              Owner
            </Text>
            <TagActor
              identifier={owner}
              fallback={"Unknown User"}
              size={"sm"}
              workspace={workspace}
              isPublic={isPublic}
            />
          </Flex>

          {/* Timestamp */}
          <Flex direction={"column"} gap={"2"}>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
              Timestamp
            </Text>
            <TagTimestamp timestamp={created} description={"Created"} />
          </Flex>

          {/* Visibility */}
          <Flex direction={"column"} gap={"2"}>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
              Visibility
            </Text>
            <TagVisibility isPublic={visibilityIsPublic} isInherited />
          </Flex>
        </Flex>
      </Flex>

      {/* Description */}
      <Flex
        direction={"column"}
        p={"2"}
        h={"100%"}
        gap={"2"}
        border={STYLES.border.style}
        borderColor={STYLES.border.color}
        bg={"surface.card"}
        rounded={"md"}
        grow={"1"}
        basis={{ base: "100%", md: "calc(50% - 4px)" }}
        minW={{ base: "100%", md: "calc(50% - 4px)" }}
      >
        <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
          Description
        </Text>
        <Textarea
          id={"entityDescriptionInput"}
          value={description}
          readOnly={descriptionReadOnly}
          onChange={onDescriptionChange ? (event) => onDescriptionChange(event.target.value) : undefined}
          h={"100%"}
          size={"xs"}
        />
      </Flex>
    </Flex>
  );
};

export default EntityOverviewCard;
