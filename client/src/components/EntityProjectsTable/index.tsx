// React
import React from "react";

// Existing and custom components
import { Button, EmptyState, Flex, Text } from "@chakra-ui/react";
import { Cell } from "@tanstack/react-table";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { DataTableAction, EntityProjectsTableProps } from "@types";

// Variables
import { STYLES } from "@variables";

const EntityProjectsTable = ({
  projects,
  editing,
  workspace,
  isPublic,
  onView,
  onRemove,
  onRemoveMany,
  onAddClick,
}: EntityProjectsTableProps) => {
  const columns = [
    {
      id: "projectId",
      accessorFn: (row: string) => row,
      cell: (info: Cell<string, string>) => {
        const projectId = info.getValue();
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={projectId} disabled={projectId.length < 32} showArrow>
              <Linky
                id={projectId}
                type={"projects"}
                size={"xs"}
                truncate={false}
                workspace={workspace}
                isPublic={isPublic}
              />
            </Tooltip>
            {editing && onRemove ? (
              <Button
                size="2xs"
                mx={"1"}
                variant="subtle"
                colorPalette="red"
                aria-label={"Remove Project"}
                onClick={() => onRemove(projectId)}
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
                aria-label={"View Project"}
                onClick={() => onView(projectId)}
              >
                View
                <Icon name={"a_right"} size={"xs"} />
              </Button>
            )}
          </Flex>
        );
      },
      header: "Name",
    },
  ];

  const actions: DataTableAction[] = onRemoveMany
    ? [
        {
          label: "Remove Projects",
          icon: "delete",
          action(table, rows) {
            const projectsToRemove: string[] = [];
            for (const rowIndex of Object.keys(rows)) {
              projectsToRemove.push(table.getRow(rowIndex).original);
            }
            onRemoveMany(projectsToRemove);
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
        <Flex direction={"row"} gap={"0.5"} align={"center"}>
          <Icon name={"project"} size={"xs"} color={STYLES.project.color.icon} />
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
            Projects ({projects.length})
          </Text>
        </Flex>
        {onAddClick && (
          <Button
            id={"addProjectsDialogButton"}
            variant={"solid"}
            size={"xs"}
            rounded={"md"}
            colorPalette={"green"}
            onClick={onAddClick}
            disabled={!editing}
          >
            Add
            <Icon name={"add"} size={"xs"} />
          </Button>
        )}
      </Flex>
      <Flex w={"100%"} justify={"center"} align={"center"} minH={projects.length > 0 ? "fit-content" : "120px"}>
        {projects.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon name={"project"} size={"lg"} color={STYLES.project.color.default} />
              </EmptyState.Indicator>
              <EmptyState.Description>No Projects</EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <DataTable
            data={projects}
            columns={columns}
            visibleColumns={{}}
            selectedRows={{}}
            viewOnly={!editing}
            actions={actions}
            showPagination
            showSelection
          />
        )}
      </Flex>
    </Flex>
  );
};

export default EntityProjectsTable;
