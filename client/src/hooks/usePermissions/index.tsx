import React, { createContext, useContext, useMemo } from "react";

// GraphQL
import { gql } from "@apollo/client";

// Hooks
import { useWatchQuery } from "@hooks/useWatchQuery";

// Custom types
import { UserCollatedPermissions, UserGlobalPermissions, UserWorkspacePermissions } from "@types";

// Variables
import { DEFAULT_GLOBAL_PERMISSIONS, DEFAULT_WORKSPACE_PERMISSIONS } from "@variables";

// Authentication
import { auth } from "@lib/auth";

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
  loading: boolean;
};

const PermissionsContext = createContext<PermissionsContextValue>({} as PermissionsContextValue);

export const PermissionsProvider = (props: { children: React.JSX.Element }) => {
  const { data: session } = auth.useSession();

  const { data } = useWatchQuery<{ userCollatedPermissions: UserCollatedPermissions }>(
    GET_USER_PERMISSIONS,
    {},
    1000, // Poll every second to pick up permission changes made by other users
    !session?.user, // Only poll while there's an active session
  );

  const value = useMemo<PermissionsContextValue>(() => {
    const permissions = data?.userCollatedPermissions;
    if (!permissions?.workspace || !permissions?.global) {
      return {
        workspacePermissions: DEFAULT_WORKSPACE_PERMISSIONS,
        globalPermissions: DEFAULT_GLOBAL_PERMISSIONS,
        loading: true,
      };
    }

    return {
      workspacePermissions: permissions.workspace,
      globalPermissions: permissions.global,
      loading: false,
    };
  }, [data]);

  return <PermissionsContext.Provider value={value}>{props.children}</PermissionsContext.Provider>;
};

export const usePermissions = () => {
  return useContext(PermissionsContext);
};
