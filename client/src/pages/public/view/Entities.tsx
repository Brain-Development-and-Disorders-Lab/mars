// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Box,
  Flex,
  Text,
  Button,
  Tag,
  EmptyState,
  Field,
  Input,
  Checkbox,
  Collapsible,
  Separator,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import ExportDialog from "@components/ExportDialog";
import { AttributeTag } from "@components/FieldTag";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import PageHeader from "@components/PageHeader";
import { CreatedCell, DescriptionCell, OwnerCell } from "@components/DataTableCell";
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
import { getPublicWorkspaceUrl } from "@lib/util";

export const Entities = () => {
  const navigate = useNavigate();

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
    context: {
      uri: getPublicWorkspaceUrl(workspace ?? ""),
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
              onClick={() => navigate(`/public/${workspace}/entities/${info.row.original._id}`)}
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
      cell: (info) => <DescriptionCell value={info.getValue()} maxLength={48} />,
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("attributes", {
      cell: (info) => (
        <FieldTagList
          items={info.row.original.attributes}
          max={1}
          emptyLabel={"Attributes"}
          getKey={(attribute) => attribute._id}
          renderTag={(attribute) => <AttributeTag attribute={attribute} />}
        />
      ),
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
      cell: (info) => <CreatedCell value={info.getValue()} />,
      header: "Created",
      enableHiding: true,
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    columnHelper.accessor("owner", {
      cell: (info) => <OwnerCell value={info.getValue()} isPublic />,
      header: "Owner",
      enableHiding: true,
    }),
  ];

  const actions: DataTableAction[] = [];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"row"} p={"1"} rounded={"md"} wrap={"wrap"} gap={"2"} minW="0" maxW="100%">
        <Flex w={"100%"} minW="0" direction={"row"} justify={"space-between"} align={"center"}>
          <Flex align={"center"} gap={"1"} w={"100%"} minW="0" ml={"0.5"}>
            <PageHeader
              icon={"entity"}
              iconColor={STYLES.entity.color.icon}
              title={"Public Entities"}
              subtitle={workspaceName}
              loading={loading}
            />
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
                                  <ActorTag identifier={owner} fallback={"Unknown User"} size={"sm"} isPublic inline />
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
