// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  Heading,
  Layer,
  List,
  PageHeader,
  Paragraph,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Text,
  TextInput,
} from "grommet/components";
import { Page, PageContent } from "grommet";
import { Add, Close, LinkNext } from "grommet-icons";

// Navigation
import { useParams, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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
    <Page kind="wide" pad={{left: "small", right: "small"}}>
      <PageContent>
        {isLoaded && isError === false ? (
          <Box gap="small" margin="small">
            <Box direction="column" justify="between">
              <PageHeader
                title={entityData.name}
                parent={<Anchor label="View all Entities" href="/entities" />}
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

            {/* Metadata table */}
            <Box pad="small">
              <Heading level="3" margin="none">
                Metadata
              </Heading>

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
                      </Box>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell scope="row" border>
                      <Heading level="4" margin="xsmall">
                        Description
                      </Heading>
                    </TableCell>
                    <TableCell border>
                      {editing ? (
                        <TextInput value={description} />
                      ) : (
                        <Paragraph>{description}</Paragraph>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            {/* Collections */}
            <Box pad="small">
              <Box direction="row" justify="between" margin={{bottom: "small"}}>
                <Heading level="3" margin="none">
                  Collections
                </Heading>
                {editing ? (
                  <Button
                    icon={<Add size="small" />}
                    label="Add"
                    primary
                    disabled={!editing}
                  />
                ) : null}
              </Box>
              {entityData.collections.length > 0 ? (
                <List
                  primaryKey={(collection) => {
                    return <Linky type="collections" id={collection} />
                  }}
                  secondaryKey={(collection) => {
                    return (
                      <Box direction="row" gap="small" margin="none">
                        <Button
                          icon={<LinkNext />}
                          primary
                          label="View"
                          onClick={() => {navigate(`/collections/${collection}`)}}
                          reverse
                        />
                      </Box>
                    )
                  }}
                  data={entityData.collections}
                  show={4}
                  paginate
                />
              ) : (
                <Text>Not present in any Collections.</Text>
              )}
            </Box>

            {/* Products */}
            <Box pad="small">
              <Box direction="row" justify="between" margin={{bottom: "small"}}>
                <Heading level="3"  margin="none">
                  Products
                </Heading>
                {editing ? (
                  <Button
                    icon={<Add size="small" />}
                    label="Add"
                    primary
                    disabled={!editing}
                  />
                ) : null}
              </Box>
              {entityData.associations.products.length > 0 ? (
                <List
                  primaryKey={(product) => {
                    return <Linky type="entities" id={product.id} />
                  }}
                  secondaryKey={(product) => {
                    return (
                      <Box direction="row" gap="small" margin="none">
                        <Button
                          icon={<LinkNext />}
                          primary
                          label="View"
                          onClick={() => {navigate(`/entity/${product}`)}}
                          reverse
                        />
                      </Box>
                    )
                  }}
                  data={entityData.associations.products}
                  show={4}
                  paginate
                />
              ) : (
                <Text>No products specified.</Text>
              )}
            </Box>

            {/* Attributes */}
            <Box pad="small">
              <Box direction="row" justify="between" margin={{bottom: "small"}}>
                <Heading level="3" margin="none">
                  Attributes
                </Heading>
                {editing ? (
                  <Button
                    icon={<Add size="small" />}
                    label="Add"
                    primary
                    disabled={!editing}
                  />
                ) : null}
              </Box>
              {entityData.attributes.length > 0 ? (
                entityData.attributes.map((attribute) => {
                  return <AttributeCard data={attribute} />;
                })
              ) : (
                <Text>No attributes specified.</Text>
              )}
            </Box>
          </Box>
        ) : (
          <Box fill align="center" justify="center">
            <Spinner size="large" />
          </Box>
        )}

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

        {isError && <ErrorLayer message={errorMessage} />}
      </PageContent>
    </Page>
  );
};

export default Entity;
