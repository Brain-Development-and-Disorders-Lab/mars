// React
import React from "react";

// Components
import { Flex, Text } from "@chakra-ui/react";
import Select from "@components/Select";

// Existing and custom types
import { DataTableColumnOption, DataTableColumnSelectProps } from "@types";

const DataTableColumnSelect = ({
  columnNamesCollection,
  visibleColumnsForSelect,
  alwaysVisibleColumns,
  updateColumnVisibility,
}: DataTableColumnSelectProps) => (
  <Flex direction={"row"} gap={1} align={"center"} wrap={"wrap"} justify={"center"} grow={1}>
    <Text fontSize={"xs"} display={{ base: "none", sm: "block" }}>
      Show Columns:
    </Text>
    <Select
      collection={columnNamesCollection}
      value={visibleColumnsForSelect}
      onValueChange={(details) => {
        const toggleableColumns = (details.value as string[]).filter((col) => !alwaysVisibleColumns.includes(col));
        updateColumnVisibility(toggleableColumns);
      }}
      multiple
      width={"200px"}
      placeholder={"Visible Columns"}
      itemDisabled={(item: DataTableColumnOption) => item.disabled}
    />
  </Flex>
);

export default DataTableColumnSelect;
