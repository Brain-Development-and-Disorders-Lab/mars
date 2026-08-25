// React
import React from "react";

// Components
import { Button, Checkbox, Collapsible, Field, Flex, Input, Separator, Text } from "@chakra-ui/react";
import TagActor from "@components/TagActor";
import Icon from "@components/Icon";

// Existing and custom types
import { DataTableFiltersProps } from "@types";

// Utility functions
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

const COUNT_BUCKETS = ["0", "1-5", "6-10", "11+"];

const DataTableFilters = ({
  entityLabel,
  filtersOpen,
  onFiltersOpenChange,
  activeFilterCount,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  owners,
  selectedOwners,
  onOwnersChange,
  workspace,
  isPublic,
  countFilter,
  extraCheckbox,
  onApply,
  onReset,
}: DataTableFiltersProps) => {
  const uniqueOwners = _.uniq(owners).filter((owner) => owner);

  const toggleOwner = (owner: string, checked: boolean) => {
    onOwnersChange(checked ? [...selectedOwners, owner] : selectedOwners.filter((o) => o !== owner));
  };

  return (
    <Collapsible.Root open={filtersOpen} onOpenChange={(event) => onFiltersOpenChange(event.open)}>
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
              {entityLabel} Filters:
            </Text>
            <Text fontWeight={"semibold"} fontSize={"xs"} color={activeFilterCount >= 1 ? "green.700" : "black"}>
              {activeFilterCount} Active
            </Text>
          </Flex>
          <Collapsible.Trigger asChild>
            <Button size={"xs"} variant={"ghost"} colorPalette={"gray"}>
              {filtersOpen ? "Hide" : "Show"} Filters
              <Icon name={filtersOpen ? "c_up" : "c_down"} size={"xs"} />
            </Button>
          </Collapsible.Trigger>
        </Flex>

        <Collapsible.Content>
          <Flex direction={"column"} gap={"2"}>
            <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
              {/* Date Range Filter */}
              <Flex direction={"column"} gap={"1"} minW={"200px"} flexShrink={0}>
                <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                  Created Between
                </Text>
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <Field.Root gap={"0"}>
                    <Field.Label
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      ml={"0.5"}
                      color={STYLES.font.secondaryHeader.color}
                    >
                      Start (optional)
                    </Field.Label>
                    <Input
                      type={"date"}
                      size={"xs"}
                      bg={"white"}
                      value={startDate}
                      onChange={(e) => onStartDateChange(e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root gap={"0"}>
                    <Field.Label
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      ml={"0.5"}
                      color={STYLES.font.secondaryHeader.color}
                    >
                      End (optional)
                    </Field.Label>
                    <Input
                      type={"date"}
                      size={"xs"}
                      bg={"white"}
                      value={endDate}
                      onChange={(e) => onEndDateChange(e.target.value)}
                    />
                  </Field.Root>
                </Flex>
              </Flex>

              <Separator orientation={"vertical"} />

              {/* Owner Filter */}
              <Flex direction={"column"} gap={"1"} minW={"200px"} flexShrink={0}>
                <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                  Owner
                </Text>
                <Flex direction={"column"} gap={"2"} maxH={"200px"} overflowY={"auto"} ml={"1"}>
                  {uniqueOwners.map((owner) => (
                    <Checkbox.Root
                      key={owner}
                      size={"xs"}
                      colorPalette={"blue"}
                      checked={selectedOwners.includes(owner)}
                      onCheckedChange={(details) => toggleOwner(owner, details.checked as boolean)}
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
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                      No {entityLabel} Owners
                    </Text>
                  )}
                </Flex>
              </Flex>

              {extraCheckbox && (
                <>
                  <Separator orientation={"vertical"} />
                  <Flex direction={"column"} gap={"1"} minW={"200px"} flexShrink={0}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                      {extraCheckbox.label}
                    </Text>
                    <Checkbox.Root
                      ml={"1"}
                      size={"xs"}
                      colorPalette={"blue"}
                      checked={extraCheckbox.checked}
                      onCheckedChange={(details) => extraCheckbox.onChange(details.checked as boolean)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label fontSize={"xs"}>{extraCheckbox.checkboxLabel}</Checkbox.Label>
                    </Checkbox.Root>
                  </Flex>
                </>
              )}

              {countFilter && (
                <>
                  <Separator orientation={"vertical"} />
                  <Flex direction={"column"} gap={"1"} minW={"200px"} flexShrink={0}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                      {countFilter.label}
                    </Text>
                    {countFilter.mode === "range" ? (
                      <Flex direction={"row"} gap={"2"} align={"center"}>
                        <Field.Root gap={"0"}>
                          <Field.Label
                            fontSize={"xs"}
                            fontWeight={"semibold"}
                            ml={"0.5"}
                            color={STYLES.font.secondaryHeader.color}
                          >
                            Minimum
                          </Field.Label>
                          <Input
                            type={"number"}
                            size={"xs"}
                            bg={"white"}
                            min={0}
                            value={countFilter.min}
                            onChange={(e) => countFilter.onMinChange(e.target.value)}
                            placeholder={"0"}
                          />
                        </Field.Root>
                        <Field.Root gap={"0"}>
                          <Field.Label
                            fontSize={"xs"}
                            fontWeight={"semibold"}
                            ml={"0.5"}
                            color={STYLES.font.secondaryHeader.color}
                          >
                            Maximum
                          </Field.Label>
                          <Input
                            type={"number"}
                            size={"xs"}
                            bg={"white"}
                            min={0}
                            value={countFilter.max}
                            onChange={(e) => countFilter.onMaxChange(e.target.value)}
                            placeholder={"∞"}
                          />
                        </Field.Root>
                      </Flex>
                    ) : (
                      <Flex direction={"column"} gap={"2"} ml={"1"}>
                        {COUNT_BUCKETS.map((range) => (
                          <Checkbox.Root
                            key={range}
                            size={"xs"}
                            colorPalette={"blue"}
                            checked={countFilter.selected.includes(range)}
                            onCheckedChange={(details) => {
                              const checked = details.checked as boolean;
                              countFilter.onChange(
                                checked
                                  ? [...countFilter.selected, range]
                                  : countFilter.selected.filter((r) => r !== range),
                              );
                            }}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize={"xs"}>
                              {range === "0"
                                ? `0 ${countFilter.unitLabel}`
                                : range === "11+"
                                  ? `11+ ${countFilter.unitLabel}`
                                  : `${range} ${countFilter.unitLabel}`}
                            </Checkbox.Label>
                          </Checkbox.Root>
                        ))}
                      </Flex>
                    )}
                  </Flex>
                </>
              )}
            </Flex>

            {/* Filter control buttons */}
            <Flex direction={"row"} gap={"2"} align={"center"} justify={"flex-end"}>
              <Button size={"xs"} rounded={"md"} colorPalette={"blue"} onClick={onApply}>
                Apply Filters
              </Button>
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

export default DataTableFilters;
