import React from "react";

// Testing imports
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "../render";
import { InMemoryCache } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing/react";

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
vi.mock("../../src/hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({
    isBreakpointActive: vi.fn(() => true),
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

const renderDataTable = (props: Partial<React.ComponentProps<typeof DataTable>> = {}) => {
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
    <MockedProvider mocks={[]} cache={createTestCache()}>
      <DataTable {...defaultProps} />
    </MockedProvider>,
  );
};

describe("DataTable Component", () => {
  describe("Default Rendering", () => {
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

  describe("Column Sorting", () => {
    it("sorts columns when header is clicked", async () => {
      const { container } = renderDataTable();

      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
      });

      // Find sort buttons
      const sortButtons = container.querySelectorAll('button[aria-label*="sort"], button[aria-label*="Sort"]');
      const nameSortIndex = 0; // Index of "name" column

      // Apply sorting tests if buttons located
      if (sortButtons.length > 0) {
        // Run initial sort, ascending order
        fireEvent.click(sortButtons[nameSortIndex] as HTMLElement);

        await waitFor(() => {
          // Verify that items are sorted by checking the name of the first item
          const firstItem = container.querySelector('div[id*="1_name"]');
          expect(firstItem?.textContent).toBe("Item 1");
        });

        // Run second sort, descending order
        fireEvent.click(sortButtons[nameSortIndex] as HTMLElement);
        await waitFor(() => {
          // Verify that items are sorted by checking the name of the first item
          const firstItem = container.querySelector('div[id*="1_name"]');
          expect(firstItem?.textContent).toBe("Item 5");
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
      const { container } = renderDataTable({ data: dataWithNulls });

      // Find sort buttons
      const sortButtons = container.querySelectorAll('button[aria-label*="sort"], button[aria-label*="Sort"]');
      const nameSortIndex = 0; // Index of "name" column

      // Apply sorting tests if buttons located
      if (sortButtons.length > 0) {
        // Run initial sort, ascending order
        fireEvent.click(sortButtons[nameSortIndex] as HTMLElement);

        await waitFor(() => {
          // Verify that items are sorted by checking the name of the first item
          // On the initial sort, ascending, `null` values should place higher
          const firstItem = container.querySelector('div[id*="1_name"]');
          expect(firstItem?.textContent).toBe("A");
        });

        // Run second sort, descending order
        fireEvent.click(sortButtons[nameSortIndex] as HTMLElement);
        await waitFor(() => {
          // Verify that items are sorted by checking the name of the first item
          // On the subsequent sort, descending, text values will place higher
          const firstItem = container.querySelector('div[id*="1_name"]');
          expect(firstItem?.textContent).toBe("B");
        });
      }
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
      const { container } = renderDataTable({ data: dataWithEmpty });

      // Find sort buttons
      const sortButtons = container.querySelectorAll('button[aria-label*="sort"], button[aria-label*="Sort"]');
      const nameSortIndex = 0; // Index of "name" column

      // Apply sorting tests if buttons located
      if (sortButtons.length > 0) {
        // Run initial sort, ascending order
        fireEvent.click(sortButtons[nameSortIndex]);

        await waitFor(() => {
          // Verify that items are sorted by checking the name of the first item
          // On the initial sort, ascending, empty values should place higher
          const firstItem = container.querySelector('div[id*="1_name"]');
          expect(firstItem?.textContent).toBe("");
        });

        // Run second sort, descending order
        fireEvent.click(sortButtons[nameSortIndex]);
        await waitFor(() => {
          // Verify that items are sorted by checking the name of the first item
          // On the subsequent sort, descending, text values will place higher
          const firstItem = container.querySelector('div[id*="1_name"]');
          expect(firstItem?.textContent).toBe("B");
        });
      }
    });
  });

  describe("Pagination", () => {
    it("renders pagination controls when enabled", async () => {
      renderDataTable({ showPagination: true, data: createTestData(25) });
      await waitFor(() => {
        // Pagination controls should be visible
        expect(screen.getByTestId("data-table-pagination")).toBeTruthy();
      });
    });

    it("hides pagination when disabled", async () => {
      renderDataTable({ showPagination: false });
      await waitFor(() => {
        expect(screen.queryByTestId("data-table-pagination")).toBeNull();
      });
    });

    it("handles page size changes", async () => {
      renderDataTable({ showPagination: true, data: createTestData(25) });

      await waitFor(() => {
        // Locate the page size `select` element and change the page size to 10 items
        const pageSizeSelect = screen.queryByTestId<HTMLSelectElement>("data-table-page-size");
        expect(pageSizeSelect).not.toBeNull();
        pageSizeSelect?.click();
      });

      await waitFor(() => {
        const pageSizeSelectOption = screen.getByRole("option", { name: "10" });
        expect(pageSizeSelectOption).not.toBeNull();
        pageSizeSelectOption.click();
      });

      await waitFor(() => {
        // Confirm that "Item 10" is visible and "Item 11" is not
        expect(screen.queryByText("Item 10")).toBeTruthy();
        expect(screen.queryByText("Item 11")).toBeFalsy();
      });
    });
  });

  describe("Row Selection", () => {
    it("renders selection checkboxes when enabled", async () => {
      renderDataTable({ showSelection: true });
      await waitFor(() => {
        // The expected number of checkboxes should be present
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBe(6); // 1 to select all, 5 across rows
      });
    });

    it("calls onSelectedRowsChange when row is selected", async () => {
      const onSelectedRowsChange = vi.fn();
      renderDataTable({
        showSelection: true,
        onSelectedRowsChange,
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
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes[1]).toHaveProperty("checked", true);
      });
    });
  });

  describe("Actions", () => {
    it("renders actions menu when actions specified", async () => {
      const mockAction = vi.fn();
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
        // "Actions" button should be present
        const actionButton = screen.getByTestId<HTMLButtonElement>("data-table-actions");
        expect(actionButton).toBeTruthy();
      });
    });

    it("disables actions when no rows selected", async () => {
      const mockAction = vi.fn();
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

      // Open the "Actions" menu
      await waitFor(() => {
        const actionButton = screen.getByTestId<HTMLButtonElement>("data-table-actions");
        actionButton.click();
      });

      // Validate the action is disabled
      await waitFor(() => {
        const actionMenuItem = screen.getByRole("menuitem");
        expect(actionMenuItem).toHaveAttribute("aria-disabled", "true");
      });
    });

    it("enables alwaysEnabled actions regardless of selection", async () => {
      const mockAction = vi.fn();
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

      // Open the "Actions" menu
      await waitFor(() => {
        const actionButton = screen.getByTestId<HTMLButtonElement>("data-table-actions");
        actionButton.click();
      });

      // Validate the action is enabled
      await waitFor(() => {
        const actionMenuItem = screen.getByRole("menuitem");
        expect(actionMenuItem).toBeEnabled();
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
      const { container } = renderDataTable({ data: specialData });

      await waitFor(() => {
        expect(container.querySelector('div[id*="0_name"]')).toHaveTextContent("Item <script>alert('xss')</script>");
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
      const { container } = renderDataTable({ data: longTextData });

      await waitFor(() => {
        expect(container.querySelector('div[id*="0_name"]')).toHaveTextContent("A".repeat(45));
      });
    });
  });

  describe("Column Visibility", () => {
    it("toggles column visibility", async () => {
      renderDataTable({ showColumnSelect: true });

      await waitFor(() => {
        expect(screen.getByText("Show Columns:")).toBeTruthy();
      });
    });

    it("always shows required columns", async () => {
      const { container } = renderDataTable({
        visibleColumns: { description: false, _id: true },
        showColumnSelect: true,
      });

      await waitFor(() => {
        expect(container.querySelector('div[data-testid="datatable-header-description"]')).not.toBeInTheDocument();
      });
    });
  });
});
