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
import Parameter from "src/view/components/Parameter";
import { Create, ParameterProps, ParameterStruct } from "types";

export const Parameters = ({}) => {
  const navigate = useNavigate();

  // Extract state from prior page
  const { state } = useLocation();
  const { name, created, project, projects, description, owner, associations: { origin, products} } = state as Create.Associations;

  const [parameters, setParameters] = useState([] as ParameterProps[]);
  const [parameterData, setParameterData] = useState([] as ParameterStruct[]);
  const [parameterOptions, setParameterOptions] = useState([] as ParameterStruct[]);

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
    storage: {},
    associations: {
      origin: origin,
      products: products,
    },
    parameters: parameters
  };

  useEffect(() => {
    const parameters = getData(`/parameters`);

    // Handle the response from the database
    parameters.then((value) => {
      setParameterData(value);
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

  return (
    <>
    {isLoaded && isError === false ?
      <>
        <Heading level="2">Apply Parameters</Heading>
        <Box fill>
        <Form
          onChange={() => {}}
          onSubmit={() => {setShowConfirmation(true)}}
        >
          <Heading level="3">Parameters</Heading>
          <Box direction="column" gap="small" margin="small">
            {parameters.length > 0 ?
              parameters.map((parameter) => {
                return (
                  <Parameter
                    key={parameter.key}
                    name={parameter.name}
                    description={parameter.description}
                    type={parameter.type}
                    attributes={parameter.attributes}
                  />
                );
              })
            :
              <Text>No parameters have been added.</Text>
            }
          </Box>

          <Box justify="center" align="center" direction="row" gap="small">
            <Box>
              <Button icon={<Add />} label="Create new parameter" primary onClick={() => {
                setParameters([
                  ...parameters,
                  {
                    key: `${parameters.length}`,
                    name: "",
                    description: "",
                    type: "data"
                  }]);
              }} />
            </Box>

            <Text>Or</Text>

            <FormField label="Add existing parameter" name="existing" info="Search for and add an existing parameter.">
              <Select
                options={parameterOptions.map((parameter) => { return { name: parameter.name, id: parameter._id }})}
                labelKey="name"
                onChange={({ option }) => {
                  // We need to get the existing parameter and insert it here
                  getData(`/parameters/${option.id}`).then((value: ParameterStruct) => {
                    setParameters([
                      ...parameters,
                      {
                        key: `${value._id}_${parameters.length}`,
                        name: value.name,
                        description: value.description,
                        type: value.type,
                        attributes: value.attributes,
                      }
                    ])
                  })
                }}
                searchPlaceholder="Search..."
                onSearch={(query) => {
                  const escapedText = query.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
                  const exp = new RegExp(escapedText, 'i');
                  setParameterOptions(parameterData.filter((parameter) => exp.test(parameter.name)));
                }}
              />
            </FormField>
          </Box>

          <Box direction="row" flex={false} justify="between">
            <Button label="Cancel" />
            <Button label="Back" icon={<LinkPrevious />} onClick={() => navigate("/create/associations")}/>
            <Button type="submit" label="Finish" icon={<Checkmark />} reverse primary />
          </Box>
        </Form>
        </Box>
      </>
    :
      <Box fill align="center" justify="center">
        <Spinner size="large"/>
      </Box>
    }

    {isError &&
      <ErrorLayer message={errorMessage} />
    }

    {showConfirmation &&
      <Layer>
        <Box width="large" direction="column" gap="small" margin="small" pad="medium" align="center">
          <Heading level="3" margin={{top: "small"}}>Sample Summary</Heading>
          <Box direction="row" gap="small">
            <Box direction="column" gap="small" pad="medium" >
              <Text><b>Identifier:</b> {name}</Text>
              <Text><b>Created:</b> {new Date(created).toDateString()}</Text>
              <Text><b>Description:</b> {description}</Text>
            </Box>
            <Box direction="column" gap="medium">
              <Text><b>Primary project:</b> <Linky key={project.id} type="projects" id={project.id} /></Text>
              <Text><b>Associated projects:</b> {projects.map((project) => {
                return (
                  <Linky key={`_${project.id}`} type="projects" id={project.id} />
                );
              })}</Text>
              {origin.name !== "" &&
                <Text><b>Origin sample:</b> <Linky type="samples" id={origin.id} /></Text>
              }
              {products.length > 0 &&
                <Text><b>Product samples:</b> {products.map((product) => {
                  return (
                    <Linky key={product.id} type="samples" id={product.id} />
                  );
                })}</Text>
              }
              {parameters.length > 0 &&
                <Text><b>Parameters:</b> {parameters.map((parameter) => {
                  return (
                    <>
                      <Tag name={parameter.name} value={parameter.name} />
                    </>
                  );
                })}</Text>
              }
            </Box>
          </Box>

          <Box direction="row" justify="between" fill>
            <Button type="submit" label="Go Back" onClick={() => setShowConfirmation(false)}/>
            <Button type="submit" label="Confirm" icon={<Checkmark />} reverse primary onClick={() => {
              // Create new parameters
              // Push the data and parameters
              console.debug(`Sample data:`, sampleData);
              pushData(`/samples/add`, sampleData).then(() => navigate("/samples"));
            }} />
          </Box>
        </Box>
      </Layer>
    }
    </>
  );
};
export default Parameters;
