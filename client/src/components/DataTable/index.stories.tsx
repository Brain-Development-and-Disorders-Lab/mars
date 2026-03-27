// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import DataTable from "@components/DataTable";

// Required UI imports
import React from "react";
import { Flex, Text, Button, Tag } from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import ActorTag from "@components/ActorTag";

// Utility imports
import _ from "lodash";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

// Custom types
import { EntityModel } from "@types";

// Setup default data to be used in all stories
const defaultData: Partial<EntityModel>[] = [
  {
    _id: "e_test_00",
    name: "Test Entity 00",
    description: "Test Description",
    owner: "Test User",
    archived: false,
    created: "2026-03-20",
    attributes: [],
    attachments: [],
  },
  {
    _id: "e_test_01",
    name: "Test Entity 01",
    description: "Test Description",
    owner: "Test User",
    archived: false,
    created: "2026-03-20",
    attributes: [],
    attachments: [],
  },
  {
    _id: "e_test_02",
    name: "Test Entity 02",
    description: "Test Description",
    owner: "Test User",
    archived: false,
    created: "2026-03-20",
    attributes: [],
    attachments: [],
  },
  {
    _id: "e_test_03",
    name: "Test Entity 03",
    description: "Test Description",
    owner: "Test User",
    archived: false,
    created: "2026-03-20",
    attributes: [],
    attachments: [],
  },
  {
    _id: "e_test_04",
    name: "Test Entity 04",
    description: "Test Description",
    owner: "Test User",
    archived: false,
    created: "2026-03-20",
    attributes: [],
    attachments: [],
  },
  {
    _id: "e_test_05",
    name: "Test Entity 05",
    description: "Test Description",
    owner: "Test User",
    archived: false,
    created: "2026-03-20",
    attributes: [],
    attachments: [],
  },
];

// Define the types and metadata for the component
const meta = {
  title: "Components/DataTable",
  component: DataTable,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// Setup default columns
const columnHelper = createColumnHelper<EntityModel>();
const columns = [
  columnHelper.accessor("name", {
    cell: (info) => {
      return (
        <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
          <Tooltip content={info.getValue()} disabled={info.getValue().length < 48} showArrow>
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              {_.truncate(info.getValue(), { length: 48 })}
            </Text>
          </Tooltip>
          <Button
            size="2xs"
            mx={"1"}
            variant="subtle"
            colorPalette="gray"
            aria-label={"View Entity"}
            onClick={() => {}}
          >
            View
            <Icon name={"a_right"} />
          </Button>
        </Flex>
      );
    },
    header: "Name",
    meta: {
      minWidth: 400,
    },
  }),
  columnHelper.accessor("description", {
    cell: (info) => {
      if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
        return (
          <Tag.Root colorPalette={"orange"}>
            <Tag.Label fontSize={"xs"}>Empty</Tag.Label>
          </Tag.Root>
        );
      }
      return (
        <Flex>
          <Tooltip content={info.getValue()} disabled={info.getValue().length < 64} showArrow>
            <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 64 })}</Text>
          </Tooltip>
        </Flex>
      );
    },
    header: "Description",
    enableHiding: true,
    meta: {
      minWidth: 400,
    },
  }),
  columnHelper.accessor("owner", {
    cell: (info) => {
      return <ActorTag identifier={info.getValue()} fallback={"Unknown User"} size={"sm"} inline />;
    },
    header: "Owner",
    enableHiding: true,
  }),
  columnHelper.accessor("created", {
    cell: (info) => (
      <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
        {dayjs(info.getValue()).fromNow()}
      </Text>
    ),
    header: "Created",
    enableHiding: true,
  }),
  columnHelper.accessor("attributes", {
    cell: (info) => (
      <Tag.Root colorPalette={"green"} size={"sm"}>
        <Tag.Label fontSize={"xs"}>{info.getValue().length}</Tag.Label>
      </Tag.Root>
    ),
    header: "Attributes",
    enableHiding: true,
  }),
  columnHelper.accessor("attachments", {
    cell: (info) => (
      <Tag.Root colorPalette={"purple"} size={"sm"}>
        <Tag.Label fontSize={"xs"}>{info.getValue().length}</Tag.Label>
      </Tag.Root>
    ),
    header: "Attachments",
    enableHiding: true,
  }),
];

// Default story
export const Default: Story = {
  parameters: {
    apolloMocks: [],
  },
  args: {
    columns: columns,
    data: defaultData,
    visibleColumns: {},
    selectedRows: [],
    showPagination: true,
  },
} satisfies Story;

export const Empty: Story = {
  parameters: {
    apolloMocks: [],
  },
  args: {
    columns: columns,
    data: [],
    visibleColumns: {},
    selectedRows: [],
    showPagination: true,
  },
} satisfies Story;

export const WithSelection: Story = {
  parameters: {
    apolloMocks: [],
  },
  args: {
    columns: columns,
    data: defaultData,
    visibleColumns: {},
    selectedRows: { 0: true, 1: true },
    showPagination: true,
    showSelection: true,
    actions: [
      {
        label: "Archive",
        icon: "archive",
        action: () => {},
      },
      {
        label: "Delete",
        icon: "delete",
        action: () => {},
      },
    ],
  },
} satisfies Story;

export const HiddenColumns: Story = {
  parameters: {
    apolloMocks: [],
  },
  args: {
    columns: columns,
    data: defaultData,
    visibleColumns: { description: false, owner: false },
    selectedRows: [],
    showPagination: true,
    showColumnSelect: true,
  },
} satisfies Story;

export const NoPagination: Story = {
  parameters: {
    apolloMocks: [],
  },
  args: {
    columns: columns,
    data: defaultData,
    visibleColumns: {},
    selectedRows: [],
    showPagination: false,
  },
} satisfies Story;
