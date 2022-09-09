// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  PageHeader,
  Paragraph,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "grommet/components";
import { Page, PageContent } from "grommet";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { CollectionModel } from "types";

// Custom components
import ErrorLayer from "src/view/components/ErrorLayer";

const Collections = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");
  const [collectionsData, setCollectionsData] = useState(
    [] as CollectionModel[]
  );

  useEffect(() => {
    const response = getData(`/collections`);

    // Handle the response from the database
    response.then((value) => {
      setCollectionsData(value);

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
        {isLoaded && isError === false ? (
          <>
            <PageHeader
              title="Collections"
              subtitle="View all Collections currently managed by the system."
              parent={<Anchor label="Return to Dashboard" href="/" />}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell scope="col" border="bottom" align="center">
                    Name
                  </TableCell>
                  <TableCell scope="col" border="bottom" align="center">
                    Description
                  </TableCell>
                  <TableCell scope="col" border="bottom"></TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoaded &&
                  collectionsData.map((value) => {
                    return (
                      <TableRow key={value._id}>
                        <TableCell scope="row" border="right" align="center">
                          <strong>{value.name}</strong>
                        </TableCell>
                        <TableCell border="right" align="center">
                          <Paragraph fill>{value.description}</Paragraph>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            primary
                            label="Details"
                            onClick={() => navigate(`/collections/${value._id}`)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </>
        ) : (
          <Box fill align="center" justify="center">
            <Spinner size="large" />
          </Box>
        )}
        {isError && <ErrorLayer message={errorMessage} />}
      </PageContent>
    </Page>
  );
};

export default Collections;
