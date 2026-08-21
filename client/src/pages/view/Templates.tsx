// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, EmptyState, Flex, Spacer, Text } from "@chakra-ui/react";
import DataTable from "@components/DataTable";
import DataTableFilters from "@components/DataTable/DataTableFilters";
import { Content } from "@components/Container";
import { ValueTag } from "@components/FieldTag";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import PageHeader from "@components/PageHeader";
import { CreatedCell, DescriptionCell, OwnerCell } from "@components/DataTable/DataTableCell";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import { AttributeModel, IGenericItem } from "@types";

// Utility functions and libraries
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
import { STYLES } from "@variables";

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
                <Icon name={"template"} color={STYLES.template.color.icon} size={"xs"} />
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
    columnHelper.accessor("values", {
      cell: (info) => (
        <FieldTagList
          items={info.row.original.values}
          max={2}
          emptyLabel={"Values"}
          getKey={(value) => value._id}
          renderTag={(value) => <ValueTag value={value} />}
        />
      ),
      header: "Values",
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("timestamp", {
      cell: (info) => <CreatedCell value={info.getValue()} />,
      header: "Created",
      enableHiding: true,
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    columnHelper.accessor("owner", {
      cell: (info) => <OwnerCell value={info.getValue()} />,
      header: "Owner",
      enableHiding: true,
    }),
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"row"} p={"1"} rounded={"md"} wrap={"wrap"} gap={"2"}>
        <Flex w={"100%"} direction={"row"} justify={"space-between"} align={"center"}>
          <Flex align={"center"} gap={"1"} w={"100%"} ml={"0.5"}>
            <PageHeader
              icon={"template"}
              iconColor={STYLES.template.color.icon}
              title={"Templates"}
              subtitle={workspaceName}
              loading={loading}
            />
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
          <DataTableFilters
            entityLabel={"Template"}
            filtersOpen={filtersOpen}
            onFiltersOpenChange={setFiltersOpen}
            activeFilterCount={activeFilterCount}
            startDate={filterState.startDate}
            endDate={filterState.endDate}
            onStartDateChange={(value) => setFilterState({ ...filterState, startDate: value })}
            onEndDateChange={(value) => setFilterState({ ...filterState, endDate: value })}
            owners={templates.map((t) => t.owner)}
            selectedOwners={filterState.owners}
            onOwnersChange={(owners) => setFilterState({ ...filterState, owners })}
            countFilter={{
              mode: "buckets",
              label: "Value Count",
              unitLabel: "values",
              selected: filterState.valueCountRanges,
              onChange: (valueCountRanges) => setFilterState({ ...filterState, valueCountRanges }),
            }}
            onApply={() => setAppliedFilters({ ...filterState })}
            onReset={() => {
              const clearedState = {
                startDate: "",
                endDate: "",
                owners: [],
                valueCountRanges: [],
              };
              setFilterState(clearedState);
              setAppliedFilters(clearedState);
            }}
          />

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
                  <Icon name={"template"} size={"lg"} color={STYLES.template.color.default} />
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
