// React
import React, { useEffect, useMemo, useState } from "react";

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
import { useLocation, useNavigate } from "react-router-dom";

// Utility functions and libraries
import { gql, useMutation } from "@apollo/client";
import _ from "lodash";

// Existing and custom types
import { IResponseMessage } from "@types";

// Contexts
import { useAuthentication } from "src/hooks/useAuthentication";
import { useWorkspace } from "src/hooks/useWorkspace";

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

const Login = () => {
  const toast = useToast();
  const { login } = useAuthentication();
  const { activateWorkspace } = useWorkspace();

  const parameters = useParameters();
  const navigate = useNavigate();

  // Extract query parameters
  const accessCode = parameters.get("code");

  // User configured state
  const [showSetup] = useState(false);

  // User information state
  const [userOrcid] = useState("");
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
    updateUser: IResponseMessage;
  }>(UPDATE_USER);

  const runLogin = async (code: string) => {
    const result = await login(code);

    if (result.success) {
      // Activate a Workspace and navigate to the Dashboard
      await activateWorkspace("");
      navigate("/");
    } else {
      if (!toast.isActive("login-graphql-error-toast")) {
        toast({
          id: "login-graphql-error-toast",
          title: "Login Error",
          status: "error",
          description: "Could not authenticate with ORCiD",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
    }
  };

  // On the page load, check if access code has been included in the URL
  useEffect(() => {
    if (accessCode) {
      runLogin(accessCode);
    }
  }, []);

  /**
   * Wrapper function to handle login flow
   */
  const onLoginClick = async () => {
    if (process.env.NODE_ENV === "development") {
      // If in a development environment, bypass the ORCiD login
      await runLogin("");
    } else {
      // In production, navigate to the API login URI
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
      // setIsSetup(result.data.updateUser.success);
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
          <Image src={"/Favicon.png"} w={"25px"} h={"25px"} />
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
            p={"8"}
            gap={"4"}
            bg={"white"}
            align={"center"}
            justify={"center"}
            border={"1px"}
            borderColor={"gray.300"}
            rounded={"md"}
          >
            <Heading size={"xl"} fontWeight={"semibold"}>
              Create your account
            </Heading>

            <Text fontWeight={"semibold"} fontSize={"sm"}>
              Complete your account information before continuing.
            </Text>

            <Flex
              direction={"row"}
              gap={"2"}
              w={"100%"}
              align={"center"}
              justify={"left"}
              pt={"8"}
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
                  id={"orcidLoginButton"}
                  colorScheme={"gray"}
                  gap={"4"}
                  onClick={onLoginClick}
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
