import {
  Box,
  Button,
  DateInput,
  Form,
  FormField,
  Heading,
  Select,
  TextArea,
  TextInput,
} from "grommet";
import { LinkNext } from "grommet-icons";

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const Start = ({}) => {
  const navigate = useNavigate();

  // Extract prior state and apply
  const { state } = useLocation();

  const initialId = state === null ? "" : (state as Create.Associations).id;
  const initialCreated = state === null ? "" : (state as Create.Associations).created;
  const initialProject = state === null ? "" : (state as Create.Associations).project;
  const initialDescription = state === null ? "" : (state as Create.Associations).description;

  const [id, setId] = useState(initialId);
  const [created, setCreated] = useState(initialCreated);
  const [project, setProject] = useState(initialProject);
  const [description, setDescription] = useState(initialDescription);

  const startState: Create.Start = {
    id: id,
    created: created,
    project: project,
    description: description,
  };

  return (
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
            <FormField label="ID" name="id" info="A standardised ID for the sample.">
              <TextInput
                name="ID"
                value={id}
                onChange={(event) => setId(event.target.value)}
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
              options={["(dunnart1234) Dunnart Prey Capture", "(ccddm2020) Metacognition in CCD"]}
              value={project}
              onChange={({ option }) => setProject(option)}
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
  );
};
export default Start;
