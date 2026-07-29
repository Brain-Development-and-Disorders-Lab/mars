import React, { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import _ from "lodash";

// GraphQL
import { ApolloClient, gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";

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
  loading: boolean;
};

const PermissionsContext = createContext<PermissionsContextValue>({} as PermissionsContextValue);

/**
 * Store that polls User permissions outside of React's render cycle
 */
const createPermissionsStore = (client: ApolloClient) => {
  let snapshot: PermissionsContextValue = {
    workspacePermissions: DEFAULT_WORKSPACE_PERMISSIONS,
    globalPermissions: DEFAULT_GLOBAL_PERMISSIONS,
    loading: true,
  };
  const listeners = new Set<() => void>();

  const observable = client.watchQuery<{ userCollatedPermissions: UserCollatedPermissions }>({
    query: GET_USER_PERMISSIONS,
    fetchPolicy: "network-only",
    pollInterval: 1000, // Poll every second to pick up permission changes made by other users
  });

  const subscription = observable.subscribe((result) => {
    if (!result.data?.userCollatedPermissions) return;

    const data = result.data as { userCollatedPermissions: UserCollatedPermissions };
    const next: PermissionsContextValue = {
      workspacePermissions: data.userCollatedPermissions.workspace,
      globalPermissions: data.userCollatedPermissions.global,
      loading: false,
    };

    // Skip notifying subscribers entirely when nothing has actually changed
    if (_.isEqual(next, snapshot)) return;

    snapshot = next;
    listeners.forEach((listener) => listener());
  });

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          subscription.unsubscribe();
        }
      };
    },
    getSnapshot: () => snapshot,
  };
};

export const PermissionsProvider = (props: { children: React.JSX.Element }) => {
  const client = useApolloClient();
  const store = useMemo(() => createPermissionsStore(client), [client]);
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return <PermissionsContext.Provider value={value}>{props.children}</PermissionsContext.Provider>;
};

export const usePermissions = () => {
  return useContext(PermissionsContext);
};
