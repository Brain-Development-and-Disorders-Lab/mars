// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  Heading,
  Text,
  Button,
  useBreakpoint,
  Tooltip,
  Spacer,
  Tag,
  Link,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import DataTable from "@components/DataTable";

// Existing and custom types
import { DataTableAction, EntityModel } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

// Utility functions and libraries
import { gql, useLazyQuery, useQuery } from "@apollo/client";
import _ from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";

const Entities = () => {
  const navigate = useNavigate();

  const [entityData, setEntityData] = useState([] as EntityModel[]);

  const breakpoint = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({});

  // Query to retrieve Entities
  const GET_ENTITIES = gql`
    query GetEntities {
      entities {
        _id
        archived
        owner
        name
        description
        created
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery<{
    entities: EntityModel[];
  }>(GET_ENTITIES, {
    variables: {},
  });

  // Query to generate exported data
  const GET_ENTITIES_EXPORT = gql`
    query GetEntitiesExport($entities: [String]) {
      exportEntities(entities: $entities)
    }
  `;
  const [exportEntities, { loading: exportLoading, error: exportError }] =
    useLazyQuery(GET_ENTITIES_EXPORT);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.entities) {
      // Unpack all the Entity data
      setEntityData(data.entities);
    }
  }, [data]);

  const { workspace } = useWorkspace();

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

  // Effect to adjust column visibility
  useEffect(() => {
    if (
      _.isEqual(breakpoint, "sm") ||
      _.isEqual(breakpoint, "base") ||
      _.isUndefined(breakpoint)
    ) {
      setVisibleColumns({ description: false, owner: false, created: false });
    } else {
      setVisibleColumns({});
    }
  }, [breakpoint]);

  // Configure table columns and data
  const columnHelper = createColumnHelper<EntityModel>();
  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex>
            <Tooltip
              label={info.getValue()}
              hasArrow
              isDisabled={info.getValue().length < 20}
            >
              <Text fontSize={"sm"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 20 })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Name",
    }),
    columnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <Tag colorScheme={"orange"}>Empty</Tag>;
        }
        return (
          <Flex>
            <Tooltip
              label={info.getValue()}
              hasArrow
              isDisabled={info.getValue().length < 24}
            >
              <Text fontSize={"sm"}>
                {_.truncate(info.getValue(), { length: 24 })}
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
        return <Tag size={"sm"}>{info.getValue()}</Tag>;
      },
      header: "Owner",
      enableHiding: true,
    }),
    columnHelper.accessor("created", {
      cell: (info) => (
        <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.600"}>
          {dayjs(info.getValue()).fromNow()}
        </Text>
      ),
      header: "Created",
      enableHiding: true,
    }),
    columnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"} p={"2"} align={"center"} gap={"1"}>
            <Link onClick={() => navigate(`/entities/${info.getValue()}`)}>
              <Text fontWeight={"semibold"}>View</Text>
            </Link>
            <Icon name={"a_right"} />
          </Flex>
        );
      },
      header: "",
    }),
  ];

  const actions: DataTableAction[] = [
    {
      label: `Export Selected`,
      icon: "download",
      action: async (table, rows: any) => {
        // Export rows that have been selected
        const toExport: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          toExport.push(table.getRow(rowIndex).original._id);
        }

        const response = await exportEntities({
          variables: {
            entities: toExport,
          },
        });

        if (response.data.exportEntities) {
          FileSaver.saveAs(
            new Blob([response.data.exportEntities]),
            slugify(
              `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.json`,
            ),
          );
        }

        table.resetRowSelection();
      },
    },
  ];

  return (
    <Content
      isError={!_.isUndefined(error) || !_.isUndefined(exportError)}
      isLoaded={!loading && !exportLoading}
    >
      <Flex
        direction={"row"}
        p={"4"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"4"}
      >
        <Flex
          w={"100%"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"entity"} size={"md"} />
            <Heading size={"md"}>Entities</Heading>
            <Spacer />
            <Button
              rightIcon={<Icon name={"add"} />}
              colorScheme={"green"}
              onClick={() => navigate("/create/entity")}
              size={"sm"}
            >
              Create
            </Button>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"4"} w={"100%"}>
          {entityData.filter((entity) => _.isEqual(entity.archived, false))
            .length > 0 ? (
            <DataTable
              columns={columns}
              data={entityData.filter((entity) =>
                _.isEqual(entity.archived, false),
              )}
              visibleColumns={visibleColumns}
              selectedRows={{}}
              actions={actions}
              showColumnSelect
              showSelection
              showPagination
              showItemCount
            />
          ) : (
            <Flex
              w={"100%"}
              direction={"row"}
              p={"4"}
              justify={"center"}
              align={"center"}
            >
              <Text color={"gray.400"} fontWeight={"semibold"}>
                You do not have any Entities.
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Entities;
