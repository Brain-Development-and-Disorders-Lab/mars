// React and Grommet
import React, { useEffect, useState } from "react";
import { Box, Button, Heading, List, Main, PageHeader, Text } from "grommet/components";
import { History, LinkNext } from "grommet-icons";
import { Page, PageContent } from "grommet";

// Database and models
import { getData } from "src/lib/database/getData";
import { CollectionModel, SampleModel } from "types";

// Navigation
import { useNavigate } from "react-router-dom";

// Custom components
import ErrorLayer from "../components/ErrorLayer";

const Home = () => {
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");
  const [sampleData, setSampleData] = useState([] as SampleModel[]);
  const [collectionData, setCollectionData] = useState([] as CollectionModel[]);

  // Get all Samples
  useEffect(() => {
    const response = getData(`/samples`);

    // Handle the response from the database
    response.then((value) => {
      setSampleData(value);

      // Check the contents of the response
      if (value["error"] !== undefined) {
        setErrorMessage(value["error"]);
        setIsError(true);
      }

      setIsLoaded(true);
    });
    return;
  }, []);

  // Get all Collections
  useEffect(() => {
    const response = getData(`/collections`);

    // Handle the response from the database
    response.then((value) => {
      setCollectionData(value);

      // Check the contents of the response
      if (value["error"] !== undefined) {
        setErrorMessage(value["error"]);
        setIsError(true);
      }

      setIsLoaded(true);
    });
    return;
  }, []);

  return (
    <Page kind="wide">
      <PageContent>
        <PageHeader
          title="Dashboard"
          subtitle="Overview of the database system."
        />

        <Main direction="row" gap="medium" fill>
          <Box direction="column" basis="2/3" pad="medium">
            <Heading level="2">Samples</Heading>
            {isLoaded && sampleData.length > 0 ?
              <List
                primaryKey="name"
                secondaryKey={value => (
                  <Button
                    primary
                    label="View"
                    icon={<LinkNext />}
                    onClick={() => navigate(`/samples/${value._id}`)}
                    reverse
                  />
                )}
                data={sampleData}
                show={4}
                paginate
              />
            :
              <Text>There are no Samples to display.</Text>
            }
            <Heading level="2">Collections</Heading>
            {isLoaded && collectionData.length > 0 ?
              <List
                primaryKey="name"
                secondaryKey={value => (
                  <Button
                    primary
                    label="View"
                    icon={<LinkNext />}
                    onClick={() => navigate(`/collections/${value._id}`)}
                    reverse
                  />
                )}
                data={collectionData}
                show={4}
                paginate
              />
            :
              <Text>There are no Collections to display.</Text>
            }
          </Box>

          <Box direction="column" background="light-2" basis="1/3" pad="medium">
            <Box direction="row" align="center" gap="small">
              <Heading level="2">Recent Changes</Heading>
              <History size="medium" />
            </Box>
            <Text>9:23 AM: <b>Henry</b> updated ...</Text>
          </Box>
        </Main>

        {isError && <ErrorLayer message={errorMessage} />}
      </PageContent>
    </Page>
  );
};

export default Home;
