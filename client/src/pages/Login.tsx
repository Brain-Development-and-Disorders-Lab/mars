// React
import React, { FC, useContext, useEffect, useMemo, useState } from "react";

// Existing and custom components
import {
  Flex,
  Heading,
  Button,
  Image,
  Text,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Tag,
  Alert,
  AlertIcon,
  AlertDescription,
  Link,
  Divider,
  Box,
  AbsoluteCenter,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";

// Routing and navigation
import { useLocation, useSearchParams } from "react-router-dom";

// Utility functions and libraries
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { useToken } from "src/authentication/useToken";
import _ from "lodash";

// Existing and custom types
import { LoginProps, ResponseMessage, UserModel, WorkspaceModel } from "@types";

// Workspace context
import { WorkspaceContext } from "src/Context";

// Define login parameters
const clientID = "APP-BBVHCTCNDUJ4CAXV";
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const redirectURI = isLocalhost
  ? "http://127.0.0.1:8080"
  : "https://app.metadatify.com";
const requestURI = `https://orcid.org/oauth/authorize?client_id=${clientID}&response_type=code&scope=openid&redirect_uri=${redirectURI}`;

const useParameters = () => {
  // Get URL query parameters
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const Login: FC<LoginProps> = ({ setAuthenticated }) => {
  const toast = useToast();

  // Enable authentication modification
  const [token, setToken] = useToken();

  const parameters = useParameters();

  // Extract query parameters
  const accessCode = parameters.get("code");

  // Access parameters to remove code after authentication
  const [searchParams, setSearchParams] = useSearchParams();

  // User configured state
  const [showSetup, setShowSetup] = useState(false);
  const [isSetup, setIsSetup] = useState(false);

  // User information state
  const [userOrcid, setUserOrcid] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAffiliation, setUserAffiliation] = useState("");
  const isUserComplete =
    userOrcid !== "" &&
    userFirstName !== "" &&
    userLastName !== "" &&
    userEmail !== "" &&
    userAffiliation !== "";

  // Remove the "code" search parameter upon login
  const removeCode = () => {
    if (searchParams.has("code")) {
      searchParams.delete("code");
      setSearchParams(searchParams);
    }
  };

  // Queries
  const LOGIN_DATA = gql`
    query PerformLogin($code: String) {
      login(code: $code) {
        orcid
        name
        token
      }
    }
  `;
  const [doLogin, { loading, error }] = useLazyQuery(LOGIN_DATA);

  // Query to retrieve Workspaces
  const GET_WORKSPACES = gql`
    query GetWorkspaces {
      workspaces {
        _id
        owner
        name
        description
      }
    }
  `;
  const [getWorkspaces, { error: workspacesError }] = useLazyQuery<{
    workspaces: WorkspaceModel[];
  }>(GET_WORKSPACES);

  // Query to retrieve User
  const GET_USER = gql`
    query GetUser($_id: String) {
      user(_id: $_id) {
        _id
        firstName
        lastName
        email
        affiliation
      }
    }
  `;
  const [getUser, { error: userError }] = useLazyQuery<{ user: UserModel }>(
    GET_USER,
  );

  // Query to update User
  const UPDATE_USER = gql`
    mutation UpdateUser($user: UserInput) {
      updateUser(user: $user) {
        success
        message
      }
    }
  `;
  const [updateUser, { error: userUpdateError }] = useMutation<{
    updateUser: ResponseMessage;
  }>(UPDATE_USER);

  // Workspace context
  const { setWorkspace } = useContext(WorkspaceContext);

  // Respond to `isSetup` state
  useEffect(() => {
    if (isSetup === true) {
      // Set the authentication status
      setAuthenticated(true);
    }
  }, [isSetup]);

  /**
   * Utility function to perform a Login operation
   * @param code String returned by ORCID API for login
   */
  const getLogin = async (code: string) => {
    // Query to retrieve Entity data and associated data for editing
    const loginResponse = await doLogin({ variables: { code: code } });

    // Perform login and data retrieval via server, check if user permitted access
    if (loginResponse.data?.login) {
      removeCode();

      // Store the User ORCiD
      setUserOrcid(loginResponse.data.login.orcid);

      // Create a new token instance with an empty Workspace value
      setToken({
        ...loginResponse.data.login,
        workspace: "",
      });

      // Retrieve all Workspaces and update the token if Workspaces exist
      const workspacesResponse = await getWorkspaces();
      if (
        workspacesResponse.data?.workspaces &&
        workspacesResponse.data.workspaces.length > 0
      ) {
        // Update the token with an active Workspace if the user is a member of a Workspace
        setToken({
          ...loginResponse.data.login,
          workspace: workspacesResponse.data.workspaces[0]._id,
        });

        // Update the Workspace context
        setWorkspace(workspacesResponse.data.workspaces[0]._id);
      }

      // Retrieve the User information and display the setup form if information missing
      const userResponse = await getUser({
        variables: {
          _id: loginResponse.data.login.orcid,
        },
      });

      if (userResponse.data?.user) {
        // Examine the user data and show setup if incomplete
        const user: Partial<UserModel> = userResponse.data.user;
        if (
          user.firstName === "" ||
          user.lastName === "" ||
          user.email === "" ||
          user.affiliation === ""
        ) {
          setShowSetup(true);
        } else {
          setAuthenticated(true);
        }
      }

      if (workspacesError) {
        toast({
          title: "Warning",
          status: "warning",
          description: "Unable to retrieve Workspaces",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }

      if (userError) {
        toast({
          title: "Warning",
          status: "warning",
          description: "Unable to retrieve User data",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
    }
  };

  useEffect(() => {
    // Handle potential errors when using ORCiD
    if (error) {
      toast({
        title: "Login Error",
        status: "error",
        description: "Could not authenticate with ORCiD",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setAuthenticated(false);
    }
  }, [error]);

  // Check if token exists
  useEffect(() => {
    if ((_.isUndefined(token) || _.isEqual(token.token, "")) && accessCode) {
      getLogin(accessCode);
    }
  }, []);

  /**
   * Wrapper function to handle login flow
   */
  const onLoginClick = async () => {
    if (process.env.NODE_ENV !== "production") {
      // If in a development environment, bypass the ORCiD login
      await getLogin("");
    } else {
      window.location.href = requestURI;
    }
  };

  /**
   * Handle the "Done" button being clicked after user information is entered
   */
  const handleUserDone = async () => {
    const result = await updateUser({
      variables: {
        user: {
          _id: userOrcid,
          firstName: userFirstName,
          lastName: userLastName,
          email: userEmail,
          affiliation: userAffiliation,
        },
      },
    });

    if (result.data?.updateUser) {
      setIsSetup(result.data.updateUser.success);
    }

    if (userUpdateError) {
      toast({
        title: "Error",
        status: "error",
        description: "Failed to update User information",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  return (
    <Content>
      <Flex h={"10vh"} p={"4"}>
        <Flex gap={"2"} align={"center"} p={"4"}>
          <Image src={"Favicon.png"} w={"25px"} h={"25px"} />
          <Heading size={"md"}>Metadatify</Heading>
        </Flex>
      </Flex>
      <Flex
        direction={"column"}
        justify={"center"}
        align={"center"}
        alignSelf={"center"}
        gap={"8"}
        w={["sm", "md", "lg"]}
        h={"90vh"}
        wrap={"wrap"}
      >
        {showSetup ? (
          <Flex
            direction={"column"}
            p={"4"}
            gap={"4"}
            bg={"white"}
            rounded={"lg"}
            border={"1px"}
            borderColor={"gray.300"}
            align={"center"}
            justify={"center"}
          >
            <Flex direction={"row"} gap={"2"} align={"center"}>
              <Image src="/Favicon.png" boxSize={"64px"} />
              <Heading size={"lg"} fontWeight={"semibold"}>
                Metadatify
              </Heading>
            </Flex>
            <Heading size={"md"}>Create your account</Heading>
            <Text fontWeight={"semibold"} color={"gray.400"}>
              Please provide the following information to complete your user
              profile.
            </Text>
            <Flex
              direction={"row"}
              gap={"2"}
              w={"100%"}
              align={"center"}
              justify={"left"}
            >
              <Text fontWeight={"semibold"}>ORCiD:</Text>
              <Tag colorScheme={"green"}>{userOrcid}</Tag>
            </Flex>
            <FormControl isRequired>
              <Flex direction={"column"} gap={"2"}>
                <Flex direction={"row"} gap={"2"}>
                  <Flex direction={"column"} w={"100%"}>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      id={"userFirstNameInput"}
                      size={"sm"}
                      rounded={"md"}
                      value={userFirstName}
                      onChange={(event) => setUserFirstName(event.target.value)}
                    />
                  </Flex>
                  <Flex direction={"column"} w={"100%"}>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      id={"userLastNameInput"}
                      size={"sm"}
                      rounded={"md"}
                      value={userLastName}
                      onChange={(event) => setUserLastName(event.target.value)}
                    />
                  </Flex>
                </Flex>
                <Flex direction={"column"} gap={"2"}>
                  <Flex direction={"column"}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      id={"userEmailInput"}
                      size={"sm"}
                      rounded={"md"}
                      type={"email"}
                      value={userEmail}
                      onChange={(event) => setUserEmail(event.target.value)}
                    />
                  </Flex>
                  <Flex direction={"column"}>
                    <FormLabel>Affiliation</FormLabel>
                    <Input
                      id={"userAffiliationInput"}
                      size={"sm"}
                      rounded={"md"}
                      value={userAffiliation}
                      onChange={(event) =>
                        setUserAffiliation(event.target.value)
                      }
                    />
                  </Flex>
                </Flex>
              </Flex>
            </FormControl>
            <Flex align={"center"} justify={"right"} w={"100%"}>
              <Button
                id={"userDoneButton"}
                rightIcon={<Icon name={"check"} />}
                colorScheme={"green"}
                size={"sm"}
                onClick={() => handleUserDone()}
                isDisabled={!isUserComplete}
              >
                Done
              </Button>
            </Flex>
          </Flex>
        ) : (
          <Flex direction={"column"} gap={"4"}>
            <Alert status={"info"}>
              <AlertIcon />
              <AlertDescription>
                Metadatify is in preview and is currently only available to a
                small group of users.
                <Link href={"https://forms.gle/q4GL4gF1bamem3DA9"} isExternal>
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Text fontWeight={"semibold"}>Join the waitlist here</Text>
                    <Icon name={"a_right"} />
                  </Flex>
                </Link>
              </AlertDescription>
            </Alert>

            <Flex
              direction={"column"}
              p={"8"}
              gap={"4"}
              h={"md"}
              bg={"white"}
              align={"center"}
              justify={"center"}
              border={"1px"}
              borderColor={"gray.300"}
              rounded={"md"}
            >
              <Heading size={"xl"} fontWeight={"semibold"}>
                Sign in
              </Heading>

              <Text fontWeight={"semibold"} fontSize={"sm"}>
                Get started with one of the sign in options below.
              </Text>

              <Flex direction={"column"} gap={"2"} pt={"8"}>
                <Button
                  colorScheme={"gray"}
                  gap={"4"}
                  onClick={onLoginClick}
                  isLoading={loading}
                  loadingText={"Logging in..."}
                >
                  <Image
                    src={
                      "https://orcid.org/sites/default/files/images/orcid_16x16.png"
                    }
                  />
                  Sign in with ORCiD
                </Button>

                <Box position={"relative"} p={"4"}>
                  <Divider />
                  <AbsoluteCenter bg={"white"} color={"gray.500"} px={"4"}>
                    or
                  </AbsoluteCenter>
                </Box>

                <Button colorScheme={"gray"} gap={"4"} isDisabled>
                  More sign in options coming soon.
                </Button>
              </Flex>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Content>
  );
};

export default Login;
