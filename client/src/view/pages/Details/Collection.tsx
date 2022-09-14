// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Heading,
  PageHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Text,
  TextInput,
} from "grommet/components";
import { Page, PageContent } from "grommet";

// Navigation
import { useParams } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { CollectionModel } from "types";

// Custom components
import ErrorLayer from "src/view/components/ErrorLayer";
import Linky from "src/view/components/Linky";

export const Collection = () => {
  const { id } = useParams();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [collectionData, setCollectionData] = useState({} as CollectionModel);

  useEffect(() => {
    const response = getData(`/collections/${id}`);

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
  }, [id]);

  return (
    <Page kind="wide">
      <PageContent>
        {isLoaded && isError === false ? (
          <Box gap="small" margin="small">
            <Box direction="column" justify="between">
              <PageHeader
                title={"Collection \"" + collectionData.name + "\""}
                parent={<Anchor label="Return to Collections" href="/collections" />}
              />
            </Box>

            <Box direction="row" gap="small">
              {/* Metadata table */}
              <Box direction="column" align="center" background="light-2" basis="1/2" round>
                <Heading level="3" margin="small">
                  Metadata
                </Heading>

                <Box fill pad={{ left: "small", right: "small", bottom: "small" }}>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell scope="row" border>
                          <Heading level="4" margin="xsmall">
                            Description
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          <TextInput
                            value={collectionData.description}
                            disabled
                            size="medium"
                            plain
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Box>

              {/* Associated parameters */}
              <Box direction="column" align="center" background="light-2" basis="1/4" round>
                <Heading level="3" margin="small">
                  Associated parameters
                </Heading>
                <Box
                  wrap
                  round
                  direction="row"
                  justify="center"
                  align="center"
                  margin="small"
                  pad="small"
                  gap="small"
                  fill
                >
                  {collectionData.parameters.length > 0 ? (
                    collectionData.parameters.map((parameter) => {
                      return (
                        <Text>Parameter "{parameter}"</Text>
                      );
                    })
                  ) : (
                    <Text>No associated parameters specified.</Text>
                  )}
                </Box>
              </Box>

              {/* Associated Entities */}
              <Box direction="column" align="center" background="light-2" basis="1/4" round>
                <Heading level="3" margin="small">
                  Associated Entities
                </Heading>
                <Box
                  wrap
                  direction="row"
                  justify="center"
                  align="center"
                  margin="small"
                  pad="small"
                  gap="small"
                  fill
                >
                  {collectionData.associations.entities.length > 0 ? (
                    collectionData.associations.entities.map((entity) => {
                      return (
                        <Linky key={entity} type="entities" id={entity} />
                      );
                    })
                  ) : (
                    <Text>No associated Entities specified.</Text>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
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

export default Collection;