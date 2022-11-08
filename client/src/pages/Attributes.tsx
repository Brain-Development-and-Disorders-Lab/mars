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
import { getData } from "src/lib/database/getData";
import { AttributeModel } from "types";

// Custom components
import ErrorLayer from "src/components/ErrorLayer";

const Attributes = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");
  const [attributesData, setAttributesData] = useState(
    [] as AttributeModel[]
  );

  useEffect(() => {
    const response = getData(`/attributes`);

    // Handle the response from the database
    response.then((value) => {
      setAttributesData(value);

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
              title="Attributes"
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
                  attributesData.map((value) => {
                    return (
                      <TableRow key={value._id}>
                        <TableCell scope="row" border="right" align="center">
                          <Heading level={4} margin="none">{value.name}</Heading>
                        </TableCell>
                        <TableCell border="right" align="left">
                          <Paragraph fill>{value.description}</Paragraph>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            primary
                            color="accent-4"
                            icon={<LinkNext />}
                            label="View"
                            onClick={() =>
                              navigate(`/attributes/${value._id}`)
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

export default Attributes;
