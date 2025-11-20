import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Flex,
  IconButton,
  Select,
  Text,
  Checkbox,
  Menu,
  Button,
  Portal,
  createListCollection,
  Fieldset,
  Field,
  Input,
} from "@chakra-ui/react";
import {
  flexRender,
  getPaginationRowModel,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  RowData,
  ColumnFiltersState,
  SortingState,
  Table,
} from "@tanstack/react-table";
import Icon from "@components/Icon";
import { DataTableProps } from "@types";
import _ from "lodash";

// Extend TanStack Table types
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

// Column metadata for enhanced column configuration
export type ColumnMeta = {
  minWidth?: number;
  maxWidth?: number;
  fixedWidth?: number;
  isFunction?: boolean; // For columns that only contain interactive elements (checkboxes, buttons)
  align?: "left" | "center" | "right";
};

// Custom filter function for array-based filtering
const includesSome = (
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: unknown[],
) => {
  if (
    !filterValue ||
    (Array.isArray(filterValue) && filterValue.length === 0)
  ) {
    return true;
  }
  return Array.isArray(filterValue)
    ? filterValue.includes(row.getValue(columnId))
    : true;
};
(
  includesSome as unknown as { autoRemove: (val: unknown) => boolean }
).autoRemove = (val: unknown) =>
  !val || (Array.isArray(val) && val.length === 0);

// Column filter menu component
type ColumnFilterMenuProps<TData extends RowData> = {
  columnId: string;
  data: TData[];
  table: Table<TData>;
};

const ColumnFilterMenu = <TData extends RowData>({
  columnId,
  data,
  table,
}: ColumnFilterMenuProps<TData>) => {
  const [query, setQuery] = useState("");

  const getDisplayValue = (val: unknown) => {
    if (val === null || val === undefined) return "Empty";
    if (Array.isArray(val)) return `${val.length} items`;
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const getFilterKey = (val: unknown) => {
    if (val === null || val === undefined) return "empty";
    if (Array.isArray(val)) return val.length.toString();
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const values = useMemo(
    () =>
      _.uniq(
        data.map((row) => (row as Record<string, unknown>)[columnId]),
      ).filter((val) => val !== null && val !== undefined),
    [data, columnId],
  );

  const filtered = useMemo(
    () =>
      values.filter((val) =>
        getDisplayValue(val).toLowerCase().includes(query.toLowerCase()),
      ),
    [values, query],
  );

  const currentFilter =
    (table.getColumn(columnId)?.getFilterValue() as unknown[]) || [];

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          variant="subtle"
          size="xs"
          p={0}
          minW="auto"
          h="auto"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Icon
            name="filter"
            size="xs"
            color={currentFilter.length > 0 ? "blue.700" : "gray.600"}
          />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Flex direction="column" p="2" gap="2" minW="200px" maxW="200px">
              <Input
                size="sm"
                rounded="md"
                placeholder="Search values..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Flex direction="row" gap="2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    table.getColumn(columnId)?.setFilterValue(values);
                  }}
                >
                  Select All
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    table.getColumn(columnId)?.setFilterValue([]);
                  }}
                >
                  Clear All
                </Button>
              </Flex>
              <Flex direction="column" maxH="200px" overflowY="auto" gap="1">
                {filtered.map((value, index) => (
                  <Menu.CheckboxItem
                    key={`${columnId}_${getFilterKey(value)}_${index}`}
                    value={getFilterKey(value)}
                    checked={currentFilter.includes(value)}
                    closeOnSelect={false}
                    onCheckedChange={(checked) => {
                      const prev = currentFilter;
                      const next = checked
                        ? [...prev, value]
                        : prev.filter((v) => v !== value);
                      table.getColumn(columnId)?.setFilterValue(next);
                    }}
                  >
                    {getDisplayValue(value)}
                    <Menu.ItemIndicator />
                  </Menu.CheckboxItem>
                ))}
                {filtered.length === 0 && (
                  <Text fontSize="sm" color="gray.500" p="2" textAlign="center">
                    No values found
                  </Text>
                )}
              </Flex>
            </Flex>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

