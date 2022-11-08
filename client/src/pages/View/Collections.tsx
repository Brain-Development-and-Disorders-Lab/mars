// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  Heading,
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
import { LinkNext } from "grommet-icons";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/database/functions";
import { CollectionModel } from "types";

// Custom components
import ErrorLayer from "src/components/ErrorLayer";

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
    <Page kind="wide" pad={{left: "small", right: "small"}}>
      <PageContent>
        {isLoaded && isError === false ? (
          <>
            <PageHeader
              title="Collections"
              parent={<Anchor label="Home" href="/" />}
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
                          <Heading level={4} margin="none">{value.name}</Heading>
                        </TableCell>
                        <TableCell align="left">
                          <Paragraph fill>{value.description}</Paragraph>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            color="accent-4"
                            primary
                            icon={<LinkNext />}
                            label="View"
                            onClick={() =>
                              navigate(`/collections/${value._id}`)
                            }
                            reverse
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
