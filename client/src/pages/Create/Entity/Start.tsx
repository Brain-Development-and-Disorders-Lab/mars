// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Box,
  Button,
  DateInput,
  Form,
  FormField,
  PageHeader,
  Select,
  Spinner,
  TextArea,
  TextInput,
} from "grommet/components";
import { Page, PageContent } from "grommet";
import { LinkNext } from "grommet-icons";

// Navigation
import { useLocation, useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { Create, CollectionModel } from "types";

// Utility functions
import { pseudoId } from "src/lib/functions";

// Custom components
import ErrorLayer from "src/components/ErrorLayer";

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
    from: "none",
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
    <Page kind="wide" pad={{left: "small", right: "small"}}>
      <PageContent>
        {isLoaded && isError === false ? (
          <>
            <PageHeader
              title="Create an Entity: Start"
              parent={<Anchor label="Return to Dashboard" href="/" />}
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
                      label="Primary Collection"
                      name="collection"
                      info="Select the primary Collection that this Entity should be associated with. Additional Collections can be specified as an Association."
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
          </>
        ) : (
          <Box fill align="center" justify="center">
            <Spinner size="large" />
          </Box>
        )}
        {isError && <ErrorLayer message={errorMessage} />}
      </PageContent>
    </Page>
  );
};
export default Start;