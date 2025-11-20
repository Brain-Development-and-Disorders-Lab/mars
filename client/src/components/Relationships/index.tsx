import React from "react";
import { Flex, Text, Tag, Button } from "@chakra-ui/react";
import DataTableRemix from "@components/DataTableRemix";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Custom and existing types
import { DataTableAction, IRelationship, RelationshipsProps } from "@types";

// Navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";

const Relationships = (props: RelationshipsProps) => {
  const navigate = useNavigate();

  /**
   * Compare two `IRelationship` structures and determine if they are describing
   * the same relationship or not
   * @param a Relationship
   * @param b Relationship
   * @return {boolean}
   */
  const relationshipIsEqual = (a: IRelationship, b: IRelationship): boolean => {
    return (
      _.isEqual(a.source._id, b.source._id) &&
      _.isEqual(a.target._id, b.target._id) &&
      _.isEqual(a.type, b.type)
    );
  };

  /**
   * Search a collection of existing `IRelationship` structures to find if another
   * `IRelationship` already exists in the collection or not
   * @param relationship Relationship structure to search for
   * @param relationships Collection of existing Relationships
   * @return {boolean}
   */
  const relationshipExists = (
    relationship: IRelationship,
    relationships: IRelationship[],
  ): boolean => {
    for (const r of relationships) {
      if (relationshipIsEqual(r, relationship)) {
        return true;
      }
    }
    return false;
  };

  // Remove Relationship from the Entity state
  const removeRelationship = (relationship: IRelationship) => {
    props.setRelationships([
      ...props.relationships.filter((r) => {
        return !relationshipIsEqual(r, relationship);
      }),
    ]);
  };

  // Remove multiple Relationships from the Entity state
  const removeRelationships = (toRemove: IRelationship[]) => {
    props.setRelationships(
      props.relationships.filter((r) => {
        return !relationshipExists(r, toRemove);
      }),
    );
  };

  // Configure relationships table columns and data
  const relationshipTableColumnHelper = createColumnHelper<IRelationship>();
  const relationshipTableColumns = [
    relationshipTableColumnHelper.accessor("source", {
      cell: (info) => {
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip
              content={info.getValue().name}
              disabled={info.getValue().name.length < 20}
              showArrow
            >
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue().name, { length: 20 })}
              </Text>
              <Button
                size="2xs"
                mx={"1"}
                variant="subtle"
                colorPalette="gray"
                aria-label={"View Source Entity"}
                onClick={() => navigate(`/entities/${info.getValue()._id}`)}
              >
                View
                <Icon name={"a_right"} size={"xs"} />
              </Button>
            </Tooltip>
          </Flex>
        );
      },
      header: "Source",
    }),
    relationshipTableColumnHelper.accessor("type", {
      cell: (info) => {
        return (
          <Flex p={"1"}>
            <Tag.Root size={"sm"}>
              <Tag.Label fontSize={"xs"}>{info.getValue()}</Tag.Label>
            </Tag.Root>
          </Flex>
        );
      },
      header: "Type",
      meta: {
        minWidth: 100,
        maxWidth: 100,
      },
    }),
    relationshipTableColumnHelper.accessor("target", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"space-between"} gap={"1"}>
            <Flex align={"center"} gap={"1"} w={"100%"}>
              <Tooltip content={info.getValue().name} showArrow>
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(info.getValue().name, { length: 20 })}
                </Text>
              </Tooltip>
            </Flex>
            {props.viewOnly ? (
              <Button
                size="2xs"
                variant="subtle"
                colorPalette="gray"
                aria-label={"View Target Entity"}
                onClick={() => navigate(`/entities/${info.getValue()._id}`)}
              >
                View
                <Icon name={"a_right"} size={"xs"} />
              </Button>
            ) : (
              <Button
                size="2xs"
                variant="subtle"
                colorPalette="red"
                aria-label={"Remove relationship"}
                onClick={() => {
                  removeRelationship(info.row.original);
                }}
              >
                Remove
                <Icon name={"delete"} size={"xs"} />
              </Button>
            )}
          </Flex>
        );
      },
      header: "Target",
    }),
  ];
  const relationshipTableActions: DataTableAction[] = [
    {
      label: "Remove Relationships",
      icon: "delete",
      action(table, rows) {
        const toRemove: IRelationship[] = [];
        for (const rowIndex of Object.keys(rows)) {
          toRemove.push(table.getRow(rowIndex).original);
        }
        removeRelationships(toRemove);
      },
    },
  ];

  return (
    <Flex w={"100%"}>
      <DataTableRemix
        data={props.relationships}
        setData={props.setRelationships}
        columns={relationshipTableColumns}
        viewOnly={props.viewOnly}
        actions={relationshipTableActions}
        selectedRows={{}}
        visibleColumns={{}}
        showPagination
        showSelection
      />
    </Flex>
  );
};

export default Relationships;
