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
  Link,
  Separator,
  Box,
  AbsoluteCenter,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";

// Routing and navigation
import { useLocation, useNavigate } from "react-router-dom";

// Contexts
import { useAuthentication } from "@hooks/useAuthentication";
import { useWorkspace } from "@hooks/useWorkspace";

// Define login parameters
const clientID = "APP-BBVHCTCNDUJ4CAXV";
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const redirectURI = isLocalhost
  ? "http://127.0.0.1:8080/login"
  : "https://app.metadatify.com/login";
const requestURI = `https://orcid.org/oauth/authorize?client_id=${clientID}&response_type=code&scope=openid&redirect_uri=${redirectURI}`;

const useParameters = () => {
  // Get URL query parameters
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const Login = () => {
  const toast = useToast();

  const { token, login } = useAuthentication();
  const { activateWorkspace } = useWorkspace();

  const parameters = useParameters();
  const navigate = useNavigate();

  // Login state
  const [isLoading, setIsLoading] = useState(false);

  // Extract query parameters
  const accessCode = parameters.get("code");

  /**
   * Run the login operation, receiving a login code from the ORCiD API, then attempting to execute
   * the login operation on the backend
   * @param code Code provided as parameter of redirect URI
   */
  const runLogin = async (code: string) => {
    setIsLoading(true);
    const result = await login(code);

    if (result.success) {
      // If successful login, check if setup is completed
      setIsLoading(false);

      if (token.setup === true) {
        // Navigate to the dashboard after activating a Workspace
        await activateWorkspace("");
        navigate("/");
      } else {
        // Navigate to the Setup interface
        navigate("/setup");
      }
    } else {
      setIsLoading(false);

      // Provide error information
      if (
        result.message.includes("Unable") &&
        !toast.isActive("login-graphql-error-toast")
      ) {
        toast({
          id: "login-graphql-error-toast",
          title: "Login Error",
          status: "error",
          description: result.message,
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      } else if (
        result.message.includes("access") &&
        !toast.isActive("login-access-error-toast")
      ) {
        toast({
          id: "login-access-error-toast",
          title: "Access Unavailable",
          status: "info",
          description: (
            <Flex direction={"column"}>
              <Link href={"https://forms.gle/q4GL4gF1bamem3DA9"} isExternal>
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Text fontWeight={"semibold"}>Join the waitlist here</Text>
                  <Icon name={"a_right"} />
                </Flex>
              </Link>
            </Flex>
          ),
          duration: null,
          position: "bottom-right",
          isClosable: true,
        });
      }
    }
  };

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
   * Utility function to examine the login state, as a composition of other states,
   * and navigate the user accordingly
   */
  const checkLoginState = async () => {
    if (accessCode && token.token === "") {
      // Not authenticated, no interest in setup yet
      runLogin(accessCode);
    } else if (token.token !== "" && token.setup === false) {
      // Authenticated but not setup
      navigate("/setup");
    } else if (token.token !== "" && token.setup === true) {
      // Authenticated and setup
      await activateWorkspace("");
      navigate("/");
    }
  };

  // On the page load, evaluate the login state components
  useEffect(() => {
    checkLoginState();
  }, []);

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
        h={"80vh"} // Header is 10vh, so 90vh - 10vh = 80vh
        wrap={"wrap"}
      >
        <Flex direction={"column"} gap={"4"}>
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
                colorPalette={"gray"}
                gap={"4"}
                onClick={onLoginClick}
                isLoading={isLoading}
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
                <Separator />
                <AbsoluteCenter bg={"white"} color={"gray.500"} px={"4"}>
                  or
                </AbsoluteCenter>
              </Box>

              <Button colorPalette={"gray"} gap={"4"} disabled>
                More sign in options coming soon.
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Login;
