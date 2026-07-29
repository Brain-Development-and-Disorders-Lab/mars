import React, { createContext, useContext, useMemo } from "react";

// GraphQL
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Custom types
import { UserCollatedPermissions, UserGlobalPermissions, UserWorkspacePermissions } from "@types";

// Variables
import { DEFAULT_GLOBAL_PERMISSIONS, DEFAULT_WORKSPACE_PERMISSIONS } from "@variables";

const GET_USER_PERMISSIONS = gql`
  query GetUserPermissions {
    userCollatedPermissions {
      workspace {
        administration {
          edit
          invite
        }
        entities {
          create
          edit
          archive
        }
        projects {
          create
          edit
          archive
        }
        templates {
          create
          edit
          archive
        }
      }
      global {
        features {
          import
          scan
          ai
          api
        }
        workspaces {
          create
        }
      }
    }
  }
`;

type PermissionsContextValue = {
  workspacePermissions: UserWorkspacePermissions;
  globalPermissions: UserGlobalPermissions;
};

const PermissionsContext = createContext<PermissionsContextValue>({} as PermissionsContextValue);

export const PermissionsProvider = (props: { children: React.JSX.Element }) => {
  const { data } = useQuery<{ userCollatedPermissions: UserCollatedPermissions }>(GET_USER_PERMISSIONS, {
    fetchPolicy: "network-only",
    pollInterval: 1000, // Poll every seconds to pick up permission changes
  });

  const value = useMemo<PermissionsContextValue>(
    () => ({
      workspacePermissions: data?.userCollatedPermissions.workspace || DEFAULT_WORKSPACE_PERMISSIONS,
      globalPermissions: data?.userCollatedPermissions.global || DEFAULT_GLOBAL_PERMISSIONS,
    }),
    [data?.userCollatedPermissions],
  );

  return <PermissionsContext.Provider value={value}>{props.children}</PermissionsContext.Provider>;
};

export const usePermissions = () => {
  return useContext(PermissionsContext);
};
