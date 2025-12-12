// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Avatar, Flex, Skeleton, Text } from "@chakra-ui/react";

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

  // Breakpoint state
  const { isBreakpointActive } = useBreakpoint();
  // GraphQL operations
  const GET_USER = gql`
    query GetUser($_id: String) {
      user(_id: $_id) {
        _id
        firstName
        lastName
      }
    }
  `;
  const { loading, data, refetch } = useQuery<{ user: Partial<UserModel> }>(
    GET_USER,
    {
      variables: {
        _id: props.orcid,
      },
      skip: !props.orcid || props.orcid.trim() === "",
    },
  );

  useEffect(() => {
    if (data?.user) {
      setActorLabel(
        _.truncate(`${data.user.firstName} ${data.user.lastName}`, {
          length: DEFAULT_ACTOR_LABEL_LENGTH,
        }),
      );
    }
  }, [data]);

  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  // If avatarOnly is true, show only the avatar
  if (props.avatarOnly) {
    return (
      <Avatar.Root
        size={props.inline ? "2xs" : props.size === "sm" ? "xs" : "sm"}
        key={actorLabel}
        colorPalette={"blue"}
      >
        <Avatar.Fallback name={actorLabel} />
      </Avatar.Root>
    );
  }

  return props.inline ? (
    <Flex direction={"row"} gap={"2"} align={"center"}>
      <Avatar.Root size={"2xs"} key={actorLabel} colorPalette={"blue"}>
        <Avatar.Fallback name={actorLabel} />
      </Avatar.Root>
      <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
        {actorLabel}
      </Text>
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
        colorPalette={"blue"}
      >
        <Avatar.Fallback name={actorLabel} />
      </Avatar.Root>
      <Skeleton loading={loading} asChild>
        <Flex direction={"column"} gap={"0.5"} align={"center"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
            {actorLabel}
          </Text>
          {isBreakpointActive("xl", "up") && (
            <Text fontSize={"2xs"} fontWeight={"semibold"} color={"gray.400"}>
              {props.orcid}
            </Text>
          )}
        </Flex>
      </Skeleton>
    </Flex>
  );
};

export default ActorTag;
