// React and Chakra UI components
import React, { useEffect, useState } from "react";
import {
  Flex,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  useToast,
  Heading,
  Tooltip,
  useBreakpoint,
  IconButton,
  Tag,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";

// Custom components
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";

// Custom types
import {
  DataTableAction,
  IGenericItem,
  IResponseMessage,
  UserModel,
} from "@types";

// GraphQL imports
import { gql, useMutation, useQuery } from "@apollo/client";

// Authentication context
import { useAuthentication } from "@hooks/useAuthentication";

// Utility functions and libraries
import _ from "lodash";

const User = () => {
  const toast = useToast();
  const breakpoint = useBreakpoint();

  // Authentication
  const { token, setToken } = useAuthentication();

  // Query to get a User and Workspaces
  const GET_USER = gql`
    query GetUser($_id: String) {
      user(_id: $_id) {
        _id
        firstName
        lastName
        email
        affiliation
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

  useEffect(() => {
    if (data?.user) {
      setUserModel(data.user);

      setUserOrcid(data.user._id);
      setUserFirstName(data.user.firstName);
      setUserLastName(data.user.lastName);
      setUserEmail(data.user.email);
      setUserAffiliation(data.user.affiliation);
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
      toast({
        title: "Error",
        description: "Unable to update User information",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } else {
      // Update the displayed name
      setStaticName(`${userFirstName} ${userLastName}`);

      // Update the token data
      const updatedToken = _.cloneDeep(token);
      updatedToken.name = `${userFirstName} ${userLastName}`;
      setToken(updatedToken);
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
          <Tooltip label={info.getValue()} hasArrow>
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
            label={"You cannot leave your only Workspace"}
            isDisabled={userWorkspaces.length > 1}
            hasArrow
          >
            <Flex w={"100%"} justify={"end"} p={"0.5"}>
              <IconButton
                icon={<Icon name={"b_right"} />}
                size={"sm"}
                aria-label={"Leave Workspace"}
                colorScheme={"orange"}
                isDisabled={!editing || userWorkspaces.length === 1}
                onClick={() => {
                  removeWorkspace(info.row.original._id);
                }}
              />
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
              colorScheme={"red"}
              rightIcon={<Icon name={"cross"} />}
              onClick={() => handleCancelClick()}
            >
              Cancel
            </Button>
            <Button
              id={"userDoneButton"}
              size={"sm"}
              colorScheme={"green"}
              rightIcon={<Icon name={"check"} />}
              isLoading={userUpdateLoading}
              onClick={() => handleUpdateClick()}
            >
              Done
            </Button>
          </Flex>
        ) : (
          <Button
            size={"sm"}
            colorScheme={"blue"}
            rightIcon={<Icon name={"edit"} />}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
      </Flex>

      <Flex direction={"column"} gap={"2"} p={"2"}>
        <Flex direction={"row"} gap={"2"}>
          <Flex direction={"column"} p={"0"} gap={"2"} grow={"1"} basis={"50%"}>
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
                <FormControl>
                  <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                    ORCiD
                  </FormLabel>
                  <Tag colorScheme={"green"}>{userOrcid}</Tag>
                </FormControl>
              </Flex>
              <Flex direction={"row"} p={"0"} gap={"2"}>
                <FormControl isRequired>
                  <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                    Email
                  </FormLabel>
                  <Input
                    id={"modalUserEmail"}
                    size={"sm"}
                    rounded={"md"}
                    placeholder={"Email"}
                    type={"email"}
                    value={userEmail}
                    isDisabled={!editing}
                    onChange={(event) => setUserEmail(event.target.value)}
                  />
                </FormControl>
              </Flex>
              <Flex direction={"row"} p={"0"} gap={"2"}>
                <FormControl isRequired>
                  <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                    Affiliation
                  </FormLabel>
                  <Input
                    id={"modalUserAffiliation"}
                    size={"sm"}
                    rounded={"md"}
                    placeholder={"Affiliation"}
                    value={userAffiliation}
                    isDisabled={!editing}
                    onChange={(event) => setUserAffiliation(event.target.value)}
                  />
                </FormControl>
              </Flex>
            </Flex>
          </Flex>

          <Flex direction={"column"} p={"0"} gap={"2"} grow={"1"} basis={"50%"}>
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                Workspaces
              </FormLabel>
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
      </Flex>
    </Content>
  );
};

export default User;
