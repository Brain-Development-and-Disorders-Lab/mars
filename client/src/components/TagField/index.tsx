// React
import React from "react";
import { Tag } from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";

// Existing and custom types
import { AttributeTagProps, EmptyTagProps, ValueTagProps } from "@types";

// Utility functions and libraries
import { getValueTypeIconProps } from "@lib/util";

// Variables
import { STYLES } from "@variables";

// A single missing field, rendered as "No {label}"
export const EmptyTag = (props: EmptyTagProps) => (
  <Tag.Root colorPalette={"orange"} size={props.size}>
    <Tag.Label fontSize={"xs"}>{`No ${props.label}`}</Tag.Label>
  </Tag.Root>
);

// A single Value, colored and iconed by its data type
export const ValueTag = (props: ValueTagProps) => {
  const { name, color } = getValueTypeIconProps(props.value.type);

  return (
    <Tag.Root colorPalette={color.split(".")[0]} size={props.size}>
      <Tag.StartElement>
        <Icon name={name} color={color} size={"xs"} />
      </Tag.StartElement>
      <Tag.Label fontSize={"xs"}>{props.value.name}</Tag.Label>
    </Tag.Root>
  );
};

// A single Attribute
export const AttributeTag = (props: AttributeTagProps) => (
  <Tag.Root colorPalette={"template"} size={props.size}>
    <Tag.StartElement>
      <Icon name={"attribute"} color={STYLES.template.color.icon} size={"xs"} />
    </Tag.StartElement>
    <Tag.Label fontSize={"xs"}>{props.attribute.name}</Tag.Label>
  </Tag.Root>
);
