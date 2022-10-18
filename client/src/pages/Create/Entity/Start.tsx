// React and Grommet
import React, { useState } from "react";
import {
  Anchor,
  Box,
  Button,
  DateInput,
  Form,
  FormField,
  PageHeader,
  TextArea,
  TextInput,
} from "grommet/components";
import { Page, PageContent } from "grommet";
import { LinkNext } from "grommet-icons";

// Navigation
import { useLocation, useNavigate } from "react-router-dom";

// Database and models
import { Create } from "types";

// Utility functions
import { pseudoId } from "src/lib/functions";

export const Start = ({}) => {
  const navigate = useNavigate();

  // Extract prior state and apply
  const { state } = useLocation();

  const initialName =
    state === null ? pseudoId() : (state as Create.Entity.Associations).name;
  const initialCreated =
    state === null
      ? new Date().toISOString()
      : (state as Create.Entity.Associations).created;
  const initialOwner =
    state === null ? "" : (state as Create.Entity.Associations).owner;
  const initialDescription =
    state === null ? "" : (state as Create.Entity.Associations).description;

  const [name, setName] = useState(initialName);
  const [created, setCreated] = useState(initialCreated);
  const [owner, setOwner] = useState(initialOwner);
  const [description, setDescription] = useState(initialDescription);

  const startState: Create.Entity.Start = {
    from: "none",
    name: name,
    created: created,
    owner: owner,
    description: description,
  };

  return (
    <Page kind="wide" pad={{left: "small", right: "small"}}>
      <PageContent>
        <PageHeader
          title="Create an Entity: Start"
          parent={<Anchor label="Home" href="/" />}
        />
        <Box width="large" fill>
          <Form
            onChange={() => {}}
            onReset={() => {}}
            onSubmit={() => {
              startState.from = "start";
              navigate("/create/entity/associations", {
                state: startState,
              });
            }}
          >
            <Box direction="row" gap="medium">
              <Box direction="column" justify="between" basis="1/3">
                <FormField
                  label="Name"
                  name="name"
                  info="A standardised name or ID for the Entity."
                >
                  <TextInput
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </FormField>
                <FormField
                  label="Owner"
                  name="owner"
                  info="Owner of the Entity."
                >
                  <TextInput
                    name="owner"
                    value={owner}
                    onChange={(event) => setOwner(event.target.value)}
                    required
                  />
                </FormField>
                <FormField
                  label="Created"
                  name="created"
                  info="Date the Entity was created."
                >
                  <DateInput
                    format="mm/dd/yyyy"
                    value={created}
                    onChange={({ value }) => setCreated(value.toString())}
                    required
                  />
                </FormField>
              </Box>

              <Box direction="column" justify="between" basis="2/3">
                <FormField
                  label="Description"
                  name="description"
                  info="A brief description of the new Entity. Most details should be inputted as Attributes with Parameters."
                >
                  <TextArea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </FormField>
              </Box>
            </Box>

            <Box direction="row" justify="between" margin="medium">
              <Button label="Cancel" onClick={() => navigate("/")} />
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
      </PageContent>
    </Page>
  );
};
export default Start;
