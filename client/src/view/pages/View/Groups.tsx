import {
  Box,
  Button,
  Heading,
  Paragraph,
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
import ErrorLayer from "src/view/components/ErrorLayer";
import { GroupModel } from "types";

const Groups = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");
  const [groupsData, setGroupsData] = useState([] as GroupModel[]);

  useEffect(() => {
    const response = getData(`/groups`);

    // Handle the response from the database
    response.then((value) => {
      setGroupsData(value);

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
          <Heading>Groups</Heading>
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
                groupsData.map((value) => {
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
                          onClick={() => navigate(`/groups/${value._id}`)}
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

export default Groups;
