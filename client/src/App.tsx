// React and React Router
import React, { ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Chakra UI provider component
import { ChakraProvider } from "@chakra-ui/react";

// Styling to be applied across the application
import "./styles/styles.css";
import "@fontsource/roboto";

// Custom components
import { PageContainer } from "@components/PageContainer";

// Pages
// Page type - View
import Attribute from "@pages/View/Attribute";
import Attributes from "@pages/View/Attributes";
import Collection from "@pages/View/Collection";
import Collections from "@pages/View/Collections";
import Entity from "@pages/View/Entity";
import Entities from "@pages/View/Entities";

// Page type - Create
import { Start as EntityStart } from "@pages/Create/Entity";
import { Start as CollectionStart } from "@pages/Create/Collection";
import { Start as AttributeStart } from "@pages/Create/Attribute";

// Page type - Unique
import Search from "@pages/Search";
import Dashboard from "@pages/Dashboard";
import Login from "@pages/Login";
import Invalid from "@pages/Invalid";

// Authentication
import { useToken } from "./authentication/useToken";

// Variables
import { DEVELOPER_MODE } from "./variables";

/**
 *
 * @return {ReactElement}
 */
export const App = (): ReactElement => {
  // Authentication token
  const [ token, setToken ] = useToken();

  return (
    <BrowserRouter>
      <ChakraProvider>
        <PageContainer>
          {!token && !DEVELOPER_MODE ? (
            <Login setToken={setToken} />
          ) : (
            <>
              <Routes>
                <Route path="/" element={<Dashboard />} />

                {/* Entity routes */}
                <Route path="/create/entity/start" element={<EntityStart />} />
                <Route path="/entities" element={<Entities />} />
                <Route path="entities">
                  <Route path=":id" element={<Entity />} />
                </Route>

                {/* Collections routes */}
                <Route
                  path="/create/collection/start"
                  element={<CollectionStart />}
                />
                <Route path="/collections" element={<Collections />} />
                <Route path="collections">
                  <Route path=":id" element={<Collection />} />
                </Route>

                {/* Attributes routes */}
                <Route path="/create/attribute/start" element={<AttributeStart />} />
                <Route path="/attributes" element={<Attributes />} />
                <Route path="attributes">
                  <Route path=":id" element={<Attribute />} />
                </Route>

                {/* Other routes */}
                <Route path="/search" element={<Search />} />
                <Route path="/invalid" element={<Invalid />} />
                <Route path="*" element={<Navigate to="/invalid" replace />} />
              </Routes>
            </>
          )}
        </PageContainer>
      </ChakraProvider>
    </BrowserRouter>
  );
};

export default App;
