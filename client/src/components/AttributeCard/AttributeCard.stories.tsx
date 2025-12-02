import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Box } from "@chakra-ui/react";
import AttributeCard from "./index";
import { AttributeCardProps, IValue } from "@types";

const meta: Meta<typeof AttributeCard> = {
  title: "Components/AttributeCard",
  component: AttributeCard,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof AttributeCard>;

const mockValues: IValue<any>[] = [
  {
    _id: "value-1",
    name: "Sample Value",
    type: "text",
    data: "Example text data",
  },
];

const defaultArgs: AttributeCardProps = {
  _id: "attribute-1",
  name: "Sample Attribute",
  owner: "0000-0000-0000-0000",
  archived: false,
  description: "This is a sample attribute description",
  values: mockValues,
  restrictDataValues: false,
  onUpdate: (data) => {
    console.log("Attribute updated:", data);
  },
  onRemove: (id) => {
    console.log("Attribute removed:", id);
  },
};

export const Default: Story = {
  render: (args) => {
    return React.createElement(
      Box,
      { p: 4, w: "1000px" },
      React.createElement(AttributeCard, {
        ...defaultArgs,
        ...args,
      }),
    );
  },
  args: {},
};

export const WithRestrictedValues: Story = {
  render: (args) => {
    return React.createElement(
      Box,
      { p: 4, w: "1000px" },
      React.createElement(AttributeCard, {
        ...defaultArgs,
        permittedDataValues: ["Option 1", "Option 2", "Option 3"],
        ...args,
      }),
    );
  },
  args: {},
};

export const Empty: Story = {
  render: (args) => {
    return React.createElement(
      Box,
      { p: 4, w: "1000px" },
      React.createElement(AttributeCard, {
        ...defaultArgs,
        ...args,
      }),
    );
  },
  args: {},
};
