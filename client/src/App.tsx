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
  FormClose,
  Search as SearchIcon,
  SettingsOption,
  User,
  View,
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
import Start from "./view/pages/Create/Sample/Start";
import Groups from "./view/pages/View/Groups";
import Search from "./view/pages/Search";
import Associations from "./view/pages/Create/Sample/Associations";
import Attributes from "./view/pages/Create/Sample/Attributes";
import Home from "./view/pages/Home";

// Theme
import { theme } from "./theme";
import Sample from "./view/pages/Details/Sample";
import Samples from "./view/pages/View/Samples";

export const App = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  const createRef = useRef(null);
  const [createVisible, setCreateVisible] = useState(false);

  const viewRef = useRef(null);
  const [viewVisible, setViewVisible] = useState(false);

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
                    <SearchIcon />
                    <Heading level="4" margin="none">
                      <Link to="/search">Search</Link>
                    </Heading>
                  </Box>
                  <Box direction="row" gap="small">
                    <Button
                      ref={createRef}
                      onClick={() => setCreateVisible(!createVisible)}
                      plain
                    >
                      <Box direction="row" gap="small">
                        <AddCircle />
                        <Heading level="4" margin="none">
                          Create
                        </Heading>
                      </Box>
                    </Button>
                    {createRef.current && createVisible && (
                      <Drop
                        align={{ top: "bottom", left: "left" }}
                        target={createRef.current}
                        elevation="large"
                        margin={{ top: "medium" }}
                      >
                        <Box
                          background="brand"
                          pad="small"
                          direction="column"
                          gap="small"
                        >
                          <Heading level="4" margin="small">
                            <Link
                              to="#"
                              onClick={() => setCreateVisible(false)}
                            >
                              Group
                            </Link>
                          </Heading>
                          <Heading level="4" margin="small">
                            <Link
                              to="/create/sample/start"
                              onClick={() => setCreateVisible(false)}
                            >
                              Sample
                            </Link>
                          </Heading>
                          <Heading level="4" margin="small">
                            <Link
                              to="#"
                              onClick={() => setCreateVisible(false)}
                            >
                              Transform
                            </Link>
                          </Heading>
                          <Heading level="4" margin="small">
                            <Link
                              to="#"
                              onClick={() => setCreateVisible(false)}
                            >
                              Attributes
                            </Link>
                          </Heading>
                        </Box>
                      </Drop>
                    )}
                  </Box>
                  <Box direction="row" gap="small">
                    <Button
                      ref={viewRef}
                      onClick={() => setViewVisible(!viewVisible)}
                      plain
                    >
                      <Box direction="row" gap="small">
                        <View />
                        <Heading level="4" margin="none">
                          View
                        </Heading>
                      </Box>
                    </Button>
                    {viewRef.current && viewVisible && (
                      <Drop
                        align={{ top: "bottom", left: "left" }}
                        target={viewRef.current}
                        elevation="large"
                        margin={{ top: "medium" }}
                      >
                        <Box
                          background="brand"
                          pad="small"
                          direction="column"
                          gap="small"
                        >
                          <Heading level="4" margin="small">
                            <Link
                              to="/groups"
                              onClick={() => setViewVisible(false)}
                            >
                              Groups
                            </Link>
                          </Heading>
                          <Heading level="4" margin="small">
                            <Link
                              to="/samples"
                              onClick={() => setViewVisible(false)}
                            >
                              Samples
                            </Link>
                          </Heading>
                        </Box>
                      </Drop>
                    )}
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
                    <Route path="/create/sample/start" element={<Start />} />
                    <Route
                      path="/create/sample/associations"
                      element={<Associations />}
                    />
                    <Route
                      path="/create/sample/attributes"
                      element={<Attributes />}
                    />
                    <Route path="/groups" element={<Groups />} />
                    <Route path="/samples" element={<Samples />} />
                    <Route path="/search" element={<Search />} />
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
};

export default App;
