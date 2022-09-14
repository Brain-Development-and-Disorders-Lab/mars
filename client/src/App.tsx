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
import Start from "./pages/Create/Entity/Start";
import Collection from "./pages/Collection";
import Collections from "./pages/Collections";
import Search from "./pages/Search";
import Associations from "./pages/Create/Entity/Associations";
import Attributes from "./pages/Create/Entity/Attributes";
import Home from "./pages/Home";
import Entity from "./pages/Entity";
import Entities from "./pages/Entities";

// Theme
import { theme } from "./theme";

export const App = () => {
  return (
    <BrowserRouter>
      <Grommet theme={theme} full>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create/entity/start" element={<Start />} />
          <Route
            path="/create/entity/associations"
            element={<Associations />}
          />
          <Route path="/create/entity/attributes" element={<Attributes />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="collections">
            <Route path=":id" element={<Collection />} />
          </Route>
          <Route path="/entities" element={<Entities />} />
          <Route path="entities">
            <Route path=":id" element={<Entity />} />
          </Route>
          <Route path="/search" element={<Search />} />
        </Routes>
      </Grommet>
    </BrowserRouter>
  );
};

export default App;
