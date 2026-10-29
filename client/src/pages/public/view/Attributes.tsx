// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, EmptyState, Flex, Text } from "@chakra-ui/react";
import DataTable from "@components/DataTable";
import DataTableFilters from "@components/DataTable/DataTableFilters";
import { Content } from "@components/Container";
import { TagValue } from "@components/TagField";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import PageHeader from "@components/PageHeader";
import { CellCreatedField, CellDescriptionField, CellOwnerField } from "@components/DataTable/DataTableCell";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import { AttributeModel, DataTableFilterValues, IGenericItem } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { countActiveFilters, createEmptyFilterValues, filterTableData, getPublicWorkspaceUrl } from "@lib/util";

// Routing and navigation
import { useNavigate, useParams } from "react-router-dom";

// GraphQL imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Variables
import { STYLES } from "@variables";

export const Attributes = () => {
  const navigate = useNavigate();
  const { id: workspace } = useParams();
  const [workspaceName, setWorkspaceName] = useState("");

  // Page state
  const [attributes, setAttributes] = useState([] as AttributeModel[]);

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState<DataTableFilterValues>(createEmptyFilterValues);
  const filteredAttributes = filterTableData(attributes, appliedFilters, {
    created: (attribute) => attribute.timestamp,
    owner: (attribute) => attribute.owner,
    counts: {
      values: (attribute) => attribute.values.length,
      usage: (attribute) => attribute.usageCount ?? 0,
    },
  });

  // GraphQL operations
  const GET_ATTRIBUTES = gql`
    query GetAttributes($workspace: String) {
      attributes {
        _id
        name
        owner
        archived
        timestamp
        description
        usageCount
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
  const { loading, error, data, previousData } = useQuery<{
    attributes: AttributeModel[];
    workspace: IGenericItem;
  }>(GET_ATTRIBUTES, {
    variables: {
      workspace: workspace,
    },
    fetchPolicy: "network-only",
    context: {
      uri: getPublicWorkspaceUrl(workspace ?? ""),
    },
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.attributes) {
      // Unpack all the Attributes data
      setAttributes(data.attributes);
    }

    if (data?.workspace) {
      // Store the Workspace name
      setWorkspaceName(data.workspace.name);
    }
  }, [loading]);

  useEffect(() => {
    if (error) {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Unable to retrieve Attributes",
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
                <Icon name={"attribute"} color={STYLES.attribute.color.icon} size={"xs"} />
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
              aria-label={"View Attribute"}
              onClick={() => navigate(`/public/${workspace}/attributes/${info.row.original._id}`)}
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
    columnHelper.accessor("values", {
      cell: (info) => (
        <FieldTagList
          items={info.row.original.values}
          max={2}
          emptyLabel={"Values"}
          getKey={(value) => value._id}
          renderTag={(value) => <TagValue value={value} />}
        />
      ),
      header: "Values",
      meta: {
        minWidth: 300,
      },
    }),
    columnHelper.accessor("timestamp", {
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

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading || !_.isUndefined(previousData)}>
      <Flex direction={"row"} p={"1"} rounded={"md"} wrap={"wrap"} gap={"2"}>
        <Flex w={"100%"} direction={"row"} justify={"space-between"} align={"center"}>
          <Flex align={"center"} gap={"1"} w={"100%"} ml={"0.5"}>
            <PageHeader
              icon={"attribute"}
              iconColor={STYLES.attribute.color.icon}
              title={"Public Attributes"}
              subtitle={workspaceName}
              loading={loading}
            />
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"2"} w={"100%"}>
          <Text fontSize={"xs"} ml={"0.5"}>
            All Attributes in the current Workspace are shown below. Sort the Attributes using the column headers or use
            the filters below.
          </Text>

          {/* Filter Section */}
          <DataTableFilters
            entityLabel={"Attribute"}
            owners={attributes.map((attribute) => attribute.owner)}
            workspace={workspace}
            isPublic
            ranges={[
              { key: "values", label: "Value Count" },
              { key: "usage", label: "Usage Count" },
            ]}
            values={appliedFilters}
            onApply={setAppliedFilters}
          />

          {filteredAttributes.filter((attribute) => _.isEqual(attribute.archived, false)).length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredAttributes.filter((attribute) => _.isEqual(attribute.archived, false))}
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
                  <Icon name={"attribute"} size={"lg"} color={STYLES.attribute.color.default} />
                </EmptyState.Indicator>
                <EmptyState.Description>
                  {countActiveFilters(appliedFilters) > 0
                    ? "No Attributes match the selected filters"
                    : "No Attributes"}
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Attributes;
