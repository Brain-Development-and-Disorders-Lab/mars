// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spacer,
  Tag,
  EmptyState,
  Field,
  Input,
  Checkbox,
  Collapsible,
  SkeletonText,
  Separator,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import ExportDialog from "@components/ExportDialog";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import DataTable from "@components/DataTable";
import { createColumnHelper, ColumnFiltersState } from "@tanstack/react-table";

// Existing and custom types
import { DataTableAction, EntityModel, IGenericItem } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { useWorkspace } from "@hooks/useWorkspace";
import { usePermissions } from "@hooks/usePermissions";

// GraphQL imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Variables
import { STYLES } from "@variables";

const Entities = () => {
  const navigate = useNavigate();

  // Permissions
  const { workspacePermissions } = usePermissions();

  const { workspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");

  const [entityData, setEntityData] = useState([] as EntityModel[]);

  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    owner: true,
    created: true,
  });

  // Column filters state for entity table
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Filter state (temporary values before applying)
  const [filterState, setFilterState] = useState({
    startDate: "",
    endDate: "",
    owners: [] as string[],
    hasAttachments: false,
    attributeCountRanges: [] as string[],
  });

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "",
    endDate: "",
    owners: [] as string[],
    hasAttachments: false,
    attributeCountRanges: [] as string[],
  });

  // Collapsible state for filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Entities export dialog
  const [exportOpen, setExportOpen] = useState(false);
  const [exportIds, setExportIds] = useState<string[] | undefined>(undefined);

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Sort state
  const [sortState, setSortState] = useState<{
    field: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Query to retrieve Entities
  const GET_ENTITIES = gql`
    query GetEntities(
      $page: Int
      $pageSize: Int
      $filter: EntityFilterInput
      $sort: EntitySortInput
      $workspace: String
    ) {
      entities(page: $page, pageSize: $pageSize, filter: $filter, sort: $sort) {
        entities {
          _id
          archived
          owner
          name
          description
          created
          attributes {
            _id
            name
            values {
              _id
              name
            }
          }
          attachments {
            _id
            name
          }
        }
        total
      }
      workspace(_id: $workspace) {
        _id
        name
      }
    }
  `;
  // Build filter object (only include non-empty values)
  const filterVariables =
    appliedFilters.startDate ||
    appliedFilters.endDate ||
    appliedFilters.owners.length > 0 ||
    appliedFilters.hasAttachments ||
    appliedFilters.attributeCountRanges.length > 0
      ? {
          ...(appliedFilters.startDate && {
            startDate: appliedFilters.startDate,
          }),
          ...(appliedFilters.endDate && { endDate: appliedFilters.endDate }),
          ...(appliedFilters.owners.length > 0 && {
            owners: appliedFilters.owners,
          }),
          ...(appliedFilters.hasAttachments && { hasAttachments: true }),
          ...(appliedFilters.attributeCountRanges.length > 0 && {
            attributeCountRanges: appliedFilters.attributeCountRanges,
          }),
        }
      : undefined;

  const { loading, error, data } = useQuery<{
    entities: { entities: EntityModel[]; total: number };
    workspace: IGenericItem;
  }>(GET_ENTITIES, {
    fetchPolicy: "network-only",
    variables: {
      workspace,
      page,
      pageSize,
      filter: filterVariables,
      sort: sortState || undefined,
    },
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.entities?.entities) {
      // Set the paginated Entity data (already filtered and sorted on server)
      setEntityData(data.entities.entities);
    }
    if (data?.workspace) {
      // Store the Workspace name
      setWorkspaceName(data.workspace.name);
    }
  }, [data]);

  // Calculate active filter count
  useEffect(() => {
    let count = 0;
    if (appliedFilters.startDate) count++;
    if (appliedFilters.endDate) count++;
    if (appliedFilters.owners.length > 0) count += appliedFilters.owners.length;
    if (appliedFilters.hasAttachments) count++;
    if (appliedFilters.attributeCountRanges.length > 0) count += appliedFilters.attributeCountRanges.length;
    setActiveFilterCount(count);
  }, [appliedFilters]);

  // Update column visibility when breakpoint changes
  useEffect(() => {
    const isMobile = breakpoint === "base" || breakpoint === "sm";
    setVisibleColumns({
      description: !isMobile,
      owner: !isMobile,
      created: !isMobile,
    });
  }, [breakpoint]);

  // Configure table columns and data
  const columnHelper = createColumnHelper<EntityModel>();
  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 48} showArrow>
              <Flex gap={"1"} align={"center"}>
                <Icon name={"entity"} color={STYLES.entity.color.icon} size={"xs"} />
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
              aria-label={"View Entity"}
              onClick={() => navigate(`/entities/${info.row.original._id}`)}
            >
              View
              <Icon name={"a_right"} size={"xs"} />
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
              <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 48 })}</Text>
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
    columnHelper.accessor("attributes", {
      cell: (info) => {
        const attributes = info.row.original.attributes;

        // 0 Attributes
        if (attributes.length === 0) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>No Attributes</Tag.Label>
            </Tag.Root>
          );
        }

        // Multiple Attributes
        if (attributes.length > 1) {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {attributes.slice(0, 1).map((attribute) => (
                <Tag.Root colorPalette={"template"}>
                  <Tag.StartElement>
                    <Icon name={"attribute"} color={STYLES.template.color.icon} size={"xs"} />
                  </Tag.StartElement>
                  <Tag.Label fontSize={"xs"}>{attribute.name}</Tag.Label>
                </Tag.Root>
              ))}
              <Text fontSize={"xs"}>
                and {attributes.length - 1} other{attributes.length - 1 !== 1 ? "s" : ""}
              </Text>
            </Flex>
          );
        } else {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {attributes.map((attribute) => (
                <Tag.Root colorPalette={"template"}>
                  <Tag.StartElement>
                    <Icon name={"attribute"} color={STYLES.template.color.icon} size={"xs"} />
                  </Tag.StartElement>
                  <Tag.Label fontSize={"xs"}>{attribute.name}</Tag.Label>
                </Tag.Root>
              ))}
            </Flex>
          );
        }
      },
      header: "Attributes",
      enableHiding: true,
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("attachments", {
      cell: (info) => (
        <Tag.Root colorPalette={info.getValue().length > 0 ? "purple" : "orange"} size={"sm"}>
          <Tag.Label fontSize={"xs"}>
            {info.getValue().length > 0 ? info.getValue().length : "No Attachments"}
          </Tag.Label>
        </Tag.Root>
      ),
      header: "Attachments",
      enableHiding: true,
      meta: {
        minWidth: 180,
        maxWidth: 180,
      },
    }),
    columnHelper.accessor("created", {
      cell: (info) => (
        <Tooltip content={dayjs(info.getValue()).format("[Created:] DD MMMM YYYY, HH:MM A")} showArrow>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
            {dayjs(info.getValue()).fromNow()}
          </Text>
        </Tooltip>
      ),
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

  const actions: DataTableAction[] = [
    {
      label: (count: number) => `Export Selected (${count})`,
      icon: "download",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      action: async (table, rows: any) => {
        const ids = Object.keys(rows).map((rowIndex) => table.getRow(rowIndex).original._id as string);
        setExportIds(ids);
        setExportOpen(true);
        table.resetRowSelection();
      },
    },
    {
      label: () => `Export All (${data?.entities?.total ?? 0})`,
      icon: "download",
      alwaysEnabled: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
      action: async (table, _rows: any) => {
        setExportIds(undefined);
        setExportOpen(true);
        table.resetRowSelection();
      },
    },
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"row"} p={"1"} rounded={"md"} wrap={"wrap"} gap={"2"} minW="0" maxW="100%">
        <Flex w={"100%"} minW="0" direction={"row"} justify={"space-between"} align={"center"}>
          <Flex align={"center"} gap={"1"} w={"100%"} minW="0" ml={"0.5"}>
            <Flex direction={"column"} gap={"0"} align={"start"}>
              <Flex direction={"row"} align={"center"} gap={"1"}>
                <Icon name={"entity"} size={"sm"} color={STYLES.entity.color.icon} />
                <Heading size={"xl"}>Entities</Heading>
              </Flex>
              <SkeletonText noOfLines={1} my={"0.5"} h={"22px"} loading={loading} asChild>
                <Text fontSize={"sm"} fontWeight={"semibold"} color={"text.subtle"}>
                  {workspaceName}
                </Text>
              </SkeletonText>
            </Flex>
            <Spacer />
            <Tooltip
              content={"Insufficient permissions in this Workspace"}
              disabled={workspacePermissions.entities.create}
              showArrow
            >
              <Button
                colorPalette={"green"}
                onClick={() => navigate("/create/entity")}
                size={"xs"}
                rounded={"md"}
                disabled={!workspacePermissions.entities.create}
              >
                Create Entity
                <Icon name={"add"} size={"xs"} />
              </Button>
            </Tooltip>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"2"} w={"100%"} minW="0" maxW="100%">
          <Text fontSize={"xs"} ml={"0.5"}>
            All Entities in the current Workspace are shown below. Sort the Entities using the column headers or use the
            filters below.
          </Text>

          {/* Filter Section */}
          <Collapsible.Root open={filtersOpen} onOpenChange={(event) => setFiltersOpen(event.open)}>
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
                    Entity Filters:
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
                    <Flex direction={"column"} gap={"1"} flexShrink={0}>
                      <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Owner
                      </Text>
                      <Flex direction={"column"} gap={"2"} maxH={"200px"} overflowY={"auto"} ml={"1"}>
                        {entityData.length > 0 &&
                          _.uniq(entityData.map((e) => e.owner))
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
                                  <ActorTag identifier={owner} fallback={"Unknown User"} size={"sm"} inline />
                                </Checkbox.Label>
                              </Checkbox.Root>
                            ))}

                        {entityData.length === 0 && (
                          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                            No Entity Owners
                          </Text>
                        )}
                      </Flex>
                    </Flex>

                    <Separator orientation={"vertical"} />

                    {/* Has Attachments Filter */}
                    <Flex direction={"column"} gap={"1"} flexShrink={0}>
                      <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Attachments
                      </Text>
                      <Checkbox.Root
                        ml={"1"}
                        size={"xs"}
                        colorPalette={"blue"}
                        checked={filterState.hasAttachments}
                        onCheckedChange={(details) => {
                          setFilterState({
                            ...filterState,
                            hasAttachments: details.checked as boolean,
                          });
                        }}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label fontSize={"xs"}>Has Attachments</Checkbox.Label>
                      </Checkbox.Root>
                    </Flex>

                    <Separator orientation={"vertical"} />

                    {/* Attribute Count Range Filter */}
                    <Flex direction={"column"} gap={"1"} flexShrink={0}>
                      <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Attribute Count
                      </Text>
                      <Flex direction={"column"} gap={"2"} ml={"1"}>
                        {["0", "1-5", "6-10", "11+"].map((range) => (
                          <Checkbox.Root
                            key={range}
                            size={"xs"}
                            colorPalette={"blue"}
                            checked={filterState.attributeCountRanges.includes(range)}
                            onCheckedChange={(details) => {
                              const isChecked = details.checked as boolean;
                              if (isChecked) {
                                setFilterState({
                                  ...filterState,
                                  attributeCountRanges: [...filterState.attributeCountRanges, range],
                                });
                              } else {
                                setFilterState({
                                  ...filterState,
                                  attributeCountRanges: filterState.attributeCountRanges.filter((r) => r !== range),
                                });
                              }
                            }}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize={"xs"}>
                              {range === "0"
                                ? "0 attributes"
                                : range === "11+"
                                  ? "11+ attributes"
                                  : `${range} attributes`}
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
                        setPage(0); // Reset to first page when filters change
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
                          hasAttachments: false,
                          attributeCountRanges: [],
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

          {entityData.filter((entity) => _.isEqual(entity.archived, false)).length > 0 ? (
            <Box w="100%" minW="0" maxW="100%">
              <DataTable
                columns={columns}
                data={entityData.filter((entity) => _.isEqual(entity.archived, false))}
                visibleColumns={visibleColumns}
                selectedRows={{}}
                actions={actions}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                showColumnSelect
                showPagination
                showSelection
                pageCount={data?.entities?.total ? Math.ceil(data.entities.total / pageSize) : 0}
                pageIndex={page}
                pageSize={pageSize}
                onPaginationChange={(newPageIndex, newPageSize) => {
                  // If page size changed, reset to first page
                  if (newPageSize !== pageSize) {
                    setPage(0);
                    setPageSize(newPageSize);
                  } else {
                    setPage(newPageIndex);
                    setPageSize(newPageSize);
                  }
                }}
                sortState={sortState}
                onSortChange={(field, direction) => {
                  if (direction) {
                    setSortState({ field, direction });
                    setPage(0); // Reset to first page when sorting changes
                  } else {
                    setSortState(null);
                    setPage(0);
                  }
                }}
              />
            </Box>
          ) : (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"entity"} size={"lg"} color={STYLES.entity.color.icon} />
                </EmptyState.Indicator>
                <EmptyState.Description>
                  {activeFilterCount > 0 ? "No entities match the selected filters" : "No Entities"}
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}
        </Flex>
      </Flex>

      <ExportDialog open={exportOpen} setOpen={setExportOpen} dataType={"entities"} ids={exportIds} />
    </Content>
  );
};

export default Entities;
