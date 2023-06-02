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
import Attribute from "@pages/Attribute";
import Attributes from "@pages/Attributes";
import Collection from "@pages/Collection";
import Collections from "@pages/Collections";
import Entity from "@pages/Entity";
import Entities from "@pages/Entities";

// Page type - Create
import Create from "@pages/Create";

// Page type - Unique
import Search from "@pages/Search";
import Dashboard from "@pages/Dashboard";
import Login from "@pages/Login";
import Invalid from "@pages/Invalid";

// Authentication
import { useToken } from "./authentication/useToken";

// Variables
import { DEVELOPER_MODE } from "./variables";

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
        {!token && !DEVELOPER_MODE ? (
          <Login setToken={setToken} />
        ) : (
          <Page>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/create" element={<Create />} />

              {/* Entity routes */}
              <Route path="/entities" element={<Entities />} />
              <Route path="entities">
                <Route path=":id" element={<Entity />} />
              </Route>

              {/* Collections routes */}
              <Route path="/collections" element={<Collections />} />
              <Route path="collections">
                <Route path=":id" element={<Collection />} />
              </Route>

              {/* Attributes routes */}
              <Route path="/attributes" element={<Attributes />} />
              <Route path="attributes">
                <Route path=":id" element={<Attribute />} />
              </Route>

              {/* Other routes */}
              <Route path="/search" element={<Search />} />
              <Route path="/invalid" element={<Invalid />} />
              <Route path="*" element={<Navigate to="/invalid" replace />} />
            </Routes>
          </Page>
        )}
      </ChakraProvider>
    </BrowserRouter>
  );
};

export default App;
