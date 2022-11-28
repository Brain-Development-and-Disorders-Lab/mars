// React and Grommet
import React from "react";
import { Grommet } from "grommet/components";

// Styling
import "./styles/styles.css";
import "@fontsource/roboto";

// Routing
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Custom components
import Navigation from "./components/Navigation";

// Custom pages
import Attribute from "./pages/Attribute";
import Attributes from "./pages/View/Attributes";
import Collection from "./pages/Collection";
import Collections from "./pages/View/Collections";
import Search from "./pages/Search";
import Entity from "./pages/Entity";
import Entities from "./pages/View/Entities";
import {Start as EntityStart} from "./pages/Create/Entity/Start";
import {Associations as EntityAssociations} from "./pages/Create/Entity/Associations";
import {Attributes as EntityAttributes} from "./pages/Create/Entity/Attributes";
import {Start as CollectionStart} from "./pages/Create/Collection/Start";
import {Start as AttributeStart} from "./pages/Create/Attribute/Start";
import Home from "./pages/Home";

import { ChakraProvider } from "@chakra-ui/react";

export const App = () => {
  return (
    <BrowserRouter>
      <ChakraProvider>
        <Grommet full>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Entity routes */}
            <Route path="/create/entity/start" element={<EntityStart />} />
            <Route path="/create/entity/associations" element={<EntityAssociations />} />
            <Route path="/create/entity/attributes" element={<EntityAttributes />} />
            <Route path="/entities" element={<Entities />} />
            <Route path="entities">
              <Route path=":id" element={<Entity />} />
            </Route>

            {/* Collections routes */}
            <Route path="/create/collection/start" element={<CollectionStart />} />
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
        </Grommet>
      </ChakraProvider>
    </BrowserRouter>
  );
};

export default App;
