import { Anchor, Box, Button, Heading, Layer, Spinner, Table, TableBody, TableCell, TableHeader, TableRow, Text } from "grommet";
import { LinkNext } from "grommet-icons";

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getData } from "src/lib/database/getData";

export const Sample = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [sampleData, setSampleData] = useState({} as SampleStruct);

  let errorBody = (
    <Box margin="small" pad="small" justify="center" align="center" direction="column" gap="small">
      <Heading margin="small" color="red">Error!</Heading>
      <Text><b>Message:</b> {errorMessage}</Text>
      <Button label="Return" icon={<LinkNext />} onClick={() => navigate("/")} primary reverse />
    </Box>
  );

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
        <Layer>
          {errorBody}
        </Layer>
      }
    </>
  );
}

export default Sample;
