// React and Chakra UI components
import React, { useEffect, useState } from "react";
import {
  Flex,
  Input,
  Button,
  Text,
  Heading,
  IconButton,
  Tag,
  Fieldset,
  Field,
} from "@chakra-ui/react";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";
import { createColumnHelper } from "@tanstack/react-table";

// Custom components
import { Content } from "@components/Container";
import DataTableRemix from "@components/DataTableRemix";
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

// Context and hooks
import { useAuthentication } from "@hooks/useAuthentication";
import { useBreakpoint } from "@hooks/useBreakpoint";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import { isValidEmail } from "src/util";

const User = () => {
  const { isBreakpointActive } = useBreakpoint();

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
      // Initialize email validation state
      setIsEmailValid(isValidEmail(data.user.email));
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

  // State for User details
  const [userModel, setUserModel] = useState({} as UserModel);
  const [userOrcid, setUserOrcid] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAffiliation, setUserAffiliation] = useState("");
  const [userKeys, setUserKeys] = useState([] as APIKey[]);
  const [showKeyValues, setShowKeyValues] = useState<Record<string, boolean>>(
    {},
  );

  // State for User Workspaces
  const [userStaticWorkspaces, setUserStaticWorkspaces] = useState(
    [] as IGenericItem[],
  );
  const [userWorkspaces, setUserWorkspaces] = useState([] as IGenericItem[]);

  // State for editing
  const [editing, setEditing] = useState(false);

  // State for display values
  const [staticName, setStaticName] = useState("");

  // Email validation state
  const [emailError, setEmailError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [affiliationError, setAffiliationError] = useState("");

  /**
   * Validate email format and update validation state
   */
  const validateEmail = (email: string) => {
    const isValid = isValidEmail(email);
    setIsEmailValid(isValid);

    if (email === "") {
      setEmailError("");
    } else if (!isValid) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  /**
   * Validate affiliation and update validation state
   */
  const validateAffiliation = (affiliation: string) => {
    if (affiliation === "") {
      setAffiliationError("Affiliation is required");
    } else {
      setAffiliationError("");
    }
  };

  /**
   * Check if form is valid for submission
   */
  const isFormValid = () => {
    return isEmailValid && userEmail !== "" && userAffiliation !== "";
  };

  /**
   * Handler function for `Done` button, apply updates to the User
   */
  const handleUpdateClick = async () => {
    // Validate before submitting
    validateEmail(userEmail);
    validateAffiliation(userAffiliation);

    if (!isFormValid()) {
      toaster.create({
        title: "Validation Error",
        description: "Please ensure email is valid and affiliation is provided",
        type: "error",
        duration: 2000,
        closable: true,
      });
      return;
    }

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

    // Reset validation state
    setEmailError("");
    setIsEmailValid(isValidEmail(userModel.email));
    setAffiliationError("");

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

  const handleRevokeKey = async (keyValue: string) => {
    const result = await revokeKey({
      variables: {
        key: keyValue,
      },
    });

    if (result.data?.revokeKey && result.data.revokeKey.success) {
      toaster.create({
        title: "Success",
        description: "API key revoked successfully",
        type: "success",
        duration: 2000,
        closable: true,
      });
      // Refetch user data to get updated keys
      if (refetch) {
        refetch();
      }
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

  const truncateTableText = !isBreakpointActive("md", "up");

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
  const apiKeysTableColumnHelper = createColumnHelper<APIKey>();
  const apiKeysTableColumns = [
    apiKeysTableColumnHelper.accessor("expires", {
      cell: (info) => {
        const apiKey = info.row.original;
        const isRevoked = dayjs(apiKey.expires).diff(Date.now()) < 0;
        return (
          <Flex direction={"row"} gap={"1"} align={"center"} w={"100%"}>
            {isRevoked ? (
              <Text fontWeight={"semibold"} fontSize={"xs"} color={"gray.400"}>
                Revoked
              </Text>
            ) : (
              <Flex
                direction={"row"}
                gap={"1"}
                align={"center"}
                justify={"space-between"}
                w={"100%"}
              >
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {dayjs(apiKey.expires).format("DD MMM YYYY")}
                </Text>
                <Button
                  size={"2xs"}
                  rounded={"md"}
                  colorPalette={"red"}
                  variant={"subtle"}
                  onClick={() => handleRevokeKey(apiKey.value)}
                  loading={revokeKeyLoading}
                >
                  Revoke
                  <Icon name={"delete"} size={"xs"} />
                </Button>
              </Flex>
            )}
          </Flex>
        );
      },
      header: "Expiry",
    }),
    apiKeysTableColumnHelper.accessor("scope", {
      cell: (info) => {
        const apiKey = info.row.original;
        const isRevoked = dayjs(apiKey.expires).diff(Date.now()) < 0;
        return (
          <Tag.Root colorPalette={isRevoked ? "red" : "blue"} size={"sm"}>
            <Tag.Label>{isRevoked ? "revoked" : info.getValue()}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "Scope",
    }),
    apiKeysTableColumnHelper.accessor("value", {
      cell: (info) => {
        const apiKey = info.row.original;
        const showValue = showKeyValues[apiKey.value] || false;
        return (
          <Flex gap={"1"} align={"center"} w={"100%"}>
            <Input
              type={showValue ? "text" : "password"}
              value={apiKey.value}
              maxW={"360px"}
              size={"xs"}
              rounded={"md"}
              readOnly
            />
            <IconButton
              variant={"outline"}
              size={"2xs"}
              rounded={"md"}
              aria-label={"Toggle API key visibility"}
              onClick={() => {
                setShowKeyValues({
                  ...showKeyValues,
                  [apiKey.value]: !showValue,
                });
              }}
            >
              <Icon
                name={showValue ? "visibility_hide" : "visibility_show"}
                size={"xs"}
              />
            </IconButton>
            <IconButton
              size={"2xs"}
              rounded={"md"}
              variant={"outline"}
              aria-label={"Copy API key"}
              onClick={async () => {
                await navigator.clipboard.writeText(apiKey.value);
                toaster.create({
                  title: "Copied to clipboard",
                  type: "success",
                  duration: 2000,
                  closable: true,
                });
              }}
            >
              <Icon name={"copy"} size={"xs"} />
            </IconButton>
          </Flex>
        );
      },
      header: "Value",
    }),
  ];

  const workspacesTableColumnHelper = createColumnHelper<IGenericItem>();
  const workspacesTableColumns = [
    workspacesTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Tooltip content={info.getValue()} showArrow>
            <Text fontSize={"xs"}>
              {_.truncate(info.getValue(), {
                length: truncateTableText ? 24 : 36,
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
          <Flex w={"100%"} justify={"end"} p={"0.5"}>
            <Tooltip
              content={"You cannot leave your only Workspace"}
              disabled={userWorkspaces.length > 1}
              showArrow
            >
              <Button
                size={"2xs"}
                rounded={"md"}
                aria-label={"Leave Workspace"}
                colorPalette={"orange"}
                variant={"subtle"}
                disabled={!editing || userWorkspaces.length === 1}
                onClick={() => {
                  removeWorkspace(info.row.original._id);
                }}
              >
                Leave Workspace
                <Icon name={"logout"} size={"xs"} />
              </Button>
            </Tooltip>
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const workspacesTableActions: DataTableAction[] = [
    {
      label: "Leave Workspace",
      icon: "delete",
      disabled: userWorkspaces.length === 1,
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
        gap={"1"}
        p={"1"}
        pb={{ base: "1", lg: "0" }}
        direction={"row"}
        justify={"space-between"}
        align={"center"}
        wrap={"wrap"}
      >
        <Flex
          align={"center"}
          gap={"1"}
          p={"1"}
          border={"2px solid"}
          rounded={"md"}
        >
          <Icon name={"person"} size={"sm"} />
          <Heading fontWeight={"semibold"} size={"sm"}>
            {staticName}
          </Heading>
        </Flex>
        {editing ? (
          <Flex direction={"row"} align={"center"} gap={"1"}>
            <Button
              size={"xs"}
              rounded={"md"}
              colorPalette={"red"}
              onClick={() => handleCancelClick()}
            >
              Cancel
              <Icon name={"cross"} size={"xs"} />
            </Button>
            <Button
              id={"userDoneButton"}
              size={"xs"}
              rounded={"md"}
              colorPalette={"green"}
              loading={userUpdateLoading}
              disabled={!isFormValid()}
              onClick={() => handleUpdateClick()}
            >
              Done
              <Icon name={"check"} size={"xs"} />
            </Button>
          </Flex>
        ) : (
          <Button
            size={"xs"}
            rounded={"md"}
            colorPalette={"blue"}
            onClick={() => {
              setEditing(true);
              // Validate fields when entering edit mode
              validateEmail(userEmail);
              validateAffiliation(userAffiliation);
            }}
          >
            Edit
            <Icon name={"edit"} size={"xs"} />
          </Button>
        )}
      </Flex>

      <Flex direction={"column"} gap={"1"} p={"1"}>
        <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            p={"0"}
            gap={"1"}
            w={{ base: "100%", md: "40%" }}
          >
            {/* User details */}
            <Flex
              direction={"column"}
              p={"1"}
              gap={"1"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
            >
              <Flex direction={"column"} p={"0"} gap={"1"}>
                <Text
                  ml={"0.5"}
                  textAlign={"left"}
                  fontSize={"xs"}
                  fontWeight={"semibold"}
                >
                  ORCiD
                </Text>
                <Flex align={"center"} justify={"start"}>
                  <Tag.Root colorPalette={"green"}>
                    <Tag.Label>{userOrcid}</Tag.Label>
                  </Tag.Root>
                </Flex>
              </Flex>

              <Fieldset.Root>
                <Fieldset.Content>
                  <Field.Root invalid={emailError !== ""} required gap={"0"}>
                    <Field.Label
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      ml={"0.5"}
                    >
                      Email
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      id={"modalUserEmail"}
                      size={"xs"}
                      rounded={"md"}
                      placeholder={"Email"}
                      type={"email"}
                      value={userEmail}
                      disabled={!editing}
                      mt={"0.5"}
                      onChange={(event) => {
                        setUserEmail(event.target.value);
                        validateEmail(event.target.value);
                      }}
                    />
                    {emailError !== "" && (
                      <Field.ErrorText fontSize={"xs"} mt={"1"}>
                        {emailError}
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                </Fieldset.Content>
              </Fieldset.Root>

              <Fieldset.Root>
                <Fieldset.Content>
                  <Field.Root
                    invalid={affiliationError !== ""}
                    required
                    gap={"0"}
                  >
                    <Field.Label
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      ml={"0.5"}
                    >
                      Affiliation
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      id={"modalUserAffiliation"}
                      size={"xs"}
                      rounded={"md"}
                      placeholder={"Affiliation"}
                      value={userAffiliation}
                      disabled={!editing}
                      mt={"0.5"}
                      onChange={(event) => {
                        setUserAffiliation(event.target.value);
                        validateAffiliation(event.target.value);
                      }}
                    />
                    {affiliationError !== "" && (
                      <Field.ErrorText fontSize={"xs"} mt={"1"}>
                        {affiliationError}
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                </Fieldset.Content>
              </Fieldset.Root>
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            p={"0"}
            gap={"1"}
            grow={"1"}
            w={{ base: "100%", md: "50%" }}
          >
            <Flex
              direction={"column"}
              p={"1"}
              gap={"1"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
            >
              <Flex
                direction={"row"}
                p={"0"}
                gap={"1"}
                align={"center"}
                ml={"0.5"}
              >
                <Icon name={"workspace"} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Workspaces
                </Text>
              </Flex>
              <Flex
                w={"100%"}
                justify={"center"}
                align={userWorkspaces.length > 0 ? "" : "center"}
                minH={userWorkspaces.length > 0 ? "fit-content" : "200px"}
              >
                {userWorkspaces.length > 0 ? (
                  <DataTableRemix
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

        <Flex direction={"row"} gap={"1"}>
          <Flex direction={"column"} p={"0"} gap={"1"} grow={"1"} basis={"50%"}>
            {/* API options */}
            <Flex
              direction={"column"}
              p={"1"}
              gap={"1"}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
            >
              <Flex direction={"column"} p={"0"} gap={"1"}>
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  align={"center"}
                >
                  <Flex
                    direction={"row"}
                    p={"0"}
                    gap={"1"}
                    align={"center"}
                    ml={"0.5"}
                  >
                    <Icon name={"key"} size={"xs"} />
                    <Text fontSize={"xs"} fontWeight={"semibold"}>
                      API Access
                    </Text>
                  </Flex>
                  <Button
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    onClick={() => handleGenerateKeyClick()}
                    loading={generateKeyLoading}
                  >
                    Add API Key
                    <Icon name={"add"} size={"xs"} />
                  </Button>
                </Flex>
                {userKeys.length > 0 ? (
                  <DataTableRemix
                    columns={apiKeysTableColumns}
                    data={userKeys}
                    visibleColumns={{}}
                    selectedRows={{}}
                    showPagination
                  />
                ) : (
                  <Text
                    fontWeight={"semibold"}
                    fontSize={"xs"}
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
    </Content>
  );
};

export default User;
