// React imports
import React, { createContext } from "react";

// Custom types
type WorkspaceContextValue = {
  workspace: string;
  setWorkspace: React.Dispatch<React.SetStateAction<string>>;
  workspaceLoading: boolean;
  setWorkspaceLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export const WorkspaceContext = createContext({} as WorkspaceContextValue);
