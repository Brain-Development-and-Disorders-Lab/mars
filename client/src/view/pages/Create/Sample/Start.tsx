// React and Grommet
import React, { useEffect, useState } from "react";
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
} from "grommet/components";
import { LinkNext } from "grommet-icons";

// Navigation
import { useLocation, useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { Create, CollectionModel } from "types";

// Utility functions
import { pseudoId } from "src/lib/functions";

// Custom components
import ErrorLayer from "src/view/components/ErrorLayer";

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
  const initialCollection =
    state === null
      ? { name: "", id: "" }
      : (state as Create.Associations).collection;
  const initialDescription =
    state === null ? "" : (state as Create.Associations).description;

  const [name, setName] = useState(initialName);
  const [created, setCreated] = useState(initialCreated);
  const [owner, setOwner] = useState(initialOwner);
  const [collection, setCollection] = useState(initialCollection);
  const [description, setDescription] = useState(initialDescription);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [collectionData, setCollectionData] = useState([] as CollectionModel[]);

  const startState: Create.Start = {
    name: name,
    created: created,
    owner: owner,
    collection: collection,
    description: description,
  };

  useEffect(() => {
    const collections = getData(`/collections`);

    // Handle the response from the database
    collections.then((value) => {
      setCollectionData(value);

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
                label="Collection"
                name="collection"
                info="Select the primary collection that this sample should be associated with. Additional collections can be specified as an Association."
              >
                <Select
                  options={collectionData.map((collection) => {
                    return { name: collection.name, id: collection._id };
                  })}
                  value={collection}
                  valueKey="name"
                  labelKey="name"
                  onChange={({ option }) => {
                    setCollection(option);
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
