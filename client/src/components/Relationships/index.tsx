import React, { useMemo, useEffect, useState } from "react";
import { Flex, Text, Tag, Button } from "@chakra-ui/react";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Custom and existing types
import {
  DataTableAction,
  IGenericItem,
  IRelationship,
  RelationshipsProps,
} from "@types";

// Navigation
import { useNavigate } from "react-router-dom";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import { isAbortError } from "@lib/util";

const Relationships = (props: RelationshipsProps) => {
  const navigate = useNavigate();

  // GraphQL query to fetch entity name by ID
  const GET_ENTITY_NAME = gql`
    query GetEntityName($_id: String) {
      entity(_id: $_id) {
        _id
        name
      }
    }
  `;
  const [getEntityName] = useLazyQuery<{ entity: IGenericItem }>(
    GET_ENTITY_NAME,
  );

  // Extract all unique entity IDs from relationships
  const uniqueEntityIds = useMemo(() => {
    const ids = new Set<string>();
    props.relationships.forEach((rel) => {
      ids.add(rel.source._id);
      ids.add(rel.target._id);
    });
    return Array.from(ids);
  }, [props.relationships]);

  // State to store fetched entity names
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});

  // Fetch entity names for all unique IDs
  useEffect(() => {
    let isMounted = true;

    const fetchEntityNames = async () => {
      const nameMap: Record<string, string> = {};

      // Fetch names for all unique entity IDs
      await Promise.all(
        uniqueEntityIds.map(async (entityId) => {
          try {
            const { data } = await getEntityName({
              variables: { _id: entityId },
            });
            if (data?.entity && isMounted) {
              nameMap[entityId] = data.entity.name;
            }
          } catch (error: any) {
            // If fetch fails, fall back to the name from relationship data
            if (isMounted) {
              const relationship = props.relationships.find(
                (rel) =>
                  rel.source._id === entityId || rel.target._id === entityId,
              );
              if (relationship) {
                nameMap[entityId] =
                  relationship.source._id === entityId
                    ? relationship.source.name
                    : relationship.target.name;
              }
            }
          }
        }),
      );

      if (isMounted) {
        setEntityNames(nameMap);
      }
    };

    if (uniqueEntityIds.length > 0) {
      Promise.resolve(fetchEntityNames()).catch((error: unknown) => {
        if (!isAbortError(error)) {
          console.error("Error in fetchEntityNames:", error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [uniqueEntityIds, getEntityName, props.relationships]);

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
        const sourceEntity = info.getValue();
        // Use fetched name if available, otherwise fall back to relationship data name
        const displayName = entityNames[sourceEntity._id] || sourceEntity.name;
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip
              content={displayName}
              disabled={displayName.length < 32}
              showArrow
            >
              <Flex
                align={"center"}
                gap={"1"}
                w={"100%"}
                justify={"space-between"}
              >
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(displayName, { length: 32 })}
                </Text>
              </Flex>
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
        const targetEntity = info.getValue();
        // Use fetched name if available, otherwise fall back to relationship data name
        const displayName = entityNames[targetEntity._id] || targetEntity.name;
        return (
          <Flex w={"100%"} justify={"space-between"} gap={"1"}>
            <Flex align={"center"} gap={"1"} w={"100%"}>
              <Tooltip
                content={displayName}
                disabled={displayName.length < 32}
                showArrow
              >
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(displayName, { length: 32 })}
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
