// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  EmptyState,
  Flex,
  Heading,
  Spacer,
  Tag,
  Text,
  Input,
  Checkbox,
  Collapsible,
  Field,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import DataTable from "@components/DataTable";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import { AttributeModel } from "@types";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Routing and navigation
import { useNavigate } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

// Context and hooks
import { useWorkspace } from "@hooks/useWorkspace";
import { useBreakpoint } from "@hooks/useBreakpoint";

const Templates = () => {
  const navigate = useNavigate();

  // Page state
  const [templates, setTemplates] = useState([] as AttributeModel[]);
  const [filteredTemplates, setFilteredTemplates] = useState(
    [] as AttributeModel[],
  );

  // Filter state (temporary values before applying)
  const [filterState, setFilterState] = useState({
    startDate: "",
    endDate: "",
    owners: [] as string[],
    valueCountRanges: [] as string[],
  });

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "",
    endDate: "",
    owners: [] as string[],
    valueCountRanges: [] as string[],
  });

  // Collapsible state for filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // GraphQL operations
  const GET_TEMPLATES = gql`
    query GetTemplates {
      templates {
        _id
        name
        owner
        timestamp
        description
        values {
          _id
          name
          type
          data
        }
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery(GET_TEMPLATES);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.templates) {
      // Unpack all the Template data
      setTemplates(data.templates);
      setFilteredTemplates(data.templates);
    }
  }, [loading]);

  // Apply filters to template data
  useEffect(() => {
    let filtered = [...templates];
    let activeFilterCount = 0;

    // Filter by date range
    if (appliedFilters.startDate) {
      const startDate = dayjs(appliedFilters.startDate).startOf("day");
      filtered = filtered.filter((template) =>
        dayjs(template.timestamp).isSameOrAfter(startDate),
      );
      activeFilterCount++;
    }
    if (appliedFilters.endDate) {
      const endDate = dayjs(appliedFilters.endDate).endOf("day");
      filtered = filtered.filter((template) =>
        dayjs(template.timestamp).isSameOrBefore(endDate),
      );
      activeFilterCount++;
    }

    // Filter by owners
    if (appliedFilters.owners.length > 0) {
      filtered = filtered.filter((template) =>
        appliedFilters.owners.includes(template.owner),
      );
      activeFilterCount += appliedFilters.owners.length;
    }

    // Filter by value count ranges
    if (appliedFilters.valueCountRanges.length > 0) {
      filtered = filtered.filter((template) => {
        const valueCount = template.values.length;
        return appliedFilters.valueCountRanges.some((range) => {
          if (range === "0") return valueCount === 0;
          if (range === "1-5") return valueCount >= 1 && valueCount <= 5;
          if (range === "6-10") return valueCount >= 6 && valueCount <= 10;
          if (range === "11+") return valueCount >= 11;
          return false;
        });
      });
      activeFilterCount += appliedFilters.valueCountRanges.length;
    }

    setActiveFilterCount(activeFilterCount);
    setFilteredTemplates(filtered);
  }, [templates, appliedFilters]);

  useEffect(() => {
    if (error) {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Unable to retrieve Templates",
        duration: 4000,
        closable: true,
      });
    }
  }, [error]);

  const { workspace } = useWorkspace();

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    timestamp: true,
    owner: true,
  });

  // Effect to adjust column visibility
  useEffect(() => {
    const isMobile = breakpoint === "base" || breakpoint === "sm";
    setVisibleColumns({
      description: !isMobile,
      timestamp: !isMobile,
      owner: !isMobile,
    });
  }, [breakpoint]);

  // Configure table columns and data
  const columnHelper = createColumnHelper<AttributeModel>();
  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 32}
              showArrow
            >
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 32 })}
              </Text>
            </Tooltip>
            <Button
              size="2xs"
              mx={"1"}
              variant="subtle"
              colorPalette="gray"
              aria-label={"View Template"}
              onClick={() => navigate(`/templates/${info.row.original._id}`)}
            >
              View
              <Icon name={"a_right"} />
            </Button>
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>Empty</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Flex>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 32}
              showArrow
            >
              <Text fontSize={"xs"}>
                {_.truncate(info.getValue(), { length: 32 })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
    }),
    columnHelper.accessor("owner", {
      cell: (info) => {
        return (
          <ActorTag
            orcid={info.getValue()}
            fallback={"Unknown User"}
            size={"sm"}
            inline
          />
        );
      },
      header: "Owner",
      enableHiding: true,
    }),
    columnHelper.accessor("timestamp", {
      cell: (info) => {
        return (
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
            {dayjs(info.getValue()).fromNow()}
          </Text>
        );
      },
      header: "Created",
      enableHiding: true,
    }),
    columnHelper.accessor("values", {
      cell: (info) => {
        return (
          <Tag.Root colorPalette={"green"} size={"sm"}>
            <Tag.Label fontSize={"xs"}>{info.getValue().length}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "Values",
    }),
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex
        direction={"row"}
        p={"1"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"1"}
      >
        <Flex
          w={"100%"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"1"} w={"100%"}>
            <Icon name={"template"} size={"sm"} />
            <Heading size={"md"}>Templates</Heading>
            <Spacer />
            <Button
              colorPalette={"green"}
              onClick={() => navigate("/create/template")}
              size={"xs"}
              rounded={"md"}
            >
              Create Template
              <Icon name={"add"} size={"xs"} />
            </Button>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"2"} w={"100%"}>
          <Text fontSize={"xs"} ml={"0.5"}>
            All Templates in the current Workspace are shown below. Sort the
            Templates using the column headers or use the filters below.
          </Text>

          {/* Filter Section */}
          <Collapsible.Root
            open={filtersOpen}
            onOpenChange={(event) => setFiltersOpen(event.open)}
          >
            <Flex
              direction={"column"}
              gap={"1"}
              p={"1"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
            >
              <Flex
                direction={"row"}
                gap={"1"}
                align={"center"}
                justify={"space-between"}
              >
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"filter"} size={"sm"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Template Filters
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
                <Flex direction={"row"} gap={["1", "4"]} wrap={"wrap"}>
                  {/* Date Range Filter */}
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    minW={"200px"}
                    flexShrink={0}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Created Between
                    </Text>
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Field.Root gap={"0"}>
                        <Field.Label fontSize={"xs"}>Start</Field.Label>
                        <Input
                          type={"date"}
                          size={"xs"}
                          bg={"white"}
                          value={filterState.startDate}
                          onChange={(e) =>
                            setFilterState({
                              ...filterState,
                              startDate: e.target.value,
                            })
                          }
                        />
                      </Field.Root>
                      <Field.Root gap={"0"}>
                        <Field.Label fontSize={"xs"}>End</Field.Label>
                        <Input
                          type={"date"}
                          size={"xs"}
                          bg={"white"}
                          value={filterState.endDate}
                          onChange={(e) =>
                            setFilterState({
                              ...filterState,
                              endDate: e.target.value,
                            })
                          }
                        />
                      </Field.Root>
                    </Flex>
                  </Flex>

                  {/* Owner Filter */}
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    minW={"200px"}
                    flexShrink={0}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Owner
                    </Text>
                    <Flex
                      direction={"column"}
                      gap={"1"}
                      maxH={"200px"}
                      overflowY={"auto"}
                    >
                      {_.uniq(templates.map((t) => t.owner))
                        .filter((owner) => owner)
                        .map((owner) => (
                          <Checkbox.Root
                            key={owner}
                            size={"xs"}
                            colorPalette={"blue"}
                            checked={filterState.owners.includes(owner)}
                            onCheckedChange={(details) => {
                              const isChecked = details.checked as boolean;
                              if (isChecked) {
                                setFilterState({
                                  ...filterState,
                                  owners: [...filterState.owners, owner],
                                });
                              } else {
                                setFilterState({
                                  ...filterState,
                                  owners: filterState.owners.filter(
                                    (o) => o !== owner,
                                  ),
                                });
                              }
                            }}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize={"xs"}>
                              <ActorTag
                                orcid={owner}
                                fallback={"Unknown User"}
                                size="sm"
                                inline
                              />
                            </Checkbox.Label>
                          </Checkbox.Root>
                        ))}
                    </Flex>
                  </Flex>

                  {/* Value Count Range Filter */}
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    minW={"200px"}
                    flexShrink={0}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Value Count
                    </Text>
                    <Flex direction={"column"} gap={"1"}>
                      {["0", "1-5", "6-10", "11+"].map((range) => (
                        <Checkbox.Root
                          key={range}
                          size={"xs"}
                          colorPalette={"blue"}
                          checked={filterState.valueCountRanges.includes(range)}
                          onCheckedChange={(details) => {
                            const isChecked = details.checked as boolean;
                            if (isChecked) {
                              setFilterState({
                                ...filterState,
                                valueCountRanges: [
                                  ...filterState.valueCountRanges,
                                  range,
                                ],
                              });
                            } else {
                              setFilterState({
                                ...filterState,
                                valueCountRanges:
                                  filterState.valueCountRanges.filter(
                                    (r) => r !== range,
                                  ),
                              });
                            }
                          }}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize={"xs"}>
                            {range === "0"
                              ? "0 values"
                              : range === "11+"
                                ? "11+ values"
                                : `${range} values`}
                          </Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </Flex>
                  </Flex>
                </Flex>
              </Collapsible.Content>
            </Flex>
          </Collapsible.Root>

          {/* Buttons and Active Filter Count */}
          <Flex
            direction={"row"}
            gap={"1"}
            align={"center"}
            justify={"flex-end"}
          >
            <Text fontWeight={"semibold"} fontSize={"xs"}>
              {activeFilterCount} Active Filter
              {activeFilterCount > 1 || activeFilterCount === 0 ? "s" : ""}
            </Text>
            <Button
              size={"xs"}
              rounded={"md"}
              colorPalette={"blue"}
              onClick={() => {
                setAppliedFilters({ ...filterState });
              }}
            >
              Apply
            </Button>
            <Button
              size={"xs"}
              variant={"outline"}
              rounded={"md"}
              onClick={() => {
                const clearedState = {
                  startDate: "",
                  endDate: "",
                  owners: [],
                  valueCountRanges: [],
                };
                setFilterState(clearedState);
                setAppliedFilters(clearedState);
              }}
              disabled={activeFilterCount === 0}
            >
              Clear
            </Button>
          </Flex>

          {filteredTemplates.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredTemplates}
              visibleColumns={visibleColumns}
              selectedRows={{}}
              showColumnSelect
              showPagination
              showSelection
            />
          ) : (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"template"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>
                  {activeFilterCount > 0
                    ? "No templates match the selected filters"
                    : "No Templates"}
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Templates;
