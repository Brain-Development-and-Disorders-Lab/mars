// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  PageHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Text,
} from "grommet/components";
import { Page, PageContent } from "grommet";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { EntityModel } from "types";

// Custom components
import ErrorLayer from "../../components/ErrorLayer";
import Linky from "../../components/Linky";

const Entities = () => {
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");
  const [entityData, setEntityData] = useState([] as EntityModel[]);

  useEffect(() => {
    const response = getData(`/entities`);

    // Handle the response from the database
    response.then((value) => {
      setEntityData(value);

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
    <Page kind="wide">
      <PageContent>
        {isLoaded && isError === false ? (
          <>
            <PageHeader
              title="Entities"
              subtitle="View all Entities currently tracked by the system."
              parent={<Anchor label="Return to Dashboard" href="/" />}
            />
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
                    Primary Collection
                  </TableCell>
                  <TableCell scope="col" border="bottom"></TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoaded &&
                  entityData.map((entity) => {
                    return (
                      <TableRow key={entity._id}>
                        <TableCell scope="row" border="right" align="center">
                          <strong>{entity.name}</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>
                            {new Date(entity.created).toDateString()}
                          </strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>{entity.owner}</strong>
                        </TableCell>
                        <TableCell border="right" align="center">
                          {entity.collection.id !== "" ?
                            <Linky type="collections" id={entity.collection.id} />
                          :
                            <Text>No Collection</Text>
                          }
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            primary
                            label="Details"
                            onClick={() => navigate(`/entities/${entity._id}`)}
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

export default Entities;
