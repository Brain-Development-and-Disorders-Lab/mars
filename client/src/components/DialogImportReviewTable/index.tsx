// React
import React from "react";

// Components
import { Flex, Tag, Text } from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { DialogImportReviewTableProps, DialogImportReviewTableRow } from "@types";

// Utility functions and libraries
import _ from "lodash";

const columnHelper = createColumnHelper<DialogImportReviewTableRow>();

/** Review table shared by the Entity and Attribute import flows */
const DialogImportReviewTable = ({
  items,
  icon,
  iconColor,
  bg,
  borderColor,
  nameHeader,
  singular,
  plural,
  showWarnings = false,
}: DialogImportReviewTableProps) => {
  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => (
        <Flex>
          <Tooltip content={info.getValue()} showArrow disabled={info.getValue().length < 30}>
            <Flex direction={"row"} gap={"1"} ml={"1"}>
              <Icon name={icon} color={iconColor} size={"xs"} />
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 30 })}
              </Text>
            </Flex>
          </Tooltip>
        </Flex>
      ),
      header: nameHeader,
    }),
    columnHelper.accessor("state", {
      cell: (info) => (
        <Flex direction={"row"} gap={"1"} align={"center"} p={"1"}>
          <Icon
            name={info.getValue() === "update" ? "edit" : "add"}
            color={info.getValue() === "update" ? "blue.600" : "green"}
            size={"xs"}
          />
          <Text fontWeight={"semibold"} fontSize={"xs"} color={info.getValue() === "update" ? "blue.600" : "green"}>
            {_.capitalize(info.getValue())}
          </Text>
        </Flex>
      ),
      header: "Action",
    }),
    ...(showWarnings
      ? [
          columnHelper.accessor("warnings", {
            cell: (info) => {
              const warnings = info.getValue();
              if (!warnings || warnings.length === 0) {
                return (
                  <Flex direction={"row"} gap={"1"} align={"center"} p={"1"}>
                    <Icon name={"check"} color={"green"} size={"xs"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={"green"}>
                      No Warnings
                    </Text>
                  </Flex>
                );
              }
              return (
                <Flex direction={"row"} gap={"1"} p={"1"}>
                  {warnings.map((warning, index) => {
                    const location = warning.split(", ")[0];
                    return (
                      <Tag.Root key={index} colorPalette={"orange"}>
                        <Tag.StartElement>
                          <Icon name={"warning"} color={"orange.400"} size={"xs"} />
                        </Tag.StartElement>
                        <Tag.Label>
                          <Tooltip content={warning} showArrow>
                            <Text fontSize={"xs"} color={"status.warning.emphasized"}>
                              {location}
                            </Text>
                          </Tooltip>
                        </Tag.Label>
                      </Tag.Root>
                    );
                  })}
                </Flex>
              );
            },
            header: "Warnings",
          }),
        ]
      : []),
  ];

  return (
    <Flex w={"100%"} direction={"column"} gap={"2"} rounded={"md"}>
      <Flex
        direction={"row"}
        gap={"2"}
        p={"2"}
        align={"center"}
        rounded={"md"}
        bg={bg}
        border={"1px solid"}
        borderColor={borderColor}
      >
        <Icon name={icon} size={"sm"} color={iconColor} />
        <Flex direction={"column"} gap={"0.5"}>
          <Text fontSize={"xs"} fontWeight={"bold"}>
            Reviewing {items.length} {items.length === 1 ? singular : plural}
          </Text>
          <Text fontSize={"xs"} color={"text.subtle"}>
            Existing {plural} will be updated, new {plural} will be created.
          </Text>
        </Flex>
      </Flex>
      <DataTable columns={columns} data={items} visibleColumns={{}} selectedRows={{}} showPagination />
    </Flex>
  );
};

export default DialogImportReviewTable;
