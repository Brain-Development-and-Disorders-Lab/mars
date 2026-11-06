import React, { useMemo, useEffect, useState } from "react";
import { Box, Button, EmptyState, Flex, Grid, Tag, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Tooltip from "@components/Tooltip";

// Custom and existing types
import { IconNames, IGenericItem, ILink, LinkRowProps, LinksProps, LinkType } from "@types";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import { getPublicWorkspaceUrl, ignoreAbort } from "@lib/util";

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

// Styling variables
const LIST_COLUMNS_NARROW = "fit-content(40%) 72px minmax(0, 1fr)";
const LIST_COLUMNS_WIDE = "fit-content(35%) 120px minmax(0, 1fr) auto";
const LIST_WIDE_BREAKPOINT = "520px";
export const LINK_LIST_CONTAINER_CSS = { containerType: "inline-size" };
export const LINK_LIST_GRID_CSS = {
  gridTemplateColumns: LIST_COLUMNS_NARROW,
  columnGap: "3",
  [`@container (min-width: ${LIST_WIDE_BREAKPOINT})`]: { gridTemplateColumns: LIST_COLUMNS_WIDE },
};

/**
 * Single Link row, a subgrid of the list grid so the arrows line up across rows
 * @param props LinkRowProps
 */
export const LinkRow = (props: LinkRowProps) => {
  const color = LINK_TYPE_ARROW_COLOR[props.link.type];

  return (
    <Grid
      templateColumns={"subgrid"}
      gridColumn={"1 / -1"}
      alignItems={"center"}
      rowGap={"1"}
      px={"2"}
      py={"1.5"}
      bg={"white"}
      borderBottom={props.isLast ? "none" : "1px solid"}
      borderColor={"border.subtle"}
      _hover={{ bg: "gray.25" }}
    >
      {/* Source */}
      <Tooltip content={props.sourceName} showArrow>
        <Text fontSize={"xs"} fontWeight={"semibold"} minW={0} truncate>
          {props.sourceName}
        </Text>
      </Tooltip>

      {/* Arrow, fills its fixed width column */}
      <Flex direction={"row"} align={"center"}>
        {props.link.type !== "child" && <Box flex={"1"} h={"2px"} bg={color} />}
        <Icon name={LINK_TYPE_ARROW_ICON[props.link.type]} size={"xs"} color={color} />
        {props.link.type !== "parent" && <Box flex={"1"} h={"2px"} bg={color} />}
      </Flex>

      {/* Target */}
      <Flex minW={0}>
        <Linky
          id={props.link.target._id}
          type={"entities"}
          truncate={false}
          workspace={props.workspace}
          isPublic={props.isPublic}
        />
      </Flex>

      {/* Type badge and remove button */}
      <Flex
        direction={"row"}
        gap={"2"}
        justify={"flex-start"}
        gridColumn={"1 / -1"}
        css={{ [`@container (min-width: ${LIST_WIDE_BREAKPOINT})`]: { gridColumn: "auto" } }}
      >
        <Tag.Root size={"sm"} colorPalette={LINK_TYPE_PALETTE[props.link.type]} minW={"64px"} justifyContent={"center"}>
          <Tag.Label fontSize={"xs"}>{_.capitalize(props.link.type)}</Tag.Label>
        </Tag.Root>

        {props.onRemove && (
          <Button
            size={"2xs"}
            variant={"subtle"}
            colorPalette={"red"}
            aria-label={"Remove Link"}
            onClick={props.onRemove}
          >
            Remove
            <Icon name={"delete"} size={"xs"} />
          </Button>
        )}
      </Flex>
    </Grid>
  );
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
  const queryContext = useMemo(
    () => (props.isPublic ? { uri: getPublicWorkspaceUrl(props.workspace ?? "") } : undefined),
    [props.isPublic, props.workspace],
  );

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
            const { data } = await getEntityName({ variables: { _id: entityId }, context: queryContext });
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
  }, [uniqueEntityIds, getEntityName, props.links, queryContext]);

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
          css={LINK_LIST_CONTAINER_CSS}
        >
          <Grid css={LINK_LIST_GRID_CSS}>
            {props.links.map((link, index) => (
              <LinkRow
                key={`${link.source._id}-${link.target._id}-${link.type}-${index}`}
                link={link}
                sourceName={entityNames[link.source._id] || link.source.name}
                onRemove={props.viewOnly ? undefined : () => removeLink(link)}
                isLast={index === props.links.length - 1}
                workspace={props.workspace}
                isPublic={props.isPublic}
              />
            ))}
          </Grid>
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
