import React, { useEffect, useState } from "react";
import { Button, EmptyState, Field, Fieldset, Flex, Input, Separator, Stack, Tag, Text } from "@chakra-ui/react";

// Custom components
import ActorTag from "@components/ActorTag";
import Icon from "@components/Icon";
import PermissionsDialog from "@components/PermissionsDialog";
import { toaster } from "@components/Toast";

// Custom types
import { Collaborator, CollaboratorsProps, ResponseData } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions
import { isValidEmail, ignoreAbort, isCollaborator } from "@lib/util";

// Variables
import { GLOBAL_STYLES } from "@variables";

// Analytics
import { usePostHog } from "posthog-js/react";

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
  const posthog = usePostHog();
  const [newCollaborator, setNewCollaborator] = useState("");
  const [validEmail, setValidEmail] = useState(false);

  // Flag to enable owner-specific features
  const isOwner = props.currentUser === props.owner;

  const [addCollaboratorLoading, setAddCollaboratorLoading] = useState(false);

  // `PermissionsDialog` state
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

  const [getCollaboratorUserId, { loading: collaboratorQueryLoading, error }] = useLazyQuery<{
    userByEmail: ResponseData<string>;
  }>(GET_USER_BY_EMAIL, {
    fetchPolicy: "network-only",
  });

  const handleAddCollaborator = async () => {
    setAddCollaboratorLoading(true);
    // Prevent adding empty or duplicate collaborator
    if (newCollaborator && !isCollaborator(newCollaborator, props.collaborators)) {
      const result = await getCollaboratorUserId({
        variables: {
          email: newCollaborator,
        },
      }).catch(ignoreAbort);

      if (!result?.data || error) {
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
        if (
          !props.collaborators.find((existingCollaborator: Collaborator) => existingCollaborator._id === collaborator)
        ) {
          posthog.capture("client.collaborator.added");
          props.setCollaborators((collaborators) => [...collaborators, collaborator]);
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

  const handleRemoveCollaborator = (collaborator: string) => {
    posthog.capture("client.collaborator.removed");
    props.setCollaborators((collaborators) => collaborators.filter((c) => c !== collaborator));
  };

  return (
    <Flex
      direction={"column"}
      gap={"2"}
      p={"2"}
      h={"fit-content"}
      rounded={"md"}
      border={GLOBAL_STYLES.border.style}
      borderColor={GLOBAL_STYLES.border.color}
      grow={"1"}
    >
      {/* Collaborators display */}
      <Flex direction={"column"} gap={"2"}>
        <Flex direction={"row"} gap={"1"} py={"1.5"} align={"center"} ml={"0.5"}>
          <Icon name={"person"} size={"xs"} color={GLOBAL_STYLES.font.secondaryHeader.color} />
          <Text fontSize={"xs"} fontWeight={"semibold"} color={GLOBAL_STYLES.font.secondaryHeader.color} ml={"0.5"}>
            Collaborators ({props.collaborators.length})
          </Text>
        </Flex>
        <Flex direction={"column"} gap={"1"}>
          <Text fontSize={"xs"} ml={"0.5"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
            Invite Collaborators to this Workspace via email
          </Text>
          <Flex direction={"row"} gap={"2"} align={"center"} w={"100%"}>
            <Fieldset.Root>
              <Fieldset.Content>
                <Field.Root invalid={newCollaborator !== "" && !validEmail}>
                  <Input
                    placeholder={"Email"}
                    size={"xs"}
                    rounded={"md"}
                    value={newCollaborator}
                    onChange={(event) => setNewCollaborator(event.target.value)}
                    disabled={!props.editing || !isOwner}
                  />
                </Field.Root>
              </Fieldset.Content>
            </Fieldset.Root>
            <Button
              colorPalette={"green"}
              size={"xs"}
              rounded={"md"}
              disabled={!props.editing || !validEmail || !isOwner}
              loading={addCollaboratorLoading || collaboratorQueryLoading}
              loadingText={"Adding..."}
              onClick={() => handleAddCollaborator()}
            >
              Invite
              <Icon name={"add"} size={"xs"} />
            </Button>
          </Flex>
        </Flex>
        <Flex
          w={"100%"}
          py={"1"}
          px={"0"}
          justify={"center"}
          align={"center"}
          minH={props.collaborators.length > 0 ? "fit-content" : "200px"}
        >
          {props.collaborators.length === 0 ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"person"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>No Collaborators</EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Stack gap={"1"} separator={<Separator variant={"solid"} />} w={"100%"}>
              {props.collaborators.map((collaborator, index) => (
                <Flex key={index} align={"center"} w={"100%"} justify={"space-between"}>
                  <Flex direction={"row"} gap={"2"} align={"center"}>
                    <ActorTag identifier={collaborator._id} fallback={"New User"} size={"sm"} />

                    {/* Permissions Display */}
                    <Flex direction={"column"} gap={"1"} align={"start"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Permissions
                      </Text>
                      <Flex direction={"row"} gap={"1"}>
                        <Tag.Root colorPalette={"green"}>
                          <Tag.Label fontSize={"xs"}>View</Tag.Label>
                        </Tag.Root>
                        <Tag.Root colorPalette={"green"}>
                          <Tag.Label fontSize={"xs"}>Edit</Tag.Label>
                        </Tag.Root>
                      </Flex>
                    </Flex>
                  </Flex>

                  {/* Action Buttons */}
                  {props.editing && !isOwner && (
                    <Button
                      size={"xs"}
                      colorPalette={"orange"}
                      rounded={"md"}
                      variant={"solid"}
                      aria-label={"Leave workspace"}
                      onClick={() => handleRemoveCollaborator(collaborator._id)}
                    >
                      Leave Workspace
                      <Icon name={"logout"} size={"xs"} />
                    </Button>
                  )}

                  {props.editing && isOwner && (
                    <Flex gap={"2"} align={"center"}>
                      <Button
                        size={"xs"}
                        colorPalette={"blue"}
                        rounded={"md"}
                        variant={"solid"}
                        aria-label={"Modify permissions"}
                        onClick={() => setPermissionsDialogOpen(true)}
                      >
                        Permissions
                        <Icon name={"settings"} size={"xs"} />
                      </Button>

                      <PermissionsDialog
                        open={permissionsDialogOpen}
                        setOpen={setPermissionsDialogOpen}
                        user={collaborator._id}
                        isGlobal={false}
                      />

                      <Button
                        size={"xs"}
                        colorPalette={"red"}
                        rounded={"md"}
                        aria-label={"Remove collaborator"}
                        onClick={() => handleRemoveCollaborator(collaborator._id)}
                      >
                        Remove
                        <Icon name={"logout"} size={"xs"} />
                      </Button>
                    </Flex>
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
