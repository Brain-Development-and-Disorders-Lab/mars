import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
import { useBreakpoint } from "@hooks/useBreakpoint";
import _ from "lodash";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

export type ColumnMeta = {
  minWidth?: number;
  maxWidth?: number;
  fixedWidth?: number;
  isFunction?: boolean;
  align?: "left" | "center" | "right";
};

const SELECT_COLUMN_WIDTH = 40;
const DEFAULT_COLUMN_WIDTH = 200;
const ALWAYS_VISIBLE_COLUMNS = ["_id", "name"];
const NON_TOGGLEABLE_COLUMNS = [...ALWAYS_VISIBLE_COLUMNS, "select", "view"];

const PAGE_SIZE_OPTIONS = [
  { label: "5", value: "5" },
  { label: "10", value: "10" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
];

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
  if (!Array.isArray(filterValue)) {
    return true;
  }

  const rowValue = row.getValue(columnId);

  // For arrays, compare by length (since we group by length in the filter)
  if (Array.isArray(rowValue)) {
    return filterValue.some((filterVal) => {
      if (Array.isArray(filterVal)) {
        return filterVal.length === rowValue.length;
      }
      return false;
    });
  }

  // For non-arrays, use direct comparison
  return filterValue.includes(rowValue);
};

(
  includesSome as unknown as { autoRemove: (val: unknown) => boolean }
).autoRemove = (val: unknown) =>
  !val || (Array.isArray(val) && val.length === 0);

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

  const getFilterKey = (val: unknown): string => {
    if (val === null || val === undefined) return "empty";
    if (Array.isArray(val)) {
      // For arrays, use the length as the key (arrays with same length are considered equal for filtering)
      return `array:${val.length}`;
    }
    if (typeof val === "object") {
      // For objects, use JSON.stringify for deep comparison
      return JSON.stringify(val);
    }
    // Normalize strings (trim whitespace) but preserve case
    // Convert to string and trim to handle whitespace-only differences
    const str = String(val).trim();
    return str || "empty";
  };

  const values = useMemo(() => {
    const rawValues = data.map(
      (row) => (row as Record<string, unknown>)[columnId],
    );

    // Use a Map to ensure uniqueness based on normalized keys
    // For arrays, we want to group by length, so use the display value as the key
    const uniqueMap = new Map<string, unknown>();
    for (const val of rawValues) {
      if (val !== null && val !== undefined) {
        // For arrays, use display value as key to group by length
        // For other types, use the normalized key
        const key = Array.isArray(val)
          ? getDisplayValue(val)
          : getFilterKey(val);

        // Only add if we haven't seen this normalized key before
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, val);
        }
      }
    }

    return Array.from(uniqueMap.values());
  }, [data, columnId]);

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
          onClick={(e) => e.stopPropagation()}
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
          <Menu.Content p={"1"}>
            <Flex direction="column" p="1" gap="1" minW="200px" maxW="200px">
              <Text fontSize="xs" fontWeight="semibold">
                Column Filters
              </Text>
              <Input
                size="xs"
                rounded="md"
                placeholder="Search values..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Flex direction="row" gap="2" justify="space-between">
                <Button
                  size="xs"
                  variant="outline"
                  rounded="md"
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
                  rounded="md"
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
                    fontSize="xs"
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
                    {_.truncate(getDisplayValue(value), { length: 24 })}
                    <Menu.ItemIndicator />
                  </Menu.CheckboxItem>
                ))}
                {filtered.length === 0 && (
                  <Text fontSize="xs" color="gray.500" p="2" textAlign="center">
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

/**
 * Custom sorting function that handles edge cases:
 * - null/undefined values (sorted to the end)
 * - Mixed types (converts to strings for consistent comparison)
 * - Case-insensitive string comparison
 * - Empty strings
 * - Arrays and objects (converted to string representation)
 */
const customSortingFn = (
  rowA: { getValue: (columnId: string) => unknown },
  rowB: { getValue: (columnId: string) => unknown },
  columnId: string,
): number => {
  const a = rowA.getValue(columnId);
  const b = rowB.getValue(columnId);

  // Handle null/undefined - sort to the end
  if (a === null || a === undefined) {
    if (b === null || b === undefined) return 0;
    return 1; // a is null/undefined, b is not, so a comes after
  }
  if (b === null || b === undefined) {
    return -1; // b is null/undefined, a is not, so b comes after
  }

  // Convert both values to strings for consistent comparison
  let strA: string;
  let strB: string;

  if (Array.isArray(a)) {
    strA = a.length > 0 ? String(a[0]) : "";
  } else if (typeof a === "object") {
    strA = JSON.stringify(a);
  } else {
    strA = String(a);
  }

  if (Array.isArray(b)) {
    strB = b.length > 0 ? String(b[0]) : "";
  } else if (typeof b === "object") {
    strB = JSON.stringify(b);
  } else {
    strB = String(b);
  }

  // Case-insensitive comparison
  const normalizedA = strA.toLowerCase().trim();
  const normalizedB = strB.toLowerCase().trim();

  // Compare normalized strings
  if (normalizedA < normalizedB) return -1;
  if (normalizedA > normalizedB) return 1;
  return 0;
};

const DataTable = (props: DataTableProps) => {
  const { isBreakpointActive } = useBreakpoint();
  const [pageLength, setPageLength] = useState<string[]>([
    props.pageSize?.toString() || "20",
  ]);
  const [pageIndex, setPageIndex] = useState(props.pageIndex ?? 0);
  const [sorting, setSorting] = useState<SortingState>(() => {
    // Initialize sorting state from props if provided (for server-side sorting)
    if (props.sortState) {
      return [
        {
          id: props.sortState.field,
          desc: props.sortState.direction === "desc",
        },
      ];
    }
    return [];
  });

  // Determine if we're using server-side pagination
  const isServerSidePagination = props.pageCount !== undefined;

  // Sync internal state with parent props when they change
  useEffect(() => {
    if (isServerSidePagination && props.pageIndex !== undefined) {
      setPageIndex(props.pageIndex);
    }
  }, [props.pageIndex, isServerSidePagination]);

  useEffect(() => {
    if (isServerSidePagination && props.pageSize !== undefined) {
      setPageLength([props.pageSize.toString()]);
    }
  }, [props.pageSize, isServerSidePagination]);

  // Sync sorting state with parent props (for server-side sorting)
  useEffect(() => {
    if (props.sortState) {
      setSorting([
        {
          id: props.sortState.field,
          desc: props.sortState.direction === "desc",
        },
      ]);
    } else if (props.sortState === null) {
      setSorting([]);
    }
  }, [props.sortState]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initial: Record<string, boolean> = { ...props.visibleColumns };
    ALWAYS_VISIBLE_COLUMNS.forEach((col) => {
      initial[col] = true;
    });
    return initial;
  });
  const [selectedRows, setSelectedRows] = useState(props.selectedRows);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    props.columnFilters ?? [],
  );
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevSelectedRowsRef = useRef(selectedRows);
  const prevColumnFiltersRef = useRef(columnFilters);
  const prevSelectedRowsPropRef = useRef(props.selectedRows);
  const prevColumnFiltersPropRef = useRef(props.columnFilters);
  const prevColumnIdsRef = useRef<string[]>([]);
  const prevVisibleColumnsRef = useRef(props.visibleColumns);
  const prevShowSelectionRef = useRef(props.showSelection);

  const getColumnId = useCallback(
    (column: {
      id?: string | ((...args: unknown[]) => string);
      accessorKey?: string;
    }) => {
      // Handle id as string
      if (typeof column.id === "string") {
        return column.id;
      }
      // Handle id as function - convert to string or use fallback
      if (typeof column.id === "function") {
        // For function-based ids, we can't reliably extract a string id
        // Use accessorKey as fallback, or generate a stable id
        return (column.accessorKey as string) || "";
      }
      // Fallback to accessorKey or empty string
      return (column.accessorKey as string) || "";
    },
    [],
  );

  const pageLengthsCollection = useMemo(
    () => createListCollection({ items: PAGE_SIZE_OPTIONS }),
    [],
  );

  useEffect(() => {
    if (
      props.onSelectedRowsChange &&
      !_.isEqual(prevSelectedRowsRef.current, selectedRows)
    ) {
      const rowSet = Object.keys(selectedRows)
        .map((idx) => props.data[parseInt(idx)])
        .filter(Boolean);
      props.onSelectedRowsChange(rowSet);
      prevSelectedRowsRef.current = selectedRows;
    }
  }, [selectedRows, props.data, props.onSelectedRowsChange]);

  useEffect(() => {
    if (
      props.onColumnFiltersChange &&
      !_.isEqual(prevColumnFiltersRef.current, columnFilters)
    ) {
      props.onColumnFiltersChange(columnFilters);
      prevColumnFiltersRef.current = columnFilters;
    }
  }, [columnFilters, props.onColumnFiltersChange]);

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

  const columns = useMemo(() => {
    const baseColumns = props.columns.map((col) => ({
      ...col,
      filterFn: includesSome,
      sortingFn: customSortingFn,
    }));

    if (!props.showSelection) {
      return baseColumns;
    }

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
  }, [props.columns, props.showSelection, props.viewOnly]);

  const allColumnIds = useMemo(
    () =>
      columns
        .map((col) => getColumnId(col))
        .filter(
          (id) =>
            id &&
            typeof id === "string" &&
            id.trim().length > 0 &&
            !NON_TOGGLEABLE_COLUMNS.includes(id),
        ),
    [columns, getColumnId],
  );

  const columnIdsFromProps = useMemo(
    () =>
      columns
        .map((col) => getColumnId(col))
        .filter(
          (id) =>
            id &&
            typeof id === "string" &&
            id.trim().length > 0 &&
            !ALWAYS_VISIBLE_COLUMNS.includes(id) &&
            id !== "view",
        ),
    [columns, getColumnId],
  );

  const columnNamesCollection = useMemo(() => {
    const items = allColumnIds
      .filter(
        (name) => name && typeof name === "string" && name.trim().length > 0,
      )
      .map((name) => ({
        value: name,
        label: _.capitalize(name) || name,
        disabled: ALWAYS_VISIBLE_COLUMNS.includes(name),
      }));
    return createListCollection({ items });
  }, [allColumnIds]);

  const mergedColumnVisibility = useMemo(() => {
    const merged = { ...columnVisibility };

    columnNames.forEach((column) => {
      if (columnVisibility[column] === undefined) {
        merged[column] = props.visibleColumns[column] ?? true;
      }
    });

    ALWAYS_VISIBLE_COLUMNS.forEach((col) => {
      merged[col] = true;
    });
    merged["select"] = !!props.showSelection;

    return merged;
  }, [
    columnVisibility,
    props.visibleColumns,
    columnNames,
    props.showSelection,
  ]);

  const table = useReactTable({
    data: props.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel:
      isServerSidePagination && props.onSortChange
        ? undefined
        : getSortedRowModel(),
    getPaginationRowModel: isServerSidePagination
      ? undefined
      : getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: isServerSidePagination,
    manualSorting: isServerSidePagination && props.onSortChange ? true : false,
    pageCount: props.pageCount,
    autoResetPageIndex: false,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: parseInt(pageLength[0]) || 20,
      },
    },
    state: {
      columnVisibility: mergedColumnVisibility,
      rowSelection: selectedRows,
      columnFilters,
      sorting,
      pagination: {
        pageIndex,
        pageSize: parseInt(pageLength[0]) || 20,
      },
    },
    onRowSelectionChange: setSelectedRows,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(newSorting);

      // Notify parent of sort changes for server-side sorting
      if (props.onSortChange && newSorting.length > 0) {
        const sort = newSorting[0];
        const field = sort.id;
        const direction = sort.desc ? "desc" : "asc";
        props.onSortChange(field, direction);
      } else if (props.onSortChange) {
        props.onSortChange("", null);
      }
    },
    onPaginationChange: (updater) => {
      const currentState = table.getState().pagination;
      const newState =
        typeof updater === "function" ? updater(currentState) : updater;

      const pageSizeChanged = newState.pageSize !== currentState.pageSize;

      // If page size changed, reset to page 0
      const finalPageIndex = pageSizeChanged ? 0 : newState.pageIndex;

      setPageIndex(finalPageIndex);
      if (pageSizeChanged) {
        setPageLength([newState.pageSize.toString()]);
      }

      // For server-side pagination, notify parent
      if (isServerSidePagination && props.onPaginationChange) {
        props.onPaginationChange(finalPageIndex, newState.pageSize);
      }
    },
    filterFns: {
      includesSome,
    },
    sortingFns: {
      customSort: customSortingFn,
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

  // Sync pagination changes to parent (for server-side pagination)
  // Only call onPaginationChange when user actually changes pagination, not on initial render
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isServerSidePagination && props.onPaginationChange) {
      const currentPageSize = parseInt(pageLength[0]) || 20;
      props.onPaginationChange(pageIndex, currentPageSize);
    }
  }, [pageIndex, pageLength, isServerSidePagination, props.onPaginationChange]);

  useEffect(() => {
    const currentColumnNames = columnNames.join(",");
    const newColumnNames = columnIdsFromProps.join(",");
    if (currentColumnNames !== newColumnNames) {
      setColumnNames(columnIdsFromProps);
    }

    const initialWidths: Record<string, number> = {};
    let hasNewWidths = false;
    columns.forEach((column) => {
      const id = getColumnId(column);
      if (id && !NON_TOGGLEABLE_COLUMNS.includes(id) && !columnWidths[id]) {
        const meta = column.meta as ColumnMeta | undefined;
        initialWidths[id] =
          meta?.fixedWidth || meta?.minWidth || DEFAULT_COLUMN_WIDTH;
        hasNewWidths = true;
      }
    });
    if (hasNewWidths) {
      setColumnWidths((prev) => ({ ...prev, ...initialWidths }));
    }
  }, [columnIdsFromProps, columnNames, columnWidths, columns, getColumnId]);

  useEffect(() => {
    const columnIdsChanged =
      columnIdsFromProps.join(",") !== prevColumnIdsRef.current.join(",");
    const visibleColumnsChanged = !_.isEqual(
      prevVisibleColumnsRef.current,
      props.visibleColumns,
    );
    const showSelectionChanged =
      prevShowSelectionRef.current !== props.showSelection;

    if (!columnIdsChanged && !visibleColumnsChanged && !showSelectionChanged) {
      return;
    }

    setColumnVisibility((currentVisibility) => {
      const updatedVisibility = { ...currentVisibility };
      let hasChanges = false;

      const allIds = columns.map((col) => getColumnId(col)).filter(Boolean);
      allIds.forEach((columnId) => {
        if (ALWAYS_VISIBLE_COLUMNS.includes(columnId)) {
          if (updatedVisibility[columnId] !== true) {
            updatedVisibility[columnId] = true;
            hasChanges = true;
          }
        }
      });

      if (visibleColumnsChanged) {
        Object.keys(props.visibleColumns).forEach((column) => {
          if (
            !NON_TOGGLEABLE_COLUMNS.includes(column) &&
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

      if (columnIdsChanged) {
        columnIdsFromProps.forEach((column) => {
          if (updatedVisibility[column] === undefined) {
            updatedVisibility[column] =
              props.visibleColumns[column] !== undefined
                ? props.visibleColumns[column]
                : true;
            hasChanges = true;
          }
        });
        prevColumnIdsRef.current = columnIdsFromProps;
      }

      if (showSelectionChanged) {
        const shouldShowSelect = !!props.showSelection;
        if (updatedVisibility["select"] !== shouldShowSelect) {
          updatedVisibility["select"] = shouldShowSelect;
          hasChanges = true;
        }
        prevShowSelectionRef.current = props.showSelection;
      }

      return hasChanges ? updatedVisibility : currentVisibility;
    });
  }, [
    columnIdsFromProps,
    props.visibleColumns,
    props.showSelection,
    columns,
    getColumnId,
    columnNames,
  ]);

  const visibleColumnsForSelect = useMemo(() => {
    const visibleToggleable = columnNames.filter(
      (column) => mergedColumnVisibility[column] === true,
    );
    const alwaysVisible = allColumnIds.filter((id) =>
      ALWAYS_VISIBLE_COLUMNS.includes(id),
    );
    return [...alwaysVisible, ...visibleToggleable];
  }, [columnNames, mergedColumnVisibility, allColumnIds]);

  const updateColumnVisibility = useCallback(
    (columns: string[]) => {
      setColumnVisibility((currentVisibility) => {
        const updatedVisibility = { ...currentVisibility };

        columnNames.forEach((column) => {
          updatedVisibility[column] = false;
        });

        columns.forEach((column) => {
          if (columnNames.includes(column)) {
            updatedVisibility[column] = true;
          }
        });

        ALWAYS_VISIBLE_COLUMNS.forEach((col) => {
          updatedVisibility[col] = true;
        });
        updatedVisibility["select"] = !!props.showSelection;

        return updatedVisibility;
      });
    },
    [columnNames, props.showSelection],
  );

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

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

  // Hide column visibility and page size on small tablet (md) and below
  // Show on lg and above
  const showAdvancedControls = isBreakpointActive("lg", "up");

  const getColumnMinWidth = useCallback(
    (columnId: string): number => {
      if (columnId === "select") {
        return SELECT_COLUMN_WIDTH;
      }
      const meta = table.getColumn(columnId)?.columnDef.meta as
        | ColumnMeta
        | undefined;

      if (meta?.fixedWidth) {
        return meta.fixedWidth;
      }

      return columnWidths[columnId] || meta?.minWidth || DEFAULT_COLUMN_WIDTH;
    },
    [columnWidths, table],
  );

  const getColumnWidth = useCallback(
    (columnId: string, isLast: boolean): string | undefined => {
      if (columnId === "select") {
        return `${SELECT_COLUMN_WIDTH}px`;
      }
      const meta = table.getColumn(columnId)?.columnDef.meta as
        | ColumnMeta
        | undefined;

      if (meta?.fixedWidth) {
        return `${meta.fixedWidth}px`;
      }

      const minWidth = getColumnMinWidth(columnId);

      if (isLast) {
        return undefined;
      }

      return `${minWidth}px`;
    },
    [getColumnMinWidth],
  );

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
      <Box
        ref={containerRef}
        w="100%"
        maxW="100%"
        flex="1"
        minH="0"
        minW="0"
        overflowX="auto"
        overflowY="auto"
        position="relative"
        className="data-table-scroll-container"
      >
        <Box
          w={props.fill !== false ? "100%" : `${totalMinWidth}px`}
          minW={`${totalMinWidth}px`}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          {headerGroups.length > 0 && (
            <Flex
              gap={0}
              bg="gray.100"
              borderBottom="1px solid"
              borderColor="gray.200"
              direction="row"
              w={props.fill !== false ? "100%" : `${totalMinWidth}px`}
            >
              {headerGroups[0].headers
                .filter((header) => header.column.getIsVisible())
                .map((header, headerIndex, visibleHeaders) => {
                  const isSelectColumn = header.id === "select";
                  const isLastColumn =
                    headerIndex === visibleHeaders.length - 1;
                  const columnWidth = getColumnWidth(header.id, isLastColumn);
                  const columnMinWidth = getColumnMinWidth(header.id);
                  const align = getColumnAlign(header.id);
                  return (
                    <Flex
                      key={header.id}
                      w={columnWidth}
                      flex={isLastColumn ? "1 1 auto" : "0 0 auto"}
                      minW={isLastColumn ? `${columnMinWidth}px` : columnWidth}
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
                      justify="center"
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
                          justify="space-between"
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

          <Box
            overflowY="auto"
            overflowX="hidden"
            w={props.fill !== false ? "100%" : `${totalMinWidth}px`}
          >
            {rows.map((row, rowIndex) => {
              const isSelected = row.getIsSelected();
              const visibleCells = row.getVisibleCells();
              return (
                <Flex
                  key={row.id}
                  id={row.id}
                  gap={0}
                  w={props.fill !== false ? "100%" : `${totalMinWidth}px`}
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
                    const columnMinWidth = getColumnMinWidth(cell.column.id);
                    const align = getColumnAlign(cell.column.id);
                    return (
                      <Box
                        key={cell.id}
                        id={cell.id}
                        w={columnWidth}
                        flex={isLastCell ? "1 1 auto" : "0 0 auto"}
                        minW={isLastCell ? `${columnMinWidth}px` : columnWidth}
                        h={"34px"}
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

      <Flex
        gap={1}
        align="center"
        justify="space-between"
        w="100%"
        mt={1}
        flexShrink={0}
      >
        <Flex direction="row" gap={1} align="center" flexShrink={0}>
          {props.showPagination && (
            <Flex direction="row" gap={1} align="center">
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
                    props.actions.map((action) => {
                      const isDisabled =
                        (Object.keys(selectedRows).length === 0 ||
                          _.isUndefined(props.actions) ||
                          props.actions?.length === 0) &&
                        !action.alwaysEnabled;
                      return (
                        <Menu.Item
                          onClick={() => {
                            if (!isDisabled && !action.disabled) {
                              action.action(table, selectedRows);
                            }
                          }}
                          key={action.label}
                          disabled={isDisabled || action.disabled}
                          value={action.label}
                        >
                          <Flex direction="row" gap="1" align="center">
                            <Icon name={action.icon} size="xs" />
                            <Text fontSize="xs">{action.label}</Text>
                          </Flex>
                        </Menu.Item>
                      );
                    })
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
        </Flex>

        {allColumnIds.length > 0 &&
          props.showColumnSelect &&
          showAdvancedControls && (
            <Flex
              direction="row"
              gap={1}
              align="center"
              wrap="wrap"
              justify="center"
              grow={1}
            >
              <Text fontSize="xs" display={{ base: "none", sm: "block" }}>
                Show Columns:
              </Text>
              <Select.Root
                key="select-columns"
                size="xs"
                w="200px"
                collection={columnNamesCollection}
                value={visibleColumnsForSelect}
                onValueChange={(details) => {
                  const toggleableColumns = (details.value as string[]).filter(
                    (col) => !ALWAYS_VISIBLE_COLUMNS.includes(col),
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
                        const isDisabled = ALWAYS_VISIBLE_COLUMNS.includes(
                          item.value,
                        );
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

        {props.showPagination && showAdvancedControls && (
          <Flex direction="row" gap={1} align="center" wrap="wrap">
            <Text fontSize="xs" display={{ base: "none", sm: "block" }}>
              Show Items:
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

export default DataTable;
