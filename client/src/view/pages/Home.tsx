// React and Grommet
import React from "react";
import { Box, Heading, Main, PageHeader, Paragraph } from "grommet/components";
import { History } from "grommet-icons";
import { Page, PageContent } from "grommet";

const Home = () => {
  return (
    <Page kind="wide">
      <PageContent>
        <PageHeader
          title="Dashboard"
          subtitle="Overview of the database system."
        />
        <Main>
          <Heading level="2">Samples</Heading>
          <Paragraph>...</Paragraph>
          <Heading level="2">Collections</Heading>
          <Paragraph>...</Paragraph>
          <Box direction="row" align="center" gap="small">
            <Heading level="2">Recent Changes</Heading>
            <History size="medium" />
          </Box>
        </Main>
      </PageContent>
    </Page>
  );
};

export default Home;
