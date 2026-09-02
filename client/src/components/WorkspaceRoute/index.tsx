// React
import React from "react";

// Existing and custom components
import Loading from "@components/Loading";

// Routing and navigation
import { Navigate, Outlet } from "react-router-dom";

// Hooks
import { useWorkspace } from "@hooks/useWorkspace";

// Route guard for private routes that require an active Workspace
const WorkspaceRoute = () => {
  const { workspace, loading } = useWorkspace();

  if (loading) return <Loading />;
  if (!workspace) return <Navigate to={"/create/workspace"} replace />;

  return <Outlet />;
};

export default WorkspaceRoute;
