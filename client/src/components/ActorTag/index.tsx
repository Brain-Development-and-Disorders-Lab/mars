// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Avatar, Flex, Skeleton, Text, Tooltip } from "@chakra-ui/react";

// Existing and custom types
import { ActorProps, UserModel } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { gql, useQuery } from "@apollo/client";

const DEFAULT_ACTOR_LABEL_LENGTH = 20; // Default number of shown characters

const ActorTag = (props: ActorProps) => {
  // Component state
  const [actorLabel, setActorLabel] = useState(props.fallback);
  const [tooltipLabel, setTooltipLabel] = useState(props.fallback);

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
      setTooltipLabel(`${data.user.firstName} ${data.user.lastName}`);
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
      bg={"gray.50"}
      border={"1px"}
      borderColor={"gray.200"}
    >
      <Avatar name={tooltipLabel} size={"sm"} />
      {loading ? (
        <Skeleton w={"30px"} />
      ) : (
        <Tooltip hasArrow label={tooltipLabel} bg={"gray.300"} color={"black"}>
          <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.700"}>
            {actorLabel}
          </Text>
        </Tooltip>
      )}
    </Flex>
  );
};

export default ActorTag;
