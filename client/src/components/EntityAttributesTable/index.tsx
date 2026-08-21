// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, EmptyState, Flex, Text } from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { EmptyTag, ValueTag } from "@components/FieldTag";
import FieldTagList from "@components/FieldTagList";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import ViewAttributeDialog from "@components/ViewAttributeDialog";

// Existing and custom types
import { AttributeModel, EntityAttributeNameCellProps, EntityAttributesTableProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Variables
import { STYLES } from "@variables";

/** Returns true if `_id` matches, or was generated from, one of the known Templates. */
const isKnownTemplate = (_id: string, templates: AttributeModel[]): boolean => {
  for (const attribute of templates) {
    if (_.startsWith(_id, attribute._id) || _.isEqual(_id, attribute._id)) return true;
  }
  return false;
};

/** Row cell for the "Name" column, kept as its own component so the dialog's open state uses a real hook. */
const EntityAttributeNameCell = ({
  attribute,
  editing,
  entityName,
  templates,
  onUpdate,
  onRemove,
  workspace,
  isPublic,
}: EntityAttributeNameCellProps) => {
  const [viewAttributeDialogOpen, setViewAttributeDialogOpen] = useState(false);

  return (
    <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
      <Tooltip content={attribute.name} disabled={attribute.name.length < 16} showArrow>
        <Text fontSize={"xs"} fontWeight={"semibold"}>
          {_.truncate(attribute.name, { length: 16 })}
        </Text>
      </Tooltip>
      <Flex direction={"row"} gap={"1"} align={"center"}>
        <Button
          size="2xs"
          variant="subtle"
          rounded="md"
          colorPalette="gray"
          aria-label={"View Attribute"}
          onClick={() => setViewAttributeDialogOpen(true)}
        >
          {editing ? "Edit" : "Expand"}
          <Icon name={editing ? "edit" : "expand"} size={"xs"} />
        </Button>
        {editing && onRemove && (
          <Button
            size="2xs"
            rounded="md"
            variant="subtle"
            colorPalette="red"
            aria-label={"Delete Attribute"}
            onClick={() => onRemove(attribute._id)}
          >
            Delete
            <Icon name={"delete"} size={"xs"} />
          </Button>
        )}
        <ViewAttributeDialog
          open={viewAttributeDialogOpen}
          setOpen={setViewAttributeDialogOpen}
          editing={editing}
          entityName={entityName}
          attribute={attribute}
          isTemplate={isKnownTemplate(attribute._id, templates)}
          onAttributeUpdate={onUpdate}
          removeCallback={onRemove ? () => onRemove(attribute._id) : undefined}
          workspace={workspace}
          isPublic={isPublic}
        />
      </Flex>
    </Flex>
  );
};

const attributeColumnHelper = createColumnHelper<AttributeModel>();

const EntityAttributesTable = ({
  attributes,
  editing,
  entityName,
  templates,
  onUpdate,
  onRemove,
  onAddClick,
  workspace,
  isPublic,
}: EntityAttributesTableProps) => {
  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({});

  // Effect to adjust column visibility
  useEffect(() => {
    if (_.isEqual(breakpoint, "sm") || _.isEqual(breakpoint, "base") || _.isUndefined(breakpoint)) {
      setVisibleColumns({ description: false });
    } else {
      setVisibleColumns({});
    }
  }, [breakpoint]);

  const columns = [
    attributeColumnHelper.accessor("name", {
      cell: (info) => (
        <EntityAttributeNameCell
          attribute={info.row.original}
          editing={editing}
          entityName={entityName}
          templates={templates}
          onUpdate={onUpdate}
          onRemove={onRemove}
          workspace={workspace}
          isPublic={isPublic}
        />
      ),
      header: "Name",
      meta: {
        minWidth: 240,
      },
    }),
    attributeColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <EmptyTag label={"Description"} />;
        }
        return (
          <Flex>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 32} showArrow>
              <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 32 })}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
    }),
    attributeColumnHelper.accessor("values", {
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
      <Flex direction={"row"} justify={"space-between"} align={"center"}>
        <Flex direction={"row"} gap={"0.5"} align={"center"}>
          <Icon name={"attribute"} size={"xs"} color={STYLES.template.color.icon} />
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
            Attributes ({attributes.length})
          </Text>
        </Flex>
        {onAddClick && (
          <Button
            id={"addAttributeDialogButton"}
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

      <Flex w={"100%"} justify={"center"} align={"center"} minH={attributes.length > 0 ? "fit-content" : "120px"}>
        {attributes.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon name={"attribute"} size={"lg"} color={STYLES.template.color.light} />
              </EmptyState.Indicator>
              <EmptyState.Description>No Attributes</EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <DataTable
            data={attributes}
            columns={columns}
            visibleColumns={visibleColumns}
            selectedRows={{}}
            viewOnly={!editing}
            showPagination
            showSelection
          />
        )}
      </Flex>
    </Flex>
  );
};

export default EntityAttributesTable;
