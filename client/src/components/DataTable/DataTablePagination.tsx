// React
import React from "react";

// Components
import { Field, Fieldset, Flex, IconButton, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Select from "@components/Select";

// Existing and custom types
import { DataTablePageSizeSelectProps, DataTablePaginationNavProps } from "@types";

export const DataTablePaginationNav = ({ table }: DataTablePaginationNavProps) => (
  <Flex direction={"row"} gap={2} align={"center"} data-testid={"data-table-pagination"}>
    <IconButton
      variant={"outline"}
      size={"xs"}
      rounded={"md"}
      bg={"white"}
      aria-label={"first page"}
      onClick={() => table.setPageIndex(0)}
      disabled={!table.getCanPreviousPage()}
    >
      <Icon name={"c_double_left"} />
    </IconButton>
    <IconButton
      variant={"outline"}
      size={"xs"}
      rounded={"md"}
      bg={"white"}
      aria-label={"previous page"}
      onClick={() => table.previousPage()}
      disabled={!table.getCanPreviousPage()}
    >
      <Icon name={"c_left"} />
    </IconButton>
    {table.getPageCount() > 0 && (
      <Flex gap={1}>
        <Text fontSize={"xs"} fontWeight={"semibold"}>
          {table.getState().pagination.pageIndex + 1}
        </Text>
        <Text fontSize={"xs"}> of </Text>
        <Text fontSize={"xs"} fontWeight={"semibold"}>
          {table.getPageCount()}
        </Text>
      </Flex>
    )}
    <IconButton
      variant={"outline"}
      size={"xs"}
      rounded={"md"}
      bg={"white"}
      aria-label={"next page"}
      onClick={() => table.nextPage()}
      disabled={!table.getCanNextPage()}
    >
      <Icon name={"c_right"} />
    </IconButton>
    <IconButton
      variant={"outline"}
      size={"xs"}
      rounded={"md"}
      bg={"white"}
      aria-label={"last page"}
      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
      disabled={!table.getCanNextPage()}
    >
      <Icon name={"c_double_right"} />
    </IconButton>
  </Flex>
);

export const DataTablePageSizeSelect = ({
  table,
  pageLength,
  setPageLength,
  pageLengthsCollection,
}: DataTablePageSizeSelectProps) => (
  <Flex direction={"row"} gap={1} align={"center"} wrap={"wrap"}>
    <Text fontSize={"xs"} display={{ base: "none", sm: "block" }}>
      Show:
    </Text>
    <Fieldset.Root w={"fit-content"}>
      <Fieldset.Content>
        <Field.Root>
          <Select
            collection={pageLengthsCollection}
            value={pageLength}
            onValueChange={(details) => {
              setPageLength(details.value);
              table.setPageSize(parseInt(details.value[0]));
            }}
            width={"80px"}
            placeholder={"Page Size"}
            testId={"data-table-page-size"}
          />
        </Field.Root>
      </Fieldset.Content>
    </Fieldset.Root>
  </Flex>
);
