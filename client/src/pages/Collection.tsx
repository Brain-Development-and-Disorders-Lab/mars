// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  Heading,
  List,
  PageHeader,
  Paragraph,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "grommet/components";
import { Page, PageContent } from "grommet";

// Navigation
import { useParams, useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { CollectionModel } from "types";

// Custom components
import ErrorLayer from "src/components/ErrorLayer";
import Linky from "src/components/Linky";
import { Add, LinkNext, StatusDisabled } from "grommet-icons";

export const Collection = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [collectionData, setCollectionData] = useState({} as CollectionModel);

  useEffect(() => {
    const response = getData(`/collections/${id}`);

    // Handle the response from the database
    response.then((value) => {
      setCollectionData(value);

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
    <Page kind="wide" pad={{left: "small", right: "small"}}>
      <PageContent>
        {isLoaded && isError === false ? (
          <Box gap="small" margin="small">
            <Box direction="row" justify="between">
              <PageHeader
                title={'Collection "' + collectionData.name + '"'}
                parent={
                  <Anchor label="Return to Collections" href="/collections" />
                }
              />
            </Box>

            <Box direction="column" gap="small">
              {/* Metadata table */}
              <Box
                direction="column"
                align="center"
                pad="small"
                gap="small"
                background="light-2"
                round
              >
                <Heading level="3" margin="none">
                  Metadata
                </Heading>

                <Box pad="small" fill>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell scope="row" border>
                          <Heading level="4" margin="xsmall">
                            Description
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          <Paragraph>{collectionData.description}</Paragraph>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Box>

              {/* Associated Attributes */}
              {collectionData.attributes.length > 0 ? (
                <Box
                  direction="column"
                  align="center"
                  pad="small"
                  gap="small"
                  background="light-2"
                  round
                >
                  <Heading level="3" margin="none">
                    Associated Attributes
                  </Heading>
                  <List
                    primaryKey={(attribute) => {
                      return <Linky type="attributes" id={attribute._id} />
                    }}
                    secondaryKey={(attribute) => {
                      return (
                        <Box direction="row" gap="small" margin="none">
                          <Button
                            icon={<LinkNext />}
                            primary
                            label="View"
                            onClick={() => {navigate(`/attributes/${attribute}`)}}
                            reverse
                          />
                          <Button
                            icon={<StatusDisabled />}
                            primary
                            label="Remove"
                            color="red"
                            onClick={() => {navigate(`/attributes/${attribute}`)}}
                            reverse
                          />
                        </Box>
                      )
                    }}
                    data={collectionData.attributes}
                    show={4}
                    paginate
                  />
                </Box>
              ) : (
                <></>
              )}

              {/* Associated Entities */}
              {collectionData.associations.entities.length > 0 ? (
                <Box
                  direction="column"
                  pad="small"
                  gap="small"
                >
                  <Box direction="row" justify="between" fill>
                    <Heading level="3" margin="none" alignSelf="center">
                      Associated Entities
                    </Heading>
                    <Button
                      label="Add"
                      icon={<Add />}
                      primary
                      reverse
                    />
                  </Box>

                  <List
                    primaryKey={(entity) => {
                      return <Linky type="entities" id={entity} />
                    }}
                    secondaryKey={(entity) => {
                      return (
                        <Box direction="row" gap="small" margin="none">
                          <Button
                            icon={<LinkNext />}
                            primary
                            label="View"
                            onClick={() => {navigate(`/entities/${entity}`)}}
                            reverse
                          />
                          <Button
                            icon={<StatusDisabled />}
                            primary
                            label="Remove"
                            color="red"
                            onClick={() => {navigate(`/entities/${entity}`)}}
                            reverse
                          />
                        </Box>
                      )
                    }}
                    data={collectionData.associations.entities}
                    show={4}
                    paginate
                  />
                </Box>
              ) : (
                <></>
              )}
            </Box>
          </Box>
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

export default Collection;
