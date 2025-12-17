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

// Variables
import { SESSION_KEY } from "src/variables";

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

  // Query to check if a specific Workspace exists
  const GET_WORKSPACE = gql`
    query GetWorkspace($_id: String) {
      workspace(_id: $_id) {
        _id
        name
      }
    }
  `;
  const [getWorkspace] = useLazyQuery<{
    workspace: WorkspaceModel;
  }>(GET_WORKSPACE, {
    fetchPolicy: "network-only",
    errorPolicy: "all", // Don't throw on errors, return them in the response
  });

  const activateWorkspace = async (
    workspace: string,
  ): Promise<IResponseMessage> => {
    if (workspace === "") {
      // Check if there's a stored workspace in session
      const storedWorkspace = session.workspace;

      if (storedWorkspace && storedWorkspace !== "") {
        // Verify the stored workspace exists
        const workspaceResponse = await getWorkspace({
          variables: { _id: storedWorkspace },
        });

        if (workspaceResponse.data?.workspace && !workspaceResponse.error) {
          // Stored workspace exists, use it
          await client.clearStore();
          sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ workspace: storedWorkspace }),
          );
          setActiveWorkspace(storedWorkspace);
          return {
            success: true,
            message: "Set active Workspace",
          };
        }

        sessionStorage.removeItem(SESSION_KEY);
      }

      // Stored workspace doesn't exist or wasn't found, get all workspaces
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
          message: "No Workspaces exist",
        };
      }

      // Use the first available workspace
      await client.clearStore();
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ workspace: workspacesData[0]._id }),
      );
      setActiveWorkspace(workspacesData[0]._id);
    } else {
      await client.clearStore();
      // Write to sessionStorage synchronously before updating state to ensure authLink reads correct value
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ workspace }));
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
