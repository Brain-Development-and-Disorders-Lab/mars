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
  Tag,
  TextInput,
} from "grommet/components";
import { Page, PageContent } from "grommet";
import { Checkmark } from "grommet-icons";

// Navigation
import { useLocation, useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/lib/database/getData";
import { CollectionModel, Create, EntityModel } from "types";

// Utility functions
import { pseudoId } from "src/lib/functions";

// Custom components
import ErrorLayer from "src/components/ErrorLayer";

import consola from "consola";

export const Start = ({}) => {
  const navigate = useNavigate();

  // Extract prior state and apply
  const { state } = useLocation();

  const initialName =
    state === null ? pseudoId() : (state as Create.Collection.Start).name;
  const initialCreated =
    state === null
      ? new Date().toISOString()
      : (state as Create.Collection.Start).created;
  const initialOwner =
    state === null ? "" : (state as Create.Collection.Start).owner;
  const initialDescription =
    state === null ? "" : (state as Create.Collection.Start).description;

  const [name, setName] = useState(initialName);
  const [created, setCreated] = useState(initialCreated);
  const [owner, setOwner] = useState(initialOwner);
  const [description, setDescription] = useState(initialDescription);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [collectionData, setCollectionData] = useState([] as CollectionModel[]);
  const [entityOptions, setEntityOptions] = useState(
    [] as { name: string; id?: string }[]
  );
  const [entities, setEntities] = useState([] as EntityModel[]);

  const startState: Create.Collection.Start = {
    from: "none",
    name: name,
    created: created,
    owner: owner,
    description: description,
  };

  useEffect(() => {
    const entities = getData(`/entities`);

    // Handle the response from the database
    entities.then((entity) => {
      setEntityOptions(entity.map((e: EntityModel) => {
        return { name: e.name, id: e._id };
      }));

      // Check the contents of the response
      if (entity["error"] !== undefined) {
        setErrorMessage(entity["error"]);
        setIsError(true);
      }
    });

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

    consola.debug("Collection data:", collectionData);
    return;
  }, []);

  return (
    <Page kind="wide" pad={{left: "small", right: "small"}}>
      <PageContent>
        {isLoaded && isError === false ? (
          <>
            <PageHeader
              title="Create a Collection"
              parent={<Anchor label="Return to Dashboard" href="/" />}
            />
            <Box width="large" fill>
              <Form
                onChange={() => {}}
                onReset={() => {}}
                onSubmit={() => {
                  startState.from = "start";
                  navigate("/create/collection/add", {
                    state: startState,
                  });
                }}
              >
                <Box direction="row" gap="medium">
                  <Box direction="column" justify="between" basis="1/3">
                    <FormField
                      label="Name"
                      name="name"
                      info="A standardised name or ID for the Collection."
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
                      info="Owner of the Collection."
                      type="email"
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
                      info="Date the Collection was created."
                    >
                      <DateInput
                        format="mm/dd/yyyy"
                        value={created}
                        onChange={({ value }) => setCreated(value.toString())}
                        required
                      />
                    </FormField>
                  </Box>
                  <Box direction="column" basis="2/3">
                    <FormField
                      label="Description"
                      name="description"
                      info="Description of the Collection."
                    >
                      <TextInput
                        name="description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        required
                      />
                    </FormField>
                    <FormField
                      label="Add"
                      name="add"
                      info="Add existing Entities to the Collection."
                    >
                      <Select
                        options={entityOptions}
                        labelKey="name"
                        value={entities}
                        valueKey="name"
                        onChange={({ value }) => {
                          if (!entities.includes(value)) {
                            setEntities([...entities, value]);
                          }
                        }}
                        searchPlaceholder="Search..."
                        onSearch={(query) => {
                          const escapedText = query.replace(
                            /[-\\^$*+?.()|[\]{}]/g,
                            "\\$&"
                          );
                          const filteredText = new RegExp(escapedText, "i");
                          setEntityOptions(
                            entityOptions
                              .filter((entity) => filteredText.test(entity.name))
                              .map((entity) => {
                                return { name: entity.name, id: entity.id };
                              })
                          );
                        }}
                      />
                    </FormField>
                    <Box direction="column" gap="xsmall">
                      {entities.map((entity) => {
                        return (
                          <Tag
                            name="Entity"
                            value={entity.name}
                            key={entity.name}
                            onRemove={() => {
                              setEntities(
                                entities.filter((item) => {
                                  return item !== entity;
                                })
                              );
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                </Box>

                <Box direction="row" justify="between" margin="medium">
                  <Button label="Cancel" onClick={() => navigate("/")} />
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
      </PageContent>
    </Page>
  );
};
export default Start;
