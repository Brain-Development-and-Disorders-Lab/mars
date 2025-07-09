import React from "react";
import { Flex, Text, Tag, IconButton, Link } from "@chakra-ui/react";
import DataTable from "@components/DataTable";
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
          <Tooltip content={info.getValue().name} showArrow>
            <Text>
              {_.truncate(info.getValue().name, {
                length: 24,
              })}
            </Text>
          </Tooltip>
        );
      },
      header: "Source",
    }),
    relationshipTableColumnHelper.accessor("type", {
      cell: (info) => {
        return (
          <Flex p={"1"}>
            <Tag.Root>
              <Tag.Label>{info.getValue()}</Tag.Label>
            </Tag.Root>
          </Flex>
        );
      },
      header: "Type",
    }),
    relationshipTableColumnHelper.accessor("target", {
      cell: (info) => {
        return (
          <Tooltip content={info.getValue().name} showArrow>
            <Text>
              {_.truncate(info.getValue().name, {
                length: 24,
              })}
            </Text>
          </Tooltip>
        );
      },
      header: "Target",
    }),
    relationshipTableColumnHelper.accessor("target._id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            {props.viewOnly ? (
              <Flex justifyContent={"right"} p={"2"} align={"center"} gap={"1"}>
                <Link
                  color={"black"}
                  fontWeight={"semibold"}
                  onClick={() =>
                    navigate(`/entities/${info.row.original.target._id}`)
                  }
                >
                  View
                </Link>
                <Icon name={"a_right"} />
              </Flex>
            ) : (
              <IconButton
                aria-label={"Remove relationship"}
                colorPalette={"red"}
                onClick={() => {
                  removeRelationship(info.row.original);
                }}
                size={"sm"}
                rounded={"md"}
              >
                <Icon name={"delete"} />
              </IconButton>
            )}
          </Flex>
        );
      },
      header: "",
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
      <DataTable
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
