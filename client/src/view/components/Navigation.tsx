// React and Grommet
import React, { useState } from "react";
import {
  Anchor,
  Avatar,
  Box,
  Button,
  Header,
  Menu,
  Nav,
} from "grommet/components";
import {
  AddCircle,
  Search as SearchIcon,
  SettingsOption,
  User,
  View,
} from "grommet-icons";

const Navigation = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <Header
      background="brand"
      sticky="scrollup"
      pad="small"
    >
      <Nav align="center" direction="row">
        <Anchor
          label="Home"
          href="/"
          color="text"
          size="large"
        />
        <Anchor
          label="Search"
          href="/search"
          icon={<SearchIcon />}
          color="text"
          size="large"
          reverse
        />
        <Menu
          dropProps={{ align: { top: "bottom", left: "left" } }}
          label="Create"
          icon={<AddCircle />}
          items={[
            { label: "Collection" },
            { label: <Anchor label="Sample" href="/create/sample/start" /> },
            { label: "Attribute" },
          ]}
          size="large"
        />
        <Menu
          dropProps={{ align: { top: "bottom", left: "left" } }}
          label="View"
          icon={<View />}
          items={[
            { label: <Anchor label="Collections" href="/collections" /> },
            { label: <Anchor label="Samples" href="/samples" /> },
            { label: <Anchor label="Attributes" href="/attributes" /> },
          ]}
          size="large"
        />
      </Nav>

      <Box direction="row" align="center">
        <Button
          icon={<SettingsOption />}
          onClick={() => setShowSidebar(!showSidebar)}
        />
        <Avatar background="white">
          <User color="black" />
        </Avatar>
      </Box>
    </Header>
  );
}

export default Navigation;
