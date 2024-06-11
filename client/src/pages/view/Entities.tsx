// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  Heading,
  Text,
  useToast,
  Button,
  useBreakpoint,
  Tooltip,
  Spacer,
  Tag,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import DataTable from "@components/DataTable";

// Existing and custom types
import { DataTableAction, EntityModel } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { request } from "@database/functions";
import _ from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";

const Entities = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const [entityData, setEntityData] = useState([] as EntityModel[]);

  const breakpoint = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({});

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

  /**
   * Utility function to retrieve all Entities
   */
  const getEntities = async () => {
    const response = await request<EntityModel[]>("GET", "/entities");
    if (response.success) {
      setEntityData(response.data);
    } else {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Entities data.",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    getEntities();
  }, []);

  // Configure table columns and data
  const data: EntityModel[] = entityData;
  const columnHelper = createColumnHelper<EntityModel>();
  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Tooltip label={info.getValue()}>
            <Text>{_.truncate(info.getValue(), { length: 20 })}</Text>
          </Tooltip>
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
          <Tooltip label={info.getValue()}>
            <Text>{_.truncate(info.getValue(), { length: 20 })}</Text>
          </Tooltip>
        );
      },
      header: "Description",
      enableHiding: true,
    }),
    columnHelper.accessor("owner", {
      cell: (info) => {
        return <Tag colorScheme={"green"}>{info.getValue()}</Tag>;
      },
      header: "Owner",
    }),
    columnHelper.accessor("created", {
      cell: (info) => dayjs(info.getValue()).fromNow(),
      header: "Created",
    }),
    columnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            <Button
              key={`view-entity-${info.getValue()}`}
              colorScheme={"gray"}
              rightIcon={<Icon name={"c_right"} />}
              onClick={() => navigate(`/entities/${info.getValue()}`)}
            >
              View
            </Button>
          </Flex>
        );
      },
      header: "",
    }),
  ];

  const actions: DataTableAction[] = [
    {
      label: "Export Selected (CSV)",
      icon: "download",
      action: async (table, rows: any) => {
        // Export rows that have been selected
        const toExport: string[] = [];
        for (let rowIndex of Object.keys(rows)) {
          toExport.push(table.getRow(rowIndex).original._id);
        }

        const response = await request<any>("POST", "/entities/export", {
          entities: toExport,
        });
        if (response.success) {
          FileSaver.saveAs(
            new Blob([response.data]),
            slugify(
              `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.csv`,
            ),
          );
        }

        table.resetRowSelection();
      },
    },
    {
      label: "Export Selected (JSON)",
      icon: "download",
      action: async (table, rows: any) => {
        // Export rows that have been selected
        const toExport: string[] = [];
        for (let rowIndex of Object.keys(rows)) {
          toExport.push(table.getRow(rowIndex).original._id);
        }

        const response = await request<any>("POST", "/entities/export", {
          entities: toExport,
          format: "json",
        });
        if (response.success) {
          FileSaver.saveAs(
            new Blob([response.data]),
            slugify(
              `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.json`,
            ),
          );
        }

        table.resetRowSelection();
      },
    },
    {
      label: "Export All (JSON)",
      icon: "download",
      action: async (table) => {
        const response = await request<any>("POST", "/entities/export_all", {
          format: "json",
        });
        if (response.success) {
          FileSaver.saveAs(
            new Blob([response.data]),
            slugify(
              `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.json`,
            ),
          );
        }

        table.resetRowSelection();
      },
      alwaysEnabled: true,
    },
  ];

  return (
    <Content isError={isError} isLoaded={isLoaded}>
      <Flex
        direction={"row"}
        p={"4"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"6"}
      >
        <Flex
          w={"100%"}
          p={"4"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"4"} w={"100%"}>
            <Icon name={"entity"} size={"lg"} />
            <Heading fontWeight={"semibold"}>Entities</Heading>
            <Spacer />
            <Button
              leftIcon={<Icon name={"add"} />}
              colorScheme={"green"}
              onClick={() => navigate("/create/entity")}
            >
              Create
            </Button>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"4"} w={"100%"}>
          {data.filter((entity) => _.isEqual(entity.deleted, false)).length >
          0 ? (
            <DataTable
              columns={columns}
              data={data.filter((entity) => _.isEqual(entity.deleted, false))}
              visibleColumns={visibleColumns}
              actions={actions}
              showSelection
              showPagination
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
