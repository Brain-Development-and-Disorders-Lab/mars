import {
  Box,
  Button,
  CheckBoxGroup,
  Form,
  FormField,
  Heading,
  Select,
  Spinner,
  Tag,
} from "grommet";
import { LinkNext, LinkPrevious } from "grommet-icons";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getData } from "src/lib/database/getData";
import ErrorLayer from "src/view/components/ErrorLayer";
import { Create, GroupModel, SampleModel } from "types";

export const Associations = ({}) => {
  const navigate = useNavigate();

  // Extract state from prior page
  const { state } = useLocation();
  const { name, created, group, description, owner } = state as Create.Start;

  // Setup state data
  const [origin, setOrigin] = useState({ name: "", id: "" });
  const [products, setProducts] = useState(
    [] as { name: string; id: string }[]
  );
  const [additionalGroups, setAdditionalGroups] = useState(
    [] as { name: string; id: string }[]
  );

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [groupData, setGroupData] = useState([] as GroupModel[]);
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
    group: group,
    groups: additionalGroups,
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

    const groups = getData(`/groups`);

    // Handle the response from the database
    groups.then((value) => {
      setGroupData(value);

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
    <>
      {isLoaded && isError === false ? (
        <>
          <Box direction="row" justify="between" align="center">
            <Heading level="2">Configure Associations for "{name}"</Heading>
          </Box>

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
                    label="Associated Groups"
                    name="groups"
                    info="Specify the groups that this new sample should be associated with. The sample will then show up underneath the specified groups."
                  >
                    <CheckBoxGroup
                      options={groupData
                        .filter((g) => {
                          return g._id !== group.id;
                        })
                        .map((group) => {
                          return { name: group.name, id: group._id };
                        })}
                      labelKey="name"
                      valueKey="id"
                      onChange={(event) => {
                        if (event) {
                          setAdditionalGroups([
                            ...additionalGroups,
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
    </>
  );
};
export default Associations;
