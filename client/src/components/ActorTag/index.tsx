// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Avatar, Badge, Flex, Skeleton, Text } from "@chakra-ui/react";

// Existing and custom types
import { ActorTagProps, UserModel } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Custom hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

const DEFAULT_ACTOR_LABEL_LENGTH = 20; // Default number of shown characters

const ActorTag = (props: ActorTagProps) => {
  // Component state
  const [actorLabel, setActorLabel] = useState(props.fallback);
  const [actorOrcid, setActorOrcid] = useState("");

  // Breakpoint state
  const { isBreakpointActive } = useBreakpoint();

  // Avatar color information
  const colorPalette = ["red", "blue", "green", "yellow", "purple", "orange"];
  const pickPalette = (name: string) => {
    const index = name.charCodeAt(0) % colorPalette.length;
    return colorPalette[index];
  };

  // GraphQL operations
  const GET_USER = gql`
    query GetUser($_id: String) {
      user(_id: $_id) {
        _id
        name
        firstName
        lastName
        account_orcid
      }
    }
  `;
  const { loading, data } = useQuery<{ user: Partial<UserModel> }>(GET_USER, {
    variables: {
      _id: props.identifier,
    },
    skip: !props.identifier || props.identifier.trim() === "",
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (data?.user) {
      setActorLabel(
        _.truncate(`${data.user.firstName} ${data.user.lastName}`, {
          length: DEFAULT_ACTOR_LABEL_LENGTH,
        }),
      );

      // Extract additional account information if specified
      if (data.user.account_orcid && data.user.account_orcid !== "") {
        const startOrcid = data.user.account_orcid.lastIndexOf("/");
        setActorOrcid(data.user.account_orcid.substring(startOrcid + 1));
      }
    }
  }, [data]);

  // If avatarOnly is true, show only the avatar
  if (props.avatarOnly) {
    return (
      <Avatar.Root
        size={props.inline ? "2xs" : props.size === "sm" ? "xs" : "sm"}
        key={actorLabel}
        colorPalette={loading ? "gray" : pickPalette(actorLabel)}
      >
        <Avatar.Fallback name={loading ? "" : actorLabel} />
      </Avatar.Root>
    );
  }

  return props.inline ? (
    <Flex direction={"row"} gap={"2"} align={"center"}>
      <Avatar.Root
        size={"2xs"}
        key={actorLabel}
        colorPalette={loading ? "gray" : pickPalette(actorLabel)}
      >
        <Avatar.Fallback name={loading ? "" : actorLabel} />
      </Avatar.Root>
      <Skeleton asChild loading={loading} w={"120px"}>
        <Badge fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
          {!loading && actorLabel}
        </Badge>
      </Skeleton>
    </Flex>
  ) : (
    <Flex
      direction={"row"}
      gap={"2"}
      align={"center"}
      justify={"space-around"}
      p={props.size === "sm" ? "1" : "2"}
      rounded={"md"}
      border={"1px solid"}
      borderColor={"gray.300"}
      bg={"white"}
      minW={"120px"}
      maxW={props.size === "sm" ? "180px" : "200px"}
      h={"54px"}
    >
      <Avatar.Root
        size={props.size === "sm" ? "xs" : "sm"}
        key={actorLabel}
        colorPalette={loading ? "gray" : pickPalette(actorLabel)}
      >
        <Avatar.Fallback name={loading ? "" : actorLabel} />
      </Avatar.Root>
      <Skeleton loading={loading} asChild>
        <Flex direction={"column"} gap={"0.5"} align={"center"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
            {actorLabel}
          </Text>
          {isBreakpointActive("xl", "up") && actorOrcid !== "" && (
            <Text fontSize={"2xs"} fontWeight={"semibold"} color={"gray.500"}>
              {actorOrcid}
            </Text>
          )}
        </Flex>
      </Skeleton>
    </Flex>
  );
};

export default ActorTag;
