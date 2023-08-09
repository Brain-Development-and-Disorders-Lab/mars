// React
import React, { ReactElement } from "react";

// Styling to be applied across the application
import "./styles/styles.css";
import "@fontsource/roboto";

// Chakra provider component
import { ChakraProvider } from "@chakra-ui/react";

// Routing and navigation
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Custom components
import { Page } from "@components/Container";

// Pages
// Page type - View
import Attribute from "@pages/view/Attribute";
import Attributes from "@pages/view/Attributes";
import Collection from "@pages/view/Collection";
import Collections from "@pages/view/Collections";
import Entity from "@pages/view/Entity";
import Entities from "@pages/view/Entities";

// Page type - Create
import Create from "@pages/create/Create";
import CreateAttribute from "@pages/create/Attribute";
import CreateEntity from "@pages/create/Entity";
import CreateCollection from "@pages/create/Collection";

// Page type - Unique
import Search from "@pages/Search";
import Settings from "@pages/Settings";
import Dashboard from "@pages/Dashboard";
import Login from "@pages/Login";
import Invalid from "@pages/Invalid";

// Authentication
import { useToken } from "./authentication/useToken";

// Theme extension
import { theme } from "./styles/theme";

/**
 * Base App component containing the page layout and page routing components
 * @return {ReactElement}
 */
const App = (): ReactElement => {
  // Authentication token
  const [token, setToken] = useToken();

  return (
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        {!token ? (
          <Login setToken={setToken} />
        ) : (
          <Page>
            <Routes>
              <Route path={"/"} element={<Dashboard />} />

              {/* Create routes */}
              <Route path={"/create/attribute"} element={<CreateAttribute />} />
              <Route
                path={"/create/collection"}
                element={<CreateCollection />}
              />
              <Route path={"/create/entity"} element={<CreateEntity />} />
              <Route path={"/create"} element={<Create />} />

              {/* Entity routes */}
              <Route path={"/entities"} element={<Entities />} />
              <Route path={"entities"}>
                <Route path={":id"} element={<Entity />} />
              </Route>

              {/* Collections routes */}
              <Route path={"/collections"} element={<Collections />} />
              <Route path={"collections"}>
                <Route path={":id"} element={<Collection />} />
              </Route>

              {/* Attributes routes */}
              <Route path={"/attributes"} element={<Attributes />} />
              <Route path={"attributes"}>
                <Route path={":id"} element={<Attribute />} />
              </Route>

              {/* Other routes */}
              <Route path={"/search"} element={<Search />} />
              <Route path={"/settings"} element={<Settings />} />
              <Route path={"/invalid"} element={<Invalid />} />
              <Route
                path={"*"}
                element={<Navigate to={"/invalid"} replace />}
              />
            </Routes>
          </Page>
        )}
      </ChakraProvider>
    </BrowserRouter>
  );
};

export default App;
