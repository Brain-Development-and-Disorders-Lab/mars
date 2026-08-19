// React
import React, { ReactElement } from "react";

// Styling to be applied across the application
import "./styles/styles.scss";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

// Chakra provider component
import { ChakraProvider } from "@chakra-ui/react";

// Custom components
import { Page } from "@components/Container";

// Routing and navigation
import {
  Route,
  Navigate,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Outlet,
} from "react-router-dom";

// Utility imports
import consola from "consola";

// Pages
// Page type - View
import Template from "@pages/view/Template";
import Templates from "@pages/view/Templates";
import Project from "@pages/view/Project";
import Projects from "@pages/view/Projects";
import Entity from "@pages/view/Entity";
import Entities from "@pages/view/Entities";
import User from "@pages/view/User";
import Workspace from "@pages/view/Workspace";
import Activity from "@pages/view/Activity";

// Page type - Create
import Create from "@pages/create/Create";
import CreateWorkspace from "@pages/create/Workspace";
import CreateTemplate from "@pages/create/Template";
import CreateEntity from "@pages/create/Entity";
import CreateProject from "@pages/create/Project";

// Page type - Other
import Search from "@pages/Search";
import Dashboard from "@pages/Dashboard";
import Admin from "@pages/account/Admin";
import Invalid from "@pages/Invalid";
import Unauthorized from "@pages/Unauthorized";
import Login from "@pages/account/Login";
import Signup from "@pages/account/Signup";
import ForgotPassword from "@pages/account/ForgotPassword";
import ResetPassword from "@pages/account/ResetPassword";

// Page type - Public
import { Dashboard as PublicDashboard } from "@pages/public/Dashboard";
import { Entities as PublicEntities } from "@pages/public/view/Entities";
import { Entity as PublicEntity } from "@pages/public/view/Entity";
import { Projects as PublicProjects } from "@pages/public/view/Projects";
import { Project as PublicProject } from "@pages/public/view/Project";

// Providers
import { WorkspaceProvider } from "@hooks/useWorkspace";
import { PermissionsProvider } from "@hooks/usePermissions";

// Theme extension
import { theme } from "./styles/theme";

/**
 * Generate and return React component of all `Provider`-type components used
 * in the application
 * @return {React.JSX.Element}
 */
const Providers = (): React.JSX.Element => {
  return (
    <ChakraProvider value={theme}>
      <WorkspaceProvider>
        <PermissionsProvider>
          <Outlet />
        </PermissionsProvider>
      </WorkspaceProvider>
    </ChakraProvider>
  );
};

/**
 * Base App component containing the page layout and page routing components
 * @return {ReactElement}
 */
const App = (): ReactElement => {
  if (import.meta.env.DEV) {
    consola.debug("Running client in development mode");
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="" element={<Providers />}>
        {/* Non-authenticated routes */}
        <Route path={"/signup"} element={<Signup />} />
        <Route path={"/login"} element={<Login />} />
        <Route path={"/forgot-password"} element={<ForgotPassword />} />
        <Route path={"/reset-password"} element={<ResetPassword />} />

        {/* Private routes */}
        <Route element={<Page isPublic={false} />}>
          <Route path={"/"} element={<Dashboard />} />

          {/* Create routes */}
          <Route path={"/create/workspace"} element={<CreateWorkspace />} />
          <Route path={"/create/template"} element={<CreateTemplate />} />
          <Route path={"/create/project"} element={<CreateProject />} />
          <Route path={"/create/entity"} element={<CreateEntity />} />
          <Route path={"/create"} element={<Create />} />

          {/* Workspace routes */}
          <Route path={"workspaces"}>
            <Route path={":id"} element={<Workspace />} />
          </Route>

          {/* Entity routes */}
          <Route path={"/entities"} element={<Entities />} />
          <Route path={"entities"}>
            <Route path={":id"} element={<Entity />} />
          </Route>

          {/* Projects routes */}
          <Route path={"/projects"} element={<Projects />} />
          <Route path={"projects"}>
            <Route path={":id"} element={<Project />} />
          </Route>

          {/* Templates routes */}
          <Route path={"/templates"} element={<Templates />} />
          <Route path={"templates"}>
            <Route path={":id"} element={<Template />} />
          </Route>

          {/* Other routes */}
          <Route path={"/profile"} element={<User />} />
          <Route path={"/search"} element={<Search />} />
          <Route path={"/activity"} element={<Activity />} />
          <Route path={"/admin"} element={<Admin />} />
          <Route path={"/invalid"} element={<Invalid />} />
          <Route path={"/unauthorized"} element={<Unauthorized />} />
          <Route path={"*"} element={<Navigate to={"/invalid"} replace />} />
        </Route>

        {/* Public routes */}
        <Route element={<Page isPublic={true} />}>
          <Route path={"/public/:id"} element={<PublicDashboard />} />
          <Route path={"/public/:id/entities"} element={<PublicEntities />} />
          <Route path={"/public/:id/entities/:entity"} element={<PublicEntity />} />
          <Route path={"/public/:id/projects"} element={<PublicProjects />} />
          <Route path={"/public/:id/projects/:project"} element={<PublicProject />} />
        </Route>
      </Route>,
    ),
  );

  return <RouterProvider router={router} />;
};

export default App;
