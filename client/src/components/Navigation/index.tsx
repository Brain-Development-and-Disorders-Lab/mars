// React and Grommet
import React from "react";
import {
  Anchor,
  Avatar,
  Box,
  Header,
  Menu,
  Nav,
} from "grommet/components";
import {
  AddCircle,
  HomeRounded,
  Search as SearchIcon,
  User,
  View,
} from "grommet-icons";

const Navigation = () => {
  return (
    <Header background="brand" sticky="scrollup" pad="small">
      <Nav align="center" direction="row" pad={{ left: "medium" }} gap="large" margin="none">
        {/* Home */}
        <Anchor
          label="Home"
          href="/"
          icon={<HomeRounded />}
          color="text"
          size="large"
        />

        {/* Search */}
        <Anchor
          label="Search"
          href="/search"
          icon={<SearchIcon />}
          color="text"
          size="large"
        />

        {/* Create */}
        <Menu
          dropProps={{ align: { top: "bottom", left: "left" } }}
          label="Create"
          icon={<AddCircle />}
          dropBackground="brand"
          items={[
            { label: (
                <Anchor
                  label="Collection"
                  href="/create/collection/start"
                  color="white"
                />
              ),
            },
            {
              label: (
                <Anchor
                  label="Entity"
                  href="/create/entity/start"
                  color="white"
                />
              ),
            },
            { label: "Attribute" },
          ]}
          size="large"
        />

        {/* View */}
        <Menu
          dropProps={{ align: { top: "bottom", left: "left" } }}
          label="View"
          icon={<View />}
          dropBackground="brand"
          items={[
            {
              label: (
                <Anchor label="Collections" href="/collections" color="white" />
              ),
            },
            {
              label: <Anchor label="Entities" href="/entities" color="white" />,
            },
            {
              label: (
                <Anchor label="Attributes" href="/attributes" color="white" />
              ),
            },
          ]}
          size="large"
        />
      </Nav>

      {/* Avatar */}
      <Box direction="row" align="center" pad={{ right: "medium" }}>
        <Avatar background="white">
          <User color="black" />
        </Avatar>
      </Box>
    </Header>
  );
};

export default Navigation;
