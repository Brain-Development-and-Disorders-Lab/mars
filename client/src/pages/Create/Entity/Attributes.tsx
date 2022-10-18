// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  Form,
  FormField,
  Heading,
  Layer,
  PageHeader,
  Select,
  Spinner,
  Tag,
  Text,
} from "grommet/components";
import { Page, PageContent } from "grommet";
import { Add, Checkmark, LinkPrevious } from "grommet-icons";

// Navigation
import { useLocation, useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { pushData } from "src/lib/database/pushData";
import { Create, AttributeModel, AttributeProps } from "types";

// Custom components
import AttributeGroup from "src/components/AttributeGroup";
import ErrorLayer from "src/components/ErrorLayer";
import Linky from "src/components/Linky";

// Consola
import consola from "consola";

export const Attributes = ({}) => {
  const navigate = useNavigate();

  // Extract state from prior page
  const { state } = useLocation();
  const {
    from,
    name,
    created,
    collections,
    description,
    owner,
    associations: { origin, products },
  } = state as Create.Entity.Associations;

  // Used to manage React components
  const [attributes, setAttributes] = useState([] as AttributeModel[]);
  const [attributeData, setAttributeData] = useState([] as AttributeModel[]);

  // Used for filtering selectable options
  const [attributeOptions, setAttributeOptions] = useState(
    [] as AttributeModel[]
  );

  // Configure state for current page
  const attributeState: Create.Entity.Attributes = {
    from: from,
    name: name,
    created: created,
    owner: owner,
    collections: collections,
    description: description,
    associations: {
      origin: origin,
      products: products,
    },
    attributes: attributes,
  };

  // Loading state and error state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [showConfirmation, setShowConfirmation] = useState(false);

  const entityData = {
    name: name,
    created: created,
    owner: owner,
    collections: collections,
    description: description,
    associations: {
      origin: origin,
      products: products,
    },
    attributes: attributeData,
  };

  useEffect(() => {
    const attributes = getData(`/attributes`);

    // Handle the response from the database
    attributes.then((value) => {
      setAttributeOptions(value);

      // Check the contents of the response
      if (value["error"] !== undefined) {
        setErrorMessage(value["error"]);
        setIsError(true);
      }

      setIsLoaded(true);
    });
    return;
  }, []);

  // Used to receive data from a Attribute component
  const dataCallback = (data: AttributeProps) => {
    setAttributeData([
      ...attributeData,
      {
        _id: data.identifier,
        name: data.name,
        description: data.description,
        type: data.type,
        parameters: data.parameters || [],
      },
    ]);
  };

  // Removal callback
  const removeCallback = (identifier: string) => {
    // We need to filter the removed attribute from the total collection
    setAttributes(
      attributes.filter((attribute) => attribute._id !== identifier)
    );
  };

  return (
    <Page kind="wide" pad={{left: "small", right: "small"}}>
      <PageContent>
        <PageHeader
          title="Create an Entity: Add attributes"
          parent={<Anchor label="Home" href="/" />}
        />
        {isLoaded && isError === false ? (
          <>
            <Box fill>
              <Form
                onChange={() => {}}
                onSubmit={() => {
                  setShowConfirmation(true);
                }}
              >
                {/* Field to create new attributes */}
                <Box
                  justify="center"
                  align="center"
                  direction="row"
                  gap="small"
                >
                  <Box>
                    <Button
                      icon={<Add />}
                      label="Create new attribute"
                      primary
                      onClick={() => {
                        // Create a unique identifier
                        const identifier = `attribute_${Math.round(
                          performance.now()
                        )}`;

                        // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
                        setAttributes([
                          ...attributes,
                          {
                            _id: identifier,
                            name: "",
                            description: "",
                            type: "physical",
                            parameters: [],
                          },
                        ]);
                      }}
                    />
                  </Box>

                  <Text>Or</Text>

                  {/* Drop-down to select existing attributes */}
                  <FormField
                    label="Add existing attribute"
                    name="existing"
                    info="Search for and add an existing attribute."
                  >
                    <Select
                      options={attributeOptions.map((attribute) => {
                        return { name: attribute.name, id: attribute._id };
                      })}
                      labelKey="name"
                      onChange={({ option }) => {
                        // We need to get the existing attribute and insert it here
                        getData(`/attributes/${option.id}`).then(
                          (value: AttributeModel) => {
                            setAttributes([
                              ...attributes,
                              {
                                _id: option.id,
                                name: value.name,
                                description: value.description,
                                type: value.type,
                                parameters: value.parameters,
                              },
                            ]);
                          }
                        );
                      }}
                      searchPlaceholder="Search..."
                      onSearch={(query) => {
                        const escapedText = query.replace(
                          /[-\\^$*+?.()|[\]{}]/g,
                          "\\$&"
                        );
                        const exp = new RegExp(escapedText, "i");
                        setAttributeOptions(
                          attributes.filter((attribute) =>
                            exp.test(attribute.name)
                          )
                        );
                      }}
                    />
                  </FormField>
                </Box>

                {/* Display all existing attributes */}
                <Box direction="column" gap="small" margin="small">
                  <AttributeGroup
                    attributes={attributes}
                    onRemove={removeCallback}
                    onDataUpdate={dataCallback}
                  />
                </Box>

                {/* Action buttons */}
                <Box
                  direction="row"
                  flex={false}
                  justify="between"
                  margin="medium"
                >
                  <Button label="Cancel" />
                  <Button
                    label="Back"
                    icon={<LinkPrevious />}
                    onClick={() => {
                      attributeState.from = "attributes";
                      navigate("/create/entity/associations", {
                        state: attributeState,
                      });
                    }}
                  />
                  <Button
                    type="submit"
                    label="Finish"
                    icon={<Checkmark />}
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

        {showConfirmation && (
          <Layer>
            <Box
              width="large"
              direction="column"
              gap="small"
              margin="small"
              pad="medium"
              align="center"
            >
              <Heading level="3" margin={{ top: "small" }}>
                Entity Summary
              </Heading>
              <Box direction="row" gap="small">
                <Box
                  direction="column"
                  gap="small"
                  pad="medium"
                  width={{ max: "medium" }}
                >
                  <Text>
                    <b>Identifier:</b> {name}
                  </Text>
                  <Text>
                    <b>Created:</b> {new Date(created).toDateString()}
                  </Text>
                  <Text truncate="tip">
                    <b>Description:</b> {description}
                  </Text>
                </Box>
                <Box direction="column" gap="medium">
                  {collections.length > 0 && (
                    <Text>
                      <b>Collections:</b>{" "}
                      {collections.map((collection) => {
                        return (
                          <Linky
                            key={`_${collection.id}`}
                            type="collections"
                            id={collection.id}
                          />
                        );
                      })}
                    </Text>
                  )}
                  {origin.name !== "" && (
                    <Text>
                      <b>Origin Entity:</b>{" "}
                      <Linky type="entities" id={origin.id} />
                    </Text>
                  )}
                  {products.length > 0 && (
                    <Text>
                      <b>Product Entities:</b>{" "}
                      {products.map((product) => {
                        return (
                          <Linky
                            key={product.id}
                            type="entities"
                            id={product.id}
                          />
                        );
                      })}
                    </Text>
                  )}
                  {attributeData.length > 0 && (
                    <Text>
                      <b>Attributes:</b>{" "}
                      {attributeData.map((attribute) => {
                        return (
                          <>
                            <Tag
                              key={`tag_${attribute._id}}`}
                              name={attribute.name}
                              value={attribute.name}
                            />
                          </>
                        );
                      })}
                    </Text>
                  )}
                </Box>
              </Box>

              <Box direction="row" justify="between" margin="medium">
                <Button
                  label="Back"
                  icon={<LinkPrevious />}
                  onClick={() =>
                    navigate("/create/entity/associations", {
                      state: attributeState,
                    })
                  }
                />

                <Button
                  type="submit"
                  label="Confirm"
                  icon={<Checkmark />}
                  reverse
                  primary
                  onClick={() => {
                    // Create new attribute
                    consola.info("Submitting data:", entityData);

                    // Push the data and attribute
                    pushData(`/entities/add`, entityData).then(() =>
                      navigate("/entities")
                    );
                  }}
                />
              </Box>
            </Box>
          </Layer>
        )}
      </PageContent>
    </Page>
  );
};
export default Attributes;
