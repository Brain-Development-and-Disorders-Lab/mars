// React
import React, { ReactElement, useEffect, useState } from "react";

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

// Custom components
import { Page } from "@components/Container";

// Pages
// Page type - View
import Attribute from "@pages/view/Attribute";
import Attributes from "@pages/view/Attributes";
import Project from "@pages/view/Project";
import Projects from "@pages/view/Projects";
import Entity from "@pages/view/Entity";
import Entities from "@pages/view/Entities";

// Page type - Create
import Create from "@pages/create/Create";
import CreateWorkspace from "@pages/create/Workspace";
import CreateAttribute from "@pages/create/Attribute";
import CreateEntity from "@pages/create/Entity";
import CreateProject from "@pages/create/Project";

// Page type - Other
import Search from "@pages/Search";
import Dashboard from "@pages/Dashboard";
import Login from "@pages/Login";
import Invalid from "@pages/Invalid";

// Theme extension
import { theme } from "./styles/theme";

// Workspace context component
import { WorkspaceContext } from "./Context";

// Authentication
import { useToken } from "src/authentication/useToken";
import Workspace from "@pages/view/Workspace";

/**
 * Base App component containing the page layout and page routing components
 * @returns {ReactElement}
 */
const App = (): ReactElement => {
  if (_.isEqual(process.env.NODE_ENV, "development")) {
    consola.debug("Running client in development mode");
  }

  // Setup token authentication
  const [token, _setToken] = useToken();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (_.isNull(token) || _.isEqual(token.token, "")) {
      setAuthenticated(false);
    } else {
      setAuthenticated(true);
    }
  }, [token]);

  // Setup Workspace state
  const [workspace, setWorkspace] = useState("");
  const [label, setLabel] = useState("");
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  return (
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        {!authenticated ? (
          <Login setAuthenticated={setAuthenticated} />
        ) : (
          <WorkspaceContext.Provider
            value={{
              workspace,
              setWorkspace,
              label,
              setLabel,
              workspaceLoading,
              setWorkspaceLoading,
            }}
          >
            <Page>
              <Routes>
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
                <Route path={"/search"} element={<Search />} />
                <Route path={"/invalid"} element={<Invalid />} />
                <Route
                  path={"*"}
                  element={<Navigate to={"/invalid"} replace />}
                />
              </Routes>
            </Page>
          </WorkspaceContext.Provider>
        )}
      </ChakraProvider>
    </BrowserRouter>
  );
};

export default App;
