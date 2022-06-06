// React and Grommet
import React from "react";
import { Box, Heading, Main, Paragraph } from "grommet/components";
import { History } from "grommet-icons";

const Home = () => {
  return (
    <Main margin="small">
      <Heading level="1">Dashboard</Heading>
      <Heading level="2">Samples</Heading>
      <Paragraph>...</Paragraph>
      <Heading level="2">Collections</Heading>
      <Paragraph>...</Paragraph>
      <Box direction="row" align="center" gap="small">
        <Heading level="2">Recent Changes</Heading>
        <History size="medium" />
      </Box>
    </Main>
  );
};

export default Home;
