// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Box,
  Flex,
  Heading,
  Text,
  Dialog,
  Button,
  Spacer,
  Tag,
  useDisclosure,
  Select,
  Portal,
  createListCollection,
  EmptyState,
  CloseButton,
  Field,
  Input,
  Checkbox,
  Collapsible,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import DataTable from "@components/DataTable";
import { toaster } from "@components/Toast";
import { createColumnHelper, ColumnFiltersState } from "@tanstack/react-table";

// Existing and custom types
import { DataTableAction, EntityModel, IGenericItem } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { useWorkspace } from "@hooks/useWorkspace";

// Utility functions and libraries
import { gql } from "@apollo/client";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import _ from "lodash";
import FileSaver from "file-saver";
import slugify from "slugify";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const Entities = () => {
  const navigate = useNavigate();

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

  // Entities export modal
  const {
    open: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();

  const [toExport, setToExport] = useState([] as IGenericItem[]);
  const [exportFormat, setExportFormat] = useState("json" as "json" | "csv");
  const exportEntitiesRef = useRef<HTMLDivElement>(null);
  const [exportFormatSelected, setExportFormatSelected] = useState(false);

  // Add state for export table columns
  const [exportTableVisibleColumns] = useState({
    name: true,
    _id: true,
  });

  // Setup columns for review table
  const exportTableColumnHelper = createColumnHelper<IGenericItem>();
  const exportTableColumns = [
    exportTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip content={info.getValue()} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 32 })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Entity Name",
    }),
    exportTableColumnHelper.accessor("_id", {
      cell: () => (
        <Flex direction={"row"} gap={"1"} align={"center"} p={"1"}>
          <Icon name={"download"} color={"blue.600"} size={"xs"} />
          <Text fontWeight={"semibold"} fontSize={"xs"} color={"blue.600"}>
            {"Export"}
          </Text>
        </Flex>
      ),
      header: "Action",
    }),
  ];

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

  const { loading, error, data, refetch } = useQuery<{
    entities: { entities: EntityModel[]; total: number };
  }>(GET_ENTITIES, {
    variables: {
      page,
      pageSize,
      filter: filterVariables,
      sort: sortState || undefined,
    },
  });

  // Query to generate exported data
  const GET_ENTITIES_EXPORT = gql`
    query GetEntitiesExport($entities: [String], $format: String) {
      exportEntities(entities: $entities, format: $format)
    }
  `;
  const [exportEntities, { loading: exportLoading, error: exportError }] =
    useLazyQuery<{ exportEntities: string }>(GET_ENTITIES_EXPORT);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.entities?.entities) {
      // Set the paginated Entity data (already filtered and sorted on server)
      setEntityData(data.entities.entities);
    }
  }, [data]);

  // Calculate active filter count
  useEffect(() => {
    let count = 0;
    if (appliedFilters.startDate) count++;
    if (appliedFilters.endDate) count++;
    if (appliedFilters.owners.length > 0) count += appliedFilters.owners.length;
    if (appliedFilters.hasAttachments) count++;
    if (appliedFilters.attributeCountRanges.length > 0)
      count += appliedFilters.attributeCountRanges.length;
    setActiveFilterCount(count);
  }, [appliedFilters]);

  const { workspace } = useWorkspace();

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

  // Refetch when pagination, filters, or sort changes
  useEffect(() => {
    if (refetch) {
      refetch();
    }
  }, [page, pageSize, appliedFilters, sortState, refetch]);

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
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 48}
              showArrow
            >
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 48 })}
              </Text>
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
              <Icon name={"a_right"} />
            </Button>
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 400,
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
              disabled={info.getValue().length < 64}
              showArrow
            >
              <Text fontSize={"xs"}>
                {_.truncate(info.getValue(), { length: 64 })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 400,
      },
    }),
    columnHelper.accessor("owner", {
      cell: (info) => {
        return (
          <ActorTag
            identifier={info.getValue()}
            fallback={"Unknown User"}
            size={"sm"}
            inline
          />
        );
      },
      header: "Owner",
      enableHiding: true,
    }),
    columnHelper.accessor("created", {
      cell: (info) => (
        <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
          {dayjs(info.getValue()).fromNow()}
        </Text>
      ),
      header: "Created",
      enableHiding: true,
    }),
    columnHelper.accessor("attributes", {
      cell: (info) => (
        <Tag.Root colorPalette={"green"} size={"sm"}>
          <Tag.Label fontSize={"xs"}>{info.getValue().length}</Tag.Label>
        </Tag.Root>
      ),
      header: "Attributes",
      enableHiding: true,
    }),
    columnHelper.accessor("attachments", {
      cell: (info) => (
        <Tag.Root colorPalette={"purple"} size={"sm"}>
          <Tag.Label fontSize={"xs"}>{info.getValue().length}</Tag.Label>
        </Tag.Root>
      ),
      header: "Attachments",
      enableHiding: true,
    }),
  ];

  const actions: DataTableAction[] = [
    {
      label: `Export Selected`,
      icon: "download",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      action: async (table, rows: any) => {
        // Export rows that have been selected
        const selectedEntities: IGenericItem[] = [];
        for (const rowIndex of Object.keys(rows)) {
          selectedEntities.push({
            _id: table.getRow(rowIndex).original._id,
            name: table.getRow(rowIndex).original.name,
          });
        }
        setToExport(selectedEntities);

        // Open the Entity export modal
        onExportOpen();

        table.resetRowSelection();
      },
    },
  ];

  const onExportClick = async () => {
    const response = await exportEntities({
      variables: {
        // Only pass the Entity identifiers
        entities: toExport.map((entity) => entity._id),
        format: exportFormat,
      },
    });

    if (!response.data?.exportEntities) {
      toaster.create({
        title: "Error",
        description: "Unable to export entities",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else if (response.data?.exportEntities) {
      FileSaver.saveAs(
        new Blob([response.data.exportEntities]),
        slugify(
          `export_entities_${dayjs(Date.now()).format(
            "YYYY_MM_DD",
          )}.${exportFormat}`,
        ),
      );
    }

    // Reset the Entity export collection and close the modal
    setToExport([]);
    onExportClose();
  };

  return (
    <Content
      isError={!_.isUndefined(error) || !_.isUndefined(exportError)}
      isLoaded={!loading && !exportLoading}
    >
      <Flex
        direction={"row"}
        p={"1"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"1"}
        minW="0"
        maxW="100%"
      >
        <Flex
          w={"100%"}
          minW="0"
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"1"} w={"100%"} minW="0">
            <Icon name={"entity"} size={"sm"} />
            <Heading size={"md"}>Entities</Heading>
            <Spacer />
            <Button
              colorPalette={"green"}
              onClick={() => navigate("/create/entity")}
              size={"xs"}
              rounded={"md"}
            >
              Create Entity
              <Icon name={"add"} size={"xs"} />
            </Button>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"2"} w={"100%"} minW="0" maxW="100%">
          <Text fontSize={"xs"} ml={"0.5"}>
            All Entities in the current Workspace are shown below. Sort the
            Entities using the column headers or use the filters below.
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
                    Entity Filters
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
                      {_.uniq(entityData.map((e) => e.owner))
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
                                identifier={owner}
                                fallback={"Unknown User"}
                                size={"sm"}
                                inline
                              />
                            </Checkbox.Label>
                          </Checkbox.Root>
                        ))}
                    </Flex>
                  </Flex>

                  {/* Has Attachments Filter */}
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    minW={"200px"}
                    flexShrink={0}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Attachments
                    </Text>
                    <Checkbox.Root
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
                      <Checkbox.Label fontSize={"xs"}>
                        Has Attachments
                      </Checkbox.Label>
                    </Checkbox.Root>
                  </Flex>

                  {/* Attribute Count Range Filter */}
                  <Flex
                    direction={"column"}
                    gap={"1"}
                    minW={"200px"}
                    flexShrink={0}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      Attribute Count
                    </Text>
                    <Flex direction={"column"} gap={"1"}>
                      {["0", "1-5", "6-10", "11+"].map((range) => (
                        <Checkbox.Root
                          key={range}
                          size={"xs"}
                          colorPalette={"blue"}
                          checked={filterState.attributeCountRanges.includes(
                            range,
                          )}
                          onCheckedChange={(details) => {
                            const isChecked = details.checked as boolean;
                            if (isChecked) {
                              setFilterState({
                                ...filterState,
                                attributeCountRanges: [
                                  ...filterState.attributeCountRanges,
                                  range,
                                ],
                              });
                            } else {
                              setFilterState({
                                ...filterState,
                                attributeCountRanges:
                                  filterState.attributeCountRanges.filter(
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
                setPage(0); // Reset to first page when filters change
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
                  hasAttachments: false,
                  attributeCountRanges: [],
                };
                setFilterState(clearedState);
                setAppliedFilters(clearedState);
              }}
              disabled={activeFilterCount === 0}
            >
              Clear
            </Button>
          </Flex>

          {entityData.filter((entity) => _.isEqual(entity.archived, false))
            .length > 0 ? (
            <Box w="100%" minW="0" maxW="100%">
              <DataTable
                columns={columns}
                data={entityData.filter((entity) =>
                  _.isEqual(entity.archived, false),
                )}
                visibleColumns={visibleColumns}
                selectedRows={{}}
                actions={actions}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                showColumnSelect
                showPagination
                showSelection
                pageCount={
                  data?.entities?.total
                    ? Math.ceil(data.entities.total / pageSize)
                    : 0
                }
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
                  <Icon name={"entity"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>
                  {activeFilterCount > 0
                    ? "No entities match the selected filters"
                    : "No Entities"}
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}
        </Flex>
      </Flex>

      <Dialog.Root
        open={isExportOpen}
        size={"xl"}
        placement={"center"}
        scrollBehavior={"inside"}
        onEscapeKeyDown={onExportClose}
        onInteractOutside={onExportClose}
      >
        <Dialog.Trigger />
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {/* Heading and close button */}
            <Dialog.Header
              p={"2"}
              fontWeight={"semibold"}
              roundedTop={"md"}
              bg={"blue.300"}
            >
              Export Entities
              <Dialog.CloseTrigger asChild>
                <CloseButton size={"2xs"} top={"6px"} onClick={onExportClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p={"1"}>
              {/* Select export format */}
              <Flex gap={"1"} direction={"column"}>
                <Flex
                  w={"100%"}
                  direction={"row"}
                  gap={"1"}
                  align={"center"}
                  ml={"0.5"}
                >
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    File Format:
                  </Text>
                  <Flex>
                    <Field.Root invalid={!exportFormatSelected} required>
                      <Select.Root
                        key={"select-export-format"}
                        size={"xs"}
                        w={"xs"}
                        rounded={"md"}
                        collection={createListCollection({
                          items: ["JSON", "CSV"],
                        })}
                        onValueChange={(details) => {
                          setExportFormat(
                            details.items[0].toLowerCase() as "json" | "csv",
                          );
                          setExportFormatSelected(true);
                        }}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText
                              placeholder={"Select export format"}
                            />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal container={exportEntitiesRef}>
                          <Select.Positioner>
                            <Select.Content zIndex={9999}>
                              {createListCollection({
                                items: ["JSON", "CSV"],
                              }).items.map((valueType) => (
                                <Select.Item item={valueType} key={valueType}>
                                  {valueType}
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    </Field.Root>
                  </Flex>
                </Flex>

                <Flex
                  w={"100%"}
                  direction={"column"}
                  gap={"2"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  rounded={"md"}
                >
                  <DataTable
                    columns={exportTableColumns}
                    data={toExport}
                    visibleColumns={exportTableVisibleColumns}
                    selectedRows={{}}
                    showPagination
                  />
                </Flex>
              </Flex>
            </Dialog.Body>
            <Dialog.Footer p={"1"} bg={"gray.100"} roundedBottom={"md"}>
              <Flex direction={"row"} w={"100%"} justify={"space-between"}>
                {/* "Export" button */}
                <Flex
                  direction={"row"}
                  w={"100%"}
                  gap={"2"}
                  justify={"right"}
                  align={"center"}
                >
                  <Button
                    colorPalette={"blue"}
                    size={"xs"}
                    onClick={() => onExportClick()}
                    loading={exportLoading}
                    rounded={"md"}
                    disabled={!exportFormatSelected}
                  >
                    Download
                    <Icon name={"download"} />
                  </Button>
                </Flex>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Content>
  );
};

export default Entities;
