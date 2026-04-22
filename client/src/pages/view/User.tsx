// React and Chakra UI components
import React, { useEffect, useState } from "react";
import { Flex, Input, Button, Text, Heading, IconButton, Tag, Fieldset, Field, EmptyState } from "@chakra-ui/react";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";
import { createColumnHelper } from "@tanstack/react-table";

// Custom components
import { Content } from "@components/Container";
import DataTable, { ColumnMeta } from "@components/DataTable";
import Icon from "@components/Icon";

// Custom types
import { APIKey, DataTableAction, IResponseMessage, ResponseData, UserModel, WorkspaceModel } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";

// Context and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Authentication
import { auth } from "@lib/auth";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import { isValidEmail, ignoreAbort } from "@lib/util";

// Variables
import { APP_URL, GLOBAL_STYLES } from "@variables";
import ActorTag from "@components/ActorTag";

const User = () => {
  const { isBreakpointActive } = useBreakpoint();

  // Authentication and user
  const [user, setUser] = useState("");

  /**
   * Helper function to get user information
   */
  const getUser = async () => {
    const sessionResponse = await auth.getSession();
    if (sessionResponse.error || !sessionResponse.data) {
      toaster.create({
        title: "Error",
        description: "Session expired, please login again",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else {
      setUser(sessionResponse.data.user.id);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  // Query to get a User and Workspaces
  const GET_USER = gql`
    query GetUser($_id: String) {
      user(_id: $_id) {
        _id
        firstName
        lastName
        email
        emailVerified
        affiliation
        api_keys
        account_orcid
      }
      workspaces {
        _id
        name
        description
        public
        owner
        collaborators
      }
    }
  `;

  type WorkspacePartial = Pick<WorkspaceModel, "_id" | "name" | "description" | "public" | "owner" | "collaborators">;

  const { loading, data, error, refetch } = useQuery<{
    user: UserModel;
    workspaces: WorkspacePartial[];
  }>(GET_USER, {
    fetchPolicy: "network-only",
    variables: {
      _id: user,
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
  const [generateKey, { loading: generateKeyLoading, error: generateKeyError }] = useLazyQuery<{
    generateKey: ResponseData<APIKey>;
  }>(GENERATE_KEY, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (data?.user) {
      // If the DB has no ORCiD but better-auth has a linked account, sync it
      if (!data.user.account_orcid) {
        auth.listAccounts().then(({ data: accounts }) => {
          const orcidAccount = accounts?.find((a) => a.providerId === "orcid");
          if (orcidAccount) {
            updateUser({
              variables: {
                user: { _id: user, account_orcid: orcidAccount.accountId },
              },
            }).then(() => refetch?.().catch(ignoreAbort));
          }
        });
      }

      // Trim the ORCiD URL
      if (data.user.account_orcid !== "") {
        const startOrcid = data.user.account_orcid.lastIndexOf("/");
        setUserOrcid(data.user.account_orcid.substring(startOrcid + 1));
      } else {
        setUserOrcid(data.user.account_orcid);
      }

      setUserModel(data.user);
      setUserFirstName(data.user.firstName);
      setUserLastName(data.user.lastName);
      setUserEmail(data.user.email);
      setEmailVerified(data.user.emailVerified);
      setUserAffiliation(data.user.affiliation);
      setUserKeys(JSON.parse(data.user.api_keys));
      setStaticName(`${data.user.firstName} ${data.user.lastName}`);

      // Initialize email validation state
      setIsEmailValid(isValidEmail(data.user.email));
    }

    if (data?.workspaces) {
      setUserStaticWorkspaces(data.workspaces);
      setUserWorkspaces(data.workspaces);
    }
  }, [data]);

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
  const [revokeKey, { loading: revokeKeyLoading, error: revokeKeyError }] = useMutation<{
    revokeKey: IResponseMessage;
  }>(REVOKE_KEY);

  // Mutation to leave a Workspace (remove self from collaborators)
  const LEAVE_WORKSPACE = gql`
    mutation UpdateWorkspace($workspace: WorkspaceUpdateInput) {
      updateWorkspace(workspace: $workspace) {
        success
        message
      }
    }
  `;
  const [leaveWorkspace, { loading: leaveWorkspaceLoading }] = useMutation<{
    updateWorkspace: IResponseMessage;
  }>(LEAVE_WORKSPACE);

  // State for User details
  const [userModel, setUserModel] = useState({} as UserModel);
  const [userOrcid, setUserOrcid] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAffiliation, setUserAffiliation] = useState("");
  const [userKeys, setUserKeys] = useState([] as APIKey[]);
  const [showKeyValues, setShowKeyValues] = useState<Record<string, boolean>>({});

  // State for User Workspaces
  const [userStaticWorkspaces, setUserStaticWorkspaces] = useState([] as WorkspacePartial[]);
  const [userWorkspaces, setUserWorkspaces] = useState([] as WorkspacePartial[]);

  // State for editing
  const [editing, setEditing] = useState(false);

  // State for display values
  const [staticName, setStaticName] = useState("");

  // Email validation state
  const [emailError, setEmailError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [affiliationError, setAffiliationError] = useState("");

  // Email verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerificationSending, setIsVerificationSending] = useState(false);
  const [sentVerification, setSentVerification] = useState(false);

  // ORCiD linking state
  const [isOrcidLinking, setIsOrcidLinking] = useState(false);

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

  const handleResendVerificationClick = async () => {
    setIsVerificationSending(true);
    const { error } = await auth.sendVerificationEmail({ email: userEmail, callbackURL: `${APP_URL}/profile` });
    setIsVerificationSending(false);

    if (error) {
      toaster.create({
        title: "Error",
        description: "Unable to send verification email, please try again",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else {
      toaster.create({
        title: "Verification email sent",
        description: "Check your inbox for a link to verify your email",
        type: "success",
        duration: 4000,
        closable: true,
      });
      setSentVerification(true);
    }
  };

  const handleLinkOrcidClick = async () => {
    setIsOrcidLinking(true);
    const { error, data } = await auth.linkSocial({
      provider: "orcid",
      callbackURL: `${APP_URL}/profile`,
    });

    if (error) {
      toaster.create({
        title: "ORCiD Linking Error",
        description: error.message || "Unable to link ORCiD account, please try again",
        type: "error",
        duration: 4000,
        closable: true,
      });
      setIsOrcidLinking(false);
    } else if (data?.url) {
      window.location.href = data.url;
    }
  };

  const handleGenerateKeyClick = async () => {
    const result = await generateKey({
      variables: {
        scope: "edit",
        workspaces: userWorkspaces.map((w) => w._id),
      },
    }).catch(ignoreAbort);

    if (generateKeyError) {
      toaster.create({
        title: "Error",
        description: "Unable to update User information",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }

    if (result?.data?.generateKey) {
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
        refetch().catch(ignoreAbort);
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

  /**
   * Utility function to remove current user from Workspace
   * @param {string} _id Workspace identifier to remove the current user from
   */
  const removeWorkspace = async (_id: string) => {
    const workspace = userWorkspaces.find((w) => _.isEqual(w._id, _id));
    if (!workspace) return;

    const result = await leaveWorkspace({
      variables: {
        workspace: {
          _id,
          name: workspace.name,
          description: workspace.description,
          public: workspace.public,
          collaborators: workspace.collaborators.filter((c) => c !== user),
        },
      },
    });

    if (result.data?.updateWorkspace?.success) {
      setUserWorkspaces((prev) => prev.filter((w) => !_.isEqual(w._id, _id)));
    } else {
      toaster.create({
        title: "Error",
        description: "Unable to leave Workspace",
        type: "error",
        duration: 2000,
        closable: true,
      });
    }
  };

  /**
   * Utility function to mass-remove current user from Workspaces
   * @param {string[]} toRemove List of Workspace identifiers to remove the current user from
   */
  const removeWorkspaces = async (toRemove: string[]) => {
    const canLeave = userWorkspaces.filter((w) => _.includes(toRemove, w._id) && !_.isEqual(w.owner, user));

    await Promise.all(
      canLeave.map((w) =>
        leaveWorkspace({
          variables: {
            workspace: {
              _id: w._id,
              name: w.name,
              description: w.description,
              public: w.public,
              collaborators: w.collaborators.filter((c) => c !== user),
            },
          },
        }),
      ),
    );

    setUserWorkspaces((prev) => prev.filter((w) => !canLeave.some((c) => _.isEqual(c._id, w._id))));
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
              <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"} w={"100%"}>
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
              <Icon name={showValue ? "visibility_hide" : "visibility_show"} size={"xs"} />
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

  const workspacesTableColumnHelper = createColumnHelper<WorkspacePartial>();
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
      meta: { minWidth: 260 } as ColumnMeta,
    }),
    workspacesTableColumnHelper.accessor("owner", {
      cell: (info) => {
        const isOwner = _.isEqual(info.getValue(), user);
        return (
          <Tag.Root colorPalette={isOwner ? "green" : "blue"} size={"sm"}>
            <Tag.Label>{isOwner ? "Owner" : "Collaborator"}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "Role",
    }),
    workspacesTableColumnHelper.accessor("_id", {
      cell: (info) => {
        const workspace = info.row.original;
        const isOwner = _.isEqual(workspace.owner, user);
        const tooltipContent = isOwner
          ? "You cannot leave a Workspace as an Owner"
          : "You cannot leave your only Workspace";
        return (
          <Flex w={"100%"} justify={"end"} p={"0.5"}>
            <Tooltip content={tooltipContent} disabled={editing && !isOwner && userWorkspaces.length > 1} showArrow>
              <Button
                size={"2xs"}
                rounded={"md"}
                aria-label={"Leave Workspace"}
                colorPalette={"orange"}
                variant={"subtle"}
                disabled={!editing || isOwner || userWorkspaces.length === 1}
                loading={leaveWorkspaceLoading}
                onClick={() => removeWorkspace(workspace._id)}
              >
                Leave Workspace
                <Icon name={"logout"} size={"xs"} />
              </Button>
            </Tooltip>
          </Flex>
        );
      },
      header: "",
      meta: { fixedWidth: 160 } as ColumnMeta,
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
          borderColor={"gray.700"}
          bg={"gray.100"}
          rounded={"md"}
        >
          <Icon name={"person"} size={"sm"} />
          <Heading fontWeight={"semibold"} size={"sm"}>
            {staticName}
          </Heading>
        </Flex>
        {editing ? (
          <Flex direction={"row"} align={"center"} gap={"1"}>
            <Button size={"xs"} rounded={"md"} colorPalette={"red"} onClick={() => handleCancelClick()}>
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
          <Flex direction={"column"} p={"0"} gap={"1"} w={{ base: "100%", md: "40%" }}>
            {/* User details */}
            <Flex
              direction={"column"}
              p={"1"}
              gap={"1"}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
            >
              {/* Avatar */}
              <Flex direction={"column"} p={"0"} gap={"1"}>
                <Text ml={"0.5"} textAlign={"left"} fontSize={"xs"} fontWeight={"semibold"}>
                  Avatar
                </Text>
                <ActorTag identifier={`${userModel._id}`} fallback={"Unknown User"} size={"md"} avatarOnly />
              </Flex>

              {/* Name */}
              <Fieldset.Root>
                <Fieldset.Content>
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Field.Root gap={"0"}>
                      <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        First Name
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"modalUserFirstName"}
                        size={"xs"}
                        rounded={"md"}
                        placeholder={"First Name"}
                        type={"text"}
                        value={userFirstName}
                        mt={"0.5"}
                        disabled
                      />
                    </Field.Root>
                    <Field.Root gap={"0"}>
                      <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Last Name
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"modalUserLastName"}
                        size={"xs"}
                        rounded={"md"}
                        placeholder={"Last Name"}
                        type={"text"}
                        value={userLastName}
                        mt={"0.5"}
                        disabled
                      />
                    </Field.Root>
                  </Flex>
                </Fieldset.Content>
              </Fieldset.Root>

              {/* Email */}
              <Fieldset.Root>
                <Fieldset.Content gap={"1"}>
                  <Field.Root invalid={emailError !== ""} required gap={"0"}>
                    <Flex direction={"row"} align={"center"} gap={"2"} justify={"start"} w={"100%"}>
                      <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                        Email
                        <Field.RequiredIndicator />
                      </Field.Label>
                      {emailVerified ? (
                        <Tag.Root colorPalette={"green"} size={"sm"}>
                          <Tag.Label>Verified</Tag.Label>
                        </Tag.Root>
                      ) : (
                        <Flex align={"center"} gap={"1"}>
                          <Tag.Root colorPalette={"orange"} size={"sm"}>
                            <Tag.Label>Not Verified</Tag.Label>
                          </Tag.Root>
                        </Flex>
                      )}
                    </Flex>
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
                  {!emailVerified && !sentVerification && (
                    <Flex>
                      <Button
                        size={"2xs"}
                        rounded={"md"}
                        colorPalette={"orange"}
                        variant={"subtle"}
                        loading={isVerificationSending}
                        loadingText={"Sending..."}
                        onClick={handleResendVerificationClick}
                      >
                        Resend Verification Email
                        <Icon name={"email"} size={"xs"} />
                      </Button>
                    </Flex>
                  )}
                  {!emailVerified && sentVerification && (
                    <Flex>
                      <Button
                        size={"2xs"}
                        rounded={"md"}
                        colorPalette={"green"}
                        variant={"subtle"}
                        loading={isVerificationSending}
                        disabled
                      >
                        Verification Email Sent
                        <Icon name={"email"} size={"xs"} />
                      </Button>
                    </Flex>
                  )}
                </Fieldset.Content>
              </Fieldset.Root>

              {/* Affiliation */}
              <Fieldset.Root>
                <Fieldset.Content>
                  <Field.Root invalid={affiliationError !== ""} required gap={"0"}>
                    <Field.Label fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
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

              {/* ORCiD */}
              <Flex direction={"column"} p={"0"} gap={"1"}>
                <Text ml={"0.5"} textAlign={"left"} fontSize={"xs"} fontWeight={"semibold"}>
                  ORCiD
                </Text>
                <Flex align={"start"} direction={"column"} justify={"center"} gap={"1"} wrap={"wrap"}>
                  <Tag.Root colorPalette={userOrcid ? "green" : "gray"}>
                    <Tag.Label>{userOrcid || "Not Connected"}</Tag.Label>
                  </Tag.Root>
                  {!userOrcid && (
                    <Button
                      size={"2xs"}
                      rounded={"md"}
                      colorPalette={"green"}
                      variant={"subtle"}
                      onClick={handleLinkOrcidClick}
                      loading={isOrcidLinking}
                      loadingText={"Linking..."}
                    >
                      Connect ORCiD
                      <Icon name={"add"} size={"xs"} />
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          <Flex direction={"column"} p={"0"} gap={"1"} grow={"1"} w={{ base: "100%", md: "50%" }}>
            <Flex
              direction={"column"}
              p={"1"}
              gap={"1"}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
            >
              <Flex direction={"row"} p={"0"} gap={"1"} align={"center"} ml={"0.5"}>
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

        <Flex direction={"row"} gap={"1"}>
          <Flex direction={"column"} p={"0"} gap={"1"} grow={"1"} basis={"50%"}>
            {/* API options */}
            <Flex
              direction={"column"}
              p={"1"}
              gap={"1"}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
            >
              <Flex direction={"column"} p={"0"} gap={"1"}>
                <Flex direction={"row"} justify={"space-between"} align={"center"}>
                  <Flex direction={"row"} p={"0"} gap={"1"} align={"center"} ml={"0.5"}>
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
                  <DataTable
                    columns={apiKeysTableColumns}
                    data={userKeys}
                    visibleColumns={{}}
                    selectedRows={{}}
                    showPagination
                  />
                ) : (
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"key"} size={"lg"} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No API keys</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
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
