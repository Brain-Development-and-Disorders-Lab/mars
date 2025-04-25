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
  useBreakpoint,
  Portal,
  createListCollection,
} from "@chakra-ui/react";
import {
  flexRender,
  getPaginationRowModel,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  RowData,
} from "@tanstack/react-table";
import Icon from "@components/Icon";

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

const DataTable = (props: DataTableProps) => {
  const breakpoint = useBreakpoint();

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

  // Table visibility state
  const [columnVisibility, setColumnVisibility] = useState(
    props.visibleColumns,
  );

  // Table row selection state
  const [selectedRows, setSelectedRows] = useState(props.selectedRows);

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
                    checked: table.getIsAllRowsSelected(),
                    isIndeterminate: table.getIsSomeRowsSelected(),
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
                    checked: row.getIsSelected(),
                    disabled: !row.getCanSelect() || props.viewOnly,
                    isIndeterminate: row.getIsSomeSelected(),
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
      ...props.columns,
    ],
    data: props.data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      columnVisibility: columnVisibility,
      rowSelection: selectedRows,
    },
    onRowSelectionChange: setSelectedRows,
    onColumnVisibilityChange: setColumnVisibility,
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
                    <Flex align={"center"} py={"1"}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {canSortColumn(header) && (
                        <Icon
                          name={
                            header.column.getIsSorted() === "desc"
                              ? "sort_up"
                              : header.column.getIsSorted() === "asc"
                                ? "sort_down"
                                : "sort"
                          }
                          style={{ marginLeft: "4px" }}
                        />
                      )}
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
            <Menu.Root size={"sm"}>
              <Menu.Trigger asChild>
                <Button colorPalette={"yellow"} size={"sm"} rounded={"md"}>
                  Actions
                  <Icon name={"lightning"} />
                </Button>
              </Menu.Trigger>
              <Portal>
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
              </Portal>
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
          _.includes(["xl", "2xl"], breakpoint) &&
          itemCountComponent}

        {props.showPagination && (
          <Flex gap={"2"} align={"center"}>
            <Text fontSize={"sm"}>Shown Per Page:</Text>
            <Select.Root
              key={"select-pagesize"}
              size={"sm"}
              w={"150px"}
              collection={pageLengthsCollection}
              value={pageLength}
              onValueChange={(details) => {
                setPageLength(details.value);
                table.setPageSize(Number(details.items[0].value));
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
