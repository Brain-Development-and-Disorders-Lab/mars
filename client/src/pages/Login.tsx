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
  Input,
  Field,
  FieldLabel,
  Fieldset,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Routing and navigation
import { useLocation, useNavigate } from "react-router-dom";

// Hooks
import { useAuthentication } from "@hooks/useAuthentication";
import { auth } from "@lib/auth";
import { useWorkspace } from "@hooks/useWorkspace";

// Utility imports
import consola from "consola";

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
        const workspaceResult = await activateWorkspace("");
        if (workspaceResult.message === "No Workspaces exist") {
          navigate("/create/workspace");
        } else if (workspaceResult.success) {
          navigate("/");
        } else {
          navigate("/");
        }
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
      const workspaceResult = await activateWorkspace("");
      if (workspaceResult.message === "No Workspaces exist") {
        navigate("/create/workspace");
      } else if (workspaceResult.success) {
        navigate("/");
      } else {
        navigate("/");
      }
    }
  };

  // On the page load, evaluate the login state components
  useEffect(() => {
    checkLoginState();
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailLoginLoading, setIsEmailLoginLoading] = useState(false);

  const newLogin = async () => {
    consola.info("Running new login...");
    setIsEmailLoginLoading(true);
    const { data, error } = await auth.signIn.email(
      {
        email,
        password,
        callbackURL: "/",
        rememberMe: false,
      },
      {},
    );
  };

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
        h={"80vh"}
        wrap={"wrap"}
      >
        <Flex direction={"column"} gap={"4"}>
          <Flex
            direction={"column"}
            p={"8"}
            gap={"6"}
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

              <Text fontWeight={"semibold"} fontSize={"xs"} color={"gray.500"}>
                Use one of the sign in options below to get started.
              </Text>
            </Flex>

            <Flex direction={"column"} w={"100%"} gap={"2"} pt={"4"}>
              <Flex direction={"column"} gap={"2"}>
                <Fieldset.Root>
                  <Field.Root gap={"0.5"} required>
                    <FieldLabel fontSize={"xs"}>
                      Email
                      <Field.RequiredIndicator />
                    </FieldLabel>
                    <Input
                      rounded={"md"}
                      size={"xs"}
                      value={email}
                      placeholder={"Email"}
                      disabled={isEmailLoginLoading}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </Field.Root>

                  <Field.Root gap={"0.5"} required>
                    <FieldLabel fontSize={"xs"}>
                      Password
                      <Field.RequiredIndicator />
                    </FieldLabel>
                    <Input
                      type={"password"}
                      rounded={"md"}
                      size={"xs"}
                      value={password}
                      placeholder={"Password"}
                      disabled={isEmailLoginLoading}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </Field.Root>

                  <Button
                    size={"sm"}
                    rounded={"md"}
                    colorScheme={"green"}
                    disabled={email === "" || password === ""}
                    onClick={() => newLogin()}
                    loading={isEmailLoginLoading}
                    loadingText={"Logging in..."}
                  >
                    Login
                    <Icon size={"xs"} name={"c_right"} />
                  </Button>
                </Fieldset.Root>
              </Flex>

              <Box position={"relative"} p={"4"}>
                <Separator />
                <AbsoluteCenter bg={"white"} color={"gray.500"} px={"4"}>
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    or
                  </Text>
                </AbsoluteCenter>
              </Box>

              <Button
                id={"orcidLoginButton"}
                variant={"subtle"}
                onClick={onLoginClick}
                loading={isLoading}
                disabled={isEmailLoginLoading}
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
            </Flex>

            <Spacer />

            <Flex direction={"column"} gap={"2"} align={"center"} w={"100%"}>
              <Text fontWeight={"semibold"} fontSize={"xs"} color={"gray.500"}>
                Don't have an account yet?
              </Text>

              <Button
                w={"100%"}
                size={"sm"}
                rounded={"md"}
                colorScheme={"green"}
                onClick={() => navigate("/signup")}
              >
                Create Account
                <Icon size={"xs"} name={"add"} />
              </Button>
            </Flex>

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
