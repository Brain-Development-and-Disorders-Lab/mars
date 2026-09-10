import React, { useMemo, useEffect, useState } from "react";
import { Button, EmptyState, Flex, Text, Tag, Box } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Tooltip from "@components/Tooltip";

// Custom and existing types
import { IconNames, IGenericItem, ILink, LinksProps, LinkType } from "@types";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import { ignoreAbort } from "@lib/util";

// Variables
import { STYLES } from "@variables";

export const LINK_TYPE_ARROW_COLOR: Record<LinkType, string> = {
  parent: "link.parent",
  child: "link.child",
  general: "link.general",
};

export const LINK_TYPE_ARROW_ICON: Record<LinkType, IconNames> = {
  parent: "a_right_fill",
  child: "a_left_fill",
  general: "a_both_fill",
};

export const LINK_TYPE_PALETTE: Record<LinkType, string> = {
  parent: "blue",
  child: "teal",
  general: "purple",
};

const Links = (props: LinksProps) => {
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
    props.links.forEach((rel) => {
      ids.add(rel.source._id);
      ids.add(rel.target._id);
    });
    return Array.from(ids);
  }, [props.links]);

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
              const rel = props.links.find((r) => r.source._id === entityId || r.target._id === entityId);
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
  }, [uniqueEntityIds, getEntityName, props.links]);

  const linkIsEqual = (a: ILink, b: ILink): boolean =>
    _.isEqual(a.source._id, b.source._id) && _.isEqual(a.target._id, b.target._id) && _.isEqual(a.type, b.type);

  const removeLink = (link: ILink) => {
    props.setLinks(props.links.filter((l) => !linkIsEqual(l, link)));
  };

  return (
    <Flex direction={"column"} w={"100%"} gap={"1"}>
      {props.links.length > 0 ? (
        <Flex
          direction={"column"}
          border={STYLES.border.style}
          borderColor={STYLES.border.color}
          rounded={"md"}
          overflow={"hidden"}
        >
          {props.links.map((link, index) => {
            const sourceName = entityNames[link.source._id] || link.source.name;
            return (
              <Flex
                key={`${link.source._id}-${link.target._id}-${link.type}-${index}`}
                direction={"row"}
                align={"center"}
                gap={"2"}
                px={"2"}
                py={"1.5"}
                borderBottom={index < props.links.length - 1 ? "1px solid" : "none"}
                borderColor={"border.subtle"}
                bg={"white"}
                _hover={{ bg: "gray.25" }}
                wrap={"wrap"}
              >
                {/* Source, arrow, and target as one unit so the badge wraps below, never between them */}
                <Flex direction={"row"} align={"center"} gap={"2"}>
                  <Tooltip content={sourceName} disabled={sourceName.length < 24} showArrow>
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      {_.truncate(sourceName, { length: 24 })}
                    </Text>
                  </Tooltip>

                  {/* Link arrow */}
                  <Flex direction={"row"} gap={"0"} align={"center"}>
                    {link.type === "parent" && <Box w={"55px"} h={"2px"} bg={LINK_TYPE_ARROW_COLOR[link.type]} />}

                    {link.type === "general" && <Box w={"27.5px"} h={"2px"} bg={LINK_TYPE_ARROW_COLOR[link.type]} />}

                    <Icon name={LINK_TYPE_ARROW_ICON[link.type]} size={"xs"} color={LINK_TYPE_ARROW_COLOR[link.type]} />

                    {link.type === "general" && <Box w={"27.5px"} h={"2px"} bg={LINK_TYPE_ARROW_COLOR[link.type]} />}

                    {link.type === "child" && <Box w={"55px"} h={"2px"} bg={LINK_TYPE_ARROW_COLOR[link.type]} />}
                  </Flex>

                  <Linky id={link.target._id} type={"entities"} truncate={12} />
                </Flex>

                <Flex direction={"row"} gap={"2"} ml={"auto"}>
                  {/* Type badge */}
                  <Tag.Root size={"sm"} colorPalette={LINK_TYPE_PALETTE[link.type]}>
                    <Tag.Label fontSize={"xs"}>{_.capitalize(link.type)}</Tag.Label>
                  </Tag.Root>

                  {/* Remove */}
                  {!props.viewOnly && (
                    <Button
                      size={"2xs"}
                      variant={"subtle"}
                      colorPalette={"red"}
                      aria-label={"Remove Link"}
                      onClick={() => removeLink(link)}
                    >
                      Remove
                      <Icon name={"delete"} size={"xs"} />
                    </Button>
                  )}
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      ) : (
        <Flex justify={"center"} align={"center"} minH={"120px"}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon name={"graph"} size={"lg"} />
              </EmptyState.Indicator>
              <EmptyState.Description>No Links</EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      )}
    </Flex>
  );
};

export default Links;
