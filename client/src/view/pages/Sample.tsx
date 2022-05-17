import { Anchor, Box, Heading, Spinner, Table, TableBody, TableCell, TableHeader, TableRow } from "grommet";

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getData } from "src/lib/database/getData";
import { SampleStruct } from "types";
import ErrorLayer from "../components/ErrorLayer";
import Linky from "../components/Linky";

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
                  <TableCell>{new Date(sampleData.created).toDateString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <strong>Owner:</strong>
                  </TableCell>
                  <TableCell><Anchor label={sampleData.owner} color="dark-2" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <strong>Description:</strong>
                  </TableCell>
                  <TableCell><Anchor label={sampleData.description} color="dark-2" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <strong>Primary project:</strong>
                  </TableCell>
                  <TableCell><Linky key={sampleData.project.id} type="projects" id={sampleData.project.id} /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <strong>Associated projects:</strong>
                  </TableCell>
                  <TableCell>
                    {sampleData.projects.map((project) => {
                      return (
                        <Linky key={project.id} type="projects" id={project.id} />
                      );
                    })}
                  </TableCell>
                </TableRow>

                {sampleData.associations.origin.name !== "" &&
                  <TableRow>
                    <TableCell scope="row">
                      <strong>Origin:</strong>
                    </TableCell>
                    <TableCell><Linky key={sampleData.associations.origin.id} type="samples" id={sampleData.associations.origin.id} /></TableCell>
                  </TableRow>
                }

                {sampleData.storage.types &&
                  <TableRow>
                    <TableCell scope="row">
                      <strong>Storage:</strong>
                    </TableCell>
                    <TableCell>{sampleData.storage.types}</TableCell>
                  </TableRow>
                }

                {sampleData.associations.products.length > 0 &&
                  <TableRow>
                    <TableCell scope="row">
                      <strong>Products:</strong>
                    </TableCell>
                    <TableCell>
                      {sampleData.associations.products.map((product) => {
                        return (
                          <Linky key={product.id} type="samples" id={product.id} />
                        );
                      })}
                    </TableCell>
                  </TableRow>
                }
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
