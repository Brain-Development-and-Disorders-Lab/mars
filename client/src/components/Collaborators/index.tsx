import React, { useEffect, useState } from "react";
import { Button, EmptyState, Field, Fieldset, Flex, Input, Link, Separator, Stack, Tag, Text } from "@chakra-ui/react";

// Custom components
import ActorTag from "@components/ActorTag";
import Icon from "@components/Icon";
import PermissionsDialog from "@components/PermissionsDialog";
import { toaster } from "@components/Toast";

// Custom types
import { Collaborator, CollaboratorsProps, ResponseData, UserModel } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery, useQuery } from "@apollo/client/react";

// Utility functions
import {
  getCollaboratorPermissions,
  getCollaboratorPermissionsLevel,
  ignoreAbort,
  isCollaborator,
  isValidEmail,
  setCollaboratorPermissions,
} from "@lib/util";

// Variables
import { DEFAULT_WORKSPACE_PERMISSIONS, GLOBAL_STYLES } from "@variables";

// Hooks
import { usePermissions } from "@hooks/usePermissions";

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

const GET_USER_EMAIL = gql`
  query GetUserEmail($_id: String) {
    user(_id: $_id) {
      email
    }
  }
`;

// Displays a Collaborator's email address, filling the space beside their name and actions
const CollaboratorEmail = (props: { userId: string }) => {
  const { loading, data } = useQuery<{ user: Partial<UserModel> }>(GET_USER_EMAIL, {
    variables: { _id: props.userId },
    fetchPolicy: "network-only",
  });

  return (
    <Link href={`mailto:${data?.user.email}`}>
      <Text fontSize={"xs"} color={"gray.600"} ml={"0.5"}>
        {loading ? "" : data?.user.email}
      </Text>
    </Link>
  );
};

const Collaborators = (props: CollaboratorsProps) => {
  const posthog = usePostHog();

  // Permissions
  const { workspacePermissions } = usePermissions();

  const [newCollaborator, setNewCollaborator] = useState("");
  const [validEmail, setValidEmail] = useState(false);

  // Flag to enable owner-specific features
  const isOwner = props.currentUser === props.owner;

  const [addCollaboratorLoading, setAddCollaboratorLoading] = useState(false);

  // `PermissionsDialog` state
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissionsDialogUser, setPermissionsDialogUser] = useState("");

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
        const collaborator: Collaborator = {
          _id: result.data.userByEmail.data,
          permissions: DEFAULT_WORKSPACE_PERMISSIONS,
        };

        if (!isCollaborator(collaborator._id, props.collaborators)) {
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
    props.setCollaborators((collaborators) => collaborators.filter((c) => c._id !== collaborator));
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

        {workspacePermissions.administration.invite && (
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
                      disabled={!props.editing}
                    />
                  </Field.Root>
                </Fieldset.Content>
              </Fieldset.Root>
              <Button
                colorPalette={"green"}
                size={"xs"}
                rounded={"md"}
                disabled={!props.editing || !validEmail}
                loading={addCollaboratorLoading || collaboratorQueryLoading}
                loadingText={"Adding..."}
                onClick={() => handleAddCollaborator()}
              >
                Invite
                <Icon name={"add"} size={"xs"} />
              </Button>
            </Flex>
          </Flex>
        )}

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
            <Stack gap={"2"} separator={<Separator variant={"solid"} />} w={"100%"}>
              {props.collaborators.map((collaborator, index) => (
                <Flex key={index} align={"start"} justify={"space-between"} direction={"row"} w={"100%"}>
                  <Flex direction={"column"} gap={"2"} align={"start"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                      Collaborator
                    </Text>
                    <ActorTag identifier={collaborator._id} fallback={"New User"} size={"sm"} />
                  </Flex>

                  {/* Email, filling the space beside the Collaborator */}
                  <Flex direction={"column"} gap={"2"} align={"start"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                      Email
                    </Text>
                    <CollaboratorEmail userId={collaborator._id} />

                    {/* Action Buttons */}
                    {props.editing && (
                      <Flex direction={"row"} gap={"2"} align={"end"} ml={"0.5"}>
                        <Button
                          size={"xs"}
                          colorPalette={"blue"}
                          rounded={"md"}
                          variant={"solid"}
                          aria-label={isOwner ? "Manage permissions" : "View permissions"}
                          onClick={() => {
                            setPermissionsDialogUser(collaborator._id);
                            setPermissionsDialogOpen(true);
                          }}
                        >
                          {isOwner ? "Manage Permissions" : "View Permissions"}
                          <Icon name={"settings"} size={"xs"} />
                        </Button>

                        {!isOwner && props.currentUser === collaborator._id && (
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

                        {isOwner && (
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
                        )}
                      </Flex>
                    )}

                    {/* Permissions Labels */}
                    <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                      {getCollaboratorPermissionsLevel(collaborator.permissions).map((label) => {
                        return (
                          <Tag.Root colorPalette={label.includes("Partial") ? "orange" : "green"}>
                            <Tag.Label fontSize={"xs"}>{label}</Tag.Label>
                          </Tag.Root>
                        );
                      })}
                    </Flex>
                  </Flex>
                </Flex>
              ))}
            </Stack>
          )}
        </Flex>
      </Flex>

      {permissionsDialogUser && (
        <PermissionsDialog
          open={permissionsDialogOpen}
          setOpen={setPermissionsDialogOpen}
          user={permissionsDialogUser}
          isGlobal={false}
          editable={isOwner}
          workspacePermissions={getCollaboratorPermissions(permissionsDialogUser, props.collaborators)}
          onUpdateWorkspacePermissions={(permissions) =>
            props.setCollaborators((collaborators) =>
              setCollaboratorPermissions(permissionsDialogUser, permissions, collaborators),
            )
          }
        />
      )}
    </Flex>
  );
};

export default Collaborators;
