// React
import React, { FC, useEffect, useState } from "react";

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
import { DataTableProps } from "@types";

const DataTable: FC<any> = (props: DataTableProps) => {
  // Table visibility state
  const [columnVisibility, setColumnVisibility] = useState(
    props.visibleColumns
  );

  // Create ReactTable instance
  const table = useReactTable({
    columns: props.columns,
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
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  // Effect to update the column visibility
  useEffect(() => {
    setColumnVisibility(props.visibleColumns);
  }, [props.visibleColumns]);

  return (
    <>
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
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const meta: any = cell.column.columnDef.meta;
                  return (
                    <Td key={cell.id} isNumeric={meta?.isNumeric}>
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

      {!props.hideControls && (
        <Flex direction={"row"} gap={"4"} justify={"space-between"} w={"100%"}>
          <Flex direction={"row"} gap={"4"} align={"center"}>
            <IconButton
              icon={<Icon name={"c_double_left"} />}
              aria-label="first page"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            />
            <IconButton
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
              icon={<Icon name={"c_right"} />}
              aria-label="next page"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            />
            <IconButton
              icon={<Icon name={"c_double_right"} />}
              aria-label="last page"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            />
          </Flex>
          <Flex>
            <Select
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
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default DataTable;
