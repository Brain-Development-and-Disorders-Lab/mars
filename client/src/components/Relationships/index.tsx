import React, { useMemo, useEffect, useState } from "react";
import { Button, EmptyState, Flex, Input, Spacer, Text, Tag } from "@chakra-ui/react";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SearchSelect from "@components/SearchSelect";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Custom and existing types
import { DataTableAction, IGenericItem, IRelationship, RelationshipsProps, RelationshipType } from "@types";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import { ignoreAbort } from "@lib/util";

// Variables
import { GLOBAL_STYLES } from "@variables";

const Relationships = (props: RelationshipsProps) => {
  const GET_ENTITY_NAME = gql`
    query GetEntityName($_id: String) {
      entity(_id: $_id) {
        _id
        name
      }
    }
  `;
  const [getEntityName] = useLazyQuery<{ entity: IGenericItem }>(GET_ENTITY_NAME, { fetchPolicy: "network-only" });

  const uniqueEntityIds = useMemo(() => {
    const ids = new Set<string>();
    props.relationships.forEach((rel) => {
      ids.add(rel.source._id);
      ids.add(rel.target._id);
    });
    return Array.from(ids);
  }, [props.relationships]);

  const [entityNames, setEntityNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    const fetchEntityNames = async () => {
      const nameMap: Record<string, string> = {};
      await Promise.all(
        uniqueEntityIds.map(async (entityId) => {
          try {
            const { data } = await getEntityName({ variables: { _id: entityId } });
            if (data?.entity && isMounted) {
              nameMap[entityId] = data.entity.name;
            }
          } catch {
            if (isMounted) {
              const rel = props.relationships.find((r) => r.source._id === entityId || r.target._id === entityId);
              if (rel) {
                nameMap[entityId] = rel.source._id === entityId ? rel.source.name : rel.target.name;
              }
            }
          }
        }),
      );
      if (isMounted) setEntityNames(nameMap);
    };

    if (uniqueEntityIds.length > 0) fetchEntityNames().catch(ignoreAbort);
    return () => {
      isMounted = false;
    };
  }, [uniqueEntityIds, getEntityName, props.relationships]);

  const relationshipIsEqual = (a: IRelationship, b: IRelationship): boolean =>
    _.isEqual(a.source._id, b.source._id) && _.isEqual(a.target._id, b.target._id) && _.isEqual(a.type, b.type);

  const relationshipExists = (relationship: IRelationship, relationships: IRelationship[]): boolean =>
    relationships.some((r) => relationshipIsEqual(r, relationship));

  const removeRelationship = (relationship: IRelationship) => {
    props.setRelationships(props.relationships.filter((r) => !relationshipIsEqual(r, relationship)));
  };

  const removeRelationships = (toRemove: IRelationship[]) => {
    props.setRelationships(props.relationships.filter((r) => !relationshipExists(r, toRemove)));
  };

  // Add form state
  const [selectedType, setSelectedType] = useState<RelationshipType>("general");
  const [selectedTarget, setSelectedTarget] = useState<IGenericItem>({} as IGenericItem);

  const addRelationship = () => {
    props.setRelationships([
      ...props.relationships,
      {
        source: { _id: props.sourceId || "no_id", name: props.sourceName || "" },
        target: { _id: selectedTarget._id, name: selectedTarget.name },
        type: selectedType,
      },
    ]);
    setSelectedType("general");
    setSelectedTarget({} as IGenericItem);
  };

  const columnHelper = createColumnHelper<IRelationship>();
  const columns = [
    columnHelper.accessor("source", {
      cell: (info) => {
        const src = info.getValue();
        const name = entityNames[src._id] || src.name;
        return (
          <Flex align={"center"} gap={"1"} w={"100%"}>
            <Tooltip content={name} disabled={name.length < 32} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(name, { length: 32 })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Source",
    }),
    columnHelper.accessor("type", {
      cell: (info) => (
        <Flex p={"1"}>
          <Tag.Root size={"sm"}>
            <Tag.Label fontSize={"xs"}>{info.getValue()}</Tag.Label>
          </Tag.Root>
        </Flex>
      ),
      header: "Type",
      meta: { minWidth: 100, maxWidth: 100 },
    }),
    columnHelper.accessor("target", {
      cell: (info) => {
        const tgt = info.getValue();
        return (
          <Flex w={"100%"} justify={"space-between"} gap={"1"}>
            <Linky id={tgt._id} type={"entities"} />
            <Button
              size={"2xs"}
              variant={"subtle"}
              colorPalette={"red"}
              aria-label={"Remove relationship"}
              onClick={() => removeRelationship(info.row.original)}
            >
              Remove
              <Icon name={"delete"} size={"xs"} />
            </Button>
          </Flex>
        );
      },
      header: "Target",
    }),
  ];

  const actions: DataTableAction[] = [
    {
      label: "Remove Relationships",
      icon: "delete",
      action(table, rows) {
        removeRelationships(Object.keys(rows).map((i) => table.getRow(i).original));
      },
    },
  ];

  return (
    <Flex direction={"column"} w={"100%"} gap={"1"}>
      {!props.viewOnly && (
        <>
          {/* Source and target */}
          <Flex
            direction={"row"}
            gap={"2"}
            align={"center"}
            p={"2"}
            rounded={"md"}
            bg={"gray.50"}
            border={GLOBAL_STYLES.border.style}
            borderColor={GLOBAL_STYLES.border.color}
          >
            <Flex direction={"column"} gap={"1"} flex={"1"}>
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                Source
              </Text>
              <Input size={"xs"} rounded={"md"} value={props.sourceName || ""} readOnly disabled bg={"white"} />
            </Flex>
            <Icon
              name={"a_right_fill"}
              size={"sm"}
              color={selectedType === "parent" ? "blue.400" : selectedType === "child" ? "green.600" : "purple.400"}
            />
            <Flex direction={"column"} gap={"1"} flex={"1"}>
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                Target
              </Text>
              <SearchSelect resultType={"entity"} value={selectedTarget} onChange={setSelectedTarget} />
            </Flex>
          </Flex>

          {/* Type and Add */}
          <Flex direction={"row"} align={"center"} gap={"2"} p={"1"}>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"} flexShrink={0}>
              Type
            </Text>
            <Flex gap={"1"}>
              {(["general", "parent", "child"] as RelationshipType[]).map((type) => {
                const palette = type === "parent" ? "blue" : type === "child" ? "green" : "purple";
                return (
                  <Button
                    key={type}
                    size={"xs"}
                    rounded={"md"}
                    variant={selectedType === type ? "solid" : "outline"}
                    colorPalette={selectedType === type ? palette : "gray"}
                    onClick={() => setSelectedType(type)}
                  >
                    {_.capitalize(type)}
                  </Button>
                );
              })}
            </Flex>
            <Spacer />
            <Button
              size={"xs"}
              rounded={"md"}
              colorPalette={"green"}
              disabled={_.isUndefined(selectedTarget._id)}
              onClick={addRelationship}
              flexShrink={0}
              data-testid={"add-relationship-button"}
            >
              Add
              <Icon name={"add"} size={"xs"} />
            </Button>
          </Flex>
        </>
      )}

      {props.relationships.length > 0 ? (
        <DataTable
          data={props.relationships}
          setData={props.setRelationships}
          columns={columns}
          viewOnly={props.viewOnly}
          actions={actions}
          selectedRows={{}}
          visibleColumns={{}}
          showPagination
          showSelection
        />
      ) : (
        <Flex justify={"center"} align={"center"} minH={"120px"}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon name={"graph"} size={"lg"} />
              </EmptyState.Indicator>
              <EmptyState.Description>No Relationships</EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      )}
    </Flex>
  );
};

export default Relationships;
