import { Anchor, Box, Button, Heading, Layer, Spinner, Table, TableBody, TableCell, TableHeader, TableRow, Text } from "grommet";
import { LinkNext } from "grommet-icons";

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export const Sample = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [sampleData, setSampleData] = useState({} as {
    _id: string;
    name: string;
    created: string;
    owner: string;
    storage: {type: string};
    associations: {projects: string[], parents: string[], children: string[], data: string[]};
    parameters: string[];
  });

  let errorBody = (
    <Box margin="small" pad="small" justify="center" align="center" direction="column" gap="small">
      <Heading margin="small" color="red">Error!</Heading>
      <Text>An error has occurred.</Text>
      <Button label="Return" icon={<LinkNext />} onClick={() => navigate("/")} primary reverse />
    </Box>
  );

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(`http://localhost:8000/samples/${id}`);
  
      if (!response.ok) {
        setIsError(true);
        setIsLoaded(true);
        return;
      }
  
      const record = await response.json();
      if (!record) {
        setIsError(true);
        setIsLoaded(true);
        return;
      }

      setSampleData(record);
      setIsLoaded(true);
    }

    fetchData();
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
                    <strong>Storage medium:</strong>
                  </TableCell>
                  <TableCell>{sampleData.storage.type}</TableCell>
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
