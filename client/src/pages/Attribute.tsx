// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Heading,
  PageHeader,
  Paragraph,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "grommet/components";
import { Page, PageContent } from "grommet";

// Navigation
import { useParams } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { AttributeModel } from "types";

// Custom components
import ErrorLayer from "src/components/ErrorLayer";

export const Attribute = () => {
  const { id } = useParams();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [attributeData, setAttributeData] = useState({} as AttributeModel);

  useEffect(() => {
    // Populate Attribute data
    const response = getData(`/attributes/${id}`);

    // Handle the response from the database
    response.then((value) => {
      setAttributeData(value);

      // Check the contents of the response
      if (value["error"] !== undefined) {
        setErrorMessage(value["error"]);
        setIsError(true);
      }

      setIsLoaded(true);
    });

    return;
  }, [id, isLoaded]);

  return (
    <Page kind="wide" pad={{left: "small", right: "small"}}>
      <PageContent>
        {isLoaded && isError === false ? (
          <Box gap="small" margin="small">
            <Box direction="row" justify="between">
              <PageHeader
                title={attributeData.name}
                parent={
                  <Anchor label="View all Attributes" href="/attributes" />
                }
              />
            </Box>

            <Box direction="column" gap="small">
              {/* Metadata table */}
              <Heading level="3" margin="none">
                Metadata
              </Heading>

              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row" border>
                      <Heading level="4" margin="xsmall">
                        Description
                      </Heading>
                    </TableCell>
                    <TableCell border>
                      <Paragraph>{attributeData.description}</Paragraph>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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

export default Attribute;
