// React and Chakra UI components
import React, { useEffect, useState } from "react";
import {
  Flex,
  Input,
  Button,
  Text,
  Heading,
  useBreakpoint,
  IconButton,
  Tag,
  Separator,
  Spacer,
  VStack,
  Fieldset,
  Field,
} from "@chakra-ui/react";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";
import { createColumnHelper } from "@tanstack/react-table";

// Custom components
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";

// Custom types
import {
  APIKey,
  DataTableAction,
  IGenericItem,
  IResponseMessage,
  ResponseData,
  UserModel,
} from "@types";

// GraphQL imports
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";

// Authentication context
import { useAuthentication } from "@hooks/useAuthentication";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

/**
 * `APIKeyItem` component for presenting a list of API keys registered to a User
 * @param props Required information for component
 * @return {React.JSX.Element}
 */
const APIKeyItem = (props: { apiKey: APIKey }) => {
  const [isRevoked, setIsRevoked] = useState(
    dayjs(props.apiKey.expires).diff(Date.now()) < 0,
  );
  const [showValue, setShowValue] = useState(false);

  // Mutation to revoke an API key
  const REVOKE_KEY = gql`
    mutation RevokeKey($key: String) {
      revokeKey(key: $key) {
        success
        message
      }
    }
  `;
  const [revokeKey, { loading: revokeKeyLoading, error: revokeKeyError }] =
    useMutation<{ revokeKey: IResponseMessage }>(REVOKE_KEY);

  const handleRevokeClick = async () => {
    const result = await revokeKey({
      variables: {
        key: props.apiKey.value,
      },
    });

    if (result.data?.revokeKey && result.data.revokeKey.success) {
      setIsRevoked(true);
      toaster.create({
        title: "Success",
        description: "API key revoked successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
    }

    if (revokeKeyError) {
      toaster.create({
        title: "Error",
        description: "Unable to revoke API key",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  return (
    <Flex direction={"row"} gap={"2"} align={"center"} w={"100%"} wrap={"wrap"}>
      <Flex direction={"row"} gap={"1"} align={"center"}>
        <Icon name={"key"} />
        <Tag.Root colorPalette={isRevoked ? "red" : "blue"} size={"sm"}>
          <Tag.Label>{isRevoked ? "revoked" : props.apiKey.scope}</Tag.Label>
        </Tag.Root>
      </Flex>

      <Flex gap={"2"} align={"center"}>
        <Input
          type={showValue || isRevoked ? "text" : "password"}
          value={props.apiKey.value}
          maxW={"200px"}
          size={"sm"}
          rounded={"md"}
          disabled={isRevoked}
          readOnly
        />
        <Button
          size={"sm"}
          onClick={() => setShowValue(!showValue)}
          disabled={isRevoked}
        >
          {showValue ? "Hide" : "Show"}
        </Button>
        <Button
          size={"sm"}
          onClick={async () => {
            await navigator.clipboard.writeText(props.apiKey.value);
          }}
        >
          Copy
        </Button>
      </Flex>

      <Spacer />

      {isRevoked ? (
        <Text fontWeight={"semibold"} fontSize={"sm"} color={"gray.400"}>
          Revoked
        </Text>
      ) : (
        <Flex gap={"2"}>
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Text fontWeight={"semibold"} fontSize={"sm"}>
              Expires:
            </Text>
            <Text fontSize={"sm"}>
              {dayjs(props.apiKey.expires).format("DD MMM YYYY")}
            </Text>
          </Flex>

          <Button
            size={"sm"}
            colorPalette={"red"}
            onClick={() => handleRevokeClick()}
            loading={revokeKeyLoading}
          >
            Revoke
            <Icon name={"delete"} />
          </Button>
        </Flex>
      )}
    </Flex>
  );
};

const User = () => {
  const breakpoint = useBreakpoint();

  // Authentication
  const { token } = useAuthentication();

  // Query to get a User and Workspaces
  const GET_USER = gql`
    query GetUser($_id: String) {
      user(_id: $_id) {
        _id
        firstName
        lastName
        email
        affiliation
        api_keys {
          value
          expires
          scope
          workspaces
        }
      }
      workspaces {
        _id
        name
      }
    }
  `;
  const { loading, data, error, refetch } = useQuery<{
    user: UserModel;
    workspaces: IGenericItem[];
  }>(GET_USER, {
    fetchPolicy: "network-only",
    variables: {
      _id: token.orcid,
    },
  });

  // Query to generate a new API key
  const GENERATE_KEY = gql`
    query GenerateKey($scope: String, $workspaces: [String]) {
      generateKey(scope: $scope, workspaces: $workspaces) {
        success
        message
        data {
          value
          expires
          scope
          workspaces
        }
      }
    }
  `;
  const [
    generateKey,
    { loading: generateKeyLoading, error: generateKeyError },
  ] = useLazyQuery<{ generateKey: ResponseData<APIKey> }>(GENERATE_KEY);

  useEffect(() => {
    if (data?.user) {
      setUserModel(data.user);
      setUserOrcid(data.user._id);
      setUserFirstName(data.user.firstName);
      setUserLastName(data.user.lastName);
      setUserEmail(data.user.email);
      setUserAffiliation(data.user.affiliation);
      setUserKeys(data.user.api_keys);
      setStaticName(`${data.user.firstName} ${data.user.lastName}`);
    }

    if (data?.workspaces) {
      setUserStaticWorkspaces(data.workspaces);
      setUserWorkspaces(data.workspaces);
    }
  }, [data]);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  // Mutation to update User
  const UPDATE_USER = gql`
    mutation UpdateUser($user: UserInput) {
      updateUser(user: $user) {
        success
        message
      }
    }
  `;
  const [updateUser, { loading: userUpdateLoading, error: userUpdateError }] =
    useMutation<IResponseMessage>(UPDATE_USER);

  // State for User details
  const [userModel, setUserModel] = useState({} as UserModel);
  const [userOrcid, setUserOrcid] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAffiliation, setUserAffiliation] = useState("");
  const [userKeys, setUserKeys] = useState([] as APIKey[]);

  // State for User Workspaces
  const [userStaticWorkspaces, setUserStaticWorkspaces] = useState(
    [] as IGenericItem[],
  );
  const [userWorkspaces, setUserWorkspaces] = useState([] as IGenericItem[]);

  // State for editing
  const [editing, setEditing] = useState(false);

  // State for display values
  const [staticName, setStaticName] = useState("");

  /**
   * Handler function for `Done` button, apply updates to the User
   */
  const handleUpdateClick = async () => {
    await updateUser({
      variables: {
        user: {
          _id: userOrcid,
          email: userEmail,
          affiliation: userAffiliation,
          workspaces: userWorkspaces.map((workspace) => workspace._id),
        },
      },
    });

    if (userUpdateError) {
      toaster.create({
        title: "Error",
        description: "Unable to update User information",
        type: "error",
        duration: 2000,
        closable: true,
      });
    } else {
      // Update the displayed name
      setStaticName(`${userFirstName} ${userLastName}`);
    }

    setEditing(false);
  };

  const handleCancelClick = async () => {
    // Reset User details
    setUserFirstName(userModel.firstName);
    setUserLastName(userModel.lastName);
    setUserEmail(userModel.email);
    setUserAffiliation(userModel.affiliation);

    // Reset User Workspaces
    setUserWorkspaces(userStaticWorkspaces);

    // Set editing state
    setEditing(false);
  };

  const handleGenerateKeyClick = async () => {
    const result = await generateKey({
      variables: {
        scope: "edit",
        workspaces: userWorkspaces.map((w) => w._id),
      },
      fetchPolicy: "network-only",
    });

    if (generateKeyError) {
      toaster.create({
        title: "Error",
        description: "Unable to update User information",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }

    if (result.data?.generateKey) {
      setUserKeys([...userKeys, result.data.generateKey.data]);
    }
  };

  const truncateTableText =
    _.isEqual(breakpoint, "sm") ||
    _.isEqual(breakpoint, "base") ||
    _.isUndefined(breakpoint);

  // Utility functions for removing Workspace contents
  const removeWorkspace = (_id: string) => {
    const updated = userWorkspaces.filter((workspace) => {
      return !_.isEqual(workspace._id, _id);
    });
    setUserWorkspaces(updated);
  };

  const removeWorkspaces = (toRemove: string[]) => {
    const updated = userWorkspaces.filter((workspace) => {
      return !_.includes(toRemove, workspace._id);
    });
    setUserWorkspaces(updated);
  };

  // Setup `DataTable` components
  const workspacesTableColumnHelper = createColumnHelper<IGenericItem>();
  const workspacesTableColumns = [
    workspacesTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Tooltip content={info.getValue()} showArrow>
            <Text>
              {_.truncate(info.getValue(), {
                length: truncateTableText ? 12 : 24,
              })}
            </Text>
          </Tooltip>
        );
      },
      header: "Name",
    }),
    workspacesTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Tooltip
            content={"You cannot leave your only Workspace"}
            disabled={userWorkspaces.length > 1}
            showArrow
          >
            <Flex w={"100%"} justify={"end"} p={"0.5"}>
              <IconButton
                size={"sm"}
                aria-label={"Leave Workspace"}
                colorPalette={"orange"}
                disabled={!editing || userWorkspaces.length === 1}
                onClick={() => {
                  removeWorkspace(info.row.original._id);
                }}
              >
                <Icon name={"b_right"} />
              </IconButton>
            </Flex>
          </Tooltip>
        );
      },
      header: "",
    }),
  ];
  const workspacesTableActions: DataTableAction[] = [
    {
      label: "Remove Workspaces",
      icon: "delete",
      action(table, rows) {
        const workspacesToRemove: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          workspacesToRemove.push(table.getRow(rowIndex).original._id);
        }
        removeWorkspaces(workspacesToRemove);
      },
    },
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex
        gap={"2"}
        p={"2"}
        pb={{ base: "2", lg: "0" }}
        direction={"row"}
        justify={"space-between"}
        align={"center"}
        wrap={"wrap"}
      >
        <Flex align={"center"} gap={"2"} p={"2"} border={"2px"} rounded={"md"}>
          <Icon name={"person"} size={"md"} />
          <Heading fontWeight={"semibold"} size={"md"}>
            {staticName}
          </Heading>
        </Flex>
        {editing ? (
          <Flex direction={"row"} align={"center"} gap={"2"}>
            <Button
              size={"sm"}
              colorPalette={"red"}
              onClick={() => handleCancelClick()}
            >
              Cancel
              <Icon name={"cross"} />
            </Button>
            <Button
              id={"userDoneButton"}
              size={"sm"}
              colorPalette={"green"}
              loading={userUpdateLoading}
              onClick={() => handleUpdateClick()}
            >
              Done
              <Icon name={"check"} />
            </Button>
          </Flex>
        ) : (
          <Button
            size={"sm"}
            colorPalette={"blue"}
            onClick={() => setEditing(true)}
          >
            Edit
            <Icon name={"edit"} />
          </Button>
        )}
      </Flex>

      <Flex direction={"column"} gap={"2"} p={"2"}>
        <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            p={"0"}
            gap={"2"}
            w={{ base: "100%", md: "40%" }}
          >
            {/* User details */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <Flex direction={"row"} p={"0"} gap={"2"}>
                <Fieldset.Root>
                  <Fieldset.Content>
                    <Field.Root>
                      <Field.Label>ORCiD</Field.Label>
                      <Tag.Root colorPalette={"green"}>
                        <Tag.Label>{userOrcid}</Tag.Label>
                      </Tag.Root>
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
              </Flex>
              <Flex direction={"row"} p={"0"} gap={"2"}>
                <Fieldset.Root>
                  <Fieldset.Content>
                    <Field.Root required>
                      <Field.Label>
                        Email
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"modalUserEmail"}
                        size={"sm"}
                        rounded={"md"}
                        placeholder={"Email"}
                        type={"email"}
                        value={userEmail}
                        disabled={!editing}
                        onChange={(event) => setUserEmail(event.target.value)}
                      />
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
              </Flex>
              <Flex direction={"row"} p={"0"} gap={"2"}>
                <Fieldset.Root>
                  <Fieldset.Content>
                    <Field.Root required>
                      <Field.Label>
                        Affiliation
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"modalUserAffiliation"}
                        size={"sm"}
                        rounded={"md"}
                        placeholder={"Affiliation"}
                        value={userAffiliation}
                        disabled={!editing}
                        onChange={(event) =>
                          setUserAffiliation(event.target.value)
                        }
                      />
                    </Field.Root>
                  </Fieldset.Content>
                </Fieldset.Root>
              </Flex>
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            p={"0"}
            gap={"2"}
            grow={"1"}
            w={{ base: "100%", md: "50%" }}
          >
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <Text fontSize={"sm"} fontWeight={"semibold"}>
                Workspaces
              </Text>
              <Flex
                w={"100%"}
                justify={"center"}
                align={userWorkspaces.length > 0 ? "" : "center"}
                minH={userWorkspaces.length > 0 ? "fit-content" : "200px"}
              >
                {userWorkspaces.length > 0 ? (
                  <DataTable
                    data={userWorkspaces}
                    columns={workspacesTableColumns}
                    visibleColumns={{}}
                    selectedRows={{}}
                    actions={workspacesTableActions}
                    viewOnly={!editing}
                    showPagination
                    showSelection
                  />
                ) : (
                  <Text color={"gray.400"} fontWeight={"semibold"}>
                    No Workspaces
                  </Text>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"2"}>
          <Flex direction={"column"} p={"0"} gap={"2"} grow={"1"} basis={"50%"}>
            {/* API options */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <Flex direction={"column"} p={"0"} gap={"2"}>
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  align={"center"}
                >
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    API Access
                  </Text>
                  <Button
                    size={"sm"}
                    colorPalette={"green"}
                    onClick={() => handleGenerateKeyClick()}
                    loading={generateKeyLoading}
                  >
                    Add API Key
                    <Icon name={"add"} />
                  </Button>
                </Flex>
                <Flex
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.200"}
                  p={"2"}
                  minH={userKeys.length > 0 ? "" : "100px"}
                  align={"center"}
                  justify={userKeys.length > 0 ? "start" : "center"}
                >
                  {userKeys.length > 0 ? (
                    <VStack
                      direction={"column"}
                      w={"100%"}
                      separator={<Separator />}
                      gap={"2"}
                      justify={"left"}
                    >
                      {userKeys.map((key, index) => {
                        return (
                          <APIKeyItem key={`api_key_${index}`} apiKey={key} />
                        );
                      })}
                    </VStack>
                  ) : (
                    <Text
                      fontWeight={"semibold"}
                      fontSize={"sm"}
                      color={"gray.400"}
                    >
                      No API keys
                    </Text>
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default User;
