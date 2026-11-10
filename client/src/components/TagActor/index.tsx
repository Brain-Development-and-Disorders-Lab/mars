// React
import React from "react";

// Existing and custom components
import { Avatar, Badge, Flex, HoverCard, Portal, Separator, Skeleton, Text } from "@chakra-ui/react";

// Existing and custom types
import {
  ActorAvatarProps,
  ActorDetailRowProps,
  ActorDetails,
  ActorHoverCardProps,
  ActorRole,
  TagActorProps,
} from "@types";

// Utility functions and libraries
import { getAvatarGradient } from "@lib/util";

// Custom hooks
import { useActor } from "@hooks/useActor";
import { useWorkspace } from "@hooks/useWorkspace";

// Variables
import { STYLES } from "@variables";

const ROLE_LABELS: Record<ActorRole, string> = {
  owner: "Owner",
  collaborator: "Collaborator",
  none: "Not a member",
};

const ROLE_PALETTES: Record<ActorRole, string> = {
  owner: "blue",
  collaborator: "gray",
  none: "orange",
};

// Font and hover colors for hover card anchors
const DETAIL_LINK_STYLES = {
  fontSize: "xs",
  color: "blue.600",
  textDecoration: "none",
  truncate: true,
  _hover: { color: "blue.800", textDecoration: "underline" },
};

// Name color, muted for non-members once loaded
const getNameColor = (actor: ActorDetails) => (actor.loading || actor.isMember ? "gray.700" : "gray.500");

// Avatar with the User image when set, otherwise gradient initials, gray for non-members
const ActorAvatar = (props: ActorAvatarProps) => {
  const getColorProps = () => {
    if (props.actor.loading) {
      return { colorPalette: "gray" };
    }
    if (!props.actor.isMember) {
      return { colorPalette: "gray", borderWidth: "1px", borderStyle: "dashed", borderColor: "gray.400" };
    }
    const gradient = getAvatarGradient(props.actor.identifier || props.actor.label);
    return { bgGradient: "to-br", gradientFrom: gradient.from, gradientTo: gradient.to, color: "white" };
  };

  return (
    <Avatar.Root size={props.size} flexShrink={0} {...getColorProps()}>
      <Avatar.Fallback name={props.actor.loading ? "" : props.actor.label} fontWeight={"bold"} />
      {props.actor.image && <Avatar.Image src={props.actor.image} />}
    </Avatar.Root>
  );
};

// Labelled row within the hover card
const ActorDetailRow = (props: ActorDetailRowProps) => (
  <Flex direction={"row"} align={"center"} justify={"space-between"} gap={"3"} minW={"0"}>
    <Text fontSize={"xs"} color={"gray.500"} flexShrink={0}>
      {props.label}
    </Text>
    <Flex minW={"0"} justify={"flex-end"}>
      {props.children}
    </Flex>
  </Flex>
);

// Hover card with the full actor details
const ActorHoverCard = (props: ActorHoverCardProps) => (
  <HoverCard.Root openDelay={400} closeDelay={100} positioning={{ placement: "top" }} lazyMount unmountOnExit>
    <HoverCard.Trigger asChild>{props.children}</HoverCard.Trigger>
    <Portal>
      <HoverCard.Positioner>
        <HoverCard.Content w={"2xs"} p={"3"}>
          <HoverCard.Arrow />
          <Flex direction={"column"} gap={"3"}>
            <Flex direction={"row"} align={"center"} gap={"3"} minW={"0"}>
              <ActorAvatar actor={props.actor} size={"md"} />
              <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.700"} truncate>
                {props.actor.label}
              </Text>
            </Flex>

            <Separator />

            <Flex direction={"column"} gap={"1.5"}>
              <ActorDetailRow label={"Role"}>
                <Badge size={"sm"} colorPalette={ROLE_PALETTES[props.actor.role]}>
                  {ROLE_LABELS[props.actor.role]}
                </Badge>
              </ActorDetailRow>
              {props.actor.affiliation && (
                <ActorDetailRow label={"Affiliation"}>
                  <Text fontSize={"xs"} color={"gray.700"} truncate>
                    {props.actor.affiliation}
                  </Text>
                </ActorDetailRow>
              )}
              {props.actor.orcid && (
                <ActorDetailRow label={"ORCiD"}>
                  <Text asChild {...DETAIL_LINK_STYLES}>
                    <a href={props.actor.orcidUrl} target={"_blank"} rel={"noreferrer"}>
                      {props.actor.orcid}
                    </a>
                  </Text>
                </ActorDetailRow>
              )}
              {props.actor.email && (
                <ActorDetailRow label={"Email"}>
                  <Text asChild {...DETAIL_LINK_STYLES}>
                    <a href={`mailto:${props.actor.email}`}>{props.actor.email}</a>
                  </Text>
                </ActorDetailRow>
              )}
            </Flex>
          </Flex>
        </HoverCard.Content>
      </HoverCard.Positioner>
    </Portal>
  </HoverCard.Root>
);

