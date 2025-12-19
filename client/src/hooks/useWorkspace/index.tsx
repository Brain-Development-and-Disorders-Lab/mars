import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Custom types
import { IResponseMessage, WorkspaceModel } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Hooks
import { useStorage } from "@hooks/useStorage";

type WorkspaceContextValue = {
  workspace: string;
  activateWorkspace: (workspace: string) => Promise<IResponseMessage>;
};
const WorkspaceContext = createContext({} as WorkspaceContextValue);

export const WorkspaceProvider = (props: { children: React.JSX.Element }) => {
  const { storage, updateStorageField } = useStorage();
  const [activeWorkspace, setActiveWorkspace] = useState(storage.workspace);

  // If the active Workspace is updated and store the identifier in the session token
  useEffect(() => {
    // Update the session token
    updateStorageField("workspace", activeWorkspace);
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
      const storedWorkspace = storage.workspace;

      if (storedWorkspace && storedWorkspace !== "") {
        // Verify the stored workspace exists
        const workspaceResponse = await getWorkspace({
          variables: { _id: storedWorkspace },
        });

        if (workspaceResponse.data?.workspace && !workspaceResponse.error) {
          // Stored workspace exists, use it
          updateStorageField("workspace", storedWorkspace);
          setActiveWorkspace(storedWorkspace);
          return {
            success: true,
            message: "Set active Workspace",
          };
        }
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
      updateStorageField("workspace", workspacesData[0]._id);
      setActiveWorkspace(workspacesData[0]._id);
    } else {
      updateStorageField("workspace", workspace);
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
