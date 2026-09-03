import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Custom types
import { IResponseMessage, WorkspaceModel } from "@types";

// Utility functions and libraries
import { ignoreAbort } from "@lib/util";

// Hooks
import { useStorage } from "@hooks/useStorage";

// Authentication
import { auth } from "@lib/auth";

// Query to retrieve all Workspaces the User has access to
const GET_WORKSPACES = gql`
  query GetWorkspaces {
    workspaces {
      _id
      owner
      name
      description
    }
  }
`;

type WorkspaceContextValue = {
  workspace: string;
  workspaces: WorkspaceModel[];
  loading: boolean;
  activateWorkspace: (workspace: string) => Promise<IResponseMessage>;
  refreshWorkspaces: () => Promise<WorkspaceModel[]>;
};
const WorkspaceContext = createContext({} as WorkspaceContextValue);

export const WorkspaceProvider = (props: { children: React.JSX.Element }) => {
  const { storage, updateStorageField } = useStorage();
  const { data: session, isPending: isSessionPending } = auth.useSession();

  // Workspace state
  const [activeWorkspace, setActiveWorkspace] = useState(storage.workspace);
  const [workspaces, setWorkspaces] = useState<WorkspaceModel[]>([]);
  const [loading, setLoading] = useState(true);

  const [getWorkspaces] = useLazyQuery<{
    workspaces: WorkspaceModel[];
  }>(GET_WORKSPACES, { fetchPolicy: "network-only" });

  /**
   * Refetch the list of Workspaces accessible to the User
   * @return {Promise<WorkspaceModel[]>}
   */
  const refreshWorkspaces = async (): Promise<WorkspaceModel[]> => {
    const result = await getWorkspaces();
    const refreshed = result.data?.workspaces ?? [];
    setWorkspaces(refreshed);
    return refreshed;
  };

  /**
   * Set the active Workspace, provided the User has access to it
   * @param {string} workspace Identifier of the Workspace to activate, or an empty string to
   * resolve the stored or first available Workspace
   * @return {Promise<IResponseMessage>}
   */
  const activateWorkspace = async (workspace: string): Promise<IResponseMessage> => {
    const accessible = await refreshWorkspaces();

    // Resolve which Workspace to activate: the requested one, the stored one, or the first available
    const target = workspace || storage.workspace;
    const resolved = accessible.find((w) => w._id === target) ?? accessible[0];

    if (!resolved) {
      return {
        success: false,
        message: "No Workspaces exist",
      };
    }

    updateStorageField("workspace", resolved._id);
    setActiveWorkspace(resolved._id);
    return {
      success: true,
      message: "Set active Workspace",
    };
  };

  // Resolve the active Workspace once the session has loaded and the profile is complete
  useEffect(() => {
    if (isSessionPending || !session?.user || session.user.completedProfile === false) return;

    activateWorkspace(storage.workspace)
      .catch(ignoreAbort)
      .finally(() => setLoading(false));
  }, [isSessionPending, session?.user?.id, session?.user?.completedProfile]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace: activeWorkspace,
      workspaces,
      loading,
      activateWorkspace,
      refreshWorkspaces,
    }),
    [activeWorkspace, workspaces, loading],
  );

  return <WorkspaceContext.Provider value={value}>{props.children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  return useContext(WorkspaceContext);
};
