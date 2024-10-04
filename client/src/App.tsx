// React
import React, { ReactElement } from "react";

// Styling to be applied across the application
import "./styles/styles.css";
import "react-querybuilder/dist/query-builder.css";

import "@fontsource/roboto";

// Chakra provider component
import { ChakraProvider } from "@chakra-ui/react";

// Routing and navigation
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Utility imports
import _ from "lodash";
import consola from "consola";

// Pages
// Page type - View
import Attribute from "@pages/view/Attribute";
import Attributes from "@pages/view/Attributes";
import Project from "@pages/view/Project";
import Projects from "@pages/view/Projects";
import Entity from "@pages/view/Entity";
import Entities from "@pages/view/Entities";
import User from "@pages/view/User";
import Workspace from "@pages/view/Workspace";

// Page type - Create
import Create from "@pages/create/Create";
import CreateWorkspace from "@pages/create/Workspace";
import CreateAttribute from "@pages/create/Attribute";
import CreateEntity from "@pages/create/Entity";
import CreateProject from "@pages/create/Project";

// Page type - Other
import Search from "@pages/Search";
import Dashboard from "@pages/Dashboard";
import Invalid from "@pages/Invalid";
import Login from "@pages/Login";

// Providers
import { WorkspaceProvider } from "./hooks/useWorkspace";
import { AuthenticationProvider } from "./hooks/useAuthentication";

// Theme extension
import { theme } from "./styles/theme";
import { Page } from "@components/Container";

/**
 * Base App component containing the page layout and page routing components
 * @returns {ReactElement}
 */
const App = (): ReactElement => {
  if (_.isEqual(process.env.NODE_ENV, "development")) {
    consola.debug("Running client in development mode");
  }

  return (
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <AuthenticationProvider>
          <WorkspaceProvider>
            <Routes>
              <Route element={<Page />}>
                <Route path={"/"} element={<Dashboard />} />

                {/* Create routes */}
                <Route
                  path={"/create/workspace"}
                  element={<CreateWorkspace />}
                />
                <Route
                  path={"/create/attribute"}
                  element={<CreateAttribute />}
                />
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

                {/* Attributes routes */}
                <Route path={"/attributes"} element={<Attributes />} />
                <Route path={"attributes"}>
                  <Route path={":id"} element={<Attribute />} />
                </Route>

                {/* Other routes */}
                <Route path={"/profile"} element={<User />} />
                <Route path={"/search"} element={<Search />} />
                <Route path={"/invalid"} element={<Invalid />} />
                <Route
                  path={"*"}
                  element={<Navigate to={"/invalid"} replace />}
                />
              </Route>

              <Route path={"/login"} element={<Login />} />
            </Routes>
          </WorkspaceProvider>
        </AuthenticationProvider>
      </ChakraProvider>
    </BrowserRouter>
  );
};

export default App;
