// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  Heading,
  Layer,
  PageHeader,
  Paragraph,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Text,
} from "grommet/components";
import { Page, PageContent } from "grommet";
import { Add, Close } from "grommet-icons";

// Navigation
import { useParams } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { EntityModel } from "types";

// Custom components
import Graph from "src/components/Graph";
import ErrorLayer from "src/components/ErrorLayer";
import Linky from "src/components/Linky";
import AttributeCard from "src/components/AttributeCard";

export const Entity = () => {
  const { id } = useParams();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [entityData, setEntityData] = useState({} as EntityModel);

  const [showGraph, setShowGraph] = useState(false);

  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState("");

  const handleEditClick = () => {
    if (editing) {
      setEditing(false);
    } else {
      setEditing(true);
    }
  };

  useEffect(() => {
    const response = getData(`/entities/${id}`);

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
  }, [id]);

  useEffect(() => {
    if (isLoaded) {
      // Update the state of editable data fields
      setDescription(entityData.description);
    }
  }, [isLoaded]);

  return (
    <Page kind="wide">
      <PageContent>
        {isLoaded && isError === false ? (
          <Box gap="small" margin="small">
            <Box direction="column" justify="between">
              <PageHeader
                title={'Entity "' + entityData.name + '"'}
                parent={<Anchor label="Return to Entities" href="/entities" />}
              />
              <Box direction="row" gap="small">
                <Button
                  label={"View Graph"}
                  primary
                  onClick={() => setShowGraph(true)}
                />
                <Button
                  label={editing ? "Save" : "Edit"}
                  primary
                  onClick={() => handleEditClick()}
                />
              </Box>
            </Box>

            <Box direction="row" gap="small">
              {/* Metadata table */}
              <Box
                direction="column"
                align="center"
                background="light-2"
                basis="1/2"
                round
              >
                <Heading level="3" margin="small">
                  Metadata
                </Heading>

                <Box
                  fill
                  pad={{ left: "small", right: "small", bottom: "small" }}
                >
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell scope="row" border>
                          <Heading level="4" margin="xsmall">
                            Created
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          <Text>
                            {new Date(entityData.created).toDateString()}
                          </Text>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell scope="row" border>
                          <Heading level="4" margin="xsmall">
                            Owner
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          <Text>
                            <Anchor label={entityData.owner} color="dark-2" />
                          </Text>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell scope="row" border>
                          <Heading level="4" margin="xsmall">
                            Description
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          <Paragraph>{description}</Paragraph>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell scope="row" border>
                          <Heading level="4" margin="xsmall">
                            Origin
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          <Box
                            direction="row"
                            gap="small"
                            align="center"
                            margin="none"
                          >
                            {entityData.associations.origin.id !== "" ? (
                              <Linky
                                key={entityData.associations.origin.id}
                                type="entities"
                                id={entityData.associations.origin.id}
                              />
                            ) : (
                              <Text>No origin specified.</Text>
                            )}
                            {editing ? (
                              <Button
                                icon={<Add size="small" />}
                                primary
                                disabled={!editing}
                              />
                            ) : null}
                          </Box>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell scope="row" border>
                          <Heading level="4" margin="xsmall">
                            Primary Collection
                          </Heading>
                        </TableCell>
                        <TableCell border>
                          {entityData.collection.id !== "" ? (
                            <Linky
                              key={entityData.collection.id}
                              type="collections"
                              id={entityData.collection.id}
                            />
                          ) : (
                            <Text>No primary Collection specified.</Text>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Box>

              {/* Associated Collections */}
              <Box
                direction="column"
                align="center"
                background="light-2"
                basis="1/4"
                round
              >
                <Heading level="3" margin="small">
                  Associated Collections
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
                  fill
                >
                  {entityData.collections.length > 0 ? (
                    entityData.collections.map((collection) => {
                      return (
                        <Linky
                          key={collection.id}
                          type="collections"
                          id={collection.id}
                        />
                      );
                    })
                  ) : (
                    <Text>No associated Collections specified.</Text>
                  )}
                </Box>
              </Box>

              {/* Products */}
              <Box
                direction="column"
                align="center"
                background="light-2"
                basis="1/4"
                round
              >
                <Heading level="3" margin="small">
                  Products
                </Heading>
                <Box
                  wrap
                  direction="row"
                  justify="center"
                  align="center"
                  margin="small"
                  pad="small"
                  gap="small"
                  fill
                >
                  {entityData.collections.length > 0 ? (
                    entityData.associations.products.map((product) => {
                      return (
                        <Linky
                          key={product.id}
                          type="entities"
                          id={product.id}
                        />
                      );
                    })
                  ) : (
                    <Text>No products specified.</Text>
                  )}
                </Box>
              </Box>
            </Box>

            <Box direction="column" align="center" background="light-2" round>
              <Heading level="3" margin="small">
                Attributes
              </Heading>
              <Box
                wrap
                round
                direction="row"
                align="center"
                justify="start"
                margin="small"
                pad="small"
                gap="small"
                background="light-2"
                fill
              >
                {entityData.attributes.length > 0 ? (
                  entityData.attributes.map((attribute) => {
                    return <AttributeCard data={attribute} />;
                  })
                ) : (
                  <Text>No attributes specified.</Text>
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
        {showGraph && (
          <Layer
            full
            onEsc={() => setShowGraph(false)}
            onClickOutside={() => setShowGraph(false)}
          >
            <Box direction="row" justify="between" margin={{ right: "small" }}>
              <Heading level="2" margin="small">
                Graph: {entityData.name}
              </Heading>
              <Button
                icon={<Close />}
                onClick={() => setShowGraph(false)}
                plain
              />
            </Box>
            <Graph id={entityData._id} />
          </Layer>
        )}
      </PageContent>
    </Page>
  );
};

export default Entity;
