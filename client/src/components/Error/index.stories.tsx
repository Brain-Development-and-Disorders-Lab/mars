// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import ErrorDisplay from "@components/Error";

// Routing
import React from "react";
import { MemoryRouter } from "react-router-dom";

// Define the types and metadata for the component
const meta = {
  title: "Components/Error",
  component: ErrorDisplay,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    name: "",
  },
} satisfies Meta<typeof ErrorDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {},
} satisfies Story;

export const WithError: Story = {
  args: {
    error: new Error(
      "GraphQL error: Could not resolve entity with the given identifier",
    ),
  },
} satisfies Story;
