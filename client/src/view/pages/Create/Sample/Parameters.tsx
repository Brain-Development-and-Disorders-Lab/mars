import {
  Box,
  Button,
  Form,
  FormField,
  Heading,
  Layer,
  Select,
  Spinner,
  Tag,
  Text,
} from "grommet";
import { Add, Checkmark, LinkPrevious } from "grommet-icons";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getData } from "src/lib/database/getData";
import { pushData } from "src/lib/database/pushData";
import ErrorLayer from "src/view/components/ErrorLayer";
import Linky from "src/view/components/Linky";

// Custom components
// import Parameter from "src/view/components/Parameter";
import ParameterGroup from "src/view/components/ParameterGroup";
import { Create, ParameterModel, ParameterProps } from "types";

export const Parameters = ({}) => {
  const navigate = useNavigate();

  // Extract state from prior page
  const { state } = useLocation();
  const {
    name,
    created,
    project,
    projects,
    description,
    owner,
    associations: { origin, products },
  } = state as Create.Associations;

  // Used to manage React components
  const [parameters, setParameters] = useState([] as ParameterModel[]);
  const [parameterData, setParameterData] = useState([] as ParameterModel[]);

  // Used for filtering selectable options
  const [parameterOptions, setParameterOptions] = useState(
    [] as ParameterModel[]
  );

  // Loading state and error state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [showConfirmation, setShowConfirmation] = useState(false);

  const sampleData = {
    name: name,
    created: created,
    owner: owner,
    project: project,
    description: description,
    projects: projects,
    associations: {
      origin: origin,
      products: products,
    },
    parameters: parameterData,
  };

  useEffect(() => {
    const parameters = getData(`/parameters`);

    // Handle the response from the database
    parameters.then((value) => {
      setParameterOptions(value);

      // Check the contents of the response
      if (value["error"] !== undefined) {
        setErrorMessage(value["error"]);
        setIsError(true);
      }

      setIsLoaded(true);
    });
    return;
  }, []);

  // Used to receive data from a Parameter component
  const dataCallback = (data: ParameterProps) => {
    setParameterData([
      ...parameterData,
      {
        _id: data.identifier,
        name: data.name,
        description: data.description,
        type: data.type,
        attributes: data.attributes || [],
      },
    ]);
  };

  // Removal callback
  const removeCallback = (identifier: string) => {
    // We need to filter the removed parameter from the total collection
    setParameters(
      parameters.filter((parameter) => parameter._id !== identifier)
    );
  };

  return (
    <>
      {isLoaded && isError === false ? (
        <>
          <Heading level="2">Apply Parameters for "{name}"</Heading>
          <Box fill>
            <Form
              onChange={() => {}}
              onSubmit={() => {
                setShowConfirmation(true);
              }}
            >
              {/* Field to create new parameters */}
              <Box justify="center" align="center" direction="row" gap="small">
                <Box>
                  <Button
                    icon={<Add />}
                    label="Create new parameter"
                    primary
                    onClick={() => {
                      // Create a unique identifier
                      const identifier = `parameter_${Math.round(
                        performance.now()
                      )}`;

                      // Create an 'empty' parameter and add the data structure to the 'parameterData' collection
                      setParameters([
                        ...parameters,
                        {
                          _id: identifier,
                          name: "",
                          description: "",
                          type: "physical",
                          attributes: [],
                        },
                      ]);
                    }}
                  />
                </Box>

                <Text>Or</Text>

                {/* Drop-down to select existing parameters */}
                <FormField
                  label="Add existing parameter"
                  name="existing"
                  info="Search for and add an existing parameter."
                >
                  <Select
                    options={parameterOptions.map((parameter) => {
                      return { name: parameter.name, id: parameter._id };
                    })}
                    labelKey="name"
                    onChange={({ option }) => {
                      // We need to get the existing parameter and insert it here
                      getData(`/parameters/${option.id}`).then(
                        (value: ParameterModel) => {
                          setParameters([
                            ...parameters,
                            {
                              _id: option.id,
                              name: value.name,
                              description: value.description,
                              type: value.type,
                              attributes: value.attributes,
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
                      setParameterOptions(
                        parameters.filter((parameter) =>
                          exp.test(parameter.name)
                        )
                      );
                    }}
                  />
                </FormField>
              </Box>

              {/* Display all existing parameters */}
              <Box direction="column" gap="small" margin="small">
                <ParameterGroup
                  parameters={parameters}
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
                  onClick={() => navigate("/create/sample/associations")}
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
              Sample Summary
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
                <Text>
                  <b>Primary project:</b>{" "}
                  <Linky key={project.id} type="projects" id={project.id} />
                </Text>
                {projects.length > 0 && (
                  <Text>
                    <b>Associated projects:</b>{" "}
                    {projects.map((project) => {
                      return (
                        <Linky
                          key={`_${project.id}`}
                          type="projects"
                          id={project.id}
                        />
                      );
                    })}
                  </Text>
                )}
                {origin.name !== "" && (
                  <Text>
                    <b>Origin sample:</b>{" "}
                    <Linky type="samples" id={origin.id} />
                  </Text>
                )}
                {products.length > 0 && (
                  <Text>
                    <b>Product samples:</b>{" "}
                    {products.map((product) => {
                      return (
                        <Linky
                          key={product.id}
                          type="samples"
                          id={product.id}
                        />
                      );
                    })}
                  </Text>
                )}
                {parameterData.length > 0 && (
                  <Text>
                    <b>Parameters:</b>{" "}
                    {parameterData.map((parameter) => {
                      return (
                        <>
                          <Tag
                            key={`tag_${parameter._id}}`}
                            name={parameter.name}
                            value={parameter.name}
                          />
                        </>
                      );
                    })}
                  </Text>
                )}
              </Box>
            </Box>

            <Box direction="row" justify="between" fill>
              <Button
                type="submit"
                label="Go Back"
                onClick={() => setShowConfirmation(false)}
              />
              <Button
                type="submit"
                label="Confirm"
                icon={<Checkmark />}
                reverse
                primary
                onClick={() => {
                  // Create new parameters
                  console.debug("Submitting data:", sampleData);

                  // Push the data and parameters
                  pushData(`/samples/add`, sampleData).then(() =>
                    navigate("/samples")
                  );
                }}
              />
            </Box>
          </Box>
        </Layer>
      )}
    </>
  );
};
export default Parameters;
