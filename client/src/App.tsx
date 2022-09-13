// React and Grommet
import React from "react";
import { Grommet } from "grommet/components";

// Styling
import "./styles/styles.css";
import "@fontsource/roboto";

// Routing
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Custom components
import Navigation from "./view/components/Navigation";

// Custom pages
import Start from "./view/pages/Create/Sample/Start";
import Collection from "./view/pages/Details/Collection";
import Collections from "./view/pages/View/Collections";
import Search from "./view/pages/Search";
import Associations from "./view/pages/Create/Sample/Associations";
import Attributes from "./view/pages/Create/Sample/Attributes";
import Home from "./view/pages/Home";
import Sample from "./view/pages/Details/Sample";
import Samples from "./view/pages/View/Samples";

// Theme
import { theme } from "./theme";

export const App = () => {

  return (
    <BrowserRouter>
      <Grommet theme={theme} full>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create/sample/start" element={<Start />} />
          <Route
            path="/create/sample/associations"
            element={<Associations />}
          />
          <Route
            path="/create/sample/attributes"
            element={<Attributes />}
          />
          <Route path="collections">
            <Route path=":id" element={<Collection />} />
          </Route>
          <Route path="/collections" element={<Collections />} />
          <Route path="samples">
            <Route path=":id" element={<Sample />} />
          </Route>
          <Route path="/samples" element={<Samples />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </Grommet>
    </BrowserRouter>
  );
};

export default App;
