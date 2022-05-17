import {
  Box,
  Button,
  Form,
  Heading,
  Text,
} from "grommet";
import { Add, Checkmark, LinkPrevious } from "grommet-icons";

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Custom components
import Parameter from "src/view/components/Parameter";

export const Parameters = ({}) => {
  const navigate = useNavigate();

  // Extract state from prior page
  const { state } = useLocation();
  const { id, created, project, projects, description, parent, children } = state as Create.Associations;

  const defaultParameters: ParameterProps[] = [];
  const [parameters, setParameters] = useState(defaultParameters);

  return (
    <>
      <Heading level="2">Apply Parameters</Heading>
      <Form
        onChange={() => {}}
        onSubmit={() => {}}
      >
        <Box direction="row" margin="small" fill>
          <Box width="large" direction="column" overflow="auto">
            <Box direction="column" gap="small" margin="small">
              {
                parameters.map((e) => {
                  return (
                    <Parameter key={e.key} type={e.type} name={e.name} />
                  );
                })
              }
            </Box>

            <Box justify="center" direction="row" >
              <Button icon={<Add />} primary onClick={() => {
                setParameters([...parameters, { key: `${parameters.length}`, name: "", type: "sample"}]);
              }} />
            </Box>
          </Box>
          <Box width="large" direction="column" gap="small" margin="small">
            <Heading level="3" margin={{top: "small"}}>Sample Summary</Heading>
            <Text>ID: {id}</Text>
            <Text>Created: {new Date(created).toDateString()}</Text>
            <Text>Primary project ID: {project}</Text>
            <Text>Associated projects: {projects.join()}</Text>
            <Text>Description: {description}</Text>
            <Text>Parent ID: {parent}</Text>
            <Text>Associated children IDs: {children.join()}</Text>
          </Box>
        </Box>
        <Box direction="row" flex={false} justify="between">
          <Button label="Cancel" />
          <Button label="Back" icon={<LinkPrevious />} onClick={() => navigate("/create/associations")}/>
          <Button type="submit" label="Finish" icon={<Checkmark />} reverse primary />
        </Box>
      </Form>
    </>
  );
};
export default Parameters;
