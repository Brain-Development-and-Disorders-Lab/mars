// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Avatar, Badge, Flex, Skeleton, SkeletonText, Text } from "@chakra-ui/react";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { TagActorProps, UserModel, WorkspaceModel } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { getPublicWorkspaceUrl } from "@lib/util";

// Custom hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { useWorkspace } from "@hooks/useWorkspace";

// Variables
import { STYLES } from "@variables";

const DEFAULT_ACTOR_LABEL_LENGTH = 20; // Default number of shown characters

const TagActor = (props: TagActorProps) => {
  // Component state
  const [actorLabel, setActorLabel] = useState(props.fallback);
  const [actorOrcid, setActorOrcid] = useState("");

  // Workspace state, overridden on unauthenticated public pages
  const { workspace: activeWorkspace } = useWorkspace();
  const workspace = props.workspace ?? activeWorkspace;

  // Breakpoint state
  const { isBreakpointActive } = useBreakpoint();

  // Avatar color information
  const colorPalette = ["red", "blue", "green", "yellow", "purple", "orange"];
  const pickPalette = (name: string) => {
    const index = name.charCodeAt(0) % colorPalette.length;
    return colorPalette[index];
  };
  const [isWorkspaceMember, setIsWorkspaceMember] = useState(false);

  // GraphQL operations
  const GET_USER = gql`
    query GetUser($_id: String, $workspace: String) {
      user(_id: $_id) {
        _id
        name
        firstName
        lastName
        account_orcid
      }
      workspace(_id: $workspace) {
        _id
        owner
        collaborators {
          _id
        }
      }
    }
  `;
  const { loading, data } = useQuery<{ user: Partial<UserModel>; workspace: WorkspaceModel }>(GET_USER, {
    variables: {
      _id: props.identifier,
      workspace: workspace,
    },
    // Send this query to the public Workspace endpoint when rendered on a public page
    context: props.isPublic ? { uri: getPublicWorkspaceUrl(workspace) } : undefined,
    skip: !props.identifier || props.identifier.trim() === "",
    fetchPolicy: "network-only",
    errorPolicy: "all",
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

    if (data?.workspace) {
      const collaboratorIds = data.workspace.collaborators.map((collaborator) => collaborator._id);
      setIsWorkspaceMember(_.includes(collaboratorIds, props.identifier) || props.identifier === data.workspace.owner);
    }
  }, [data]);

  // If avatarOnly is true, show only the avatar
  if (props.avatarOnly) {
    return (
      <Tooltip content={isWorkspaceMember ? actorLabel : "Not a member of this Workspace"} showArrow>
        <Avatar.Root
          size={props.inline ? "2xs" : props.size === "sm" ? "xs" : "sm"}
          key={actorLabel}
          colorPalette={loading || !isWorkspaceMember ? "gray" : pickPalette(actorLabel)}
        >
          <Avatar.Fallback name={loading ? "" : actorLabel} />
        </Avatar.Root>
      </Tooltip>
    );
  }

  return props.inline || props.inlineNoAvatar ? (
    <Tooltip content={"Not a member of this Workspace"} disabled={isWorkspaceMember} showArrow>
      <Flex direction={"row"} gap={"0.5"} align={"center"} w={"fit-content"}>
        {(_.isUndefined(props.inlineNoAvatar) || !props.inlineNoAvatar) && (
          <Avatar.Root
            size={"2xs"}
            key={actorLabel}
            colorPalette={loading || !isWorkspaceMember ? "gray" : pickPalette(actorLabel)}
          >
            <Avatar.Fallback name={loading ? "" : actorLabel} />
          </Avatar.Root>
        )}
        <Skeleton asChild loading={loading} w={"120px"}>
          <Badge fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"}>
            {!loading && actorLabel}
          </Badge>
        </Skeleton>
      </Flex>
    </Tooltip>
  ) : (
    <Tooltip content={"Not a member of this Workspace"} disabled={isWorkspaceMember} showArrow>
      <Flex
        direction={"row"}
        gap={"2"}
        align={"center"}
        justify={"space-around"}
        p={props.size === "sm" ? "1" : "2"}
        rounded={"md"}
        border={STYLES.border.style}
        borderColor={STYLES.border.color}
        bg={isWorkspaceMember ? "white" : "surface.card"}
        minW={"120px"}
        w={"fit-content"}
        maxW={"200px"}
        h={"52px"}
      >
        <Avatar.Root
          size={props.size === "sm" ? "xs" : "sm"}
          key={actorLabel}
          colorPalette={loading || !isWorkspaceMember ? "gray" : pickPalette(actorLabel)}
        >
          <Avatar.Fallback name={loading ? "" : actorLabel} />
        </Avatar.Root>
        <SkeletonText loading={loading} w={"100%"} noOfLines={actorOrcid !== "" ? 2 : 1} gap={"2"} asChild>
          <Flex w={"100%"} align={"left"}>
            <Flex direction={"column"} gap={"0.5"} align={"left"} w={"100%"} justify={"center"}>
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.700"} ml={"0.5"}>
                {actorLabel}
              </Text>
              {isBreakpointActive("xl", "up") && actorOrcid !== "" && (
                <Badge fontSize={"2xs"} fontWeight={"semibold"} variant={"subtle"}>
                  {actorOrcid}
                </Badge>
              )}
            </Flex>
          </Flex>
        </SkeletonText>
      </Flex>
    </Tooltip>
  );
};

export default TagActor;