const TagActor = (props: TagActorProps) => {
  // Workspace state, overridden on unauthenticated public pages
  const { workspace: activeWorkspace } = useWorkspace();
  const workspace = props.workspace ?? activeWorkspace;

  const actor = useActor({
    identifier: props.identifier,
    fallback: props.fallback,
    workspace,
    isPublic: props.isPublic,
  });

  const variant = props.variant ?? "card";
  const isSmall = props.size === "sm";

  // Just the avatar
  if (variant === "avatar") {
    return (
      <ActorHoverCard actor={actor}>
        <Flex flexShrink={0} cursor={"default"}>
          <ActorAvatar actor={actor} size={isSmall ? "xs" : "sm"} />
        </Flex>
      </ActorHoverCard>
    );
  }

  // Just the name
  if (variant === "name") {
    return (
      <ActorHoverCard actor={actor}>
        <Flex minW={"0"} maxW={"full"} w={"fit-content"} cursor={"default"}>
          <Skeleton loading={actor.loading} asChild>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={getNameColor(actor)} truncate>
              {actor.label}
            </Text>
          </Skeleton>
        </Flex>
      </ActorHoverCard>
    );
  }

  // Compact avatar and name pill, for tables and lists
  if (variant === "inline") {
    return (
      <ActorHoverCard actor={actor}>
        <Flex
          direction={"row"}
          align={"center"}
          gap={"1.5"}
          p={"0.5"}
          pr={"2"}
          rounded={"full"}
          bg={"bg.muted"}
          minW={"0"}
          maxW={"full"}
          w={"fit-content"}
          cursor={"default"}
        >
          <ActorAvatar actor={actor} size={"2xs"} />
          <Skeleton loading={actor.loading} asChild>
            <Text fontSize={"xs"} fontWeight={"medium"} color={getNameColor(actor)} truncate>
              {actor.label}
            </Text>
          </Skeleton>
        </Flex>
      </ActorHoverCard>
    );
  }

  // Full card with the ORCiD as a secondary line, other details live in the hover card
  const secondary = actor.orcid;

  return (
    <ActorHoverCard actor={actor}>
      <Flex
        direction={"row"}
        align={"center"}
        gap={"2"}
        h={STYLES.tag.height[props.size]}
        px={isSmall ? "1.5" : "2"}
        pr={"3"}
        rounded={"md"}
        border={STYLES.border.style}
        borderColor={STYLES.border.color}
        bg={actor.loading || actor.isMember ? "white" : "surface.card"}
        minW={"0"}
        maxW={"240px"}
        w={"fit-content"}
        cursor={"default"}
      >
        <ActorAvatar actor={actor} size={isSmall ? "xs" : "sm"} />
        <Skeleton loading={actor.loading} asChild>
          <Flex direction={"column"} gap={"0.5"} minW={"0"}>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={getNameColor(actor)} truncate>
              {actor.label}
            </Text>
            {secondary && (
              <Text fontSize={"2xs"} color={"gray.500"} truncate>
                {secondary}
              </Text>
            )}
          </Flex>
        </Skeleton>
      </Flex>
    </ActorHoverCard>
  );
};

export default TagActor;
