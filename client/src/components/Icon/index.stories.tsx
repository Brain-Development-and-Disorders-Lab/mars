// React
import React from "react";

// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Existing and custom components
import { Flex, Text } from "@chakra-ui/react";
import Icon, { SYSTEM_ICONS } from "@components/Icon";

// Existing and custom types
import { IconNames } from "@types";

// Define the types and metadata for the component
const meta = {
  title: "Components/Icon",
  component: Icon,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    name: "dashboard",
  },
} satisfies Story;

export const Small: Story = {
  args: {
    name: "dashboard",
    size: "sm",
  },
} satisfies Story;

export const Medium: Story = {
  args: {
    name: "dashboard",
    size: "md",
  },
} satisfies Story;

export const Large: Story = {
  args: {
    name: "dashboard",
    size: "lg",
  },
} satisfies Story;

export const Color: Story = {
  args: {
    name: "dashboard",
    color: "red",
  },
} satisfies Story;

// All icons, rendered together for a quick visual overview
export const All: Story = {
  args: {
    name: "dashboard",
  },
  render: () => (
    <Flex wrap={"wrap"} gap={"4"}>
      {Object.keys(SYSTEM_ICONS).map((name) => (
        <Flex key={name} direction={"column"} align={"center"} gap={"1"} w={"20"}>
          <Icon name={name as IconNames} size={"sm"} />
          <Text fontSize={"xs"} textAlign={"center"} wordBreak={"break-word"}>
            {name}
          </Text>
        </Flex>
      ))}
    </Flex>
  ),
} satisfies Story;
