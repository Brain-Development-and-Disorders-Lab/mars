import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, EmptyState, Flex, Text } from "@chakra-ui/react";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import { CreatedCell, DescriptionCell, OwnerCell } from "@components/DataTableCell";
import { AttributeTag } from "@components/FieldTag";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import PageHeader from "@components/PageHeader";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Routing and navigation
import { useParams } from "react-router-dom";

// GraphQL
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Custom types
import { EntityModel, WorkspaceModel } from "@types";

// Variables
import { STYLES } from "@variables";

// Hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Utility functions
import { getPublicWorkspaceUrl } from "@lib/util";
import _ from "lodash";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

// Queries
const GET_WORKSPACE = gql`
  query GetWorkspace($workspace: String, $entityLimit: Int, $entitiesArchived: Boolean) {
    workspace(_id: $workspace) {
      _id
      name
    }
    entities(limit: $entityLimit, archived: $entitiesArchived, reverse: true) {
      entities {
        _id
        archived
        owner
        name
        description
        timestamp
        attributes {
          _id
          name
        }
      }
      total
    }
  }
`;

export const Dashboard = () => {
  const { id } = useParams();

  // Display state
  const [workspaceName, setWorkspaceName] = useState<string>();
  const [workspaceEntities, setWorkspaceEntities] = useState<EntityModel[]>([]);

  // Execute GraphQL query both on page load and navigation
  const { loading, error, data } = useQuery<{
    workspace: WorkspaceModel;
    entities: { entities: EntityModel[]; total: number };
  }>(GET_WORKSPACE, {
    variables: {
      workspace: id,
      entityLimit: 10,
      entitiesArchived: false,
    },
    // Send this query to the public Workspace endpoint
    context: {
      uri: getPublicWorkspaceUrl(id ?? ""),
    },
    fetchPolicy: "network-only",
    skip: !id,
  });

  // Assign data
  useEffect(() => {
    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }

    if (data?.entities) {
      setWorkspaceEntities(data.entities.entities);
    }
  }, [data]);

  // Display error messages from GraphQL usage
  useEffect(() => {
    if (error) {
      // Raised GraphQL error
      toaster.create({
        title: "Error",
        description: "Could not retrieve data for Dashboard",
        type: "error",
        duration: 4000,
        closable: true,
      });
    }
  }, [error]);

  // Configure Entity table
  const entityTableColumnHelper = createColumnHelper<EntityModel>();
  const entityTableColumns = [
    entityTableColumnHelper.accessor("name", {
      cell: (info) => (
        <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
          <Tooltip content={info.getValue()} disabled={info.getValue().length < 48} showArrow>
            <Flex gap={"1"} align={"center"}>
              <Icon name={"entity"} color={STYLES.entity.color.icon} size={"xs"} />
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 48 })}
              </Text>
            </Flex>
          </Tooltip>
          <Button size="2xs" mx={"1"} variant="subtle" colorPalette="gray" aria-label={"View Entity"} disabled>
            View
            <Icon name={"a_right"} size={"xs"} />
          </Button>
        </Flex>
      ),
      header: "Name",
      meta: {
        minWidth: 300,
      },
    }),
    entityTableColumnHelper.accessor("owner", {
      cell: (info) => <OwnerCell value={info.getValue()} />,
      header: "Owner",
      enableHiding: true,
    }),
    entityTableColumnHelper.accessor("timestamp", {
      cell: (info) => <CreatedCell value={info.getValue()} />,
      header: "Created",
      enableHiding: true,
      meta: {
        minWidth: 120,
        maxWidth: 120,
      },
    }),
    entityTableColumnHelper.accessor("description", {
      cell: (info) => <DescriptionCell value={info.getValue()} maxLength={48} />,
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 300,
      },
    }),
    entityTableColumnHelper.accessor("attributes", {
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
  ];

  // Use custom breakpoint hook
  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    attributes: true,
    created: true,
  });

  // Update column visibility when breakpoint changes
  useEffect(() => {
    const isMobile = breakpoint === "base" || breakpoint === "sm";
    setVisibleColumns({
      description: !isMobile,
      attributes: !isMobile,
      created: !isMobile,
    });
  }, [breakpoint]);

  return (
    <Content isError={false} isLoaded={!loading}>
      <Flex direction={"column"} w={"100%"} p={"1"} gap={"2"}>
        {/* Header */}
        <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"} p={"0"}>
          <PageHeader icon={"dashboard"} title={"Dashboard"} subtitle={workspaceName} loading={loading} />
        </Flex>

        {/* Recent Entities */}
        <Flex
          direction={"column"}
          p={"2"}
          rounded={"md"}
          gap={"2"}
          border={STYLES.border.style}
          borderColor={STYLES.border.color}
          bg={"surface.card"}
          minW={"0"}
          maxW={"100%"}
        >
          <Flex direction={"row"} align={"center"} gap={"1"} py={"1.5"} ml={"1.5"}>
            <Icon name={"entity"} size={"xs"} color={STYLES.entity.color.icon} />
            <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
              Recent Entities
            </Text>
          </Flex>

          {!loading && workspaceEntities.length > 0 && (
            <DataTable
              columns={entityTableColumns}
              data={workspaceEntities}
              visibleColumns={visibleColumns}
              selectedRows={{}}
              fill
            />
          )}

          {!loading && _.isEmpty(workspaceEntities) && (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"entity"} size={"lg"} color={STYLES.entity.color.default} />
                </EmptyState.Indicator>
                <EmptyState.Description>No Entities</EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}

          <Flex justify={"flex-end"}>
            <Button size={"xs"} rounded={"md"} variant={"solid"} colorPalette={"blue"} disabled>
              All Entities
              <Icon name={"a_right"} size={"xs"} />
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Dashboard;
