import React, { useEffect, useState } from "react";
import { Flex, Tooltip, Text, Tag, IconButton, Link } from "@chakra-ui/react";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import { createColumnHelper } from "@tanstack/react-table";

// Custom and existing types
import { DataTableAction, IRelationship, RelationshipsProps } from "@types";

import _ from "lodash";
import { useNavigate } from "react-router-dom";

const Relationships = (props: RelationshipsProps) => {
  const [relationships, setRelationships] = useState(props.relationships);
  useEffect(() => {
    setRelationships(props.relationships);
  }, [props.relationships]);

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
      _.isEqual(a.target, b.type)
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
    setRelationships(
      relationships.filter((r) => {
        return !relationshipIsEqual(r, relationship);
      }),
    );
  };

  // Remove multiple Relationships from the Entity state
  const removeRelationships = (toRemove: IRelationship[]) => {
    setRelationships(
      relationships.filter((r) => {
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
          <Tooltip label={info.getValue().name} hasArrow>
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
            <Tag>{info.getValue()}</Tag>
          </Flex>
        );
      },
      header: "Type",
    }),
    relationshipTableColumnHelper.accessor("target", {
      cell: (info) => {
        return (
          <Tooltip label={info.getValue().name} hasArrow>
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
                  onClick={() =>
                    navigate(`/entities/${info.row.original.target._id}`)
                  }
                >
                  <Text fontWeight={"semibold"}>View</Text>
                </Link>
                <Icon name={"a_right"} />
              </Flex>
            ) : (
              <IconButton
                icon={<Icon name={"delete"} />}
                aria-label={"Remove relationship"}
                colorScheme={"red"}
                onClick={() => {
                  removeRelationship(info.row.original);
                }}
                size={"sm"}
              />
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
          toRemove.push(table.getRow(rowIndex).original._id);
        }
        removeRelationships(toRemove);
      },
    },
  ];

  return (
    <Flex w={"100%"}>
      <DataTable
        data={relationships}
        setData={setRelationships}
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
