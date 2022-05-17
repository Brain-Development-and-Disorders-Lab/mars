import { Anchor, Box, Heading, Spinner, Table, TableBody, TableCell, TableHeader, TableRow } from "grommet";

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getData } from "src/lib/database/getData";
import { SampleStruct } from "types";
import ErrorLayer from "../components/ErrorLayer";

export const Sample = () => {
  const { id } = useParams();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [sampleData, setSampleData] = useState({} as SampleStruct);

  useEffect(() => {
    const response = getData(`/samples/${id}`);

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
  }, [id]);

  return (
    <>
      {isLoaded && isError === false ?
        <>
          <Heading level="2" margin="small">Sample "{sampleData.name}"</Heading>
          <Heading level="3" margin="small">Data fields</Heading>
          <Box width="large" margin="small">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell scope="col" border="bottom">
                    Field
                  </TableCell>
                  <TableCell scope="col" border="bottom">
                    Value
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell scope="row">
                    <strong>Created:</strong>
                  </TableCell>
                  <TableCell>{sampleData.created}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <strong>Owner:</strong>
                  </TableCell>
                  <TableCell><Anchor label={sampleData.owner} color="dark-2" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <strong>Storage mediums:</strong>
                  </TableCell>
                  <TableCell>{sampleData.storage.types}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </>
      :
        <Box fill align="center" justify="center">
          <Spinner size="large"/>
        </Box>}
      {isError &&
        <ErrorLayer message={errorMessage} />
      }
    </>
  );
}

export default Sample;
