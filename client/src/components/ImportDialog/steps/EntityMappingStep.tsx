// React
import React, { useState } from "react";

// Components
import { Button, EmptyState, Flex, Text } from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import AddAttributeDialog from "@components/AddAttributeDialog";
import { EmptyTag, ValueTag } from "@components/FieldTag";
import FieldTagList from "@components/FieldTagList";
import { Information } from "@components/Label";
import ViewAttributeDialog from "@components/ViewAttributeDialog";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { AttributeModel, AttributeNameCellProps, EntityMappingStepProps } from "@types";

// Utility functions and libraries
import { isSpreadsheetFile } from "@lib/util";
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

/** Row cell for the "Name" column, kept as its own component so the dialog's open state uses a real hook. */
const AttributeNameCell = ({ attribute, fileType, columns, onRemove, onUpdate }: AttributeNameCellProps) => {
  const [viewAttributeDialogOpen, setViewAttributeDialogOpen] = useState(false);
  return (
    <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"} w={"100%"}>
      <Flex direction={"row"} gap={"1"} ml={"1"}>
        <Icon name={"template"} color={STYLES.template.color.icon} size={"xs"} />
        <Text fontSize={"xs"} fontWeight={"semibold"} color={attribute.name !== "" ? "black" : "gray.400"}>
          {attribute.name !== "" ? attribute.name : "Unnamed"}
        </Text>
      </Flex>
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
        <ViewAttributeDialog
          open={viewAttributeDialogOpen}
          setOpen={setViewAttributeDialogOpen}
          attribute={attribute}
          editing={true}
          permittedDataValues={isSpreadsheetFile(fileType) ? columns : undefined}
          onAttributeUpdate={onUpdate}
        />
      </Flex>
    </Flex>
  );
};

const EntityMappingStep = ({
  attributesField,
  onAttributesFieldChange,
  addAttributeOpen,
  onAddAttributeOpenChange,
  ownerField,
  templates,
  fileType,
  columns,
}: EntityMappingStepProps) => {
  const onRemoveAttribute = (identifier: string) => {
    onAttributesFieldChange(attributesField.filter((attribute) => attribute._id !== identifier));
  };

  const onUpdateAttribute = (updated: AttributeModel) => {
    onAttributesFieldChange(attributesField.map((attr) => (_.isEqual(attr._id, updated._id) ? updated : attr)));
  };

  const attributeColumnHelper = createColumnHelper<AttributeModel>();
  const attributeTableColumns = [
    attributeColumnHelper.accessor("name", {
      cell: (info) => (
        <AttributeNameCell
          attribute={info.row.original}
          fileType={fileType}
          columns={columns}
          onRemove={onRemoveAttribute}
          onUpdate={onUpdateAttribute}
        />
      ),
      header: "Name",
      meta: {
        minWidth: 320,
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
    }),
  ];

  return (
    <Flex
      w={"100%"}
      direction={"column"}
      gap={"2"}
      p={"2"}
      border={STYLES.border.style}
      borderColor={STYLES.border.color}
      rounded={"md"}
    >
      <Flex direction={"row"} align={"center"} justify={"space-between"}>
        <Flex direction={"column"} gap={"1"} ml={"0.5"}>
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Icon name={"attribute"} color={STYLES.template.color.icon} size={"xs"} />
            <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
              Attributes
            </Text>
          </Flex>
          <Information text={"Attributes created here will be appended to all imported Entities"} />
        </Flex>
        <Button size={"xs"} rounded={"md"} colorPalette={"green"} onClick={() => onAddAttributeOpenChange(true)}>
          Add
          <Icon name={"add"} size={"xs"} />
        </Button>
      </Flex>

      {attributesField.length > 0 ? (
        <DataTable columns={attributeTableColumns} data={attributesField} visibleColumns={{}} selectedRows={{}} />
      ) : (
        <Flex justify={"center"} align={"center"} minH={"80px"}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon name={"attribute"} size={"lg"} color={STYLES.template.color.light} />
              </EmptyState.Indicator>
              <EmptyState.Description>No Attributes added</EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      )}

      <AddAttributeDialog
        open={addAttributeOpen}
        onClose={() => onAddAttributeOpenChange(false)}
        owner={ownerField}
        templates={templates}
        entityName={""}
        entityDescription={""}
        permittedDataValues={isSpreadsheetFile(fileType) ? columns : undefined}
        onAdd={(attribute) => onAttributesFieldChange([...attributesField, attribute])}
      />
    </Flex>
  );
};

export default EntityMappingStep;