// Helper to check if a column can be sorted
const canSortColumn = (columnId: string): boolean => {
  return (
    columnId !== "select" &&
    columnId !== "type" &&
    columnId !== "view" &&
    columnId !== "_id" &&
    !columnId.endsWith("_id") &&
    columnId !== "id"
  );
};

// Main DataTableRemix component
const DataTableRemix = (props: DataTableProps) => {
  // Pagination state
  const [pageLength, setPageLength] = useState<string[]>(["10"]);
  const pageLengthsCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "5", value: "5" },
          { label: "10", value: "10" },
          { label: "20", value: "20" },
          { label: "50", value: "50" },
          { label: "100", value: "100" },
        ],
      }),
    [],
  );

  // Column width management
  const SELECT_COLUMN_WIDTH = 40;
  const DEFAULT_COLUMN_WIDTH = 200;
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  // Table state
  // Initialize column visibility, ensuring _id and name are always visible
  // Start with props values, which will be properly initialized by the sync effect
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initialVisibility: Record<string, boolean> = {};
    // Copy all props values
    Object.keys(props.visibleColumns).forEach((key) => {
      initialVisibility[key] = props.visibleColumns[key];
    });
    // Always ensure _id and name are visible (cannot be toggled)
    initialVisibility["_id"] = true;
    initialVisibility["name"] = true;
    return initialVisibility;
  });
  const [selectedRows, setSelectedRows] = useState(props.selectedRows);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    props.columnFilters ?? [],
  );
  const [sorting, setSorting] = useState<SortingState>([]);

  // Helper function to get column ID reliably
  const getColumnId = useCallback(
    (column: { id?: string; accessorKey?: string }) => {
      return (column.id as string) || (column.accessorKey as string) || "";
    },
    [],
  );

  // Column names for visibility selector (toggleable columns only)
  const [columnNames, setColumnNames] = useState<string[]>([]);

  // Track previous selectedRows to avoid unnecessary callbacks
  const prevSelectedRowsRef = React.useRef(selectedRows);

  // Notify parent of selected rows changes
  useEffect(() => {
    if (
      props.onSelectedRowsChange &&
      !_.isEqual(prevSelectedRowsRef.current, selectedRows)
    ) {
      const rowSet = [];
      for (const rowIndex of Object.keys(selectedRows)) {
        const row = props.data[parseInt(rowIndex)];
        if (row) {
          rowSet.push(row);
        }
      }
      props.onSelectedRowsChange(rowSet);
      prevSelectedRowsRef.current = selectedRows;
    }
  }, [selectedRows, props.data, props.onSelectedRowsChange]);

  // Track previous columnFilters to avoid unnecessary callbacks
  const prevColumnFiltersRef = React.useRef(columnFilters);

  // Notify parent of column filter changes
  useEffect(() => {
    if (
      props.onColumnFiltersChange &&
      !_.isEqual(prevColumnFiltersRef.current, columnFilters)
    ) {
      props.onColumnFiltersChange(columnFilters);
      prevColumnFiltersRef.current = columnFilters;
    }
  }, [columnFilters, props.onColumnFiltersChange]);

  // Track previous prop values to prevent loops
  const prevSelectedRowsPropRef = React.useRef(props.selectedRows);
  const prevColumnFiltersPropRef = React.useRef(props.columnFilters);

  // Sync external state changes - only when props actually change
  useEffect(() => {
    if (!_.isEqual(prevSelectedRowsPropRef.current, props.selectedRows)) {
      setSelectedRows(props.selectedRows);
      prevSelectedRowsPropRef.current = props.selectedRows;
    }
  }, [props.selectedRows]);

  useEffect(() => {
    const newFilters = props.columnFilters ?? [];
    if (!_.isEqual(prevColumnFiltersPropRef.current, newFilters)) {
      setColumnFilters(newFilters);
      prevColumnFiltersPropRef.current = newFilters;
    }
  }, [props.columnFilters]);

  // Build columns with selection column if needed
  const columns = useMemo(() => {
    const baseColumns = props.columns.map((col) => ({
      ...col,
      filterFn: includesSome,
    }));

    if (props.showSelection) {
      return [
        {
          id: "select",
          header: ({ table: tableInstance }: { table: Table<RowData> }) => (
            <Flex align="center" justify="center" w="100%" h="100%">
              <Checkbox.Root
                disabled={props.viewOnly}
                size="xs"
                colorPalette="blue"
                checked={
                  tableInstance.getIsAllRowsSelected()
                    ? true
                    : tableInstance.getIsSomeRowsSelected()
                      ? "indeterminate"
                      : false
                }
                onChange={tableInstance.getToggleAllRowsSelectedHandler()}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
              </Checkbox.Root>
            </Flex>
          ),
          cell: ({
            row,
          }: {
            row: {
              getIsSelected: () => boolean;
              getIsSomeSelected: () => boolean;
              getCanSelect: () => boolean;
              getToggleSelectedHandler: () => (event: unknown) => void;
            };
          }) => (
            <Flex align="center" justify="center" w="100%" h="100%">
              <Checkbox.Root
                size="xs"
                colorPalette="blue"
                checked={
                  row.getIsSelected()
                    ? true
                    : row.getIsSomeSelected()
                      ? "indeterminate"
                      : false
                }
                disabled={!row.getCanSelect() || props.viewOnly}
                onChange={row.getToggleSelectedHandler()}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
              </Checkbox.Root>
            </Flex>
          ),
          enableSorting: false,
          enableColumnFilter: false,
          meta: {
            fixedWidth: SELECT_COLUMN_WIDTH,
            isFunction: true,
            align: "center",
          } as ColumnMeta,
        },
        ...baseColumns,
      ];
    }
    return baseColumns;
  }, [props.columns, props.showSelection, props.viewOnly]);

  // Get all column IDs (including _id and name for display)
  const allColumnIds = useMemo(
    () =>
      columns
        .map((col) => getColumnId(col))
        .filter(
          (id) =>
            id && id.trim().length > 0 && id !== "select" && id !== "view",
        ),
    [columns, getColumnId],
  );

  // Column names collection for Select - includes all columns with disabled state
  const columnNamesCollection = useMemo(() => {
    const items = allColumnIds
      .filter((name) => name && name.trim().length > 0)
      .map((name) => ({
        value: name,
        label: _.capitalize(name) || name,
        disabled: name === "_id" || name === "name", // Disable _id and name
      }));
    return createListCollection({ items });
  }, [allColumnIds]);

  // Compute merged visibility state (props merged with internal state)
  // This ensures the Select dropdown and table reflect the current state
  // Internal state takes precedence for columns that have been set, props are used as fallback
  const mergedColumnVisibility = useMemo(() => {
    const merged = { ...columnVisibility };

    // For toggleable columns, use internal state if set, otherwise fall back to props
    // This allows user interactions to override props
    columnNames.forEach((column) => {
      if (columnVisibility[column] === undefined) {
        // If not in internal state, use props value
        if (props.visibleColumns[column] !== undefined) {
          merged[column] = props.visibleColumns[column];
        } else {
          // Default to true if not specified
          merged[column] = true;
        }
      }
      // Otherwise, keep the internal state value (already in merged from spread above)
    });

    // Always ensure _id and name are visible
    merged["_id"] = true;
    merged["name"] = true;

    // Ensure select column visibility matches showSelection prop
    merged["select"] = !!props.showSelection;

    return merged;
  }, [
    columnVisibility,
    props.visibleColumns,
    columnNames,
    props.showSelection,
  ]);

  // Initialize table
  const table = useReactTable({
    data: props.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    autoResetPageIndex: false,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      columnVisibility: mergedColumnVisibility,
      rowSelection: selectedRows,
      columnFilters,
      sorting,
    },
    onRowSelectionChange: setSelectedRows,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    filterFns: {
      includesSome,
    },
    meta: {
      updateData: (rowIndex: number, columnId: string, value: unknown) => {
        if (props.setData) {
          props.setData((data) =>
            data.map((row, index) => {
              if (index === rowIndex) {
                return {
                  ...data[rowIndex],
                  [columnId]: value,
                };
              }
              return row;
            }),
          );
        }
      },
    },
  });

  // Track column IDs from props to detect changes
  // Only include columns that can be toggled (exclude _id, name, and view)
  const columnIdsFromProps = useMemo(
    () =>
      columns
        .map((col) => getColumnId(col))
        .filter(
          (id) =>
            id &&
            id.trim().length > 0 &&
            !_.includes(["_id", "name", "view"], id),
        ),
    [columns, getColumnId],
  );

  // Initialize column widths and names - only when column structure changes
  useEffect(() => {
    const visibleColumnIds = columnIdsFromProps;

    // Only update if column names actually changed
    const currentColumnNames = columnNames.join(",");
    const newColumnNames = visibleColumnIds.join(",");
    if (currentColumnNames !== newColumnNames) {
      setColumnNames(visibleColumnIds);
    }

    // Initialize column widths - only if not already set
    const initialWidths: Record<string, number> = {};
    let hasNewWidths = false;
    columns.forEach((column) => {
      const id = getColumnId(column);
      if (id && id !== "select" && !_.includes(["_id", "name", "view"], id)) {
        if (!columnWidths[id]) {
          const meta = column.meta as ColumnMeta | undefined;
          initialWidths[id] =
            meta?.fixedWidth || meta?.minWidth || DEFAULT_COLUMN_WIDTH;
          hasNewWidths = true;
        }
      }
    });
    if (hasNewWidths) {
      setColumnWidths((prev) => ({ ...prev, ...initialWidths }));
    }
  }, [columnIdsFromProps, columnNames, columnWidths, columns]);

  // Track previous values for visibility sync
  const prevColumnIdsRef = React.useRef<string[]>([]);
  const prevVisibleColumnsRef = React.useRef(props.visibleColumns);
  const prevShowSelectionRef = React.useRef(props.showSelection);

  // Sync visibility state - consolidated effect to avoid loops
  useEffect(() => {
    const visibleColumnIds = columnIdsFromProps;
    const columnIdsChanged =
      visibleColumnIds.join(",") !== prevColumnIdsRef.current.join(",");
    const visibleColumnsChanged = !_.isEqual(
      prevVisibleColumnsRef.current,
      props.visibleColumns,
    );
    const showSelectionChanged =
      prevShowSelectionRef.current !== props.showSelection;

    // Only run if something actually changed
    if (!columnIdsChanged && !visibleColumnsChanged && !showSelectionChanged) {
      return;
    }

    // Use functional update to get current state without including it in dependencies
    setColumnVisibility((currentVisibility) => {
      const updatedVisibility = { ...currentVisibility };
      let hasChanges = false;

      // Always ensure _id and name are visible (cannot be toggled)
      const allColumnIds = columns
        .map((col) => getColumnId(col))
        .filter(Boolean);
      allColumnIds.forEach((columnId) => {
        if (columnId === "_id" || columnId === "name") {
          if (updatedVisibility[columnId] !== true) {
            updatedVisibility[columnId] = true;
            hasChanges = true;
          }
        }
      });

      // Sync from props (only if props changed)
      if (visibleColumnsChanged) {
        Object.keys(props.visibleColumns).forEach((column) => {
          // Only sync toggleable columns (not _id, name, or select)
          if (
            column !== "select" &&
            column !== "_id" &&
            column !== "name" &&
            columnNames.includes(column) &&
            props.visibleColumns[column] !== undefined
          ) {
            if (updatedVisibility[column] !== props.visibleColumns[column]) {
              updatedVisibility[column] = props.visibleColumns[column];
              hasChanges = true;
            }
          }
        });
        prevVisibleColumnsRef.current = props.visibleColumns;
      }

      // Set defaults for new toggleable columns (only when column structure changes)
      // Also initialize columns from props if they exist in props but not in internal state
      if (columnIdsChanged) {
        visibleColumnIds.forEach((column) => {
          if (updatedVisibility[column] === undefined) {
            // Use props value if available, otherwise default to true
            updatedVisibility[column] =
              props.visibleColumns[column] !== undefined
                ? props.visibleColumns[column]
                : true;
            hasChanges = true;
          }
        });
        prevColumnIdsRef.current = visibleColumnIds;
      }

      // Sync select column (only if prop changed)
      if (showSelectionChanged) {
        const shouldShowSelect = !!props.showSelection;
        if (updatedVisibility["select"] !== shouldShowSelect) {
          updatedVisibility["select"] = shouldShowSelect;
          hasChanges = true;
        }
        prevShowSelectionRef.current = props.showSelection;
      }

      // Only return new object if there are changes, otherwise return current to prevent re-render
      return hasChanges ? updatedVisibility : currentVisibility;
    });
  }, [columnIdsFromProps, props.visibleColumns, props.showSelection, columns]);

  // Get visible columns for the Select value (includes always-visible _id and name)
  const visibleColumnsForSelect = useMemo(() => {
    const visibleToggleable = columnNames.filter(
      (column) => mergedColumnVisibility[column] === true,
    );
    // Always include _id and name in the value to show them as selected (but disabled)
    const alwaysVisible = allColumnIds.filter(
      (id) => id === "_id" || id === "name",
    );
    return [...alwaysVisible, ...visibleToggleable];
  }, [columnNames, mergedColumnVisibility, allColumnIds]);

  // Update column visibility from selector
  const updateColumnVisibility = useCallback(
    (columns: string[]) => {
      setColumnVisibility((currentVisibility) => {
        const updatedVisibility = { ...currentVisibility };
        const toggleableColumns = columnNames;

        // Hide all toggleable columns first
        toggleableColumns.forEach((column) => {
          updatedVisibility[column] = false;
        });

        // Show selected columns
        columns.forEach((column) => {
          if (toggleableColumns.includes(column)) {
            updatedVisibility[column] = true;
          }
        });

        // Always keep _id and name visible
        updatedVisibility["_id"] = true;
        updatedVisibility["name"] = true;

        // Sync select column
        updatedVisibility["select"] = !!props.showSelection;

        return updatedVisibility;
      });
    },
    [columnNames, props.showSelection],
  );

  // Container ref for measuring width
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  // Measure container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  // Calculate total minimum width of all visible columns
  const calculateTotalMinWidth = useCallback(() => {
    const visibleHeaders =
      headerGroups[0]?.headers.filter((header) =>
        header.column.getIsVisible(),
      ) || [];

    let totalMinWidth = 0;
    visibleHeaders.forEach((header) => {
      const id = header.id;
      if (id === "select") {
        totalMinWidth += SELECT_COLUMN_WIDTH;
      } else {
        const meta = header.column.columnDef.meta as ColumnMeta | undefined;
        if (meta?.fixedWidth) {
          totalMinWidth += meta.fixedWidth;
        } else {
          totalMinWidth +=
            columnWidths[id] || meta?.minWidth || DEFAULT_COLUMN_WIDTH;
        }
      }
    });
    return totalMinWidth;
  }, [headerGroups, columnWidths]);

  const totalMinWidth = calculateTotalMinWidth();
  const needsScrolling =
    containerWidth !== null && totalMinWidth > containerWidth;

  // Get column width helper - now handles responsive sizing
  const getColumnWidth = useCallback(
    (columnId: string, isLast: boolean): string | undefined => {
      if (columnId === "select") {
        return `${SELECT_COLUMN_WIDTH}px`;
      }
      const meta = table.getColumn(columnId)?.columnDef.meta as
        | ColumnMeta
        | undefined;

      // Fixed width columns always use their fixed width
      if (meta?.fixedWidth) {
        return `${meta.fixedWidth}px`;
      }

      const minWidth =
        columnWidths[columnId] || meta?.minWidth || DEFAULT_COLUMN_WIDTH;

      // If we need scrolling, use min widths (no flex)
      if (needsScrolling) {
        return `${minWidth}px`;
      }

      // If we have extra space, distribute it
      // Last non-fixed column gets remaining space
      if (isLast) {
        return undefined; // Flex to fill remaining space
      }

      // Other non-fixed columns use their min width but can grow
      return `${minWidth}px`;
    },
    [columnWidths, table, needsScrolling],
  );

  // Get column alignment helper
  const getColumnAlign = useCallback(
    (columnId: string): "left" | "center" | "right" => {
      const meta = table.getColumn(columnId)?.columnDef.meta as
        | ColumnMeta
        | undefined;
      return meta?.align || "left";
    },
    [table],
  );

  return (
    <Box
      w="100%"
      maxW="100%"
      display="flex"
      flexDirection="column"
      css={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Scrollable table container */}
      <Box
        ref={containerRef}
        w="100%"
        maxW="100%"
        flex="1"
        minH="0"
        minW="0"
        overflowX={needsScrolling ? "auto" : "hidden"}
        overflowY="auto"
        position="relative"
        className="data-table-scroll-container"
      >
        <Box
          w="100%"
          minW={needsScrolling ? `${totalMinWidth}px` : "100%"}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          {/* Header Row */}
          {headerGroups.length > 0 && (
            <Flex
              gap={0}
              bg="gray.100"
              borderBottom="1px solid"
              borderColor="gray.200"
              direction="row"
              w="100%"
            >
              {headerGroups[0].headers
                .filter((header) => header.column.getIsVisible())
                .map((header, headerIndex, visibleHeaders) => {
                  const isSelectColumn = header.id === "select";
                  const isLastColumn =
                    headerIndex === visibleHeaders.length - 1;
                  const columnWidth = getColumnWidth(header.id, isLastColumn);
                  const align = getColumnAlign(header.id);

                  const meta = table.getColumn(header.id)?.columnDef.meta as
                    | ColumnMeta
                    | undefined;
                  const isFixed = meta?.fixedWidth !== undefined;
                  const flexValue =
                    isLastColumn && !needsScrolling && !isFixed
                      ? "1"
                      : "0 0 auto";

                  return (
                    <Flex
                      key={header.id}
                      w={columnWidth}
                      flex={flexValue}
                      minW={columnWidth}
                      px={1}
                      py={1}
                      fontSize="xs"
                      fontWeight="semibold"
                      color="gray.600"
                      bg="gray.100"
                      borderRight={!isLastColumn ? "1px solid" : "none"}
                      borderColor="gray.200"
                      position="relative"
                      textAlign={align}
                      lineHeight="1.2"
                      align="center"
                      justify={"center"}
                      overflow="hidden"
                      flexShrink={0}
                    >
                      {isSelectColumn ? (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      ) : (
                        <Flex
                          direction="row"
                          align="center"
                          gap={1}
                          justify={"space-between"}
                          w="100%"
                        >
                          <Text textAlign={align}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </Text>
                          <Flex
                            direction="row"
                            gap={1}
                            align="center"
                            justify="center"
                          >
                            {canSortColumn(header.id) && (
                              <Button
                                size="xs"
                                variant="subtle"
                                p={0}
                                minW="auto"
                                h="auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  header.column.getToggleSortingHandler()?.(e);
                                }}
                              >
                                <Icon
                                  name={
                                    header.column.getIsSorted() === "desc"
                                      ? "sort_up"
                                      : header.column.getIsSorted() === "asc"
                                        ? "sort_down"
                                        : "sort"
                                  }
                                  color={
                                    header.column.getIsSorted()
                                      ? "blue.700"
                                      : "gray.600"
                                  }
                                  size="xs"
                                />
                              </Button>
                            )}
                            {canSortColumn(header.id) && (
                              <ColumnFilterMenu<RowData>
                                columnId={header.id}
                                data={props.data}
                                table={table}
                              />
                            )}
                          </Flex>
                        </Flex>
                      )}
                    </Flex>
                  );
                })}
            </Flex>
          )}

          {/* Data Rows */}
          <Box overflowY="auto" overflowX="hidden" w="100%">
            {rows.map((row, rowIndex) => {
              const isSelected = row.getIsSelected();
              const visibleCells = row.getVisibleCells();
              return (
                <Flex
                  key={row.id}
                  id={row.id}
                  gap={0}
                  w="100%"
                  borderBottom={
                    rowIndex < rows.length - 1 ? "1px solid" : "none"
                  }
                  borderColor="gray.200"
                  _hover={{ bg: "gray.25" }}
                  overflow="hidden"
                  bg={isSelected ? "blue.50" : "transparent"}
                >
                  {visibleCells.map((cell, cellIndex) => {
                    const isLastCell = cellIndex === visibleCells.length - 1;
                    const columnWidth = getColumnWidth(
                      cell.column.id,
                      isLastCell,
                    );
                    const align = getColumnAlign(cell.column.id);
                    const meta = cell.column.columnDef.meta as
                      | ColumnMeta
                      | undefined;
                    const isFixed = meta?.fixedWidth !== undefined;
                    const flexValue =
                      isLastCell && !needsScrolling && !isFixed
                        ? "1"
                        : "0 0 auto";

                    return (
                      <Box
                        key={cell.id}
                        id={cell.id}
                        w={columnWidth}
                        flex={flexValue}
                        minW={columnWidth}
                        px={1}
                        py={0.5}
                        borderRight={!isLastCell ? "1px solid" : "none"}
                        borderColor="gray.200"
                        textAlign={align}
                        overflow="hidden"
                        display="flex"
                        alignItems="center"
                        justifyContent={
                          align === "center"
                            ? "center"
                            : align === "right"
                              ? "flex-end"
                              : "flex-start"
                        }
                        bg={isSelected ? "blue.50" : "transparent"}
                        flexShrink={0}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </Box>
                    );
                  })}
                </Flex>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Pagination and Controls Toolbar */}
      <Flex
        gap={1}
        align="center"
        wrap="wrap"
        justify="space-between"
        w="100%"
        mt={1}
        flexShrink={0}
      >
        {/* Left side: Pagination controls */}
        {props.showPagination && (
          <Flex direction="row" gap={1} align="center" wrap="wrap">
            <IconButton
              variant="outline"
              size="xs"
              rounded="md"
              aria-label="first page"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <Icon name="c_double_left" />
            </IconButton>
            <IconButton
              variant="outline"
              size="xs"
              rounded="md"
              aria-label="previous page"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <Icon name="c_left" />
            </IconButton>
            {table.getPageCount() > 0 && (
              <Flex gap={1}>
                <Text fontSize="xs" fontWeight="semibold">
                  {table.getState().pagination.pageIndex + 1}
                </Text>
                <Text fontSize="xs"> of </Text>
                <Text fontSize="xs" fontWeight="semibold">
                  {table.getPageCount()}
                </Text>
              </Flex>
            )}
            <IconButton
              variant="outline"
              size="xs"
              rounded="md"
              aria-label="next page"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <Icon name="c_right" />
            </IconButton>
            <IconButton
              variant="outline"
              size="xs"
              rounded="md"
              aria-label="last page"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <Icon name="c_double_right" />
            </IconButton>
          </Flex>
        )}

        {/* Center: Actions and Column Selector */}
        <Flex
          direction="row"
          gap={1}
          align="center"
          justify="start"
          grow={1}
          wrap="wrap"
        >
          {!props.viewOnly && props.showSelection && (
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button colorPalette="yellow" size="xs" rounded="md">
                  Actions
                  <Icon name="lightning" size="xs" />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content p={1}>
                  {props.actions && props.actions.length > 0 ? (
                    props.actions.map((action) => (
                      <Menu.Item
                        onClick={() => {
                          action.action(table, selectedRows);
                        }}
                        key={action.label}
                        disabled={
                          (Object.keys(selectedRows).length === 0 ||
                            _.isUndefined(props.actions) ||
                            props.actions?.length === 0) &&
                          !action.alwaysEnabled
                        }
                        value={action.label}
                      >
                        <Flex direction="row" gap="1" align="center">
                          <Icon name={action.icon} size="xs" />
                          <Text fontSize="xs">{action.label}</Text>
                        </Flex>
                      </Menu.Item>
                    ))
                  ) : (
                    <Menu.Item
                      key="no-actions"
                      disabled
                      value="No actions available"
                    >
                      <Flex direction="row" gap="1" align="center">
                        <Text fontSize="xs">No Actions available</Text>
                      </Flex>
                    </Menu.Item>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          )}

          {allColumnIds.length > 0 && props.showColumnSelect && (
            <Flex
              direction="row"
              gap={1}
              align="center"
              wrap="wrap"
              justify="center"
              grow={1}
            >
              <Text fontSize="xs" display={{ base: "none", sm: "block" }}>
                Columns:
              </Text>
              <Select.Root
                key="select-columns"
                size="xs"
                w="200px"
                collection={columnNamesCollection}
                value={visibleColumnsForSelect}
                onValueChange={(details) => {
                  // Filter out disabled columns (_id and name) from the selection
                  const toggleableColumns = (details.value as string[]).filter(
                    (col) => col !== "_id" && col !== "name",
                  );
                  updateColumnVisibility(toggleableColumns);
                }}
                multiple
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger rounded="md">
                    <Select.ValueText placeholder="Visible Columns" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {(columnNamesCollection.items || []).map((item) => {
                        const isDisabled =
                          item.disabled === true ||
                          item.value === "_id" ||
                          item.value === "name";
                        return (
                          <Select.Item
                            item={item}
                            key={item.value}
                            pointerEvents={isDisabled ? "none" : "auto"}
                            opacity={isDisabled ? 0.5 : 1}
                            cursor={isDisabled ? "not-allowed" : "pointer"}
                            onClick={(e) => {
                              if (isDisabled) {
                                e.preventDefault();
                                e.stopPropagation();
                              }
                            }}
                          >
                            {item.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        );
                      })}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Flex>
          )}
        </Flex>

        {/* Right side: Page size selector */}
        {props.showPagination && (
          <Flex direction="row" gap={1} align="center" wrap="wrap">
            <Text fontSize="xs" display={{ base: "none", sm: "block" }}>
              Show:
            </Text>
            <Fieldset.Root w="fit-content">
              <Fieldset.Content>
                <Field.Root>
                  <Select.Root
                    key="select-pagesize"
                    size="xs"
                    w="80px"
                    collection={pageLengthsCollection}
                    value={pageLength}
                    onValueChange={(details) => {
                      setPageLength(details.value);
                      table.setPageSize(parseInt(details.value[0]));
                    }}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger rounded="md">
                        <Select.ValueText placeholder="Page Size" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {pageLengthsCollection.items.map((count) => (
                            <Select.Item item={count} key={count.value}>
                              {count.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
              </Fieldset.Content>
            </Fieldset.Root>
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export default DataTableRemix;
