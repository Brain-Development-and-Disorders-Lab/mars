import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery, useApolloClient } from "@apollo/client/react";

// Custom types
import { IResponseMessage, WorkspaceModel } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Session
import { useSession } from "@hooks/useSession";

type WorkspaceContextValue = {
  workspace: string;
  activateWorkspace: (workspace: string) => Promise<IResponseMessage>;
};
const WorkspaceContext = createContext({} as WorkspaceContextValue);

export const WorkspaceProvider = (props: { children: React.JSX.Element }) => {
  const [session, setSession] = useSession();
  const [activeWorkspace, setActiveWorkspace] = useState(session.workspace);
  const client = useApolloClient();

  // If the active Workspace is updated and store the identifier in the session token
  useEffect(() => {
    // Update the session token
    setSession({
      workspace: activeWorkspace,
    });
  }, [activeWorkspace]);

  // Query to retrieve Workspaces
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
  const [getWorkspaces, { error: workspacesError }] = useLazyQuery<{
    workspaces: WorkspaceModel[];
  }>(GET_WORKSPACES);

  const activateWorkspace = async (
    workspace: string,
  ): Promise<IResponseMessage> => {
    if (workspace === "") {
      // Option for simply activating any Workspace
      const workspacesResponse = await getWorkspaces();
      const workspacesData = workspacesResponse.data?.workspaces;

      // Check for any query errors
      if (_.isUndefined(workspacesData) || !_.isUndefined(workspacesError)) {
        return {
          success: false,
          message: "Unable to activate Workspace",
        };
      }

      // Check that the User is a member of a Workspace
      if (workspacesData.length === 0) {
        return {
          success: false,
          message: "User is not a member of any Workspaces",
        };
      }

      await client.clearStore();
      setActiveWorkspace(workspacesData[0]._id);
    } else {
      await client.clearStore();
      setActiveWorkspace(workspace);
    }

    return {
      success: true,
      message: "Set active Workspace",
    };
  };

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace: activeWorkspace,
      activateWorkspace,
    }),
    [activeWorkspace],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {props.children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  return useContext(WorkspaceContext);
};
