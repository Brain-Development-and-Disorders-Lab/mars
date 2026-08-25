// React
import React from "react";

// Existing and custom components
import { Button, EmptyState, Flex, SkeletonText, Text } from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { AttributeTag, EmptyTag } from "@components/TagField";
import FieldTagList from "@components/FieldTagList";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { DataTableAction, ProjectEntitiesTableProps, ProjectEntityTableRow } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

const columnHelper = createColumnHelper<ProjectEntityTableRow>();

const ProjectEntitiesTable = ({
  entities,
  entityCount,
  editing,
  workspace,
  isPublic,
  onView,
  onRemove,
  onRemoveMany,
  onAddClick,
  addDisabled,
}: ProjectEntitiesTableProps) => {
  const entitiesColumns = [
    columnHelper.accessor("_id", {
      cell: (info) => {
        const entityId = info.getValue();
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Linky id={entityId} type={"entities"} workspace={workspace} isPublic={isPublic} />
            {editing && onRemove ? (
              <Button
                size="2xs"
                mx={"1"}
                variant="subtle"
                colorPalette="red"
                aria-label={"Remove Entity"}
                onClick={() => onRemove(entityId)}
              >
                Remove
                <Icon name={"delete"} size={"xs"} />
              </Button>
            ) : (
              <Button
                size="2xs"
                mx={"1"}
                variant="subtle"
                colorPalette="gray"
                aria-label={"View Entity"}
                onClick={() => onView(entityId)}
              >
                View
                <Icon name={"a_right"} size={"xs"} />
              </Button>
            )}
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 360,
      },
    }),
    columnHelper.accessor("description", {
      cell: (info) => {
        const description = info.getValue();
        if (_.isUndefined(description)) {
          return <SkeletonText noOfLines={1} />;
        }
        if (_.isEqual(description, "")) {
          return <EmptyTag label={"Description"} />;
        }
        return (
          <Flex>
            <Tooltip content={description} disabled={description.length < 64} showArrow>
              <Text fontSize={"xs"}>{_.truncate(description, { length: 64 })}</Text>
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
    columnHelper.accessor("attributes", {
      cell: (info) => {
        const attributes = info.getValue();
        if (_.isUndefined(attributes)) {
          return <SkeletonText noOfLines={1} />;
        }
        return (
          <FieldTagList
            items={attributes}
            max={2}
            emptyLabel={"Attributes"}
            getKey={(attribute) => attribute._id}
            renderTag={(attribute) => <AttributeTag attribute={attribute} />}
          />
        );
      },
      header: "Attributes",
      meta: {
        minWidth: 120,
      },
    }),
  ];

  const entitiesTableActions: DataTableAction[] = onRemoveMany
    ? [
        {
          label: "Remove Entities",
          icon: "delete",
          action(table, rows) {
            const entitiesToRemove: string[] = [];
            for (const rowIndex of Object.keys(rows)) {
              entitiesToRemove.push(table.getRow(rowIndex).original._id);
            }
            onRemoveMany(entitiesToRemove);
          },
        },
      ]
    : [];

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
      <Flex direction={"row"} justify={"space-between"} align={"center"}>
        {/* Entities in the Project */}
        <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
          <Icon name={"entity"} size={"xs"} color={STYLES.entity.color.icon} />
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
            Entities ({entityCount})
          </Text>
        </Flex>
        {onAddClick && (
          <Button
            colorPalette={"green"}
            id={"addEntityButton"}
            onClick={onAddClick}
            size={"xs"}
            rounded={"md"}
            disabled={addDisabled}
          >
            Add
            <Icon name={"add"} size={"xs"} />
          </Button>
        )}
      </Flex>
      <Flex w={"100%"} justify={"center"} align={"center"} minH={entities.length > 0 ? "fit-content" : "200px"}>
        {entities.length > 0 ? (
          <DataTable
            data={entities}
            columns={entitiesColumns}
            visibleColumns={{}}
            selectedRows={{}}
            viewOnly={!editing}
            showSelection={true}
            actions={entitiesTableActions}
            showPagination
          />
        ) : (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon name={"entity"} size={"lg"} color={STYLES.entity.color.default} />
              </EmptyState.Indicator>
              <EmptyState.Description>No Entities</EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        )}
      </Flex>
    </Flex>
  );
};

export default ProjectEntitiesTable;
