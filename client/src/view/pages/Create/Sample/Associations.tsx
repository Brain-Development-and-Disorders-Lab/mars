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
import { Create, CollectionModel, SampleModel } from "types";

// Custom components
import ErrorLayer from "src/view/components/ErrorLayer";

export const Associations = ({}) => {
  const navigate = useNavigate();

  // Extract state from prior page
  const { state } = useLocation();
  const { name, created, collection, description, owner } =
    state as Create.Start;

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
  const [sampleData, setSampleData] = useState([] as SampleModel[]);

  // Options for Select element drop-down menu
  const [originOptions, setOriginOptions] = useState(
    [] as { name: string; id?: string }[]
  );
  const [productOptions, setProductOptions] = useState(
    [] as { name: string; id?: string }[]
  );

  const associationState: Create.Associations = {
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
    const samples = getData(`/samples`);

    // Handle the response from the database
    samples.then((value) => {
      setSampleData(value);
      setProductOptions(
        value.map((e: SampleModel) => {
          return { name: e.name, id: e._id };
        })
      );
      setOriginOptions(
        value.map((e: SampleModel) => {
          return { name: e.name, id: e._id };
        })
      );

      // Check the contents of the response
      if (value["error"] !== undefined) {
        setErrorMessage(value["error"]);
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
    <Page kind="wide">
      <PageContent>
        <PageHeader
          title="Create a Sample: Add associations"
          parent={<Anchor label="Return to Dashboard" href="/" />}
        />
        {isLoaded && isError === false ? (
          <>
            <Box margin="small">
              <Form
                onChange={() => {}}
                onSubmit={() => {
                  navigate("/create/sample/attributes", {
                    state: associationState,
                  });
                }}
              >
                <Box direction="row">
                  <Box direction="column">
                    <FormField
                      label="Associated Collections"
                      name="collections"
                      info="Specify the collections that this new sample should be associated with. The sample will then show up underneath the specified collections."
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
                      label="Linked Origin"
                      name="origin"
                      info="If the source of this sample currently exists or did exist in this system, specify that association here by searching for the origin sample."
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
                            sampleData
                              .filter((sample) => exp.test(sample.name))
                              .map((sample) => {
                                return { name: sample.name, id: sample._id };
                              })
                          );
                        }}
                      />
                    </FormField>
                  </Box>
                  <Box direction="column">
                    <FormField
                      label="Linked Products"
                      name="products"
                      info="If this sample has any derivatives or samples that have been created from it, specify those associations here by searching for the corresponding sample."
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
                          const exp = new RegExp(escapedText, "i");
                          setProductOptions(
                            sampleData
                              .filter((sample) => exp.test(sample.name))
                              .map((sample) => {
                                return { name: sample.name, id: sample._id };
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

                <Box direction="row" flex={false} justify="between">
                  <Button label="Cancel" />
                  <Button
                    label="Back"
                    icon={<LinkPrevious />}
                    onClick={() =>
                      navigate("/create/sample/start", {
                        state: associationState,
                      })
                    }
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
export default Associations;
