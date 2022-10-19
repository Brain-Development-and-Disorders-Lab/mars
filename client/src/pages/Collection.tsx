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
import { postData } from "src/lib/database/postData";
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
  }, [id, isLoaded]);

  const onRemove = (data: { entity: string, collection: string }) => {
    postData(`/collections/remove`, data).then(() =>
      navigate(`/collections/${id}`)
    );
  }

  return (
    <Page kind="wide" pad={{left: "small", right: "small"}}>
      <PageContent>
        {isLoaded && isError === false ? (
          <Box gap="small" margin="small">
            <Box direction="row" justify="between">
              <PageHeader
                title={collectionData.name}
                parent={
                  <Anchor label="View all Collections" href="/collections" />
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

              {/* Associated Entities */}
              <Box
                direction="column"
                pad="small"
                gap="small"
              >
                <Box direction="row" justify="between" fill>
                  <Heading level="3" margin="none" alignSelf="center">
                    Entities
                  </Heading>
                  <Button
                    label="Add"
                    icon={<Add />}
                    primary
                    reverse
                  />
                </Box>

                {collectionData.entities.length > 0 ? (
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
                            onClick={() => {
                              if (id) {
                                // Remove the entity from the collection
                                onRemove({
                                  entity: entity,
                                  collection: id,
                                });

                                // Force the page to reload by setting the isLoaded state
                                setIsLoaded(false);
                              }
                            }}
                            reverse
                          />
                        </Box>
                      )
                    }}
                    data={collectionData.entities}
                    show={4}
                    paginate
                  />
                ) : (
                  <></>
                )}
              </Box>
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
