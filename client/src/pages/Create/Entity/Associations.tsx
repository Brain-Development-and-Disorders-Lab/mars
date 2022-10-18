// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  CheckBoxGroup,
  Form,
  FormField,
  PageHeader,
  Select,
  Spinner,
  Tag,
} from "grommet/components";
import { Page, PageContent } from "grommet";
import { LinkNext, LinkPrevious } from "grommet-icons";

// Navigation
import { useLocation, useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { Create, CollectionModel, EntityModel } from "types";

// Custom components
import ErrorLayer from "src/components/ErrorLayer";

export const Associations = ({}) => {
  const navigate = useNavigate();

  // Extract state from prior page
  const { state } = useLocation();

  const { from, name, created, collection, description, owner } =
    state as Create.Entity.Start;

  // Setup state data
  const [origin, setOrigin] = useState({ name: "", id: "" });
  const [products, setProducts] = useState(
    [] as { name: string; id: string }[]
  );
  const [additionalCollections, setAdditionalCollections] = useState(
    [] as { name: string; id: string }[]
  );

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [collectionData, setCollectionData] = useState([] as CollectionModel[]);
  const [entityData, setEntityData] = useState([] as EntityModel[]);

  // Options for Select element drop-down menu
  const [originOptions, setOriginOptions] = useState(
    [] as { name: string; id?: string }[]
  );
  const [productOptions, setProductOptions] = useState(
    [] as { name: string; id?: string }[]
  );

  const associationState: Create.Entity.Associations = {
    from: from,
    name: name,
    created: created,
    owner: owner,
    collection: collection,
    collections: additionalCollections,
    description: description,
    associations: {
      origin: origin,
      products: products,
    },
  };

  useEffect(() => {
    const entities = getData(`/entities`);

    // Handle the response from the database
    entities.then((entity) => {
      setEntityData(entity);
      setProductOptions(
        entity.map((e: EntityModel) => {
          return { name: e.name, id: e._id };
        })
      );
      setOriginOptions(
        entity.map((e: EntityModel) => {
          return { name: e.name, id: e._id };
        })
      );

      // Check the contents of the response
      if (entity["error"] !== undefined) {
        setErrorMessage(entity["error"]);
        setIsError(true);
      }
    });

    const collections = getData(`/collections`);

    // Handle the response from the database
    collections.then((value) => {
      setCollectionData(value);

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
    <Page kind="wide" pad={{left: "small", right: "small"}}>
      <PageContent>
        <PageHeader
          title="Create an Entity: Add associations"
          parent={<Anchor label="Return to Dashboard" href="/" />}
        />
        {isLoaded && isError === false ? (
          <Box margin="small">
            <Form
              onChange={() => {}}
              onSubmit={() => {
                associationState.from = "associations";
                navigate("/create/entity/attributes", {
                  state: associationState,
                });
              }}
            >
              <Box direction="row" gap="medium">
                <Box direction="column" justify="between">
                  <FormField
                    label="Origin Entity"
                    name="origin"
                    info="If the source of this Entity currently exists or did exist in this system, specify that association here by searching for the origin Entity."
                  >
                    <Select
                      options={originOptions}
                      labelKey="name"
                      value={origin}
                      valueKey="name"
                      onChange={({ option }) => {
                        setOrigin(option);
                      }}
                      searchPlaceholder="Search..."
                      onSearch={(query) => {
                        const escapedText = query.replace(
                          /[-\\^$*+?.()|[\]{}]/g,
                          "\\$&"
                        );
                        const exp = new RegExp(escapedText, "i");
                        setOriginOptions(
                          entityData
                            .filter((entity) => exp.test(entity.name))
                            .map((entity) => {
                              return { name: entity.name, id: entity._id };
                            })
                        );
                      }}
                    />
                  </FormField>
                </Box>

                <Box direction="column">
                  <FormField
                    label="Associated Collections"
                    name="collections"
                    info="Specify the collections that this new Entity should be associated with. The Entity will then show up underneath the specified collections."
                  >
                    <CheckBoxGroup
                      options={collectionData
                        .filter((c) => {
                          return c._id !== collection.id;
                        })
                        .map((collection) => {
                          return { name: collection.name, id: collection._id };
                        })}
                      labelKey="name"
                      valueKey="id"
                      onChange={(event) => {
                        if (event) {
                          setAdditionalCollections([
                            ...additionalCollections,
                            {
                              name: (
                                event.option as { name: string; id: string }
                              ).name,
                              id: (event.option as { name: string; id: string })
                                .id,
                            },
                          ]);
                        }
                      }}
                    />
                  </FormField>

                  <FormField
                    label="Linked Products"
                    name="products"
                    info="If this Entity has any derivatives or Entities that have been created from it, specify those associations here by searching for the corresponding Entity."
                  >
                    <Select
                      options={productOptions}
                      labelKey="name"
                      value={products}
                      valueKey="name"
                      onChange={({ value }) => {
                        if (!products.includes(value)) {
                          setProducts([...products, value]);
                        }
                      }}
                      searchPlaceholder="Search..."
                      onSearch={(query) => {
                        const escapedText = query.replace(
                          /[-\\^$*+?.()|[\]{}]/g,
                          "\\$&"
                        );
                        const filteredText = new RegExp(escapedText, "i");
                        setProductOptions(
                          entityData
                            .filter((entity) => filteredText.test(entity.name))
                            .map((entity) => {
                              return { name: entity.name, id: entity._id };
                            })
                        );
                      }}
                    />
                  </FormField>
                  <Box direction="column" gap="xsmall">
                    {products.map((product) => {
                      return (
                        <Tag
                          name="Product"
                          value={product.name}
                          key={product.name}
                          onRemove={() => {
                            setProducts(
                              products.filter((item) => {
                                return item !== product;
                              })
                            );
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Box>

              <Box direction="row" justify="between" margin="medium">
                <Button label="Cancel" />
                <Button
                  label="Back"
                  icon={<LinkPrevious />}
                  onClick={() => {
                    associationState.from = "associations";
                    navigate("/create/entity/start", {
                      state: associationState,
                    });
                  }}
                />
                <Button
                  type="submit"
                  label="Continue"
                  icon={<LinkNext />}
                  reverse
                  primary
                />
              </Box>
            </Form>
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
export default Associations;
