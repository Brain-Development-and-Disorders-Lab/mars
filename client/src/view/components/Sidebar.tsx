// React and Grommet
import React from "react";
import { Box, Heading } from "grommet/components";
import { SettingsOption } from "grommet-icons";

const Sidebar = () => (
  <Box direction="row" align="center" gap="small">
    <Heading level="3">Settings</Heading>
    <SettingsOption />
  </Box>
);

export default Sidebar;
