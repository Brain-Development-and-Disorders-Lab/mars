// React
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

// Existing and custom components
import {
  Button,
  Checkbox,
  Flex,
  IconButton,
  Input,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { ColumnDef, RowData, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import Icon from "@components/Icon";
// import Linky from "@components/Linky";

// Existing and custom types
import { EntityModel, IValue } from "@types";

// Utility functions and libraries
import { getData } from "@database/functions";
import _ from "lodash";
import dayjs from "dayjs";

// Extend the TableMeta type to incorporate an "updateData" function
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
};

// Create custom "skip" hook to prevent table from re-rendering
const useSkip = () => {
  const shouldSkipRef = React.useRef(true);
  const shouldSkip = shouldSkipRef.current;

  const skip = useCallback(() => {
    shouldSkipRef.current = false;
  }, [])

  useEffect(() => {
    shouldSkipRef.current = true
  });

  return [shouldSkip, skip] as const;
};

/**
 * Values component use to display a collection of Values and enable
 * creating and deleting Values. Displays collection as cards.
 * @param props collection of props to construct component
 * @return
 */
const Values = (props: {
  collection: IValue<any>[];
  viewOnly: boolean;
  setValues?: Dispatch<SetStateAction<IValue<any>[]>>;
}) => {
  const toast = useToast();
  const [entities, setEntities] = useState([] as EntityModel[]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getData(`/entities`)
      .then((value) => {
        setEntities(value);
        setIsLoaded(true);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          description: "Could not retrieve Entities.",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        setIsLoaded(true);
      });
    return;
  }, []);

  // const onUpdate = (data: IValue<any>) => {
  //   // Store the received Value information
  //   props.setValues &&
  //     props.setValues(
  //       props.collection.filter((value) => {
  //         // Get the relevant Value
  //         if (value.identifier === data.identifier) {
  //           value.name = data.name;
  //           value.data = data.data;
  //         }
  //         return value;
  //       })
  //     );
  // };

  // const onRemove = (identifier: string) => {
  //   props.setParameters &&
  //     props.setParameters(
  //       props.parameters.filter((parameter) => {
  //         // Filter out the Parameter to be removed
  //         if (!_.isEqual(parameter.identifier, identifier)) {
  //           return parameter;
  //         } else {
  //           return;
  //         }
  //       })
  //     );
  // };

  const [data, setData] = useState(props.collection);
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkip();


  useEffect(() => {
    console.info("props.viewOnly", props.viewOnly);
  }, [props.viewOnly]);

  // Define a default cell within a column
  const defaultColumn: Partial<ColumnDef<IValue<any>>> = {
    cell: ({ getValue, row: { original, index }, column: { id }, table }) => {
      const initialValue = getValue();
      const valueType = original.type;
      const [value, setValue] = useState(initialValue);

      // Update the table data on the "blur" event
      const onBlur = () => {
        table.options.meta?.updateData(index, id, value);
      };

      // Update the initial values if these are changed externally
      useEffect(() => {
        setValue(initialValue);
      }, [initialValue]);

      // Different cell types for data column
      if (_.isEqual(id, "data")) {
        switch (valueType) {
          case "date":
            return (
              <Input
                type={"datetime-local"}
                value={value as string}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                disabled
              />
            );
          case "entity":
            return (
              !props.viewOnly ? (
                <Select
                  value={value as string}
                >
                  {isLoaded &&
                    entities.map((entity) => {
                      return (
                        <option key={entity._id} value={entity._id}>
                          {entity.name}
                        </option>
                      );
                    })}
                </Select>
              ) : (
                <Input
                  value={value as string}
                  onChange={e => setValue(e.target.value)}
                  onBlur={onBlur}
                  disabled
                />
              )
            );
          case "number":
            return (
              <Input
                type={"number"}
                value={value as string}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                disabled={props.viewOnly}
              />
            );
          case "text":
            return (
              <Input
                value={value as string}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                disabled={props.viewOnly}
              />
            );
          case "url":
            return (
              <Input
                value={value as string}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                disabled={props.viewOnly}
              />
            );
        };
      }

      // Default
      return (
        <Input
          value={value as string}
          onChange={e => setValue(e.target.value)}
          onBlur={onBlur}
          disabled={props.viewOnly}
        />
      );
    },
  };

  const columns = useMemo<ColumnDef<IValue<any>>[]>(() => [
    {
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          {...{
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
              isChecked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              isIndeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler(),
            }}
          />
        </Flex>
      ),
    },
    {
      header: "name",
      accessorKey: "name",
    },
    {
      header: "data",
      accessorKey: "data",
    }
  ], []);

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex,
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();

        setData((values) =>
        values.map((row, index) => {
            if (_.isEqual(index, rowIndex)) {
              return {
                ...values[rowIndex]!,
                [columnId]: value,
              }
            }
            return row;
          })
        );
      },
    },
    debugTable: true,
  });

  return (
    <Flex direction={"column"} gap={"2"} w={"100%"} align={"center"}>
      {/* Button Group */}
      {!props.viewOnly && (
        <Flex
          direction={"row"}
          gap={"2"}
          flexWrap={"wrap"}
          justify={"center"}
          align={"center"}
        >
          {/* Buttons to add Values */}
          <Button
            leftIcon={<Icon name={"p_date"} />}
            onClick={() => {
              skipAutoResetPageIndex();
              setData([
                ...data,
                {
                  identifier: `p_date_${Math.round(performance.now())}`,
                  name: "",
                  type: "date",
                  data: dayjs(new Date()).toISOString(),
                },
              ]);
            }}
          >
            Date
          </Button>

          <Button
            leftIcon={<Icon name={"p_text"} />}
            onClick={() => {
              skipAutoResetPageIndex();
              setData([
                ...data,
                {
                  identifier: `p_text_${Math.round(performance.now())}`,
                  name: "",
                  type: "text",
                  data: "",
                },
              ]);
            }}
          >
            Text
          </Button>

          <Button
            leftIcon={<Icon name={"p_number"} />}
            onClick={() => {
              skipAutoResetPageIndex();
              setData([
                ...data,
                {
                  identifier: `p_number_${Math.round(performance.now())}`,
                  name: "",
                  type: "number",
                  data: 0,
                },
              ]);
            }}
          >
            Number
          </Button>

          <Button
            leftIcon={<Icon name={"p_url"} />}
            onClick={() => {
              skipAutoResetPageIndex();
              setData([
                ...data,
                {
                  identifier: `p_url_${Math.round(performance.now())}`,
                  name: "",
                  type: "url",
                  data: "",
                },
              ]);
            }}
          >
            URL
          </Button>

          <Button
            leftIcon={<Icon name={"entity"} />}
            onClick={() => {
              skipAutoResetPageIndex();
              setData([
                ...data,
                {
                  identifier: `p_entity_${Math.round(performance.now())}`,
                  name: "",
                  type: "entity",
                  data: "",
                },
              ]);
            }}
          >
            Entity
          </Button>
        </Flex>
      )}

      {/* Values list */}
      <Flex p={["1", "2"]} direction={"column"} gap={"1"} w={"100%"}>
        <TableContainer>
          <Table>
            <Thead>
              {table.getHeaderGroups().map(headerGroup => (
                <Tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <Th key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : (
                          <Flex>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </Flex>
                        )}
                      </Th>
                    )
                  })}
                </Tr>
              ))}
            </Thead>
            <Tbody>
              {table.getRowModel().rows.map(row => {
                return (
                  <Tr key={row.id}>
                    {row.getVisibleCells().map(cell => {
                      return (
                        <Td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </Td>
                      )
                    })}
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </TableContainer>

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
            <Text as={"b"}>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </Text>
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
      </Flex>
    </Flex>
  );
};

export default Values;
