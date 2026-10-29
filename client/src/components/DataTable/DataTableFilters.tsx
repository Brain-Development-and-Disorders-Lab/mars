// React
import React, { useState } from "react";

// Components
import { Checkbox, Flex, Text } from "@chakra-ui/react";
import DataTableFilterPanel, {
  FilterCheckbox,
  FilterInput,
  FilterSection,
} from "@components/DataTable/DataTableFilterPanel";
import TagActor from "@components/TagActor";

// Existing and custom types
import { DataTableFilterRange, DataTableFiltersProps, DataTableFilterValues } from "@types";

// Utility functions
import _ from "lodash";
import { countActiveFilters, createEmptyFilterValues, toggleArrayValue } from "@lib/util";

// Variables
import { STYLES } from "@variables";

const EMPTY_RANGE: DataTableFilterRange = { min: "", max: "" };

const DataTableFilters = ({
  entityLabel,
  owners,
  workspace,
  isPublic,
  ranges = [],
  toggles = [],
  values,
  onApply,
}: DataTableFiltersProps) => {
  // Values being edited, starting from the applied values
  const [draft, setDraft] = useState<DataTableFilterValues>(values);

  const uniqueOwners = _.uniq(owners).filter((owner) => owner);

  const updateRange = (key: string, bound: keyof DataTableFilterRange, value: string) => {
    const range = draft.ranges[key] ?? EMPTY_RANGE;
    setDraft({ ...draft, ranges: { ...draft.ranges, [key]: { ...range, [bound]: value } } });
  };

  const applyValues = (updated: DataTableFilterValues) => {
    setDraft(updated);
    onApply(updated);
  };

  return (
    <DataTableFilterPanel
      label={entityLabel}
      activeFilterCount={countActiveFilters(values)}
      onApply={() => applyValues(draft)}
      onReset={() => applyValues(createEmptyFilterValues())}
    >
      <FilterSection label={"Created Between"}>
        <Flex direction={"row"} gap={"2"}>
          <FilterInput
            label={"Start"}
            type={"date"}
            value={draft.startDate}
            onChange={(value) => setDraft({ ...draft, startDate: value })}
          />
          <FilterInput
            label={"End"}
            type={"date"}
            value={draft.endDate}
            onChange={(value) => setDraft({ ...draft, endDate: value })}
          />
        </Flex>
      </FilterSection>

      <FilterSection label={"Owner"}>
        <Flex direction={"column"} gap={"1.5"} maxH={"120px"} overflowY={"auto"}>
          {uniqueOwners.map((owner) => (
            <Checkbox.Root
              key={owner}
              size={"xs"}
              colorPalette={"blue"}
              checked={draft.owners.includes(owner)}
              onCheckedChange={(details) =>
                setDraft({ ...draft, owners: toggleArrayValue(draft.owners, owner, details.checked as boolean) })
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label fontSize={"xs"}>
                <TagActor
                  identifier={owner}
                  fallback={"Unknown User"}
                  size={"sm"}
                  workspace={workspace}
                  isPublic={isPublic}
                  inline
                />
              </Checkbox.Label>
            </Checkbox.Root>
          ))}

          {uniqueOwners.length === 0 && (
            <Text fontSize={"xs"} color={STYLES.neutral.textTertiary}>
              No {entityLabel} Owners
            </Text>
          )}
        </Flex>
      </FilterSection>

      {toggles.map((toggle) => (
        <FilterSection key={toggle.key} label={toggle.label}>
          <FilterCheckbox
            label={toggle.checkboxLabel}
            checked={draft.toggles[toggle.key] ?? false}
            onChange={(checked) => setDraft({ ...draft, toggles: { ...draft.toggles, [toggle.key]: checked } })}
          />
        </FilterSection>
      ))}

      {ranges.map((range) => (
        <FilterSection key={range.key} label={range.label}>
          <Flex direction={"row"} gap={"2"}>
            <FilterInput
              label={"Minimum"}
              type={"number"}
              value={draft.ranges[range.key]?.min ?? ""}
              onChange={(value) => updateRange(range.key, "min", value)}
              placeholder={"0"}
            />
            <FilterInput
              label={"Maximum"}
              type={"number"}
              value={draft.ranges[range.key]?.max ?? ""}
              onChange={(value) => updateRange(range.key, "max", value)}
              placeholder={"∞"}
            />
          </Flex>
        </FilterSection>
      ))}
    </DataTableFilterPanel>
  );
};

export default DataTableFilters;
