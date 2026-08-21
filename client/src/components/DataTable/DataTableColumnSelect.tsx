// React
import React from "react";

// Components
import { Flex, Portal, Select, Text } from "@chakra-ui/react";

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
    <Select.Root
      key={"select-columns"}
      size={"xs"}
      w={"200px"}
      bg={"white"}
      collection={columnNamesCollection}
      value={visibleColumnsForSelect}
      onValueChange={(details) => {
        const toggleableColumns = (details.value as string[]).filter((col) => !alwaysVisibleColumns.includes(col));
        updateColumnVisibility(toggleableColumns);
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
            {(columnNamesCollection.items || []).map((item: DataTableColumnOption) => {
              const isDisabled = alwaysVisibleColumns.includes(item.value);
              return (
                <Select.Item
                  item={item}
                  key={item.value}
                  pointerEvents={isDisabled ? "none" : "auto"}
                  opacity={isDisabled ? 0.5 : 1}
                  cursor={isDisabled ? "not-allowed" : "pointer"}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                >
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              );
            })}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  </Flex>
);

export default DataTableColumnSelect;
