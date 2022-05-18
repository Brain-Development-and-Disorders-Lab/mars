import React from "react";
import { Box, Heading } from "grommet";
import { SettingsOption } from "grommet-icons";

const Sidebar = () => (
  <Box direction="row" align="center" gap="small">
    <Heading level="3">Settings</Heading>
    <SettingsOption />
  </Box>
);

export default Sidebar;
