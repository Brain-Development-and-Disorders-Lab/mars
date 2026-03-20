// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import Tooltip from "@components/Tooltip";

// Required UI imports
import React from "react";
import { Button } from "@chakra-ui/react";

// Define the types and metadata for the component
const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    content: "This is a tooltip",
    showArrow: true,
    children: <Button size={"xs"}>Hover me</Button>,
  },
} satisfies Story;

export const NoArrow: Story = {
  args: {
    content: "No arrow tooltip",
    showArrow: false,
    children: <Button size={"xs"}>Hover me</Button>,
  },
} satisfies Story;

export const Disabled: Story = {
  args: {
    content: "You will not see this",
    disabled: true,
    children: <Button size={"xs"}>Hover me (disabled)</Button>,
  },
} satisfies Story;
