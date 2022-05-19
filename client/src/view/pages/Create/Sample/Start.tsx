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
import { Create, GroupModel } from "types";

export const Start = ({}) => {
  const navigate = useNavigate();

  // Extract prior state and apply
  const { state } = useLocation();

  const initialName =
    state === null ? pseudoId() : (state as Create.Associations).name;
  const initialCreated =
    state === null
      ? new Date().toISOString()
      : (state as Create.Associations).created;
  const initialOwner =
    state === null ? "" : (state as Create.Associations).owner;
  const initialGroup =
    state === null
      ? { name: "", id: "" }
      : (state as Create.Associations).group;
  const initialDescription =
    state === null ? "" : (state as Create.Associations).description;

  const [name, setName] = useState(initialName);
  const [created, setCreated] = useState(initialCreated);
  const [owner, setOwner] = useState(initialOwner);
  const [group, setGroup] = useState(initialGroup);
  const [description, setDescription] = useState(initialDescription);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [groupData, setGroupData] = useState([] as GroupModel[]);

  const startState: Create.Start = {
    name: name,
    created: created,
    owner: owner,
    group: group,
    description: description,
  };

  useEffect(() => {
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
          <Heading level="2">Create a Sample</Heading>
          <Box width="large" fill>
            <Form
              onChange={() => {}}
              onReset={() => {}}
              onSubmit={() => {
                navigate("/create/sample/associations", { state: startState });
              }}
            >
              <Box direction="row" justify="between">
                <FormField
                  label="Name"
                  name="name"
                  info="A standardised name or ID for the sample."
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
                  info="Owner of the sample."
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
                  info="Date the sample was created."
                >
                  <DateInput
                    format="mm/dd/yyyy"
                    value={created}
                    onChange={({ value }) => setCreated(value.toString())}
                    required
                  />
                </FormField>
              </Box>

              <FormField
                label="Group"
                name="group"
                info="Select the primary group that this sample should be associated with. Additional groups can be specified as an Association."
              >
                <Select
                  options={groupData.map((group) => {
                    return { name: group.name, id: group._id };
                  })}
                  value={group}
                  valueKey="name"
                  labelKey="name"
                  onChange={({ option }) => {
                    setGroup(option);
                  }}
                />
              </FormField>

              <FormField
                label="Description"
                name="description"
                info="A brief description of the new sample. Most details should be inputted as Attributes with Blocks."
              >
                <TextArea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </FormField>
              <Box direction="row" flex={false} justify="between">
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
export default Start;
