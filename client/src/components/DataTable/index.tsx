// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  IconButton,
  Select,
  Table,
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
} from "@tanstack/react-table";
import Icon from "@components/Icon";

// Custom hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Existing and custom types
import { DataTableProps } from "@types";
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

// Utility functions and libraries
import _ from "lodash";

// Custom filter function for array inclusion
const includesSome = (row: any, columnId: string, filterValue: unknown[]) => {
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
// Auto remove when filter array empty
(includesSome as any).autoRemove = (val: unknown) =>
  !val || (Array.isArray(val) && val.length === 0);

type ColumnFilterMenuProps = {
  columnId: string;
  data: any[];
  table: any;
};

const ColumnFilterMenu = ({ columnId, data, table }: ColumnFilterMenuProps) => {
  const [query, setQuery] = useState("");

  // Helper function to convert values to display strings
  const getDisplayValue = (val: any) => {
    if (val === null || val === undefined) return "Empty";
    if (Array.isArray(val)) return `${val.length} items`;
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  // Helper function to get filter key (what we actually filter by)
  const getFilterKey = (val: any) => {
    if (val === null || val === undefined) return "empty";
    if (Array.isArray(val)) return val.length.toString();
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const values = React.useMemo(
    () =>
      _.uniq(data.map((row) => row[columnId])).filter(
        (val) => val !== null && val !== undefined,
      ),
    [data, columnId],
  );

  const filtered = React.useMemo(
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
          variant="ghost"
          size="xs"
          p="1"
          minW="auto"
          h="auto"
          style={{ marginLeft: "4px" }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Icon
            name="filter"
            style={{
              cursor: "pointer",
              color: currentFilter.length > 0 ? "#3182ce" : "inherit",
            }}
          />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Flex direction="column" p="2" gap="2" minW="200px" maxW="300px">
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

const DataTable = (props: DataTableProps) => {
  // Breakpoint state
  const { isBreakpointActive } = useBreakpoint();

  // Page length collection
  const [pageLength, setPageLength] = useState<string[]>(["10"]);
  const pageLengthsCollection = createListCollection({
    items: [
      { label: "10", value: "10" },
      { label: "20", value: "20" },
      { label: "50", value: "50" },
      { label: "100", value: "100" },
    ],
  });
  const selectPageSizeRef = React.useRef<HTMLDivElement>(null);

  // Table visibility state
  const [columnVisibility, setColumnVisibility] = useState(
    props.visibleColumns,
  );

  // Table row selection state
  const [selectedRows, setSelectedRows] = useState(props.selectedRows);

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    props.columnFilters ?? [],
  );

  // `useEffect` for when the rows are selected
  useEffect(() => {
    if (props.onSelectedRowsChange) {
      const rowSet = [];
      for (const rowIndex of Object.keys(selectedRows)) {
        // Get the corresponding row based on the current selected index
        rowSet.push(props.data[parseInt(rowIndex)]);
      }
      props.onSelectedRowsChange(rowSet);
    }
  }, [selectedRows]);

  // Create ReactTable instance
  const table = useReactTable({
    columns: [
      // Checkbox select column
      ...(_.isEqual(props.showSelection, true)
        ? [
            {
              id: "select",
              header: ({ table }: any) => (
                <Checkbox.Root
                  {...{
                    disabled: props.viewOnly,
                    pl: "1",
                    variant: "outline",
                    checked: table.getIsAllRowsSelected()
                      ? true
                      : table.getIsSomeRowsSelected()
                        ? "indeterminate"
                        : false,
                    invalid: false,
                    onChange: table.getToggleAllRowsSelectedHandler(),
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              ),
              cell: ({ row }: any) => (
                <Checkbox.Root
                  {...{
                    id: `s_${Math.random().toString(16).slice(2)}`,
                    pl: "1",
                    variant: "outline",
                    checked: row.getIsSelected()
                      ? true
                      : row.getIsSomeSelected()
                        ? "indeterminate"
                        : false,
                    disabled: !row.getCanSelect() || props.viewOnly,
                    invalid: false,
                    onChange: row.getToggleSelectedHandler(),
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              ),
            },
          ]
        : []),
      ...props.columns.map((col) => ({ ...col, filterFn: includesSome })),
    ],
    data: props.data,
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
      columnVisibility: columnVisibility,
      rowSelection: selectedRows,
      columnFilters: columnFilters,
    },
    onRowSelectionChange: setSelectedRows,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    filterFns: {
      includesSome,
    },
    meta: {
      updateData: (rowIndex: number, columnId: any, value: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        props.setData &&
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
      },
    },
  });

  // Effect to update the column visibility
  useEffect(() => {
    const updatedVisibility = _.cloneDeep(columnVisibility);
    Object.keys(props.visibleColumns).map((column) => {
      updatedVisibility[column] = props.visibleColumns[column];
    });
    setColumnVisibility(updatedVisibility);
  }, [props.visibleColumns]);

  // Column selector state
  const [columnNames, setColumnNames] = useState([] as string[]);
  const [columnNamesCollection, setColumnNamesCollection] = useState(
    createListCollection<string>({ items: [] }),
  );

  useEffect(() => {
    // Get a list of all column names
    const columns = table
      .getAllColumns()
      .filter((column) => {
        return !_.includes(["_id", "select", "name", "view"], column.id);
      })
      .map((column) => column.id);
    setColumnNames(columns);
    setColumnNamesCollection(createListCollection({ items: columns }));

    // Set the column visibilities
    const updatedVisibility = _.cloneDeep(columnVisibility);
    columns.map((column) => {
      if (!_.isUndefined(columnVisibility[column])) {
        updatedVisibility[column] = true;
      }
    });
    setColumnVisibility(updatedVisibility);
  }, []);

  // Effect to update the selected rows
  useEffect(() => {
    setSelectedRows(props.selectedRows);
  }, [props.selectedRows]);

  // When column filters change, notify parent if needed
  useEffect(() => {
    props.onColumnFiltersChange && props.onColumnFiltersChange(columnFilters);
  }, [columnFilters]);

  // Effect to update the column filters
  useEffect(() => {
    setColumnFilters(props.columnFilters ?? []);
  }, [props.columnFilters]);

  // Add a counter for the number of presented paginated items
  const [itemCountComponent, setItemCountComponent] = useState(<Flex></Flex>);
  const updateItemCountComponent = () => {
    const page = table.getState().pagination.pageIndex;
    const pageSize = table.getState().pagination.pageSize;

    if (props.data.length === 0) {
      setItemCountComponent(<Flex></Flex>);
    } else if (page === 0) {
      setItemCountComponent(
        <Flex direction={"row"} gap={"1"} align={"center"}>
          <Text fontSize={"sm"}>Showing:</Text>
          <Text fontSize={"sm"} fontWeight={"semibold"}>
            1 - {props.data.length > pageSize ? pageSize : props.data.length}
          </Text>
          <Text fontSize={"sm"}>of {props.data.length}</Text>
        </Flex>,
      );
    } else if (page < table.getPageCount() - 1) {
      setItemCountComponent(
        <Flex direction={"row"} gap={"1"} align={"center"}>
          <Text fontSize={"sm"}>Showing:</Text>
          <Text fontSize={"sm"} fontWeight={"semibold"}>
            {pageSize * page + 1} - {pageSize * (page + 1)}
          </Text>
          <Text fontSize={"sm"}>of {props.data.length}</Text>
        </Flex>,
      );
    } else {
      setItemCountComponent(
        <Flex direction={"row"} gap={"1"} align={"center"}>
          <Text fontSize={"sm"}>Showing:</Text>
          <Text fontSize={"sm"} fontWeight={"semibold"}>
            {pageSize * page + 1} - {props.data.length}
          </Text>
          <Text fontSize={"sm"}>of {props.data.length}</Text>
        </Flex>,
      );
    }
  };
  useEffect(() => {
    updateItemCountComponent();
  }, [table.getState().pagination.pageIndex, props.data.length]);

  // Exclude columns that are not sortable, i.e. checkboxes and buttons
  const canSortColumn = (header: any) => {
    return (
      !_.isEqual(header.id, "select") &&
      !_.isEqual(header.id, "type") &&
      !_.isEqual(header.id, "view") &&
      !_.isEqual(header.id, "_id") &&
      !_.endsWith(header.id, "_id") &&
      !_.isEqual(header.id, "id")
    );
  };

  // Utility function to get sorting handlers with correct behaviour
  const getToggleSortingHandler = (header: any) => {
    if (!canSortColumn(header)) return;
    return header.column.getToggleSortingHandler();
  };

  /**
   * Update the column visibility depending on the column selected
   * @param column Name of the column
   */
  const updateColumnVisibility = (columns: string[]) => {
    const updatedVisibility = _.cloneDeep(columnVisibility);

    // Reset visibility on update
    for (const column of Object.keys(updatedVisibility)) {
      // Hide all columns
      updatedVisibility[column] = false;
    }

    // Re-instate column visibility if defined
    for (const column of columns) {
      if (
        !_.isUndefined(updatedVisibility[column]) ||
        updatedVisibility[column] === false
      ) {
        updatedVisibility[column] = true;
      }
    }
    setColumnVisibility(updatedVisibility);
  };

  return (
    <Flex w={"100%"} direction={"column"}>
      <Table.Root variant={"line"} size={"sm"} w={"100%"} interactive>
        {/* Table head */}
        <Table.Header bg={"gray.50"} p={"0"}>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const meta: any = header.column.columnDef.meta;

                // Customize the column widths depending on data contents
                let width = "auto";
                if (_.isEqual(header.id, "select")) {
                  // Dynamically set the width for the checkboxes
                  width = "30px";
                } else if (_.isEqual(header.id, "type")) {
                  width = "100px";
                }

                return (
                  <Table.ColumnHeader
                    key={header.id}
                    onClick={getToggleSortingHandler(header)}
                    fontVariantNumeric={meta?.isNumeric}
                    w={width}
                    _hover={canSortColumn(header) ? { cursor: "pointer" } : {}}
                    transition={
                      canSortColumn(header)
                        ? "background-color 0.3s ease-in-out, color 0.3s ease-in-out"
                        : ""
                    }
                    p={"1"}
                  >
                    <Flex>
                      <Flex
                        px={header.column.getIsSorted() ? "2" : "0"}
                        py={"1"}
                        rounded={"full"}
                        border={canSortColumn(header) ? "1px solid" : ""}
                        borderColor={
                          header.column.getIsSorted()
                            ? "blue.300"
                            : "transparent"
                        }
                        bg={
                          header.column.getIsSorted()
                            ? "blue.100"
                            : "transparent"
                        }
                        align={"center"}
                      >
                        <Flex
                          fontWeight={"bold"}
                          fontSize={"sm"}
                          color={
                            header.column.getIsSorted() ? "blue.700" : "black"
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </Flex>
                        {canSortColumn(header) && (
                          <Icon
                            name={
                              header.column.getIsSorted() === "desc"
                                ? "sort_up"
                                : header.column.getIsSorted() === "asc"
                                  ? "sort_down"
                                  : "sort"
                            }
                            color={
                              header.column.getIsSorted() ? "blue.700" : "black"
                            }
                            style={{ marginLeft: "4px" }}
                          />
                        )}
                        {canSortColumn(header) && (
                          <ColumnFilterMenu
                            columnId={header.id}
                            data={props.data}
                            table={table}
                          />
                        )}
                      </Flex>
                    </Flex>
                  </Table.ColumnHeader>
                );
              })}
            </Table.Row>
          ))}
        </Table.Header>

        {/* Table body */}
        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <Table.Row id={row.id} key={row.id} w={"auto"}>
              {row.getVisibleCells().map((cell) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const meta: any = cell.column.columnDef.meta;
                return (
                  <Table.Cell
                    id={cell.id}
                    key={cell.id}
                    fontVariantNumeric={meta?.isNumeric}
                    px={"1"}
                    py={"1"}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                );
              })}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Flex
        direction={"row"}
        pt={props.showSelection || props.showPagination ? "2" : ""}
        gap={"2"}
        justify={"space-between"}
        w={"100%"}
        wrap={"wrap"}
        align={"center"}
      >
        <Flex gap={"2"} direction={"row"} align={"center"}>
          {/* Actions button */}
          {props.showSelection && (
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button colorPalette={"yellow"} size={"sm"} rounded={"md"}>
                  Actions
                  <Icon name={"lightning"} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  {props.actions &&
                    props.actions.length > 0 &&
                    props.actions?.map((action) => {
                      return (
                        <Menu.Item
                          onClick={() => {
                            action.action(table, selectedRows);
                          }}
                          key={action.label}
                          disabled={
                            (Object.keys(selectedRows).length === 0 ||
                              _.isUndefined(props.actions) ||
                              props.actions?.length === 0) &&
                            action.alwaysEnabled !== true
                          }
                          value={action.label}
                        >
                          <Flex direction={"row"} gap={"2"} align={"center"}>
                            <Icon name={action.icon} />
                            <Text fontSize={"sm"}>{action.label}</Text>
                          </Flex>
                        </Menu.Item>
                      );
                    })}
                  {(_.isUndefined(props.actions) ||
                    props.actions.length === 0) && (
                    <Menu.Item
                      key={"no-actions"}
                      disabled
                      value={"No actions available"}
                    >
                      <Flex direction={"row"} gap={"2"} align={"center"}>
                        <Text fontSize={"sm"}>No Actions available</Text>
                      </Flex>
                    </Menu.Item>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          )}

          {columnNames.length > 0 && props.showColumnSelect && (
            <Select.Root
              key={"select-columns"}
              size={"sm"}
              w={"200px"}
              collection={columnNamesCollection}
              value={Object.keys(columnVisibility).filter(
                (column) => columnVisibility[column] === true,
              )}
              onValueChange={(details) => {
                updateColumnVisibility(details.items);
              }}
              multiple
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger rounded={"md"}>
                  <Select.ValueText placeholder={"Visible Columns"} />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {columnNamesCollection.items.map((name) => (
                      <Select.Item item={name} key={name}>
                        {_.capitalize(name)}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          )}
        </Flex>

        {/* Table item counter */}
        {props.showItemCount &&
          isBreakpointActive("xl", "up") &&
          itemCountComponent}

        {props.showPagination && (
          <Flex gap={"2"} align={"center"} ref={selectPageSizeRef}>
            <Text fontSize={"sm"}>Shown Per Page:</Text>
            <Fieldset.Root w={"fit-content"}>
              <Fieldset.Content>
                <Field.Root>
                  <Select.Root
                    key={"select-pagesize"}
                    size={"sm"}
                    w={"80px"}
                    collection={pageLengthsCollection}
                    value={pageLength}
                    onValueChange={(details) => {
                      setPageLength(details.value);
                      table.setPageSize(parseInt(details.value[0]));
                    }}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger rounded={"md"}>
                        <Select.ValueText placeholder={"Page Size"} />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal container={selectPageSizeRef}>
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

            <Flex direction={"row"} gap={"2"} align={"center"}>
              <IconButton
                variant={"outline"}
                size={"sm"}
                rounded={"md"}
                aria-label="first page"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <Icon name={"c_double_left"} />
              </IconButton>
              <IconButton
                variant={"outline"}
                size={"sm"}
                rounded={"md"}
                aria-label="previous page"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <Icon name={"c_left"} />
              </IconButton>
              {table.getPageCount() > 0 && (
                <Flex gap={"1"}>
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    {table.getState().pagination.pageIndex + 1}
                  </Text>
                  <Text fontSize={"sm"}> of </Text>
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    {table.getPageCount()}
                  </Text>
                </Flex>
              )}
              <IconButton
                variant={"outline"}
                size={"sm"}
                rounded={"md"}
                aria-label="next page"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <Icon name={"c_right"} />
              </IconButton>
              <IconButton
                variant={"outline"}
                size={"sm"}
                rounded={"md"}
                aria-label="last page"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <Icon name={"c_double_right"} />
              </IconButton>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default DataTable;
