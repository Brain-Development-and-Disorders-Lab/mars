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
  HomeRounded,
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
      <Nav align="center" direction="row" pad={{ left: "medium" }} gap="large">
        <Anchor
          label="Dashboard"
          href="/"
          icon={<HomeRounded />}
          color="text"
          size="large"
          reverse
        />
        <Menu
          dropProps={{ align: { top: "bottom", left: "left" } }}
          label="Create"
          icon={<AddCircle />}
          dropBackground="brand"
          items={[
            { label: "Collection" },
            { label: <Anchor label="Entity" href="/create/entity/start" color="white"/> },
            { label: "Attribute" },
          ]}
          size="large"
        />
        <Menu
          dropProps={{ align: { top: "bottom", left: "left" } }}
          label="View"
          icon={<View />}
          dropBackground="brand"
          items={[
            { label: <Anchor label="Collections" href="/collections" color="white"/> },
            { label: <Anchor label="Entities" href="/entities" color="white"/> },
            { label: <Anchor label="Attributes" href="/attributes" color="white"/> },
          ]}
          size="large"
        />
      </Nav>

      <Box direction="row" align="center" pad={{ right: "medium" }}>
        <Anchor
          label="Search"
          href="/search"
          icon={<SearchIcon />}
          color="text"
          size="large"
          margin={{ right: "large" }}
        />
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
