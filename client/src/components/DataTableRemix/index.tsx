import React, { useEffect, useState } from "react";
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
} from "@tanstack/react-table";
import Icon from "@components/Icon";
import { DataTableProps } from "@types";
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

import _ from "lodash";

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
(includesSome as any).autoRemove = (val: unknown) =>
  !val || (Array.isArray(val) && val.length === 0);

type ColumnFilterMenuProps = {
  columnId: string;
  data: any[];
  table: any;
};

const ColumnFilterMenu = ({ columnId, data, table }: ColumnFilterMenuProps) => {
  const [query, setQuery] = useState("");

  const getDisplayValue = (val: any) => {
    if (val === null || val === undefined) return "Empty";
    if (Array.isArray(val)) return `${val.length} items`;
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

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

const DataTableRemix = (props: DataTableProps) => {
  const [pageLength, setPageLength] = useState<string[]>(["10"]);
  const pageLengthsCollection = createListCollection({
    items: [
      { label: "5", value: "5" },
      { label: "10", value: "10" },
      { label: "20", value: "20" },
      { label: "50", value: "50" },
      { label: "100", value: "100" },
    ],
  });

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const selectColumnWidth = 40;
  const defaultColumnWidth = 200;

  const [columnVisibility, setColumnVisibility] = useState(
    props.visibleColumns,
  );
  const [selectedRows, setSelectedRows] = useState(props.selectedRows);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    props.columnFilters ?? [],
  );

  useEffect(() => {
    if (props.onSelectedRowsChange) {
      const rowSet = [];
      for (const rowIndex of Object.keys(selectedRows)) {
        const row = props.data[parseInt(rowIndex)];
        if (row) {
          rowSet.push(row);
        }
      }
      props.onSelectedRowsChange(rowSet);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRows, props.data]);

  const table = useReactTable({
    columns: [
      ...(props.showSelection
        ? [
            {
              id: "select",
              header: ({ table }: any) => (
                <Flex align="center" justify="center" w="auto" h="100%">
                  <Checkbox.Root
                    {...{
                      disabled: props.viewOnly,
                      size: "xs",
                      colorPalette: "blue",
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
                </Flex>
              ),
              cell: ({ row }: any) => (
                <Flex align="center" justify="center" w="auto" h="100%">
                  <Checkbox.Root
                    {...{
                      id: `s_${Math.random().toString(16).slice(2)}`,
                      size: "xs",
                      colorPalette: "blue",
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
                </Flex>
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

  useEffect(() => {
    const updatedVisibility = _.cloneDeep(columnVisibility);
    let hasChanges = false;

    Object.keys(props.visibleColumns).forEach((column) => {
      if (
        column !== "select" &&
        updatedVisibility[column] !== props.visibleColumns[column]
      ) {
        updatedVisibility[column] = props.visibleColumns[column];
        hasChanges = true;
      }
    });

    const shouldShowSelect = props.showSelection === true;
    if (updatedVisibility["select"] !== shouldShowSelect) {
      updatedVisibility["select"] = shouldShowSelect;
      hasChanges = true;
    }

    if (hasChanges) {
      setColumnVisibility(updatedVisibility);
    }
  }, [props.visibleColumns, props.showSelection]);

  const [columnNames, setColumnNames] = useState([] as string[]);
  const [columnNamesCollection, setColumnNamesCollection] = useState(
    createListCollection<string>({ items: [] }),
  );

  useEffect(() => {
    const columns = table
      .getAllColumns()
      .filter((column) => {
        return !_.includes(["_id", "select", "name", "view"], column.id);
      })
      .map((column) => column.id);
    setColumnNames(columns);
    setColumnNamesCollection(createListCollection({ items: columns }));

    const updatedVisibility = _.cloneDeep(columnVisibility);

    Object.keys(props.visibleColumns).forEach((column) => {
      if (column !== "select" && props.visibleColumns[column] !== undefined) {
        updatedVisibility[column] = props.visibleColumns[column];
      }
    });

    columns.map((column) => {
      if (updatedVisibility[column] === undefined) {
        updatedVisibility[column] = true;
      }
    });

    if (props.showSelection === true) {
      updatedVisibility["select"] = true;
    } else {
      updatedVisibility["select"] = false;
    }

    setColumnVisibility(updatedVisibility);

    const initialWidths: Record<string, number> = {};
    table.getAllColumns().forEach((column) => {
      if (
        column.id !== "select" &&
        !_.includes(["_id", "name", "view"], column.id)
      ) {
        initialWidths[column.id] = defaultColumnWidth;
      }
    });
    setColumnWidths((prev) => ({ ...prev, ...initialWidths }));
  }, []);

  useEffect(() => {
    if (!_.isEqual(selectedRows, props.selectedRows)) {
      setSelectedRows(props.selectedRows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedRows]);

  useEffect(() => {
    if (props.onColumnFiltersChange) {
      props.onColumnFiltersChange(columnFilters);
    }
  }, [columnFilters, props.onColumnFiltersChange]);

  useEffect(() => {
    if (!_.isEqual(columnFilters, props.columnFilters ?? [])) {
      setColumnFilters(props.columnFilters ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.columnFilters]);

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

  const updateColumnVisibility = (columns: string[]) => {
    const updatedVisibility = _.cloneDeep(columnVisibility);
    const toggleableColumns = columnNames;

    toggleableColumns.forEach((column) => {
      updatedVisibility[column] = false;
    });

    columns.forEach((column) => {
      if (toggleableColumns.includes(column)) {
        updatedVisibility[column] = true;
      }
    });

    if (props.showSelection === true) {
      updatedVisibility["select"] = true;
    } else {
      updatedVisibility["select"] = false;
    }

    setColumnVisibility(updatedVisibility);
  };

  return (
    <Box
      w="100%"
      maxW="100%"
      display="flex"
      flexDirection="column"
      css={{ WebkitOverflowScrolling: "touch" }}
    >
      <Box
        w="100%"
        maxW="100%"
        flex="1"
        minH="0"
        minW="0"
        overflowX="auto"
        overflowY="auto"
        position="relative"
      >
        <Box
          minW="800px"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
          display="inline-block"
        >
          <Flex
            gap={0}
            bg="gray.100"
            borderBottom="1px solid"
            borderColor="gray.200"
            direction="row"
          >
            {table.getHeaderGroups()[0]?.headers.map((header, headerIndex) => {
              const isSelectColumn = header.id === "select";
              const isLastColumn =
                headerIndex === table.getHeaderGroups()[0]?.headers.length - 1;
              const headerWidth = isSelectColumn
                ? selectColumnWidth
                : isLastColumn
                  ? undefined
                  : columnWidths[header.id] || defaultColumnWidth;

              return (
                <Flex
                  key={header.id}
                  w={headerWidth ? `${headerWidth}px` : "auto"}
                  flex={isLastColumn ? "1" : "0 0 auto"}
                  px={1}
                  py={1}
                  fontSize="xs"
                  fontWeight="semibold"
                  color="gray.600"
                  bg="gray.100"
                  borderRight={!isLastColumn ? "1px solid" : "none"}
                  borderColor="gray.200"
                  position="relative"
                  textAlign="center"
                  lineHeight="1.2"
                  align="center"
                  justify="center"
                  overflow="hidden"
                >
                  {header.id === "select" ? (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )
                  ) : (
                    <Flex
                      direction="row"
                      align="center"
                      gap={1}
                      justify="center"
                      w="100%"
                    >
                      <Text textAlign="center">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </Text>
                      {canSortColumn(header) && (
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
                      {canSortColumn(header) && (
                        <ColumnFilterMenu
                          columnId={header.id}
                          data={props.data}
                          table={table}
                        />
                      )}
                    </Flex>
                  )}
                </Flex>
              );
            })}
          </Flex>

          <Box overflowY="auto" overflowX="hidden">
            {table.getRowModel().rows.map((row, rowIndex) => {
              const isSelected = row.getIsSelected();
              return (
                <Flex
                  key={row.id}
                  id={row.id}
                  gap={0}
                  borderBottom={
                    rowIndex < table.getRowModel().rows.length - 1
                      ? "1px solid"
                      : "none"
                  }
                  borderColor="gray.200"
                  _hover={{ bg: "gray.25" }}
                  overflow="hidden"
                  bg={isSelected ? "blue.50" : "transparent"}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const meta: any = cell.column.columnDef.meta;
                    const isLastCell =
                      cellIndex === row.getVisibleCells().length - 1;
                    const isSelectColumn = cell.column.id === "select";
                    const cellWidth = isSelectColumn
                      ? selectColumnWidth
                      : isLastCell
                        ? undefined
                        : columnWidths[cell.column.id] || defaultColumnWidth;

                    return (
                      <Box
                        key={cell.id}
                        id={cell.id}
                        w={cellWidth ? `${cellWidth}px` : "auto"}
                        flex={isLastCell ? "1" : "0 0 auto"}
                        px={1}
                        py={0.5}
                        fontVariantNumeric={meta?.isNumeric}
                        borderRight={!isLastCell ? "1px solid" : "none"}
                        borderColor="gray.200"
                        textAlign={isSelectColumn ? "center" : "left"}
                        overflow="hidden"
                        display="flex"
                        alignItems="center"
                        bg={isSelected ? "blue.50" : "transparent"}
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
        wrap="wrap"
        justify={"space-between"}
        w="100%"
        mt={1}
        flexShrink={0}
      >
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
              <Icon name={"c_double_left"} />
            </IconButton>
            <IconButton
              variant="outline"
              size="xs"
              rounded="md"
              aria-label="previous page"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <Icon name={"c_left"} />
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
              <Icon name={"c_right"} />
            </IconButton>
            <IconButton
              variant="outline"
              size="xs"
              rounded="md"
              aria-label="last page"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <Icon name={"c_double_right"} />
            </IconButton>
          </Flex>
        )}

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
                <Button colorPalette={"yellow"} size={"xs"} rounded={"md"}>
                  Actions
                  <Icon name={"lightning"} size="xs" />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content p={1}>
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
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Icon name={action.icon} size="xs" />
                            <Text fontSize={"xs"}>{action.label}</Text>
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
                      <Flex direction={"row"} gap={"1"} align={"center"}>
                        <Text fontSize={"xs"}>No Actions available</Text>
                      </Flex>
                    </Menu.Item>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          )}

          {columnNames.length > 0 && props.showColumnSelect && (
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
                key={"select-columns"}
                size={"xs"}
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
            </Flex>
          )}
        </Flex>

        {props.showPagination && (
          <Flex direction="row" gap={1} align="center" wrap="wrap">
            <Text fontSize="xs" display={{ base: "none", sm: "block" }}>
              Show:
            </Text>
            <Fieldset.Root w="fit-content">
              <Fieldset.Content>
                <Field.Root>
                  <Select.Root
                    key={"select-pagesize"}
                    size={"xs"}
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
