// React
import React, { useState } from "react";

// Existing and custom components
import { Button, EmptyState, Flex, Text } from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { EmptyTag, ValueTag } from "@components/TagField";
import FieldTagList from "@components/FieldTagList";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import DialogViewAttribute from "@components/DialogViewAttribute";

// Existing and custom types
import { AttributeModel, CreateEntityAttributeNameCellProps, CreateEntityAttributesTableProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

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
const CreateEntityAttributeNameCell = ({
  attribute,
  templates,
  onUpdate,
  onRemove,
}: CreateEntityAttributeNameCellProps) => {
  const [viewAttributeDialogOpen, setViewAttributeDialogOpen] = useState(false);

  return (
    <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
      <Tooltip content={attribute.name} disabled={attribute.name.length < 16} showArrow>
        <Flex direction={"row"} gap={"1"} ml={"0.5"}>
          <Icon name={"attribute"} color={STYLES.template.color.icon} size={"xs"} />
          <Text fontSize={"xs"} fontWeight={"semibold"}>
            {_.truncate(attribute.name, { length: 16 })}
          </Text>
        </Flex>
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
          Edit
          <Icon name={"edit"} size={"xs"} />
        </Button>
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
        <DialogViewAttribute
          open={viewAttributeDialogOpen}
          setOpen={setViewAttributeDialogOpen}
          attribute={attribute}
          editing={true}
          isTemplate={isKnownTemplate(attribute._id, templates)}
          onAttributeUpdate={onUpdate}
          removeCallback={() => onRemove(attribute._id)}
        />
      </Flex>
    </Flex>
  );
};

const attributeColumnHelper = createColumnHelper<AttributeModel>();

const CreateEntityAttributesTable = ({
  attributes,
  templates,
  onUpdate,
  onRemove,
  onAddClick,
}: CreateEntityAttributesTableProps) => {
  const columns = [
    attributeColumnHelper.accessor("name", {
      cell: (info) => (
        <CreateEntityAttributeNameCell
          attribute={info.row.original}
          templates={templates}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ),
      header: "Name",
      meta: { minWidth: 240 },
    }),
    attributeColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <EmptyTag label={"Description"} />;
        }
        return (
          <Tooltip content={info.getValue()} disabled={info.getValue().length < 32} showArrow>
            <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 32 })}</Text>
          </Tooltip>
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
    }),
  ];

  return (
    <Flex
      direction={"column"}
      p={"2"}
      gap={"2"}
      minH={attributes.length > 0 ? "fit-content" : "120px"}
      bg={STYLES.card.bg}
      rounded={"md"}
      border={STYLES.border.style}
      borderColor={STYLES.border.color}
      data-testid={"create-entity-attributes"}
    >
      <Flex direction={"row"} justify={"space-between"} align={"center"}>
        <Flex direction={"row"} gap={"0.5"} align={"center"}>
          <Icon name={"attribute"} size={"xs"} color={STYLES.template.color.icon} />
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
            Attributes
          </Text>
        </Flex>
        <Button
          data-testid={"create-entity-add-attribute"}
          variant={"solid"}
          size={"xs"}
          rounded={"md"}
          colorPalette={"green"}
          onClick={onAddClick}
        >
          Add
          <Icon name={"add"} size={"xs"} />
        </Button>
      </Flex>

      {attributes.length > 0 ? (
        <DataTable
          data={attributes}
          columns={columns}
          visibleColumns={{}}
          selectedRows={{}}
          viewOnly={false}
          showPagination
          showSelection
        />
      ) : (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon name={"attribute"} size={"lg"} />
            </EmptyState.Indicator>
            <EmptyState.Description>No Attributes</EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      )}
    </Flex>
  );
};

export default CreateEntityAttributesTable;
