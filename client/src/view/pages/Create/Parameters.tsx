import {
  Box,
  Button,
  Form,
  FormField,
  Heading,
  Layer,
  Select,
  Spinner,
  Text,
} from "grommet";
import { Add, Checkmark, LinkPrevious } from "grommet-icons";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getData } from "src/lib/database/getData";
import ErrorLayer from "src/view/components/ErrorLayer";

// Custom components
import Parameter from "src/view/components/Parameter";

export const Parameters = ({}) => {
  const navigate = useNavigate();

  // Extract state from prior page
  const { state } = useLocation();
  const { id, created, project, projects, description, parent, children } = state as Create.Associations;

  const [parameters, setParameters] = useState([] as ParameterProps[]);
  const [parameterData, setParameterData] = useState([] as ParameterStruct[]);
  const [parameterOptions, setParameterOptions] = useState([] as ParameterStruct[]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [showConfirmation, setShowConfirmation] = useState(false);

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
      <Form
        onChange={() => {}}
        onSubmit={() => {
          setShowConfirmation(true);
        }}
      >
        <Box direction="row" margin="small" fill>
          <Box width="large" direction="column" overflow="auto">
            <FormField label="Existing Parameter" name="existing" info="If you have already created a parameter, you can search and add it here.">
              <Select
                options={parameterOptions.map((parameter) => { return { name: parameter.name, id: parameter._id }})}
                labelKey="name"
                onChange={({ option }) => {
                  // We need to get the existing parameter and insert it here
                  console.debug(option);
                  getData(`/parameters/${option.id}`).then((value: ParameterStruct) => {
                    setParameters([
                      ...parameters,
                      {
                        key: `${value._id}_${parameters.length}`,
                        name: value.name,
                        description: value.description,
                        type: value.type,
                        attributes: value.attributes,
                        associations: value.associations,
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

            <Box direction="column" gap="small" margin="small">
              {
                parameters.map((parameter) => {
                  return (
                    <Parameter
                      key={parameter.key}
                      name={parameter.name}
                      description={parameter.description}
                      type={parameter.type}
                      attributes={parameter.attributes}
                      associations={parameter.associations}
                    />
                  );
                })
              }
            </Box>

            <Box justify="center" direction="row" >
              <Button icon={<Add />} label="Create new parameter" primary onClick={() => {
                setParameters([
                  ...parameters,
                  {
                    key: `${parameters.length}`,
                    name: "",
                    description: "",
                    type: "sample"
                  }]);
              }} />
            </Box>
          </Box>
        </Box>
        <Box direction="row" flex={false} justify="between">
          <Button label="Cancel" />
          <Button label="Back" icon={<LinkPrevious />} onClick={() => navigate("/create/associations")}/>
          <Button type="submit" label="Finish" icon={<Checkmark />} reverse primary />
        </Box>
      </Form>
    </>
    :
      <Box fill align="center" justify="center">
        <Spinner size="large"/>
      </Box>}
    {isError &&
      <ErrorLayer message={errorMessage} />
    }
    {showConfirmation &&
      <Layer>
        <Box width="large" direction="column" gap="small" margin="small">
          <Heading level="3" margin={{top: "small"}}>Sample Summary</Heading>
          <Text>ID: {id}</Text>
          <Text>Created: {new Date(created).toDateString()}</Text>
          <Text>Primary project ID: {project}</Text>
          <Text>Associated projects: {projects.join()}</Text>
          <Text>Description: {description}</Text>
          <Text>Parent ID: {parent}</Text>
          <Text>Associated children IDs: {children.join()}</Text>
          <Button type="submit" label="Go Back" />
          <Button type="submit" label="Confirm" icon={<Checkmark />} reverse primary />
        </Box>
      </Layer>
    }
    </>
  );
};
export default Parameters;
