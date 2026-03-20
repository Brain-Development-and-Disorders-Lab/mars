// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import SearchBox from "@components/SearchBox";

// Routing
import React from "react";
import { MemoryRouter } from "react-router-dom";

// Define the types and metadata for the component
const meta = {
  title: "Components/SearchBox",
  component: SearchBox,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    apolloMocks: [],
    name: "",
  },
} satisfies Meta<typeof SearchBox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {},
} satisfies Story;

export const EntityOnly: Story = {
  args: {
    resultType: "entity",
  },
} satisfies Story;

export const ProjectOnly: Story = {
  args: {
    resultType: "project",
  },
} satisfies Story;
