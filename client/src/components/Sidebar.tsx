import React from "react";
import { Box, Heading } from "grommet";
import { Notification } from 'grommet-icons';

const Sidebar = (props: any) => (
  <Box direction='row' align='center' gap='small'>
    <Heading level='3'>Notifications</Heading><Notification />
  </Box>
);

export default Sidebar;
