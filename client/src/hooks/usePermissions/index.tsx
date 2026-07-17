import React, { createContext, useContext, useMemo } from "react";

// GraphQL
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Custom types
import { UserAllPermissions, UserGlobalPermissions, UserWorkspacePermissions } from "@types";

// Variables
import { DEFAULT_GLOBAL_PERMISSIONS, DEFAULT_WORKSPACE_PERMISSIONS } from "@variables";

const GET_USER_PERMISSIONS = gql`
  query GetUserPermissions {
    userAllPermissions {
      workspace {
        workspaces {
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
        application {
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
  const { data } = useQuery<{ userAllPermissions: UserAllPermissions }>(GET_USER_PERMISSIONS, {
    fetchPolicy: "network-only",
  });

  const value = useMemo<PermissionsContextValue>(
    () => ({
      workspacePermissions: data?.userAllPermissions.workspace || DEFAULT_WORKSPACE_PERMISSIONS,
      globalPermissions: data?.userAllPermissions.global || DEFAULT_GLOBAL_PERMISSIONS,
    }),
    [data?.userAllPermissions],
  );

  return <PermissionsContext.Provider value={value}>{props.children}</PermissionsContext.Provider>;
};

export const usePermissions = () => {
  return useContext(PermissionsContext);
};
