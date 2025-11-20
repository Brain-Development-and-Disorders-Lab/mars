import React, { useState } from "react";
import { Box } from "@chakra-ui/react";
import DataTableRemix from "./index";
import type { Meta, StoryObj } from "@storybook/react";
import { createColumnHelper } from "@tanstack/react-table";

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
  },
};

export default meta;
type Story = StoryObj<typeof DataTableRemix>;

const sampleData: SampleData[] = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Project ${String.fromCharCode(65 + (i % 26))}`,
  status: ["Active", "Inactive", "Pending"][i % 3],
  value: (i + 1) * 1000,
  description: `Description for project ${i + 1}`,
}));

const columnHelper = createColumnHelper<SampleData>();

const defaultColumns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => info.getValue(),
    meta: { minWidth: 150 },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => info.getValue(),
    meta: { minWidth: 100 },
  }),
  columnHelper.accessor("value", {
    header: "Value",
    cell: (info) => `$${info.getValue().toLocaleString()}`,
    meta: { minWidth: 120 },
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: (info) => info.getValue(),
    meta: { minWidth: 200 },
  }),
];

const defaultVisibleColumns = {
  name: true,
  status: true,
  value: true,
  description: true,
};

export const Default: Story = {
  render: (args) => {
    const [visibleColumns] = useState(defaultVisibleColumns);
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

export const WithSelection: Story = {
  render: (args) => {
    const [visibleColumns] = useState(defaultVisibleColumns);
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

export const ManyRows: Story = {
  render: (args) => {
    const [visibleColumns] = useState(defaultVisibleColumns);
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

export const ReadOnly: Story = {
  render: (args) => {
    const [visibleColumns] = useState(defaultVisibleColumns);
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

export const ResponsiveSizing: Story = {
  render: (args) => {
    const [visibleColumns] = useState(defaultVisibleColumns);
    const containerWidths = [
      { width: 1000, label: "1000px (Desktop)" },
      { width: 800, label: "800px (Tablet)" },
      { width: 500, label: "500px (Small Tablet)" },
      { width: 375, label: "375px (iPhone)" },
    ];

    return (
      <Box p={4} w="100%">
        {containerWidths.map(({ width, label }) => (
          <Box key={width} mb={8}>
            <Box mb={2} fontSize="sm" fontWeight="semibold" color="gray.700">
              {label} - Table should {width < 570 ? "scroll" : "expand"} to fill
              container
            </Box>
            <Box
              w={`${width}px`}
              h="400px"
              border="1px solid"
              borderColor="gray.300"
              p={2}
              display="flex"
              flexDirection="column"
              overflow="hidden"
              minW="0"
            >
              <DataTableRemix
                {...args}
                columns={defaultColumns}
                data={sampleData}
                visibleColumns={visibleColumns}
                selectedRows={{}}
              />
            </Box>
          </Box>
        ))}
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
