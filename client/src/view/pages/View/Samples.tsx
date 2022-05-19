import {
  Box,
  Button,
  Heading,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "grommet";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getData } from "src/lib/database/getData";
import { SampleModel } from "types";
import ErrorLayer from "../../components/ErrorLayer";
import Linky from "../../components/Linky";

const Samples = () => {
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");
  const [sampleData, setSampleData] = useState([] as SampleModel[]);

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
      {isLoaded && isError === false ? (
        <>
          <Heading>Samples</Heading>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell scope="col" border="bottom" align="center">
                  Identifier
                </TableCell>
                <TableCell scope="col" border="bottom" align="center">
                  Created
                </TableCell>
                <TableCell scope="col" border="bottom" align="center">
                  Owner
                </TableCell>
                <TableCell scope="col" border="bottom" align="center">
                  Primary group
                </TableCell>
                <TableCell scope="col" border="bottom"></TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoaded &&
                sampleData.map((value) => {
                  return (
                    <TableRow key={value._id}>
                      <TableCell scope="row" border="right" align="center">
                        <strong>{value.name}</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>
                          {new Date(value.created).toDateString()}
                        </strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>{value.owner}</strong>
                      </TableCell>
                      <TableCell border="right" align="center">
                        <Linky type="groups" id={value.group.id} />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          primary
                          label="Details"
                          onClick={() => navigate(`/samples/${value._id}`)}
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
    </>
  );
};

export default Samples;
