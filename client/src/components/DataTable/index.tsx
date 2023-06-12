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
  Button,
} from "@chakra-ui/react";
import {
  flexRender,
  getPaginationRowModel,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import Icon from "@components/Icon";

// Existing and custom types
import { DataTableProps, IValue } from "@types";

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
      ... (_.isEqual(props.hideSelection, false) || _.isUndefined(props.hideSelection)) ?
        [{
          id: "select",
          header: ({ table }: any) => (
            <Checkbox
              {...{
                disabled: props.viewOnly,
                isChecked: table.getIsAllRowsSelected(),
                isIndeterminate: table.getIsSomeRowsSelected(),
                onChange: table.getToggleAllRowsSelectedHandler(),
              }}
            />
          ),
          cell: ({ row }: any) => (
            <Flex>
              <Checkbox
                {...{
                  id: `s_${Math.random().toString(16).slice(2)}`,
                  isChecked: row.getIsSelected(),
                  disabled: !row.getCanSelect() || props.viewOnly,
                  isIndeterminate: row.getIsSomeSelected(),
                  onChange: row.getToggleSelectedHandler(),
                }}
              />
            </Flex>
          ),
        }] : [],
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
  });

  // Effect to update the column visibility
  useEffect(() => {
    setColumnVisibility(props.visibleColumns);
  }, [props.visibleColumns]);

  /**
   * Apply delete operation to rows that have been selected
   */
  const onDeleteRows = () => {
    const idToRemove: IValue<any>[] = [];
    for (let rowIndex of Object.keys(selectedRows)) {
      idToRemove.push(table.getRow(rowIndex).original.identifier);
    }

    const updatedCollection = props.data.filter((value) => {
      return !idToRemove.includes(value.identifier);
    });

    if (props.setData) {
      props.setData(updatedCollection);
      table.resetRowSelection();
    }
  };

  return (
    <TableContainer>
      <Table>
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
                  >
                    <Flex gap={"4"} direction={"row"}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() ? (
                        header.column.getIsSorted() === "desc" ? (
                          <Icon name={"c_down"} />
                        ) : (
                          <Icon name={"c_up"} />
                        )
                      ) : null}
                    </Flex>
                  </Th>
                );
              })}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {table.getRowModel().rows.map((row) => (
            <Tr id={row.id} key={row.id}>
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
      {!props.hidePagination && (
      <Flex direction={"row"} pt={"4"} gap={"4"} justify={"space-between"} w={"100%"} wrap={"wrap"}>
        <Flex gap={"4"}>
          <Select
            id={"select-page-size"}
            value={table.getState().pagination.pageSize}
            onChange={(event) => {
              table.setPageSize(Number(event.target.value));
            }}
          >
            {[5, 10, 20].map((size) => {
              return (
                <option key={size} value={size}>
                  Show {size}
                </option>
              );
            })}
          </Select>
          {!props.hidePagination && !props.viewOnly && !props.hideSelection &&
            <Flex>
              <Button variant={"outline"} disabled={Object.keys(selectedRows).length === 0 || props.viewOnly} onClick={onDeleteRows} leftIcon={<Icon name={"delete"} />}>{Object.keys(selectedRows).length}</Button>
            </Flex>
          }
        </Flex>

        <Flex direction={"row"} gap={"4"} align={"center"}>
          <IconButton
            variant={"outline"}
            icon={<Icon name={"c_double_left"} />}
            aria-label="first page"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          />
          <IconButton
            variant={"outline"}
            icon={<Icon name={"c_left"} />}
            aria-label="previous page"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          />
          {table.getPageCount() > 0 &&
            <Text as={"b"}>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </Text>
          }
          <IconButton
            variant={"outline"}
            icon={<Icon name={"c_right"} />}
            aria-label="next page"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          />
          <IconButton
            variant={"outline"}
            icon={<Icon name={"c_double_right"} />}
            aria-label="last page"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          />
        </Flex>
      </Flex>
    )}
    </TableContainer>
  );
};

export default DataTable;
