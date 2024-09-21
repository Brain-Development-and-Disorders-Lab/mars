// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Avatar, Flex, Skeleton, Text } from "@chakra-ui/react";

// Existing and custom types
import { ActorProps, UserModel } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { gql, useQuery } from "@apollo/client";

const DEFAULT_ACTOR_LABEL_LENGTH = 20; // Default number of shown characters

const ActorTag = (props: ActorProps) => {
  // Component state
  const [actorLabel, setActorLabel] = useState(props.fallback);

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

  return (
    <Flex
      direction={"row"}
      gap={"2"}
      align={"center"}
      p={"2"}
      rounded={"md"}
      border={"1px"}
      borderColor={"gray.300"}
    >
      <Avatar name={actorLabel} size={"sm"} />
      {loading ? (
        <Skeleton w={"30px"} />
      ) : (
        <Flex direction={"column"} gap={"0"}>
          <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.700"}>
            {actorLabel}
          </Text>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.400"}>
            {props.orcid}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default ActorTag;
