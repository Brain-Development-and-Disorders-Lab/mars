// React
import React, { useState } from "react";

// Components
import { Button, Checkbox, Collapsible, Field, Flex, Input, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Existing and custom types
import { DataTableFilterPanelProps, FilterCheckboxProps, FilterInputProps, FilterSectionProps } from "@types";

// Variables
import { STYLES } from "@variables";

// Labelled date or number input
export const FilterInput = ({ label, type, value, onChange, placeholder }: FilterInputProps) => (
  <Field.Root gap={"0"}>
    <Field.Label fontSize={"xs"} color={STYLES.neutral.textSecondary}>
      {label}
    </Field.Label>
    <Input
      type={type}
      size={"xs"}
      bg={"white"}
      min={type === "number" ? 0 : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </Field.Root>
);

// Single checkbox with a text label
export const FilterCheckbox = ({ label, checked, onChange }: FilterCheckboxProps) => (
  <Checkbox.Root
    size={"xs"}
    colorPalette={"blue"}
    checked={checked}
    onCheckedChange={(details) => onChange(details.checked as boolean)}
  >
    <Checkbox.HiddenInput />
    <Checkbox.Control />
    <Checkbox.Label fontSize={"xs"}>{label}</Checkbox.Label>
  </Checkbox.Root>
);

// Bordered panel grouping the inputs for a single filter
export const FilterSection = ({ label, children }: FilterSectionProps) => (
  <Flex
    direction={"column"}
    gap={"1.5"}
    flex={"1 1 260px"}
    p={"2"}
    rounded={"md"}
    border={STYLES.border.style}
    borderColor={STYLES.border.color}
    bg={STYLES.neutral.background}
  >
    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.neutral.textSecondary}>
      {label}
    </Text>
    {children}
  </Flex>
);

// Collapsible panel containing filter sections and the apply and reset controls
const DataTableFilterPanel = ({ label, activeFilterCount, onApply, onReset, children }: DataTableFilterPanelProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible.Root open={open} onOpenChange={(event) => setOpen(event.open)}>
      <Flex
        direction={"column"}
        gap={"2"}
        p={"2"}
        rounded={"md"}
        border={STYLES.border.style}
        borderColor={STYLES.border.color}
        bg={"surface.card"}
      >
        <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"}>
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Icon name={"filter"} size={"sm"} />
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              {label} Filters:
            </Text>
            <Text
              fontWeight={"semibold"}
              fontSize={"xs"}
              color={activeFilterCount >= 1 ? "green.700" : STYLES.neutral.textSecondary}
            >
              {activeFilterCount} Active
            </Text>
          </Flex>
          <Collapsible.Trigger asChild>
            <Button size={"xs"} variant={"ghost"} colorPalette={"gray"}>
              {open ? "Hide" : "Show"} Filters
              <Icon name={open ? "c_up" : "c_down"} size={"xs"} />
            </Button>
          </Collapsible.Trigger>
        </Flex>

        <Collapsible.Content>
          <Flex direction={"column"} gap={"2"}>
            <Flex direction={"row"} gap={"2"} wrap={"wrap"} align={"stretch"}>
              {children}
            </Flex>

            {/* Filter control buttons */}
            <Flex direction={"row"} gap={"2"} align={"center"} justify={"flex-end"}>
              {onApply && (
                <Button size={"xs"} rounded={"md"} colorPalette={"blue"} onClick={onApply}>
                  Apply Filters
                </Button>
              )}
              <Button
                size={"xs"}
                variant={"outline"}
                rounded={"md"}
                onClick={onReset}
                disabled={activeFilterCount === 0}
              >
                Reset Filters
              </Button>
            </Flex>
          </Flex>
        </Collapsible.Content>
      </Flex>
    </Collapsible.Root>
  );
};

export default DataTableFilterPanel;
