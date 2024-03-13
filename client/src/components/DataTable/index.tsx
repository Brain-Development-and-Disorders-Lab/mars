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
  Spacer,
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
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
  // Table visibility state
  const [columnVisibility, setColumnVisibility] = useState(
    props.visibleColumns
  );

  // Table row selection state
  const [selectedRows, setSelectedRows] = useState({});

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
        pageSize: 5,
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
                  ...data[rowIndex]!,
                  [columnId]: value,
                };
              }
              return row;
            })
          );
      },
    },
  });

  // Effect to update the column visibility
  useEffect(() => {
    setColumnVisibility(props.visibleColumns);
  }, [props.visibleColumns]);

  return (
    <Flex direction={"column"}>
      <TableContainer>
        <Table variant={"simple"} size={"sm"}>
          {/* Table head */}
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta: any = header.column.columnDef.meta;
                  return (
                    <Th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      isNumeric={meta?.isNumeric}
                      // Dynamically set the width for the checkboxes
                      w={_.isEqual(header.id, "select") ? "1" : "auto"}
                      _hover={{ cursor: 'pointer', background: "blue.50" }}
                      transition="background-color 0.3s ease-in-out, color 0.3s ease-in-out"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <Icon
                        name={(header.column.getIsSorted() === 'desc' ? 'c_down' : 'c_up')}
                        style={{ marginLeft: '4px', }}
                      />
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
                    <Td id={cell.id} key={cell.id} isNumeric={meta?.isNumeric}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
        pt={"4"}
        gap={"4"}
        justify={"space-between"}
        w={"100%"}
        wrap={"wrap"}
      >
        {props.showSelection && (
          <Flex>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<Icon name={"c_down"} />}
              >
                Actions
              </MenuButton>
              <MenuList>
                {props.actions?.map((action) => {
                  return (
                    <MenuItem
                      onClick={() => {
                        action.action(table, selectedRows);
                      }}
                      icon={<Icon name={action.icon} />}
                      key={action.label}
                      isDisabled={
                        (Object.keys(selectedRows).length === 0 ||
                          _.isUndefined(props.actions) ||
                          props.actions?.length === 0) &&
                        action.alwaysEnabled !== true
                      }
                    >
                      {action.label}
                    </MenuItem>
                  );
                })}
              </MenuList>
            </Menu>
          </Flex>
        )}

        <Spacer />

        {props.showPagination && (
          <Flex gap={"4"} wrap={"wrap"}>
            <Flex>
              <Select
                id={"select-page-size"}
                value={table.getState().pagination.pageSize}
                onChange={(event) => {
                  table.setPageSize(Number(event.target.value));
                }}
                isInvalid={false}
              >
                {[5, 10, 20].map((size) => {
                  return (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  );
                })}
              </Select>
            </Flex>

            <Flex direction={"row"} gap={"4"} align={"center"}>
              <IconButton
                variant={"outline"}
                icon={<Icon name={"c_double_left"} />}
                aria-label="first page"
                onClick={() => table.setPageIndex(0)}
                isDisabled={!table.getCanPreviousPage()}
              />
              <IconButton
                variant={"outline"}
                icon={<Icon name={"c_left"} />}
                aria-label="previous page"
                onClick={() => table.previousPage()}
                isDisabled={!table.getCanPreviousPage()}
              />
              {table.getPageCount() > 0 && (
                <Text as={"b"}>
                  {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </Text>
              )}
              <IconButton
                variant={"outline"}
                icon={<Icon name={"c_right"} />}
                aria-label="next page"
                onClick={() => table.nextPage()}
                isDisabled={!table.getCanNextPage()}
              />
              <IconButton
                variant={"outline"}
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
