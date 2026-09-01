// React
import React from "react";

// Existing and custom components
import { Portal, Select as ChakraSelect } from "@chakra-ui/react";

// Custom types
import { SelectProps } from "@types";

// Utility functions and libraries
import { groupBy as lodashGroupBy } from "lodash";

// Shared appearance for every native `Select` throughout the client
export const SELECT_SIZE = "xs";
export const SELECT_ROUNDED = "md";
export const SELECT_BG = "white";

/**
 * An updated native `Select`, covering the use-case of a text-only trigger and item list
 */
const Select = <T,>({
  collection,
  value,
  onValueChange,
  placeholder = "Select...",
  disabled,
  multiple,
  width,
  minW,
  fontSize,
  testId,
  groupBy,
  itemDisabled,
}: SelectProps<T>) => {
  const renderItem = (item: T) => {
    const disabled = itemDisabled?.(item) ?? false;
    return (
      <ChakraSelect.Item
        item={item}
        key={collection.getItemValue(item)}
        fontSize={fontSize}
        pointerEvents={disabled ? "none" : "auto"}
        opacity={disabled ? 0.5 : 1}
        cursor={disabled ? "not-allowed" : "pointer"}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {collection.stringifyItem(item)}
        <ChakraSelect.ItemIndicator />
      </ChakraSelect.Item>
    );
  };

  return (
    <ChakraSelect.Root
      size={SELECT_SIZE}
      rounded={SELECT_ROUNDED}
      bg={SELECT_BG}
      width={width}
      minW={minW}
      collection={collection}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      multiple={multiple}
    >
      <ChakraSelect.HiddenSelect />
      <ChakraSelect.Control>
        <ChakraSelect.Trigger fontSize={fontSize} data-testid={testId}>
          <ChakraSelect.ValueText placeholder={placeholder} fontSize={fontSize} />
        </ChakraSelect.Trigger>
        <ChakraSelect.IndicatorGroup>
          <ChakraSelect.Indicator />
        </ChakraSelect.IndicatorGroup>
      </ChakraSelect.Control>
      <Portal>
        <ChakraSelect.Positioner>
          <ChakraSelect.Content fontSize={fontSize}>
            {groupBy
              ? Object.entries(lodashGroupBy(collection.items, groupBy)).map(([group, items]) => (
                  <ChakraSelect.ItemGroup key={group}>
                    <ChakraSelect.ItemGroupLabel>{group}</ChakraSelect.ItemGroupLabel>
                    {items.map(renderItem)}
                  </ChakraSelect.ItemGroup>
                ))
              : collection.items.map(renderItem)}
          </ChakraSelect.Content>
        </ChakraSelect.Positioner>
      </Portal>
    </ChakraSelect.Root>
  );
};

export default Select;
