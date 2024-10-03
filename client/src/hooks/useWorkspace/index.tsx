import React, { createContext, useContext, useMemo, useState } from "react";
import { useToken } from "src/authentication/useToken";

type WorkspaceContextValue = {
  workspace: string;
  setWorkspace: React.Dispatch<React.SetStateAction<string>>;
  // workspaceLoading: boolean;
  // setWorkspaceLoading: React.Dispatch<React.SetStateAction<boolean>>;
};
const WorkspaceContext = createContext({} as WorkspaceContextValue);

export const WorkspaceProvider = (props: { children: React.JSX.Element }) => {
  const [token] = useToken();
  const [workspace, setWorkspace] = useState(token.workspace);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace,
      setWorkspace,
    }),
    [workspace],
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
