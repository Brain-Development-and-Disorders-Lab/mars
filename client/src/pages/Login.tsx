// React
import React, { useEffect, useMemo, useState } from "react";

// Existing and custom components
import {
  Flex,
  Heading,
  Button,
  Image,
  Text,
  Link,
  Separator,
  Box,
  AbsoluteCenter,
  Spacer,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

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
        !toaster.isVisible("login-graphql-error-toast")
      ) {
        toaster.create({
          id: "login-graphql-error-toast",
          title: "Login Error",
          type: "error",
          description: result.message,
          duration: 4000,
          closable: true,
        });
      } else if (
        result.message.includes("access") &&
        !toaster.isVisible("login-access-error-toast")
      ) {
        toaster.create({
          id: "login-access-error-toast",
          title: "Access Unavailable",
          type: "info",
          description: (
            <Flex direction={"column"}>
              <Link
                href={"https://forms.gle/q4GL4gF1bamem3DA9"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Text fontWeight={"semibold"}>Join the waitlist here</Text>
                  <Icon name={"a_right"} />
                </Flex>
              </Link>
            </Flex>
          ),
          closable: true,
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
          <Heading size={"md"} color={"primary"}>
            Metadatify
          </Heading>
        </Flex>
      </Flex>
      <Flex
        direction={"column"}
        justify={"center"}
        align={"center"}
        alignSelf={"center"}
        gap={"8"}
        w={["sm", "md", "lg"]}
        h={"80vh"}
        wrap={"wrap"}
      >
        <Flex direction={"column"} gap={"4"}>
          <Flex
            direction={"column"}
            p={"8"}
            gap={"6"}
            h={"md"}
            bg={"white"}
            align={"center"}
            justify={"center"}
            border={"1px solid"}
            borderColor={"gray.200"}
            rounded={"lg"}
            shadow={"sm"}
          >
            <Flex direction={"column"} gap={"2"} align={"center"}>
              <Image src={"/Favicon.png"} w={"35px"} h={"35px"} />
              <Heading size={"2xl"} fontWeight={"semibold"}>
                Sign in
              </Heading>

              <Text fontWeight={"semibold"} fontSize={"sm"} color={"gray.500"}>
                Use one of the sign in options below to get started.
              </Text>
            </Flex>

            <Flex direction={"column"} gap={"2"} pt={"8"}>
              <Button
                id={"orcidLoginButton"}
                variant={"subtle"}
                onClick={onLoginClick}
                loading={isLoading}
                loadingText={"Logging in..."}
                size={"sm"}
                rounded={"md"}
                colorPalette={"green"}
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
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    or
                  </Text>
                </AbsoluteCenter>
              </Box>

              <Button
                variant={"subtle"}
                colorPalette={"gray"}
                disabled
                size={"sm"}
                opacity={0.8}
                rounded={"md"}
              >
                <Icon name={"clock"} size={"xs"} />
                More sign in options coming soon.
              </Button>
            </Flex>

            <Spacer />

            {/* Version number */}
            <Flex
              direction={"row"}
              gap={"2"}
              align={"center"}
              justify={"center"}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.400"}>
                v{process.env.VERSION}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Login;
