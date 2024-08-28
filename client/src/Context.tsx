// React imports
import React, { createContext } from "react";

// Custom types
import { WorkspaceModel } from "@types";
type WorkspaceContextValue = {
  workspace: WorkspaceModel;
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceModel>>;
};

export const WorkspaceContext = createContext({} as WorkspaceContextValue);
