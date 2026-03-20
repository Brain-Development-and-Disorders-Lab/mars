// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import { Information, Warning } from "@components/Label";

// Required UI imports
import React from "react";

// Define the types and metadata for the component
const meta = {
  title: "Components/Label/Information",
  component: Information,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof Information>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    text: "This is an informational label",
  },
} satisfies Story;

export const WarningLabel: StoryObj<typeof Warning> = {
  render: () => <Warning text={"This is a warning label"} />,
};
