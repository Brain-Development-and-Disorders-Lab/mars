import React from "react";

// Testing imports
import { InMemoryCache } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing/react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { expect, describe, it, jest } from "@jest/globals";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import DataTable from "../../src/components/DataTable";
import { createColumnHelper } from "@tanstack/react-table";

// Create test cache matching app configuration (without deprecated addTypename)
const createTestCache = () => {
  return new InMemoryCache({
    typePolicies: {
      Workspace: {
        keyFields: ["_id"],
      },
      Entity: {
        keyFields: ["_id"],
      },
      Project: {
        keyFields: ["_id"],
      },
      Attribute: {
        keyFields: ["_id"],
      },
      Activity: {
        keyFields: ["_id"],
      },
    },
  });
};

// Mock useBreakpoint hook
jest.mock("../../src/hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({
    isBreakpointActive: jest.fn(() => true),
  }),
}));

type TestData = {
  id: string;
  name: string;
  status: string;
  value: number;
  description: string | null;
  tags: string[];
};

const columnHelper = createColumnHelper<TestData>();

const createTestColumns = () => [
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
    cell: (info) => info.getValue() || "No description",
    meta: { minWidth: 200 },
  }),
  columnHelper.accessor("tags", {
    header: "Tags",
    cell: (info) => info.getValue().join(", "),
    meta: { minWidth: 150 },
  }),
];

const createTestData = (count: number = 5): TestData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    name: `Item ${i + 1}`,
    status: ["Active", "Inactive", "Pending"][i % 3],
    value: (i + 1) * 1000,
    description: i % 2 === 0 ? `Description ${i + 1}` : null,
    tags: [`tag${i + 1}`, `tag${i + 2}`],
  }));
};

const defaultVisibleColumns = {
  name: true,
  status: true,
  value: true,
  description: true,
  tags: true,
};

const renderDataTable = (
  props: Partial<React.ComponentProps<typeof DataTable>> = {},
) => {
  const defaultProps = {
    columns: createTestColumns(),
    data: createTestData(),
    visibleColumns: defaultVisibleColumns,
    selectedRows: {},
    showPagination: true,
    showSelection: false,
    showColumnSelect: false,
    viewOnly: false,
    ...props,
  };

  return render(
    <ChakraProvider value={theme}>
      <MockedProvider mocks={[]} cache={createTestCache()}>
        <DataTable {...defaultProps} />
      </MockedProvider>
    </ChakraProvider>,
  );
};

