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
  SkeletonText,
  Separator,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import DataTable from "@components/DataTable";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import { AttributeModel, IGenericItem } from "@types";

// Utility functions and libraries
import { getValueTypeIconProps } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { usePermissions } from "@hooks/usePermissions";
import { useWorkspace } from "@hooks/useWorkspace";

// Variables
import { GLOBAL_STYLES } from "@variables";

const Templates = () => {
  const navigate = useNavigate();

  // Permissions
  const { workspacePermissions } = usePermissions();

  const { workspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");

  // Page state
  const [templates, setTemplates] = useState([] as AttributeModel[]);
  const [filteredTemplates, setFilteredTemplates] = useState([] as AttributeModel[]);

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
    query GetTemplates($workspace: String) {
      templates {
        _id
        name
        owner
        archived
        timestamp
        description
        values {
          _id
          name
          type
          data
        }
      }
      workspace(_id: $workspace) {
        _id
        name
      }
    }
  `;
  const { loading, error, data } = useQuery<{
    templates: AttributeModel[];
    workspace: IGenericItem;
  }>(GET_TEMPLATES, {
    variables: {
      workspace: workspace,
    },
    fetchPolicy: "network-only",
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.templates) {
      // Unpack all the Template data
      setTemplates(data.templates);
      setFilteredTemplates(data.templates);
    }

    if (data?.workspace) {
      // Store the Workspace name
      setWorkspaceName(data.workspace.name);
    }
  }, [loading]);

  // Apply filters to template data
  useEffect(() => {
    let filtered = [...templates];
    let activeFilterCount = 0;

    // Filter by date range
    if (appliedFilters.startDate) {
      const startDate = dayjs(appliedFilters.startDate).startOf("day");
      filtered = filtered.filter((template) => dayjs(template.timestamp).isSameOrAfter(startDate));
      activeFilterCount++;
    }
    if (appliedFilters.endDate) {
      const endDate = dayjs(appliedFilters.endDate).endOf("day");
      filtered = filtered.filter((template) => dayjs(template.timestamp).isSameOrBefore(endDate));
      activeFilterCount++;
    }

    // Filter by owners
    if (appliedFilters.owners.length > 0) {
      filtered = filtered.filter((template) => appliedFilters.owners.includes(template.owner));
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
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 48} showArrow>
              <Flex gap={"1"} align={"center"}>
                <Icon name={"template"} color={GLOBAL_STYLES.template.color.icon} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(info.getValue(), { length: 48 })}
                </Text>
              </Flex>
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
              <Tag.Label fontSize={"xs"}>No Description</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Flex>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 64} showArrow>
              <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 64 })}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("values", {
      cell: (info) => {
        const values = info.row.original.values;

        // 0 Values
        if (values.length === 0) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>No Values</Tag.Label>
            </Tag.Root>
          );
        }

        // Multiple Values
        if (values.length > 2) {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {values.slice(0, 2).map((value) => (
                <Tag.Root colorPalette={getValueTypeIconProps(value.type).color.split(".")[0]}>
                  <Tag.StartElement>
                    <Icon
                      name={getValueTypeIconProps(value.type).name}
                      color={getValueTypeIconProps(value.type).color}
                      size={"xs"}
                    />
                  </Tag.StartElement>
                  <Tag.Label fontSize={"xs"}>{value.name}</Tag.Label>
                </Tag.Root>
              ))}
              <Text fontSize={"xs"}>
                and {values.length - 2} other{values.length - 2 !== 1 ? "s" : ""}
              </Text>
            </Flex>
          );
        } else {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {values.map((value) => (
                <Tag.Root colorPalette={getValueTypeIconProps(value.type).color.split(".")[0]}>
                  <Tag.StartElement>
                    <Icon
                      name={getValueTypeIconProps(value.type).name}
                      color={getValueTypeIconProps(value.type).color}
                      size={"xs"}
                    />
                  </Tag.StartElement>
                  <Tag.Label fontSize={"xs"}>{value.name}</Tag.Label>
                </Tag.Root>
              ))}
            </Flex>
          );
        }
      },
      header: "Values",
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("timestamp", {
      cell: (info) => {
        return (
          <Tooltip content={dayjs(info.getValue()).format("[Created:] DD MMMM YYYY, HH:MM A")} showArrow>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
              {dayjs(info.getValue()).fromNow()}
            </Text>
          </Tooltip>
        );
      },
      header: "Created",
      enableHiding: true,
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    columnHelper.accessor("owner", {
      cell: (info) => {
        return <ActorTag identifier={info.getValue()} fallback={"Unknown User"} size={"sm"} inline />;
      },
      header: "Owner",
      enableHiding: true,
    }),
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"row"} p={"1"} rounded={"md"} bg={"white"} wrap={"wrap"} gap={"2"}>
        <Flex w={"100%"} direction={"row"} justify={"space-between"} align={"center"}>
          <Flex align={"center"} gap={"1"} w={"100%"} ml={"0.5"}>
            <Flex direction={"column"} gap={"0"} align={"start"}>
              <Flex direction={"row"} align={"center"} gap={"1"}>
                <Icon name={"template"} size={"sm"} color={GLOBAL_STYLES.template.color.icon} />
                <Heading size={"xl"}>Templates</Heading>
              </Flex>
              <SkeletonText noOfLines={1} my={"0.5"} h={"22px"} loading={loading} asChild>
                <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.500"}>
                  {workspaceName}
                </Text>
              </SkeletonText>
            </Flex>
            <Spacer />
            <Tooltip
              content={"Insufficient permissions in this Workspace"}
              disabled={workspacePermissions.templates.create}
              showArrow
            >
              <Button
                colorPalette={"green"}
                onClick={() => navigate("/create/template")}
                size={"xs"}
                rounded={"md"}
                disabled={!workspacePermissions.templates.create}
              >
                Create Template
                <Icon name={"add"} size={"xs"} />
              </Button>
            </Tooltip>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"2"} w={"100%"}>
          <Text fontSize={"xs"} ml={"0.5"}>
            All Templates in the current Workspace are shown below. Sort the Templates using the column headers or use
            the filters below.
          </Text>

          {/* Filter Section */}
          <Collapsible.Root open={filtersOpen} onOpenChange={(event) => setFiltersOpen(event.open)}>
            <Flex
              direction={"column"}
              gap={"2"}
              p={"2"}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
            >
              <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"}>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Icon name={"filter"} size={"sm"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Template Filters:
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
                  <Flex direction={"row"} gap={["1", "4"]} wrap={"wrap"}>
                    {/* Date Range Filter */}
                    <Flex direction={"column"} gap={"1"} minW={"200px"} flexShrink={0}>
                      <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Created Between
                      </Text>
                      <Flex direction={"row"} gap={"2"} align={"center"}>
                        <Field.Root gap={"0"}>
                          <Field.Label fontSize={"xs"} ml={"0.5"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                            Start (optional)
                          </Field.Label>
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
                          <Field.Label fontSize={"xs"} ml={"0.5"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                            End (optional)
                          </Field.Label>
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

                    <Separator orientation={"vertical"} />

                    {/* Owner Filter */}
                    <Flex direction={"column"} gap={"1"} minW={"200px"} flexShrink={0}>
                      <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Owner
                      </Text>
                      <Flex direction={"column"} gap={"2"} maxH={"200px"} overflowY={"auto"} ml={"1"}>
                        {templates.length > 0 &&
                          _.uniq(templates.map((t) => t.owner))
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
                                      owners: filterState.owners.filter((o) => o !== owner),
                                    });
                                  }
                                }}
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                                <Checkbox.Label fontSize={"xs"}>
                                  <ActorTag identifier={owner} fallback={"Unknown User"} size="sm" inline />
                                </Checkbox.Label>
                              </Checkbox.Root>
                            ))}

                        {templates.length === 0 && (
                          <Text
                            fontSize={"xs"}
                            fontWeight={"semibold"}
                            color={GLOBAL_STYLES.font.secondaryHeader.color}
                          >
                            No Template Owners
                          </Text>
                        )}
                      </Flex>
                    </Flex>

                    <Separator orientation={"vertical"} />

                    {/* Value Count Range Filter */}
                    <Flex direction={"column"} gap={"1"} minW={"200px"} flexShrink={0}>
                      <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Value Count
                      </Text>
                      <Flex direction={"column"} gap={"2"} ml={"1"}>
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
                                  valueCountRanges: [...filterState.valueCountRanges, range],
                                });
                              } else {
                                setFilterState({
                                  ...filterState,
                                  valueCountRanges: filterState.valueCountRanges.filter((r) => r !== range),
                                });
                              }
                            }}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize={"xs"}>
                              {range === "0" ? "0 values" : range === "11+" ? "11+ values" : `${range} values`}
                            </Checkbox.Label>
                          </Checkbox.Root>
                        ))}
                      </Flex>
                    </Flex>
                  </Flex>

                  {/* Filter control buttons */}
                  <Flex direction={"row"} gap={"2"} align={"center"} justify={"flex-end"}>
                    <Button
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"blue"}
                      onClick={() => {
                        setAppliedFilters({ ...filterState });
                      }}
                    >
                      Apply Filters
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
                      Reset Filters
                    </Button>
                  </Flex>
                </Flex>
              </Collapsible.Content>
            </Flex>
          </Collapsible.Root>

          {filteredTemplates.filter((template) => _.isEqual(template.archived, false)).length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredTemplates.filter((template) => _.isEqual(template.archived, false))}
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
                  <Icon name={"template"} size={"lg"} color={GLOBAL_STYLES.template.color.default} />
                </EmptyState.Indicator>
                <EmptyState.Description>
                  {activeFilterCount > 0 ? "No templates match the selected filters" : "No Templates"}
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
