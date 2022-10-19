// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  FormField,
  Heading,
  Layer,
  List,
  PageHeader,
  Paragraph,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tag,
} from "grommet/components";
import { Page, PageContent } from "grommet";
import { Add, Close, LinkNext, StatusDisabled } from "grommet-icons";

// Navigation
import { useParams, useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { postData } from "src/lib/database/postData";
import { CollectionModel, EntityModel } from "types";

// Custom components
import ErrorLayer from "src/components/ErrorLayer";
import Linky from "src/components/Linky";

export const Collection = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [showAdd, setShowAdd] = useState(false);

  const [collectionData, setCollectionData] = useState({} as CollectionModel);
  const [entityOptions, setEntityOptions] = useState(
    [] as { name: string; id: string }[]
  );
  const [entitiesSelected, setEntitiesSelected] = useState(
    [] as { name: string; id: string }[]
  );

  useEffect(() => {
    // Populate Collection data
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

  useEffect(() => {
    // Populate Entity data
    const entities = getData(`/entities`);

    // Handle the response from the database
    entities.then((entity) => {
      setEntityOptions(entity.map((e: EntityModel) => {
        return { name: e.name, id: e._id };
      }));

      // Check the contents of the response
      if (entity["error"] !== undefined) {
        setErrorMessage(entity["error"]);
        setIsError(true);
      }

      setIsLoaded(true);
    });
    return;
  }, [id, isLoaded]);

  const onAdd = (data: { entities: string[], collection: string }) => {
    postData(`/collections/add`, data).then(() => {
      navigate(`/collections/${id}`);
    });
  };

  /**
   * Callback function to remove the Entity from the Collection, and refresh the page
   * @param data ID of the Entity and Collection to remove the Entity from
   */
  const onRemove = (data: { entity: string, collection: string }) => {
    postData(`/collections/remove`, data).then(() => {
      navigate(`/collections/${id}`);
    });
  };

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
                    onClick={() => {
                      setShowAdd(!showAdd);
                    }}
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

            {showAdd && (
              <Layer
                onEsc={() => setShowAdd(false)}
                onClickOutside={() => setShowAdd(false)}
              >
                <Box direction="row" justify="between" margin={{ right: "small" }}>
                  <Heading level="2" margin="small">
                    Add Entities
                  </Heading>
                  <Button
                    icon={<Close />}
                    onClick={() => setShowAdd(false)}
                    plain
                  />
                </Box>
                <Box direction="column" margin="small">
                  <FormField
                    name="add"
                    info="Add existing Entities to the Collection."
                  >
                    <Select
                      options={entityOptions}
                      labelKey="name"
                      value={entitiesSelected}
                      valueKey="name"
                      onChange={({ value }) => {
                        if (!entitiesSelected.includes(value)) {
                          setEntitiesSelected([...entitiesSelected, value]);
                        }
                      }}
                      searchPlaceholder="Search..."
                      onSearch={(query) => {
                        const escapedText = query.replace(
                          /[-\\^$*+?.()|[\]{}]/g,
                          "\\$&"
                        );
                        const filteredText = new RegExp(escapedText, "i");
                        setEntityOptions(
                          entityOptions
                            .filter((entity) => filteredText.test(entity.name))
                            .map((entity) => {
                              return { name: entity.name, id: entity.id };
                            })
                        );
                      }}
                    />
                  </FormField>
                  <Box direction="column" gap="xsmall">
                    {entitiesSelected.map((entity) => {
                      return (
                        <Tag
                          name="Entity"
                          value={entity.name}
                          key={entity.name}
                          onRemove={() => {
                            setEntitiesSelected(
                              entitiesSelected.filter((item) => {
                                return item !== entity;
                              })
                            );
                          }}
                        />
                      );
                    })}
                  </Box>
                  <Button
                    label="Done"
                    onClick={() => {
                      if (id) {
                        // Add the Entities to the Collection
                        onAdd({
                          entities: entitiesSelected.map((entity) => entity.id),
                          collection: id,
                        });

                        setEntitiesSelected([]);
                        setShowAdd(false);

                        // Force the page to reload by setting the isLoaded state
                        setIsLoaded(false);
                      }
                    }}
                  />
                </Box>
              </Layer>
            )}
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
