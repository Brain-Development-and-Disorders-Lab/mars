import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import Navigation from "@components/Navigation";

import "./styles/styles.css";
import "@fontsource/roboto";

// Custom pages
import Attribute from "@pages/View/Attribute";
import Attributes from "@pages/View/Attributes";
import Collection from "@pages/View/Collection";
import Collections from "@pages/View/Collections";
import Search from "@pages/Search";
import Entity from "@pages/View/Entity";
import Entities from "@pages/View/Entities";
import {Start as EntityStart} from "@pages/Create/Entity";
import {Start as CollectionStart} from "@pages/Create/Collection";
import {Start as AttributeStart} from "@pages/Create/Attribute";
import Home from "@pages/Home";

export const App = () => {
  return (
    <BrowserRouter>
      <ChakraProvider>
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
      </ChakraProvider>
    </BrowserRouter>
  );
};

export default App;
