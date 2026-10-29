// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Box, Flex, Text, Button, Tag, EmptyState } from "@chakra-ui/react";
import { Content } from "@components/Container";
import DialogExport from "@components/DialogExport";
import { TagAttribute } from "@components/TagField";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import PageHeader from "@components/PageHeader";
import { CellCreatedField, CellDescriptionField, CellOwnerField } from "@components/DataTable/DataTableCell";
import Tooltip from "@components/Tooltip";
import DataTable from "@components/DataTable";
import DataTableFilters from "@components/DataTable/DataTableFilters";
import { createColumnHelper, ColumnFiltersState } from "@tanstack/react-table";

// Existing and custom types
import { DataTableAction, DataTableFilterValues, EntityFilter, EntityModel, IGenericItem } from "@types";

// Routing and navigation
import { useNavigate, useParams } from "react-router-dom";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// GraphQL imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import { countActiveFilters, createEmptyFilterValues, getPublicWorkspaceUrl, toCountRange } from "@lib/util";

// Variables
import { STYLES } from "@variables";

export const Entities = () => {
  const navigate = useNavigate();

  const { id: workspace } = useParams();
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

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState<DataTableFilterValues>(createEmptyFilterValues);

  // Entities export dialog
  const [exportOpen, setExportOpen] = useState(false);
  const [exportIds] = useState<string[] | undefined>(undefined);

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
  const filterVariables: EntityFilter = {
    startDate: appliedFilters.startDate || undefined,
    endDate: appliedFilters.endDate || undefined,
    owners: appliedFilters.owners.length > 0 ? appliedFilters.owners : undefined,
    hasAttachments: appliedFilters.toggles.hasAttachments || undefined,
    attributeCount: toCountRange(appliedFilters.ranges.attributes),
    projectCount: toCountRange(appliedFilters.ranges.projects),
  };

  const { loading, error, data, previousData } = useQuery<{
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
      cell: (info) => <CellDescriptionField value={info.getValue()} maxLength={48} />,
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
          renderTag={(attribute) => <TagAttribute attribute={attribute} />}
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
      cell: (info) => <CellCreatedField value={info.getValue()} />,
      header: "Created",
      enableHiding: true,
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    columnHelper.accessor("owner", {
      cell: (info) => <CellOwnerField value={info.getValue()} workspace={workspace} isPublic />,
      header: "Owner",
      enableHiding: true,
    }),
  ];

  const actions: DataTableAction[] = [];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading || !_.isUndefined(previousData)}>
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
          <DataTableFilters
            entityLabel={"Entity"}
            owners={entityData.map((e) => e.owner)}
            workspace={workspace}
            isPublic
            toggles={[{ key: "hasAttachments", label: "Attachments", checkboxLabel: "Has Attachments" }]}
            ranges={[
              { key: "attributes", label: "Attribute Count" },
              { key: "projects", label: "Project Count" },
            ]}
            values={appliedFilters}
            onApply={(values) => {
              setAppliedFilters(values);
              setPage(0); // Reset to first page when filters change
            }}
          />

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
                  {countActiveFilters(appliedFilters) > 0 ? "No Entities match the selected filters" : "No Entities"}
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}
        </Flex>
      </Flex>

      <DialogExport open={exportOpen} setOpen={setExportOpen} dataType={"entities"} ids={exportIds} />
    </Content>
  );
};

export default Entities;
