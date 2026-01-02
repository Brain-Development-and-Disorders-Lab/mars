import React, { useEffect, useState } from "react";
import {
  Button,
  EmptyState,
  Field,
  Fieldset,
  Flex,
  Input,
  Separator,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";

// Custom components
import ActorTag from "@components/ActorTag";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Custom types
import { CollaboratorsProps, ResponseData } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions
import _ from "lodash";
import { isValidEmail } from "@lib/util";

const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String) {
    userByEmail(email: $email) {
      success
      message
      data
    }
  }
`;

const Collaborators = (props: CollaboratorsProps) => {
  const [newCollaborator, setNewCollaborator] = useState("");
  const [validEmail, setValidEmail] = useState(false);

  const [addCollaboratorLoading, setAddCollaboratorLoading] = useState(false);

  const [getCollaboratorUserId, { loading: collaboratorQueryLoading, error }] =
    useLazyQuery<{ userByEmail: ResponseData<string> }>(GET_USER_BY_EMAIL, {
      fetchPolicy: "network-only",
    });

  const handleAddCollaborator = async () => {
    setAddCollaboratorLoading(true);
    // Prevent adding empty or duplicate collaborator
    if (
      newCollaborator &&
      !props.projectCollaborators.includes(newCollaborator)
    ) {
      const result = await getCollaboratorUserId({
        variables: {
          email: newCollaborator,
        },
      });

      if (!result.data || error) {
        toaster.create({
          title: "Error",
          type: "error",
          description: "Could not retrieve User information",
          duration: 4000,
          closable: true,
        });
      } else if (result.data && result.data.userByEmail.data === "") {
        toaster.create({
          title: "Error",
          type: "error",
          description: `Could not locate user with email address "${newCollaborator}"`,
          duration: 4000,
          closable: true,
        });
      } else if (result.data) {
        const collaborator = result.data.userByEmail.data;
        if (!_.includes(props.projectCollaborators, collaborator)) {
          props.setProjectCollaborators((collaborators) => [
            ...collaborators,
            collaborator,
          ]);
        } else {
          toaster.create({
            title: "Warning",
            type: "warning",
            description: "Collaborator already exists in this Workspace",
            duration: 4000,
            closable: true,
          });
        }
      }
    }

    setNewCollaborator(""); // Clear the input after adding
    setAddCollaboratorLoading(false);
  };

  // Check if the new collaborator is a valid email
  useEffect(() => {
    setValidEmail(isValidEmail(newCollaborator));
  }, [newCollaborator]);

  return (
    <Flex
      direction={"column"}
      gap={"1"}
      p={"1"}
      h={"fit-content"}
      rounded={"md"}
      border={"1px solid"}
      borderColor={"gray.300"}
      grow={"1"}
    >
      {/* Collaborators display */}
      <Flex direction={"column"} gap={"1"}>
        <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
          <Icon name={"person"} size={"xs"} />
          <Text fontSize={"xs"} fontWeight={"semibold"}>
            Collaborators
          </Text>
        </Flex>
        <Flex direction={"row"} gap={"2"} align={"center"}>
          <Fieldset.Root>
            <Fieldset.Content>
              <Field.Root invalid={newCollaborator !== "" && !validEmail}>
                <Input
                  placeholder={"Email"}
                  size={"xs"}
                  rounded={"md"}
                  value={newCollaborator}
                  onChange={(event) => setNewCollaborator(event.target.value)}
                  disabled={!props.editing}
                />
              </Field.Root>
            </Fieldset.Content>
          </Fieldset.Root>
          <Spacer />
          <Button
            colorPalette={"green"}
            size={"xs"}
            rounded={"md"}
            disabled={!props.editing || !validEmail}
            loading={addCollaboratorLoading || collaboratorQueryLoading}
            loadingText={"Adding..."}
            onClick={() => handleAddCollaborator()}
          >
            Add
            <Icon name={"add"} size={"xs"} />
          </Button>
        </Flex>
        <Flex
          w={"100%"}
          py={"1"}
          px={"0"}
          justify={"center"}
          align={"center"}
          minH={props.projectCollaborators.length > 0 ? "fit-content" : "200px"}
        >
          {props.projectCollaborators.length === 0 ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"person"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>
                  No Collaborators
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Stack
              gap={"1"}
              separator={<Separator variant={"solid"} />}
              w={"100%"}
            >
              {props.projectCollaborators.map((collaborator, index) => (
                <Flex
                  key={index}
                  align={"center"}
                  w={"100%"}
                  justify={"space-between"}
                >
                  <Flex gap={"2"} align={"center"}>
                    <ActorTag
                      identifier={collaborator}
                      fallback={"New User"}
                      size={"sm"}
                    />
                    <Tag.Root colorPalette={"green"}>
                      <Tag.Label fontSize={"xs"}>Collaborator</Tag.Label>
                    </Tag.Root>
                  </Flex>
                  {props.editing && (
                    <Button
                      size={"2xs"}
                      colorPalette={"red"}
                      rounded={"md"}
                      variant={"subtle"}
                      aria-label="Remove collaborator"
                      onClick={() =>
                        props.setProjectCollaborators((collaborators) =>
                          collaborators.filter((c) => c !== collaborator),
                        )
                      }
                    >
                      Remove
                      <Icon name="delete" size={"xs"} />
                    </Button>
                  )}
                </Flex>
              ))}
            </Stack>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Collaborators;
