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
import ErrorLayer from "../../components/ErrorLayer";
import Linky from "../../components/Linky";
import ParameterCard from "../../components/ParameterCard";

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
        <Box>
          <Heading level="2" margin="small">
            Sample "{sampleData.name}"
          </Heading>
          <Box>
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
              </TableBody>
            </Table>
          </Box>

          {sampleData.projects.length > 0 &&
            <Box>
              <Heading level="4" margin="small">
                Associated projects
              </Heading>
              <Box
                wrap
                round
                direction="row"
                justify="center"
                align="center"
                margin="small"
                pad="small"
                gap="small"
                background="light-2"
              >
                {sampleData.projects.map((project) => {
                  return (
                    <Linky
                      key={project.id}
                      type="projects"
                      id={project.id}
                    />
                  );
                })}
              </Box>
            </Box>
          }

          {sampleData.associations.products.length > 0 && (
            <Box>
              <Heading level="4" margin="small">
                Products
              </Heading>
              <Box
                wrap
                round
                direction="row"
                justify="center"
                align="center"
                margin="small"
                pad="small"
                gap="small"
                background="light-2"
              >
                {sampleData.associations.products.map((product) => {
                  return (
                    <Linky
                      key={product.id}
                      type="samples"
                      id={product.id}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {sampleData.parameters.length > 0 && (
            <Box>
              <Heading level="4" margin="small">
                Parameters
              </Heading>
              <Box
                wrap
                round
                direction="row"
                justify="center"
                align="center"
                margin="small"
                pad="small"
                gap="small"
                background="light-2"
              >
                {sampleData.parameters.map((parameter) => {
                  return (
                    <ParameterCard data={parameter} />
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
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
