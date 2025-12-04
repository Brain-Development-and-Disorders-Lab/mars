// React
import React, { useState } from "react";

// Chakra UI components
import { Box, Flex, Text } from "@chakra-ui/react";

// Components
import Values from "./index";

// Types
import { IValue, GenericValueType } from "@types";

// Storybook
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Values> = {
  title: "Components/Values",
  component: Values,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A spreadsheet-like interface for editing key-value data with type selection, name, and value columns.",
      },
    },
  },
  argTypes: {
    viewOnly: {
      control: "boolean",
      description: "Whether the component is in read-only mode",
    },
    requireData: {
      control: "boolean",
      description: "Whether data fields are required",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Values>;

// Default story with empty values
export const Default: Story = {
  render: (args) => {
    const [values, setValues] = useState<IValue<GenericValueType>[]>([]);

    return (
      <Box p={4}>
        <Values {...args} values={values} setValues={setValues} />
      </Box>
    );
  },
};

// Story with pre-populated data
export const WithData: Story = {
  render: (args) => {
    const [values, setValues] = useState<IValue<GenericValueType>[]>([
      {
        _id: "1",
        name: "Project Name",
        type: "text",
        data: "MARS Project",
      },
      {
        _id: "2",
        name: "Budget",
        type: "number",
        data: 50000,
      },
      {
        _id: "3",
        name: "Start Date",
        type: "date",
        data: "2024-01-15",
      },
      {
        _id: "4",
        name: "Repository URL",
        type: "url",
        data: "https://github.com/example/mars-project",
      },
      {
        _id: "5",
        name: "Related Entity",
        type: "entity",
        data: { _id: "entity_123", name: "Sample Entity" },
      },
    ]);

    return (
      <Box p={4}>
        <Values {...args} values={values} setValues={setValues} />
      </Box>
    );
  },
};

// Read-only mode
export const ReadOnly: Story = {
  args: {
    viewOnly: true,
  },
  render: (args) => {
    const [values, setValues] = useState<IValue<GenericValueType>[]>([
      {
        _id: "1",
        name: "Project Name",
        type: "text",
        data: "MARS Project",
      },
      {
        _id: "2",
        name: "Budget",
        type: "number",
        data: 50000,
      },
    ]);

    return (
      <Box p={4}>
        <Values {...args} values={values} setValues={setValues} />
      </Box>
    );
  },
};

// Multiple rows to test scrolling
export const ManyRows: Story = {
  render: (args) => {
    const [values, setValues] = useState<IValue<GenericValueType>[]>([
      { _id: "1", name: "Row 1", type: "text", data: "Value 1" },
      { _id: "2", name: "Row 2", type: "number", data: 100 },
      { _id: "3", name: "Row 3", type: "text", data: "Value 3" },
      { _id: "4", name: "Row 4", type: "date", data: "2024-01-01" },
      { _id: "5", name: "Row 5", type: "url", data: "https://example.com" },
      { _id: "6", name: "Row 6", type: "text", data: "Value 6" },
      { _id: "7", name: "Row 7", type: "number", data: 200 },
      { _id: "8", name: "Row 8", type: "text", data: "Value 8" },
    ]);

    return (
      <Box p={4}>
        <Values {...args} values={values} setValues={setValues} />
      </Box>
    );
  },
};

// Responsive container test
export const ResponsiveContainer: Story = {
  render: (args) => {
    const [values, setValues] = useState<IValue<GenericValueType>[]>([
      {
        _id: "1",
        name: "Project Name",
        type: "text",
        data: "MARS Project",
      },
      {
        _id: "2",
        name: "Budget",
        type: "number",
        data: 50000,
      },
      {
        _id: "3",
        name: "Start Date",
        type: "date",
        data: "2024-01-15",
      },
      {
        _id: "4",
        name: "Repository URL",
        type: "url",
        data: "https://github.com/example/mars-project",
      },
      {
        _id: "5",
        name: "Description",
        type: "text",
        data: "A long description that demonstrates scrolling behavior",
      },
      {
        _id: "6",
        name: "Team Size",
        type: "number",
        data: 15,
      },
      {
        _id: "7",
        name: "Status",
        type: "text",
        data: "Active",
      },
      {
        _id: "8",
        name: "End Date",
        type: "date",
        data: "2024-12-31",
      },
    ]);

    return (
      <Flex direction="column" gap={4} p={4}>
        <Text fontSize="sm" color="gray.600">
          Container width: 320px, height: 400px (table scrollable, navigation
          fixed)
        </Text>
        <Box
          w="320px"
          h="400px"
          border="1px solid"
          borderColor="gray.300"
          p={2}
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Values {...args} values={values} setValues={setValues} />
        </Box>

        <Text fontSize="sm" color="gray.600">
          Container width: 200px, height: 300px (should scroll both directions)
        </Text>
        <Box
          w="200px"
          h="300px"
          border="1px solid"
          borderColor="gray.300"
          p={2}
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Values {...args} values={values} setValues={setValues} />
        </Box>
      </Flex>
    );
  },
};
