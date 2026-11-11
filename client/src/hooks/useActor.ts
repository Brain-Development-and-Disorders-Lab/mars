// GraphQL
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Existing and custom types
import { ActorDetails, ActorRole, ActorUserQueryResult, ActorWorkspaceQueryResult, UseActorOptions } from "@types";

// Utility functions and libraries
import { getPublicWorkspaceUrl } from "@lib/util";

// User fields allowed by the public endpoint's `user` allowlist
const GET_ACTOR_USER_PUBLIC = gql`
  query GetActorUserPublic($_id: String) {
    user(_id: $_id) {
      _id
      name
      firstName
      lastName
      image
      account_orcid
    }
  }
`;

// Authenticated variant, the server withholds `email` unless the Users share a Workspace
const GET_ACTOR_USER = gql`
  query GetActorUser($_id: String) {
    user(_id: $_id) {
      _id
      name
      firstName
      lastName
      image
      account_orcid
      affiliation
      email
    }
  }
`;

// Identical for every actor in a Workspace, so it is fetched once and served from cache
const GET_ACTOR_WORKSPACE = gql`
  query GetActorWorkspace($_id: String) {
    workspace(_id: $_id) {
      _id
      owner
      collaborators {
        _id
      }
    }
  }
`;

/**
 * Resolve display details and Workspace membership for a User, sharing cached results across every caller
 * @param {UseActorOptions} options the User identifier, fallback label, and Workspace context
 * @returns {ActorDetails}
 */
export const useActor = (options: UseActorOptions): ActorDetails => {
  const hasIdentifier = !!options.identifier && options.identifier.trim() !== "";
  const context = options.isPublic ? { uri: getPublicWorkspaceUrl(options.workspace) } : undefined;

  const { data: userData, loading: userLoading } = useQuery<ActorUserQueryResult>(
    options.isPublic ? GET_ACTOR_USER_PUBLIC : GET_ACTOR_USER,
    {
      variables: { _id: options.identifier },
      context,
      skip: !hasIdentifier,
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
  );

  const { data: workspaceData, loading: workspaceLoading } = useQuery<ActorWorkspaceQueryResult>(GET_ACTOR_WORKSPACE, {
    variables: { _id: options.workspace },
    context,
    skip: !hasIdentifier || !options.workspace,
    fetchPolicy: "cache-first",
    errorPolicy: "all",
  });

  const user = userData?.user;
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const label = fullName || user?.name || options.fallback;

  // ORCiD is stored as a full URL, keep the bare ID for display
  const orcidRaw = user?.account_orcid ?? "";
  const orcid = orcidRaw.substring(orcidRaw.lastIndexOf("/") + 1);
  const orcidUrl = orcidRaw.startsWith("http") ? orcidRaw : `https://orcid.org/${orcid}`;

  const workspace = workspaceData?.workspace;
  let role: ActorRole = "none";
  if (workspace?.owner === options.identifier) {
    role = "owner";
  } else if (workspace?.collaborators?.some((collaborator) => collaborator._id === options.identifier)) {
    role = "collaborator";
  }

  return {
    identifier: options.identifier,
    label,
    affiliation: user?.affiliation ?? "",
    email: user?.email ?? "",
    image: user?.image ?? "",
    orcid,
    orcidUrl: orcid ? orcidUrl : "",
    role,
    isMember: role !== "none",
    loading: userLoading || workspaceLoading,
  };
};
