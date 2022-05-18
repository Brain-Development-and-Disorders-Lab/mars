import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Collapsible,
  Heading,
  Grommet,
  Layer,
  ResponsiveContext,
  Avatar,
  Drop,
} from "grommet";
import {
  AddCircle,
  Catalog,
  FormClose,
  List,
  Search,
  SettingsOption,
  User,
} from "grommet-icons";

// Styling
import "./styles/styles.css";
import "@fontsource/roboto";

// Routing
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

// Custom components
import Navigation from "./view/components/Navigation";
import Sidebar from "./view/components/Sidebar";

// Custom pages
import Start from "./view/pages/Create/Start";
import Projects from "./view/pages/Projects";
import Associations from "./view/pages/Create/Associations";
import Parameters from "./view/pages/Create/Parameters";
import Home from "./view/pages/Home";

// Theme
import { theme } from "./theme";
import Sample from "./view/pages/Sample";
import Samples from "./view/pages/Samples";

export const App = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  const createRef = useRef(null);
  const [createVisible, setCreateVisible] = useState(false);

  return (
    <BrowserRouter>
      <Grommet theme={theme} full>
        <ResponsiveContext.Consumer>
          {(size) => (
            <Box fill>
              <Navigation>
                <Heading level="3" margin="none">
                  <Link to="/">🧪 SampleFlow</Link>
                </Heading>
                <Box
                  flex
                  direction="row"
                  gap="xlarge"
                  pad={{ left: "medium", right: "small", vertical: "small" }}
                >
                  <Box direction="row" gap="small">
                    <Search />
                    <Heading level="4" margin="none">
                      <Link to="#">Search</Link>
                    </Heading>
                  </Box>
                  <Box
                    direction="row"
                    gap="small"
                  >
                    <Button
                      ref={createRef}
                      onClick={() => setCreateVisible(!createVisible)}
                      plain
                    >
                      <Box
                        direction="row"
                        gap="small"
                      >
                        <AddCircle />
                        <Heading level="4" margin="none">Create</Heading>
                      </Box>
                    </Button>
                    {createRef.current && createVisible &&
                      <Drop
                        align={{ top: 'bottom', left: 'left' }}
                        target={createRef.current}
                        elevation="large"
                        margin={{ top: 'medium' }}
                        style={{ position: "absolute" }}
                      >
                        <Box background="light-2" pad="small" direction="column" gap="small">
                          <Heading level="4" margin="small">
                            <Link to="/create/start" onClick={() => setCreateVisible(false)} >Sample</Link>
                          </Heading>
                          <Heading level="4" margin="small">
                            <Link to="#" onClick={() => setCreateVisible(false)} >Project</Link>
                          </Heading>
                          <Heading level="4" margin="small">
                            <Link to="#" onClick={() => setCreateVisible(false)} >Parameter</Link>
                          </Heading>
                        </Box>
                      </Drop>
                    }
                  </Box>
                  <Box direction="row" gap="small">
                    <List />
                    <Heading level="4" margin="none">
                      <Link to="/projects">Projects</Link>
                    </Heading>
                  </Box>
                  <Box direction="row" gap="small">
                    <Catalog />
                    <Heading level="4" margin="none">
                      <Link to="/samples">Samples</Link>
                    </Heading>
                  </Box>
                </Box>
                <Button
                  icon={<SettingsOption />}
                  onClick={() => setShowSidebar(!showSidebar)}
                />
                <Avatar background="white">
                  <User color="black" />
                </Avatar>
              </Navigation>
              <Box
                direction="row"
                flex
                overflow={{ horizontal: "hidden" }}
                pad="small"
              >
                <Box flex align="left">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/create/start" element={<Start />} />
                    <Route path="/create/associations" element={<Associations />} />
                    <Route path="/create/parameters" element={<Parameters />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/samples" element={<Samples />} />
                    <Route path="samples">
                      <Route path=":id" element={<Sample />} />
                    </Route>
                  </Routes>
                </Box>
                {!showSidebar || size !== "small" ? (
                  <Collapsible direction="horizontal" open={showSidebar}>
                    <Box
                      flex
                      width="medium"
                      background="light-2"
                      elevation="small"
                      align="center"
                    >
                      <Sidebar />
                    </Box>
                  </Collapsible>
                ) : (
                  <Layer>
                    <Box
                      background="light-2"
                      tag="header"
                      justify="end"
                      align="center"
                      direction="row"
                    >
                      <Button
                        icon={<FormClose />}
                        onClick={() => setShowSidebar(false)}
                      />
                    </Box>
                    <Box
                      fill
                      background="light-2"
                      align="center"
                      justify="center"
                    >
                      <Sidebar />
                    </Box>
                  </Layer>
                )}
              </Box>
            </Box>
          )}
        </ResponsiveContext.Consumer>
      </Grommet>
    </BrowserRouter>
  );
}

export default App;
