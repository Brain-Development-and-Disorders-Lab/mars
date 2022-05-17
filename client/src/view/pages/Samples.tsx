import { Box, Button, Heading, Spinner, Table, TableBody, TableCell, TableHeader, TableRow, Text } from "grommet";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getData } from "src/lib/database/getData";
import ErrorLayer from "../components/ErrorLayer";

const Samples = () => {
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");
  const [sampleData, setSampleData] = useState([] as SampleStruct[]);

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

  return (
    <>
    {isLoaded && isError === false ?
      <>
        <Heading>Samples</Heading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell scope="col" border="bottom">
                Name
              </TableCell>
              <TableCell scope="col" border="bottom">
                Owner
              </TableCell>
              <TableCell scope="col" border="bottom">
                Stored
              </TableCell>
              <TableCell scope="col" border="bottom">
                Last Update
              </TableCell>
              <TableCell scope="col" border="bottom"></TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoaded && sampleData.map((value) => {
              return (
                <TableRow key={value._id}>
                  <TableCell scope="row" border="right">
                    <strong>{value.name}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{value.owner}</strong>
                  </TableCell>
                  <TableCell>
                    <Text>asdf</Text>
                  </TableCell>
                  <TableCell>
                    <strong>Today</strong> at 14:17.43 by Henry
                  </TableCell>
                  <TableCell>
                    <Button primary label="View" onClick={() => navigate(`/samples/${value._id}`)}/>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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

export default Samples;
