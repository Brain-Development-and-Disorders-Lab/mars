import {
  Anchor,
  Box,
  Heading,
  Paragraph,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Text,
} from "grommet";

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
      {isLoaded && isError === false ? (
        <>
          <Heading level="2" margin="small">
            Sample "{sampleData.name}"
          </Heading>
          <Box width="large" margin="small">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell scope="col" border align="center">
                    <Heading level="3" margin="small">
                      Field
                    </Heading>
                  </TableCell>
                  <TableCell scope="col" border align="center">
                    <Heading level="3" margin="small">
                      Value
                    </Heading>
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell scope="row" align="right" border>
                    <Heading level="4" margin="small">
                      Created
                    </Heading>
                  </TableCell>
                  <TableCell border>
                    <Text>{new Date(sampleData.created).toDateString()}</Text>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row" align="right" border>
                    <Heading level="4" margin="small">
                      Owner
                    </Heading>
                  </TableCell>
                  <TableCell border>
                    <Text>
                      <Anchor label={sampleData.owner} color="dark-2" />
                    </Text>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row" align="right" border>
                    <Heading level="4" margin="small">
                      Description:
                    </Heading>
                  </TableCell>
                  <TableCell border>
                    <Paragraph>{sampleData.description}</Paragraph>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row" align="right" border>
                    <Heading level="4" margin="small">
                      Primary project
                    </Heading>
                  </TableCell>
                  <TableCell border>
                    <Linky
                      key={sampleData.project.id}
                      type="projects"
                      id={sampleData.project.id}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row" border align="right">
                    <Heading level="4" margin="small">
                      Associated projects
                    </Heading>
                  </TableCell>
                  <TableCell border>
                    {sampleData.projects.map((project) => {
                      return (
                        <Linky
                          key={project.id}
                          type="projects"
                          id={project.id}
                        />
                      );
                    })}
                  </TableCell>
                </TableRow>

                {sampleData.associations.origin.name !== "" && (
                  <TableRow>
                    <TableCell scope="row" border align="right">
                      <Heading level="4" margin="small">
                        Origin
                      </Heading>
                    </TableCell>
                    <TableCell border>
                      <Linky
                        key={sampleData.associations.origin.id}
                        type="samples"
                        id={sampleData.associations.origin.id}
                      />
                    </TableCell>
                  </TableRow>
                )}

                {sampleData.associations.products.length > 0 && (
                  <TableRow>
                    <TableCell scope="row" border align="right">
                      <Heading level="4" margin="small">
                        Products
                      </Heading>
                    </TableCell>
                    <TableCell border>
                      {sampleData.associations.products.map((product) => {
                        return (
                          <Linky
                            key={product.id}
                            type="samples"
                            id={product.id}
                          />
                        );
                      })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
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

export default Sample;
