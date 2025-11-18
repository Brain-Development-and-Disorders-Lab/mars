// React
import React, { useState } from "react";

// Chakra UI components
import { Box } from "@chakra-ui/react";

// Components
import DataTableRemix from "./index";

// Storybook
import type { Meta, StoryObj } from "@storybook/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Text } from "@chakra-ui/react";

// Sample data type
type SampleData = {
  id: string;
  name: string;
  status: string;
  value: number;
  description: string;
};

const meta: Meta<typeof DataTableRemix> = {
  title: "Components/DataTableRemix",
  component: DataTableRemix,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A next-generation data table component with updated styling and spacing matching ValuesRemix. Features sorting, filtering, pagination, and row selection.",
      },
    },
  },
  argTypes: {
    viewOnly: {
      control: "boolean",
      description: "Whether the component is in read-only mode",
    },
    showPagination: {
      control: "boolean",
      description: "Whether to show pagination controls",
    },
    showSelection: {
      control: "boolean",
      description: "Whether to show row selection checkboxes",
    },
    showColumnSelect: {
      control: "boolean",
      description: "Whether to show column visibility selector",
    },
    onSelectedRowsChange: {
      action: "selectedRowsChanged",
      table: {
        disable: true,
      },
    },
    onColumnFiltersChange: {
      action: "columnFiltersChanged",
      table: {
        disable: true,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTableRemix>;

// Sample data
const sampleData: SampleData[] = [
  {
    id: "1",
    name: "Project Alpha",
    status: "Active",
    value: 1000,
    description: "A sample project for testing",
  },
  {
    id: "2",
    name: "Project Beta",
    status: "Inactive",
    value: 2000,
    description: "Another sample project",
  },
  {
    id: "3",
    name: "Project Gamma",
    status: "Active",
    value: 3000,
    description: "Third project in the list",
  },
  {
    id: "4",
    name: "Project Delta",
    status: "Pending",
    value: 4000,
    description: "Fourth project example",
  },
  {
    id: "5",
    name: "Project Epsilon",
    status: "Active",
    value: 5000,
    description: "Fifth project for demonstration",
  },
  {
    id: "6",
    name: "Project Zeta",
    status: "Inactive",
    value: 6000,
    description: "Sixth project sample",
  },
  {
    id: "7",
    name: "Project Eta",
    status: "Active",
    value: 7000,
    description: "Seventh project example",
  },
  {
    id: "8",
    name: "Project Theta",
    status: "Pending",
    value: 8000,
    description: "Eighth project in the dataset",
  },
  {
    id: "9",
    name: "Project Iota",
    status: "Active",
    value: 9000,
    description: "Ninth project for testing",
  },
  {
    id: "10",
    name: "Project Kappa",
    status: "Inactive",
    value: 10000,
    description: "Tenth project sample",
  },
  {
    id: "11",
    name: "Project Lambda",
    status: "Active",
    value: 11000,
    description: "Eleventh project example",
  },
  {
    id: "12",
    name: "Project Mu",
    status: "Pending",
    value: 12000,
    description: "Twelfth project in the list",
  },
];

// Create column helper
const columnHelper = createColumnHelper<SampleData>();

// Default columns
const defaultColumns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => <Text fontSize="xs">{info.getValue()}</Text>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => <Text fontSize="xs">{info.getValue()}</Text>,
  }),
  columnHelper.accessor("value", {
    header: "Value",
    cell: (info) => (
      <Text fontSize="xs" fontVariantNumeric="tabular-nums">
        ${info.getValue().toLocaleString()}
      </Text>
    ),
    meta: {
      isNumeric: true,
    },
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: (info) => <Text fontSize="xs">{info.getValue()}</Text>,
  }),
];

// Default story
export const Default: Story = {
  render: (args) => {
    const [visibleColumns] = useState({
      name: true,
      status: true,
      value: true,
      description: true,
    });

    return (
      <Box p={4} w="100%" maxW="1200px">
        <DataTableRemix
          {...args}
          columns={defaultColumns}
          data={sampleData}
          visibleColumns={visibleColumns}
          selectedRows={{}}
        />
      </Box>
    );
  },
  args: {
    showPagination: true,
    showSelection: false,
    showColumnSelect: false,
    viewOnly: false,
  },
};

// Story with selection enabled
export const WithSelection: Story = {
  render: (args) => {
    const [visibleColumns] = useState({
      name: true,
      status: true,
      value: true,
      description: true,
    });

    return (
      <Box p={4} w="100%" maxW="1200px">
        <DataTableRemix
          {...args}
          columns={defaultColumns}
          data={sampleData}
          visibleColumns={visibleColumns}
          selectedRows={{}}
          actions={[
            {
              label: "Delete Selected",
              icon: "delete",
              action: (_table, rows) => {
                console.log("Delete action", rows);
              },
            },
          ]}
        />
      </Box>
    );
  },
  args: {
    showPagination: true,
    showSelection: true,
    showColumnSelect: true,
    viewOnly: false,
  },
};

// Story with many rows to test pagination
export const ManyRows: Story = {
  render: (args) => {
    const [visibleColumns] = useState({
      name: true,
      status: true,
      value: true,
      description: true,
    });

    // Generate more data
    const manyRows = Array.from({ length: 50 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Project ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
      status: ["Active", "Inactive", "Pending"][i % 3],
      value: (i + 1) * 1000,
      description: `Description for project ${i + 1}`,
    }));

    return (
      <Box p={4} w="100%" maxW="1200px">
        <DataTableRemix
          {...args}
          columns={defaultColumns}
          data={manyRows}
          visibleColumns={visibleColumns}
          selectedRows={{}}
        />
      </Box>
    );
  },
  args: {
    showPagination: true,
    showSelection: false,
    showColumnSelect: true,
    viewOnly: false,
  },
};

// Read-only mode
export const ReadOnly: Story = {
  render: (args) => {
    const [visibleColumns] = useState({
      name: true,
      status: true,
      value: true,
      description: true,
    });

    return (
      <Box p={4} w="100%" maxW="1200px">
        <DataTableRemix
          {...args}
          columns={defaultColumns}
          data={sampleData}
          visibleColumns={visibleColumns}
          selectedRows={{}}
        />
      </Box>
    );
  },
  args: {
    showPagination: true,
    showSelection: false,
    showColumnSelect: false,
    viewOnly: true,
  },
};
