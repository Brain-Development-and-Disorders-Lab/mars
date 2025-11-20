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
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import DataTableRemix from "@components/DataTableRemix";
import { createColumnHelper, ColumnFiltersState } from "@tanstack/react-table";

// Existing and custom types
import { DataTableAction, EntityModel, IGenericItem } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
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

  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    owner: true,
    created: true,
  });

  // Column filters state for entity table
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
    }
  `;
  const { loading, error, data, refetch } = useQuery<{
    entities: EntityModel[];
  }>(GET_ENTITIES, {
    variables: {},
  });

  // Query to generate exported data
  const GET_ENTITIES_EXPORT = gql`
    query GetEntitiesExport($entities: [String], $format: String) {
      exportEntities(entities: $entities, format: $format)
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
              disabled={info.getValue().length < 20}
              showArrow
            >
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 20 })}
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
        minWidth: 200,
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
              disabled={info.getValue().length < 32}
              showArrow
            >
              <Text fontSize={"xs"}>
                {_.truncate(info.getValue(), { length: 32 })}
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
        return (
          <ActorTag
            orcid={info.getValue()}
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

    if (response.data.exportEntities) {
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
        p={"2"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"2"}
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
          <Flex align={"center"} gap={"2"} w={"100%"} minW="0">
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
            Entities using the column headers.
          </Text>
          {entityData.filter((entity) => _.isEqual(entity.archived, false))
            .length > 0 ? (
            <Box w="100%" minW="0" maxW="100%">
              <DataTableRemix
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
              />
            </Box>
          ) : (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"entity"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>No Entities</EmptyState.Description>
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
              bg={"gray.100"}
            >
              Export Entities
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size={"2xs"}
                  onClick={onExportClose}
                  _hover={{ bg: "gray.200" }}
                />
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
                  <DataTableRemix
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
