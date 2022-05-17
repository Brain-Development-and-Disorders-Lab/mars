import {
  Box,
  Button,
  DateInput,
  Form,
  FormField,
  Heading,
  Select,
  Spinner,
  TextArea,
  TextInput,
} from "grommet";
import { LinkNext } from "grommet-icons";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getData } from "src/lib/database/getData";
import { pseudoId } from "src/lib/functions";
import ErrorLayer from "src/view/components/ErrorLayer";
import { Create, ProjectStruct } from "types";

export const Start = ({}) => {
  const navigate = useNavigate();

  // Extract prior state and apply
  const { state } = useLocation();

  const initialName = state === null ? pseudoId() : (state as Create.Associations).name;
  const initialCreated = state === null ? new Date().toISOString() : (state as Create.Associations).created;
  const initialOwner = state === null ? "" : (state as Create.Associations).owner;
  const initialProject = state === null ? {name: "", id: ""} : (state as Create.Associations).project;
  const initialDescription = state === null ? "" : (state as Create.Associations).description;

  const [name, setName] = useState(initialName);
  const [created, setCreated] = useState(initialCreated);
  const [owner, setOwner] = useState(initialOwner);
  const [project, setProject] = useState(initialProject);
  const [description, setDescription] = useState(initialDescription);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [projectData, setProjectData] = useState([] as ProjectStruct[]);

  const startState: Create.Start = {
    name: name,
    created: created,
    owner: owner,
    project: project,
    description: description,
  };

  useEffect(() => {
    const projects = getData(`/projects`);

    // Handle the response from the database
    projects.then((value) => {
      setProjectData(value);
      
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
        <Heading level="2">Create a Sample</Heading>
        <Box width="large" fill>
          <Form
            onChange={() => {}}
            onReset={() => {}}
            onSubmit={() => {
              navigate("/create/associations", { state: startState});
            }}
          >
            <Box direction="row" justify="between">
              <FormField label="Name" name="name" info="A standardised name or ID for the sample.">
                <TextInput
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </FormField>
              <FormField label="Owner" name="owner" info="Owner of the sample.">
                <TextInput
                  name="owner"
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                />
              </FormField>
              <FormField label="Created" name="created" info="Date the sample was created.">
                <DateInput
                  format="mm/dd/yyyy"
                  value={created}
                  onChange={({ value }) => setCreated(value.toString())}
                />
              </FormField>
            </Box>

            <FormField label="Project" name="project" info="Select the primary project that this sample should be associated with. Additional projects can be specified as an Association.">
              <Select
                options={projectData.map((project) => {
                  return { name: project.name, id: project._id };
                })}
                value={project}
                valueKey="name"
                labelKey="name"
                onChange={({ option }) => {
                  setProject(option);
                }}
              />
            </FormField>

            <FormField label="Description" name="description" info="A brief description of the new sample. Most details should be inputted as Parameters.">
              <TextArea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </FormField>
            <Box direction="row" flex={false} justify="between">
              <Button label="Cancel" onClick={() => navigate("/")}/>
              <Button type="submit" label="Continue" icon={<LinkNext />} reverse primary />
            </Box>
          </Form>
        </Box>
      </>
    :
      <Box fill align="center" justify="center">
        <Spinner size="large"/>
      </Box>}
    {isError &&
      <ErrorLayer message={errorMessage} />
    }
    </>
  );
};
export default Start;
