// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import Values from "@components/Values";

// Utility imports
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

// UI imports
import React from "react";

// Routing to support `viewOnly` that depends on `Linky`
import { MemoryRouter } from "react-router-dom";

// Custom types
import { IValue } from "@types";

// Setup default data to be used in all stories
const defaultValues: IValue[] = [
  {
    _id: "v_test_00",
    name: "Test Value 00",
    type: "date",
    data: "2026-03-14",
  },
  {
    _id: "v_test_01",
    name: "Test Value 01",
    type: "text",
    data: "test_value",
  },
  {
    _id: "v_test_02",
    name: "Test Value 02",
    type: "number",
    data: "0.3821",
  },
  {
    _id: "v_test_03",
    name: "Test Value 03",
    type: "url",
    data: "https://wustl.box.com",
  },
  {
    _id: "v_test_04",
    name: "Test Value 04",
    type: "select",
    data: JSON.stringify({
      selected: "a",
      options: ["a", "b", "c"],
    }),
  },
  {
    _id: "v_test_05",
    name: "Test Value 05",
    type: "entity",
    data: JSON.stringify({
      _id: "e_invalid_00",
      name: "Invalid Entity",
    }),
  },
];

// Define the types and metadata for the component
const meta = {
  title: "Components/Values",
  component: Values,
  parameters: {
    name: "",
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof Values>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  parameters: {
    apolloMocks: [],
  },
  args: {
    values: defaultValues,
    setValues: () => {},
  },
} satisfies Story;

export const ViewOnly: Story = {
  parameters: {
    apolloMocks: [],
  },
  args: {
    values: defaultValues,
    setValues: () => {},
    viewOnly: true,
  },
} satisfies Story;
