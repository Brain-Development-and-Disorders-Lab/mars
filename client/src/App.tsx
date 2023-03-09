// React and React Router
import React, { ReactElement } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Chakra UI provider component
import { ChakraProvider } from "@chakra-ui/react";

// Custom Navigation component shown as the header of each page
import Navigation from "@components/Navigation";

// Styling to be applied across the application
import "./styles/styles.css";
import "@fontsource/roboto";

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
import Home from "@pages/Home";
import { PageContainer } from "@components/PageContainer";

/**
 *
 * @return {ReactElement}
 */
export const App = (): ReactElement => {
  return (
    <BrowserRouter>
      <ChakraProvider>
        <PageContainer>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
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
          </Routes>
        </PageContainer>
      </ChakraProvider>
    </BrowserRouter>
  );
};

export default App;
