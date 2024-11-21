// React
import React, { ReactElement } from "react";

// Styling to be applied across the application
import "./styles/styles.css";
import "react-querybuilder/dist/query-builder.css";

import "@fontsource/roboto";

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
import _ from "lodash";
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

// Page type - Create
import Create from "@pages/create/Create";
import CreateWorkspace from "@pages/create/Workspace";
import CreateTemplate from "@pages/create/Template";
import CreateEntity from "@pages/create/Entity";
import CreateProject from "@pages/create/Project";

// Page type - Other
import Search from "@pages/Search";
import Dashboard from "@pages/Dashboard";
import Invalid from "@pages/Invalid";
import Login from "@pages/Login";
import Setup from "@pages/Setup";

// Providers
import { WorkspaceProvider } from "./hooks/useWorkspace";
import { AuthenticationProvider } from "./hooks/useAuthentication";

// Theme extension
import { theme } from "./styles/theme";

/**
 * Generate and return React component of all `Provider`-type components used
 * in the application
 * @return {React.JSX.Element}
 */
const Providers = (): React.JSX.Element => {
  return (
    <ChakraProvider theme={theme}>
      <AuthenticationProvider>
        <WorkspaceProvider>
          <Outlet />
        </WorkspaceProvider>
      </AuthenticationProvider>
    </ChakraProvider>
  );
};

/**
 * Base App component containing the page layout and page routing components
 * @return {ReactElement}
 */
const App = (): ReactElement => {
  if (_.isEqual(process.env.NODE_ENV, "development")) {
    consola.debug("Running client in development mode");
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="" element={<Providers />}>
        {/* Authentication not required */}
        <Route path={"/setup"} element={<Setup />} />
        <Route path={"/login"} element={<Login />} />

        {/* Authentication required */}
        <Route element={<Page />}>
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
          <Route path={"/invalid"} element={<Invalid />} />
          <Route path={"*"} element={<Navigate to={"/invalid"} replace />} />
        </Route>
      </Route>,
    ),
  );

  return <RouterProvider router={router} />;
};

export default App;
