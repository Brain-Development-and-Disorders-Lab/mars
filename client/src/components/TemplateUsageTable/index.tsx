// React
import React from "react";

// Existing and custom components
import { Button, EmptyState, Flex, Tag, Text } from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { AttributeUsage, TemplateUsageTableProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

const usageColumnHelper = createColumnHelper<AttributeUsage>();

const TemplateUsageTable = ({ templateUsage, onViewEntity, workspace, isPublic }: TemplateUsageTableProps) => {
  const usageColumns = [
    usageColumnHelper.accessor("entity", {
      cell: (info) => {
        const entityId = info.cell.getValue();
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={entityId} disabled={entityId.length < 20} showArrow>
              <Linky id={entityId} type={"entities"} size={"xs"} workspace={workspace} isPublic={isPublic} />
            </Tooltip>

            <Button
              size="2xs"
              mx={"1"}
              variant="subtle"
              colorPalette="gray"
              aria-label={"View Entity"}
              onClick={() => onViewEntity(entityId)}
            >
              View
              <Icon name={"a_right"} size={"xs"} />
            </Button>
          </Flex>
        );
      },
      header: "Entity",
      meta: {
        minWidth: 300,
      },
    }),
    usageColumnHelper.accessor("modifications", {
      cell: (info) => {
        const modifications = info.cell.getValue();
        if (modifications.length > 0) {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {modifications.map((modification) => {
                return (
                  <Tag.Root colorPalette={"orange"}>
                    <Tag.Label fontSize={"xs"}>{_.capitalize(modification)}</Tag.Label>
                  </Tag.Root>
                );
              })}
            </Flex>
          );
        } else {
          return (
            <Tag.Root colorPalette={"green"}>
              <Tag.Label fontSize={"xs"}>None</Tag.Label>
            </Tag.Root>
          );
        }
      },
      header: "Modifications",
    }),
  ];

  return (
    <Flex
      direction={"column"}
      p={"2"}
      h={"fit-content"}
      gap={"2"}
      rounded={"md"}
      border={STYLES.border.style}
      borderColor={STYLES.border.color}
      bg={"surface.card"}
      grow={"1"}
      basis={{ base: "100%", md: "calc(50% - 4px)" }}
      minW={{ base: "100%", md: "calc(50% - 4px)" }}
    >
      <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
        Usage ({templateUsage.length} {templateUsage.length !== 1 ? "Entities" : "Entity"})
      </Text>
      {templateUsage.length > 0 ? (
        <DataTable
          data={templateUsage}
          columns={usageColumns}
          visibleColumns={{}}
          selectedRows={{}}
          viewOnly={true}
          showSelection={true}
          showPagination
        />
      ) : (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon name={"template"} size={"lg"} color={STYLES.template.color.default} />
            </EmptyState.Indicator>
            <EmptyState.Description>No Usage</EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      )}
    </Flex>
  );
};

export default TemplateUsageTable;
