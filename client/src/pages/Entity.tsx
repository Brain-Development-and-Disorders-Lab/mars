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

// Consola
import consola from "consola";

// Database and models
import { getData } from "src/lib/database/getData";
import { AttributeStruct, EntityModel } from "types";

// Custom components
import Graph from "src/components/Graph";
import ErrorLayer from "src/components/ErrorLayer";
import Linky from "src/components/Linky";
import AttributeCard from "src/components/AttributeCard";
import { postData } from "src/lib/database/postData";

export const Entity = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [entityData, setEntityData] = useState({} as EntityModel);

  const [showGraph, setShowGraph] = useState(false);

  // Break up entity data into editable fields
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [collections, setCollections] = useState([] as string[]);
  const [products, setProducts] = useState([] as { name: string; id: string }[]);
  const [attributes, setAttributes] = useState([] as AttributeStruct[]);

  // Toggle editing status
  const handleEditClick = () => {
    if (editing) {
      // Collate data for updating
      const updateData: EntityModel = {
        _id: entityData._id,
        name: entityData.name,
        created: entityData.created,
        owner: entityData.owner,
        description: description,
        collections: collections,
        associations: {
          origin: entityData.associations.origin,
          products: products,
        },
        attributes: attributes,
      };

      // Update data
      postData(`/entities/update`, updateData).then(() => {
        setEditing(false);
      });
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
      if (value["error"]) {
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
      setCollections(entityData.collections);
      setProducts(entityData.associations.products);
      setAttributes(entityData.attributes);
    }
  }, [isLoaded]);

  const removeProduct = (id: string) => {
    setProducts(products.filter((product) => {
      return product.id !== id;
    }));
  };

  const removeCollection = (id: string) => {
    setCollections(collections.filter((collection) => {
      return collection !== id;
    }));
  };

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
                  color="accent-4"
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

              <Table margin={{top: "small"}}>
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
                        <TextInput
                          value={description}
                          onChange={(event) => {
                            consola.debug("Updating Entity description");
                            setDescription(event.target.value);
                          }}
                        />
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
                  Collections{collections.length > 0 && " (" + collections.length + ")"}
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
              {collections.length > 0 ? (
                <List
                  primaryKey={(collection) => {
                    return <Linky type="collections" id={collection} key={`linky-collection-${collection}`}/>
                  }}
                  secondaryKey={(collection) => {
                    return (
                      <Box direction="row" gap="small" margin="none" key={`box-collection-${collection}`}>
                        {editing &&
                          <Button
                            key={`remove-${collection}`}
                            icon={<Close />}
                            color="status-critical"
                            primary
                            label="Remove"
                            onClick={() => {removeCollection(collection)}}
                            reverse
                          />
                        }
                        {!editing &&
                          <Button
                            key={`view-${collection}`}
                            icon={<LinkNext />}
                            color="accent-4"
                            primary
                            label="View"
                            onClick={() => {navigate(`/collections/${collection}`)}}
                            reverse
                          />
                        }
                      </Box>
                    )
                  }}
                  data={collections}
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
                  Products{products.length > 0 && " (" + products.length + ")"}
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
              {products.length > 0 ? (
                <List
                  primaryKey={(product) => {
                    return <Linky type="entities" id={product.id} key={`linky-product-${product.id}`}/>
                  }}
                  secondaryKey={(product) => {
                    return (
                      <Box direction="row" gap="small" margin="none" key={`box-product-${product.id}`}>
                        {editing &&
                          <Button
                            key={`remove-product-${product.id}`}
                            icon={<Close />}
                            color="status-critical"
                            primary
                            label="Remove"
                            onClick={() => {removeProduct(product.id)}}
                            reverse
                          />
                        }
                        {!editing &&
                          <Button
                            key={`view-product-${product.id}`}
                            icon={<LinkNext />}
                            color="accent-4"
                            primary
                            label="View"
                            onClick={() => {navigate(`/entities/${product.id}`)}}
                            reverse
                          />
                        }
                      </Box>
                    )
                  }}
                  data={products}
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
                  Attributes{attributes.length > 0 && " (" + attributes.length + ")"}
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
              <Box gap="small" direction="row">
                {attributes.length > 0 ? (
                  attributes.map((attribute) => {
                    return <AttributeCard data={attribute} key={`attribute-${attribute.name}`}/>;
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