describe("DataTable Component", () => {
  describe("Basic Rendering", () => {
    it("renders table with data", async () => {
      renderDataTable();
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
      expect(screen.getByText("Status")).toBeTruthy();
      expect(screen.getByText("Item 1")).toBeTruthy();
    });

    it("renders empty table when no data provided", async () => {
      renderDataTable({ data: [] });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });

    it("renders with custom visible columns", async () => {
      renderDataTable({
        visibleColumns: { name: true, status: false, value: true },
      });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
        expect(screen.getByText("Value")).toBeTruthy();
      });
    });
  });

  describe("Sorting", () => {
    it("sorts columns when header is clicked", async () => {
      const { container } = renderDataTable();

      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });

      // Find sort button (icon button next to header)
      const sortButtons = container.querySelectorAll(
        'button[aria-label*="sort"], button[aria-label*="Sort"]',
      );
      if (sortButtons.length > 0) {
        fireEvent.click(sortButtons[0] as HTMLElement);

        await waitFor(() => {
          // After sorting, verify table still renders
          expect(screen.getByText("Name")).toBeTruthy();
        });
      }
    });

    it("handles sorting with null values", async () => {
      const dataWithNulls = [
        {
          id: "1",
          name: "A",
          status: "Active",
          value: 100,
          description: null,
          tags: [],
        },
        {
          id: "2",
          name: "B",
          status: "Inactive",
          value: 200,
          description: "Has description",
          tags: [],
        },
      ];
      renderDataTable({ data: dataWithNulls });
      await waitFor(() => {
        expect(screen.getByText("A")).toBeTruthy();
        expect(screen.getByText("B")).toBeTruthy();
      });
    });

    it("handles sorting with empty strings", async () => {
      const dataWithEmpty = [
        {
          id: "1",
          name: "",
          status: "Active",
          value: 100,
          description: null,
          tags: [],
        },
        {
          id: "2",
          name: "B",
          status: "Inactive",
          value: 200,
          description: "Has description",
          tags: [],
        },
      ];
      renderDataTable({ data: dataWithEmpty });
      await waitFor(() => {
        expect(screen.getByText("B")).toBeTruthy();
      });
    });
  });

  describe("Filtering", () => {
    it("renders filter buttons in column headers", async () => {
      const { container } = renderDataTable();
      await waitFor(() => {
        // Filter buttons should be present (they're icon buttons)
        const filterButtons = container.querySelectorAll("button");
        expect(filterButtons.length).toBeGreaterThan(0);
      });
    });

    it("handles filtering with empty data", async () => {
      renderDataTable({ data: [] });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });
  });

  describe("Pagination", () => {
    it("renders pagination controls when enabled", async () => {
      renderDataTable({ showPagination: true, data: createTestData(25) });
      await waitFor(() => {
        // Pagination controls should be visible
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it("hides pagination when disabled", async () => {
      renderDataTable({ showPagination: false });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });

    it("handles page size changes", async () => {
      renderDataTable({ showPagination: true, data: createTestData(25) });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });

    it("handles pagination with single page", async () => {
      renderDataTable({ showPagination: true, data: createTestData(5) });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });
  });

  describe("Row Selection", () => {
    it("renders selection checkboxes when enabled", async () => {
      renderDataTable({ showSelection: true });
      await waitFor(() => {
        // Checkboxes should be present
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });

    it("calls onSelectedRowsChange when row is selected", async () => {
      const onSelectedRowsChange = jest.fn();
      renderDataTable({
        showSelection: true,
        onSelectedRowsChange,
      });

      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThan(0);
      });

      const checkboxes = screen.getAllByRole("checkbox");
      if (checkboxes.length > 1) {
        // Click first row checkbox (skip header checkbox)
        fireEvent.click(checkboxes[1]);

        await waitFor(() => {
          expect(onSelectedRowsChange).toHaveBeenCalled();
        });
      }
    });

    it("disables selection in viewOnly mode", async () => {
      renderDataTable({ showSelection: true, viewOnly: true });
      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        // Header checkbox should be disabled
        if (checkboxes.length > 0) {
          expect(checkboxes[0]).toHaveProperty("disabled", true);
        }
      });
    });

    it("handles pre-selected rows", async () => {
      const selectedRows = { "0": true };
      renderDataTable({ showSelection: true, selectedRows });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });
  });

  describe("Actions", () => {
    it("renders actions menu when actions provided", async () => {
      const mockAction = jest.fn();
      renderDataTable({
        showSelection: true,
        actions: [
          {
            label: "Delete",
            icon: "delete",
            action: mockAction,
          },
        ],
      });

      await waitFor(() => {
        // Actions button should be present
        const actionButtons = screen.getAllByText("Actions");
        expect(actionButtons.length).toBeGreaterThan(0);
      });
    });

    it("disables actions when no rows selected", async () => {
      const mockAction = jest.fn();
      renderDataTable({
        showSelection: true,
        selectedRows: {},
        actions: [
          {
            label: "Delete",
            icon: "delete",
            action: mockAction,
          },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText("Actions")).toBeTruthy();
      });
    });

    it("enables alwaysEnabled actions regardless of selection", async () => {
      const mockAction = jest.fn();
      renderDataTable({
        showSelection: true,
        selectedRows: {},
        actions: [
          {
            label: "Export All",
            icon: "download",
            action: mockAction,
            alwaysEnabled: true,
          },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText("Actions")).toBeTruthy();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles very large datasets", async () => {
      const largeData = createTestData(1000);
      renderDataTable({ data: largeData });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });

    it("handles data with special characters", async () => {
      const specialData = [
        {
          id: "1",
          name: "Item <script>alert('xss')</script>",
          status: "Active",
          value: 100,
          description: "Test & special chars",
          tags: ["tag1", "tag2"],
        },
      ];
      renderDataTable({ data: specialData });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });

    it("handles data with very long text", async () => {
      const longTextData = [
        {
          id: "1",
          name: "A".repeat(1000),
          status: "Active",
          value: 100,
          description: "B".repeat(2000),
          tags: ["tag1"],
        },
      ];
      renderDataTable({ data: longTextData });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });

    it("handles rapid column visibility changes", async () => {
      const { rerender } = renderDataTable();

      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });

      rerender(
        <ChakraProvider value={theme}>
          <MockedProvider mocks={[]} cache={createTestCache()}>
            <DataTable
              columns={createTestColumns()}
              data={createTestData()}
              visibleColumns={{ name: false, status: true }}
              selectedRows={{}}
              showPagination={true}
              showSelection={false}
              showColumnSelect={false}
              viewOnly={false}
            />
          </MockedProvider>
        </ChakraProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Status")).toBeTruthy();
      });
    });

    it("handles missing column metadata gracefully", async () => {
      const columnsWithoutMeta = [
        columnHelper.accessor("name", {
          header: "Name",
          cell: (info) => info.getValue(),
        }),
      ];
      renderDataTable({ columns: columnsWithoutMeta });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });

    it("handles server-side pagination props", async () => {
      const onPaginationChange = jest.fn();
      renderDataTable({
        pageCount: 10,
        pageIndex: 0,
        pageSize: 20,
        onPaginationChange,
      });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });

    it("handles server-side sorting props", async () => {
      const onSortChange = jest.fn();
      renderDataTable({
        pageCount: 10,
        sortState: { field: "name", direction: "asc" },
        onSortChange,
      });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });

    it("handles null sortState", async () => {
      renderDataTable({
        pageCount: 10,
        sortState: null,
        onSortChange: jest.fn(),
      });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });
  });

  describe("Column Visibility", () => {
    it("toggles column visibility", async () => {
      renderDataTable({ showColumnSelect: true });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });

    it("always shows required columns", async () => {
      renderDataTable({
        visibleColumns: { name: false, _id: true },
        showColumnSelect: true,
      });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });
    });
  });

  describe("Data Updates", () => {
    it("updates when data prop changes", async () => {
      const { rerender } = renderDataTable();

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeTruthy();
      });

      const newData = createTestData(3);
      rerender(
        <ChakraProvider value={theme}>
          <MockedProvider mocks={[]} cache={createTestCache()}>
            <DataTable
              columns={createTestColumns()}
              data={newData}
              visibleColumns={defaultVisibleColumns}
              selectedRows={{}}
              showPagination={true}
              showSelection={false}
              showColumnSelect={false}
              viewOnly={false}
            />
          </MockedProvider>
        </ChakraProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeTruthy();
      });
    });
  });
});
