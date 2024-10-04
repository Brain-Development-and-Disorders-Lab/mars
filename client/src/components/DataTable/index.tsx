// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  IconButton,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  Checkbox,
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  useBreakpoint,
  InputGroup,
  Input,
  InputRightElement,
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
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

// Utility functions and libraries
import _ from "lodash";

const DataTable = (props: DataTableProps) => {
  const breakpoint = useBreakpoint();

  // Table visibility state
  const [columnVisibility, setColumnVisibility] = useState(
    props.visibleColumns,
  );

  // Table row selection state
  const [selectedRows, setSelectedRows] = useState(props.selectedRows);

  // Create ReactTable instance
  const table = useReactTable({
    columns: [
      // Checkbox select column
      ...(_.isEqual(props.showSelection, true)
        ? [
            {
              id: "select",
              header: ({ table }: any) => (
                <Checkbox
                  {...{
                    disabled: props.viewOnly,
                    pl: "1",
                    isChecked: table.getIsAllRowsSelected(),
                    isIndeterminate: table.getIsSomeRowsSelected(),
                    isInvalid: false,
                    onChange: table.getToggleAllRowsSelectedHandler(),
                  }}
                />
              ),
              cell: ({ row }: any) => (
                <Checkbox
                  {...{
                    id: `s_${Math.random().toString(16).slice(2)}`,
                    pl: "1",
                    isChecked: row.getIsSelected(),
                    disabled: !row.getCanSelect() || props.viewOnly,
                    isIndeterminate: row.getIsSomeSelected(),
                    isInvalid: false,
                    onChange: row.getToggleSelectedHandler(),
                  }}
                />
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
  const [showColumnList, setShowColumnList] = useState(false);
  const [columnNames, setColumnNames] = useState([] as string[]);

  useEffect(() => {
    // Get a list of all column names
    const columns = table
      .getAllColumns()
      .filter((column) => {
        return !_.includes(["_id", "select", "name", "view"], column.id);
      })
      .map((column) => column.id);
    setColumnNames(columns);

    // Set the column visibilities
    const updatedVisibility = _.cloneDeep(columnVisibility);
    columns.map((column) => {
      if (_.isUndefined(columnVisibility[column])) {
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
      !_.isEqual(header.id, "id")
    );
  };

  // Utility function to get sorting handlers with correct behaviour
  const getToggleSortingHandler = (header: any) => {
    if (!canSortColumn(header)) return;
    return header.column.getToggleSortingHandler();
  };

  /**
   * Handle clicking the `Column` component dropdown
   */
  const onColumnsClick = () => {
    if (props.viewOnly !== true) {
      setShowColumnList(!showColumnList);
    }
  };

  /**
   * Update the column visibility depending on the column selected
   * @param column Name of the column
   */
  const onColumnViewClick = (column: string) => {
    const updatedVisibility = _.cloneDeep(columnVisibility);
    if (
      _.isUndefined(updatedVisibility[column]) ||
      updatedVisibility[column] === false
    ) {
      updatedVisibility[column] = true;
    } else {
      updatedVisibility[column] = false;
    }
    setColumnVisibility(updatedVisibility);
  };

  return (
    <Flex w={"100%"} direction={"column"}>
      <TableContainer overflowX={"visible"} overflowY={"visible"}>
        <Table variant={"simple"} size={"sm"} w={"100%"}>
          {/* Table head */}
          <Thead bg={"gray.50"} p={"0"}>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
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
                    <Th
                      key={header.id}
                      onClick={getToggleSortingHandler(header)}
                      isNumeric={meta?.isNumeric}
                      w={width}
                      _hover={
                        canSortColumn(header) ? { cursor: "pointer" } : {}
                      }
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
                    </Th>
                  );
                })}
              </Tr>
            ))}
          </Thead>

          {/* Table body */}
          <Tbody>
            {table.getRowModel().rows.map((row) => (
              <Tr id={row.id} key={row.id} w={"auto"}>
                {row.getVisibleCells().map((cell) => {
                  const meta: any = cell.column.columnDef.meta;
                  return (
                    <Td
                      id={cell.id}
                      key={cell.id}
                      isNumeric={meta?.isNumeric}
                      px={"1"}
                      py={"1"}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </Td>
                  );
                })}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

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
            <Menu size={"sm"}>
              <MenuButton
                as={Button}
                colorScheme={"yellow"}
                rightIcon={<Icon name={"lightning"} />}
                size={"sm"}
              >
                Actions
              </MenuButton>
              <MenuList>
                {props.actions &&
                  props.actions.length > 0 &&
                  props.actions?.map((action) => {
                    return (
                      <MenuItem
                        onClick={() => {
                          action.action(table, selectedRows);
                        }}
                        key={action.label}
                        isDisabled={
                          (Object.keys(selectedRows).length === 0 ||
                            _.isUndefined(props.actions) ||
                            props.actions?.length === 0) &&
                          action.alwaysEnabled !== true
                        }
                      >
                        <Flex direction={"row"} gap={"2"} align={"center"}>
                          <Icon name={action.icon} />
                          <Text fontSize={"sm"}>{action.label}</Text>
                        </Flex>
                      </MenuItem>
                    );
                  })}
                {(_.isUndefined(props.actions) ||
                  props.actions.length === 0) && (
                  <MenuItem key={"no-actions"} isDisabled>
                    <Flex direction={"row"} gap={"2"} align={"center"}>
                      <Text fontSize={"sm"}>No Actions available</Text>
                    </Flex>
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          )}

          {columnNames.length > 0 && props.showColumnSelect && (
            <Flex>
              <Flex pos={"relative"} w={"100%"}>
                <InputGroup size={"sm"} onClick={onColumnsClick}>
                  <Input
                    placeholder={"Show Columns"}
                    value={"Show Columns"}
                    backgroundColor={"white"}
                    data-testid={"value-editor"}
                    cursor={"pointer"}
                    size={"sm"}
                    rounded={"md"}
                    isDisabled={props.viewOnly}
                    isReadOnly
                  />
                  <InputRightElement>
                    {showColumnList ? (
                      <Icon name={"c_up"} />
                    ) : (
                      <Icon name={"c_down"} />
                    )}
                  </InputRightElement>
                </InputGroup>
                {showColumnList && (
                  <Flex
                    w={"100%"}
                    p={"2"}
                    mt={"9"}
                    gap={"2"}
                    direction={"column"}
                    bg={"white"}
                    border={"1px"}
                    borderColor={"gray.300"}
                    borderRadius={"sm"}
                    shadow={"md"}
                    position={"absolute"}
                    zIndex={"2"}
                  >
                    {columnNames.map((column) => {
                      return (
                        <Button
                          key={column}
                          variant={"ghost"}
                          onClick={() => onColumnViewClick(column)}
                          width={"full"}
                          size={"sm"}
                          justifyContent={"left"}
                        >
                          <Flex
                            direction={"row"}
                            gap={"2"}
                            justify={"space-between"}
                            w={"100%"}
                          >
                            <Text fontSize={"sm"}>{_.capitalize(column)}</Text>
                            {columnVisibility[column] && (
                              <Icon name={"check"} color={"green"} />
                            )}
                          </Flex>
                        </Button>
                      );
                    })}
                  </Flex>
                )}
              </Flex>
            </Flex>
          )}
        </Flex>

        {/* Table item counter */}
        {props.showItemCount &&
          _.includes(["xl", "2xl"], breakpoint) &&
          itemCountComponent}

        {props.showPagination && (
          <Flex gap={"2"} wrap={"wrap"}>
            <Flex gap={"2"} align={"center"}>
              <Text fontSize={"sm"}>Show:</Text>
              <Select
                id={"select-page-size"}
                size={"sm"}
                rounded={"md"}
                value={table.getState().pagination.pageSize}
                onChange={(event) => {
                  table.setPageSize(Number(event.target.value));
                }}
                isInvalid={false}
              >
                {[10, 20, 50].map((size) => {
                  return (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  );
                })}
              </Select>
            </Flex>

            <Flex direction={"row"} gap={"2"} align={"center"}>
              <IconButton
                variant={"outline"}
                size={"sm"}
                icon={<Icon name={"c_double_left"} />}
                aria-label="first page"
                onClick={() => table.setPageIndex(0)}
                isDisabled={!table.getCanPreviousPage()}
              />
              <IconButton
                variant={"outline"}
                size={"sm"}
                icon={<Icon name={"c_left"} />}
                aria-label="previous page"
                onClick={() => table.previousPage()}
                isDisabled={!table.getCanPreviousPage()}
              />
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
                icon={<Icon name={"c_right"} />}
                aria-label="next page"
                onClick={() => table.nextPage()}
                isDisabled={!table.getCanNextPage()}
              />
              <IconButton
                variant={"outline"}
                size={"sm"}
                icon={<Icon name={"c_double_right"} />}
                aria-label="last page"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                isDisabled={!table.getCanNextPage()}
              />
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default DataTable;
