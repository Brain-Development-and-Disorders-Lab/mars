import React, { useState, useEffect } from "react";
import {
  Flex,
  Heading,
  Button,
  Image,
  Text,
  Separator,
  Box,
  AbsoluteCenter,
  Spacer,
  Input,
  Field,
  FieldLabel,
  Fieldset,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Authentication
import { auth } from "@lib/auth";

// Variables
import { APP_URL, GLOBAL_STYLES } from "@variables";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailLoginLoading, setIsEmailLoginLoading] = useState(false);
  const [isOrcidLoading, setIsOrcidLoading] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get("error");

      // Handle OAuth errors
      if (error) {
        toaster.create({
          title: "ORCiD Authentication Error",
          description: "Unable to authenticate with ORCiD. Please try again.",
          type: "error",
          duration: 4000,
          closable: true,
        });
        window.history.replaceState({}, document.title, "/login");
        return;
      }

      // Check if user is already logged in
      const { data: session } = await auth.getSession();

      if (session?.user) {
        // User is logged in, check if profile is complete
        if (session.user.email?.endsWith("@orcid.placeholder")) {
          // ORCiD login found no existing account, so delete the orphaned
          // placeholder account
          await auth.deleteUser();
          window.history.replaceState({}, document.title, "/login");
          toaster.create({
            title: "No Account Found",
            description:
              "No account is linked to this ORCiD. Please sign up first, or log in with email and password and link ORCiD from Account Settings.",
            type: "error",
            duration: 6000,
            closable: true,
          });
        } else {
          // Profile complete, redirect to dashboard
          window.history.replaceState({}, document.title, "/login");
          navigate("/");
        }
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const onEmailLoginClick = async () => {
    setIsEmailLoginLoading(true);
    const { error } = await auth.signIn.email({
      email,
      password,
      callbackURL: "/",
      rememberMe: false,
    });
    setIsEmailLoginLoading(false);

    if (error) {
      toaster.create({
        title: "Authentication Error",
        description: "Unable to authenticate user. Please log in again.",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else {
      navigate("/");
    }
  };

  const onOrcidLoginClick = async () => {
    setIsOrcidLoading(true);
    const { error, data } = await auth.signIn.social({
      provider: "orcid",
      callbackURL: `${APP_URL}/login`,
    });

    if (error) {
      toaster.create({
        title: "ORCiD Authentication Error",
        description: error.message || "Unable to authenticate with ORCiD. Please try again.",
        type: "error",
        duration: 4000,
        closable: true,
      });
      setIsOrcidLoading(false);
    } else if (data?.url) {
      window.location.href = data.url;
    }
  };

  const checkKeyboardLogin = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.key === "Enter" && email !== "" && password !== "") {
      onEmailLoginClick();
    }
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
        onKeyUp={(event) => checkKeyboardLogin(event)}
      >
        <Flex direction={"column"} gap={"4"}>
          <Flex
            direction={"column"}
            p={"8"}
            gap={"6"}
            bg={"white"}
            align={"center"}
            justify={"center"}
            border={GLOBAL_STYLES.border.style}
            borderColor={GLOBAL_STYLES.border.color}
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
                      id={"userEmailInput"}
                      rounded={"md"}
                      size={"xs"}
                      value={email}
                      placeholder={"Email"}
                      disabled={isEmailLoginLoading || isOrcidLoading}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </Field.Root>

                  <Field.Root gap={"0.5"} required>
                    <FieldLabel fontSize={"xs"}>
                      Password
                      <Field.RequiredIndicator />
                    </FieldLabel>
                    <Input
                      id={"userPasswordInput"}
                      type={"password"}
                      rounded={"md"}
                      size={"xs"}
                      value={password}
                      placeholder={"Password"}
                      disabled={isEmailLoginLoading || isOrcidLoading}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <Text
                      fontSize={"xs"}
                      color={"gray.400"}
                      fontWeight={"semibold"}
                      cursor={"pointer"}
                      _hover={{ color: "gray.600" }}
                      alignSelf={"flex-end"}
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot password?
                    </Text>
                  </Field.Root>

                  <Button
                    id={"userLoginButton"}
                    size={"xs"}
                    rounded={"md"}
                    colorScheme={"green"}
                    disabled={email === "" || password === "" || isOrcidLoading}
                    onClick={onEmailLoginClick}
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
                onClick={onOrcidLoginClick}
                loading={isOrcidLoading}
                disabled={isEmailLoginLoading}
                loadingText={"Redirecting to ORCiD..."}
                size={"xs"}
                gap={"1"}
                rounded={"md"}
                colorPalette={"green"}
              >
                Sign in with ORCiD
                <Image src={"https://orcid.org/sites/default/files/images/orcid_16x16.png"} />
              </Button>
            </Flex>

            <Spacer />

            <Flex direction={"column"} gap={"2"} align={"center"} w={"100%"}>
              <Text fontWeight={"semibold"} fontSize={"xs"} color={"gray.500"}>
                Don't have an account yet?
              </Text>
              <Button
                id={"createAccountButton"}
                w={"100%"}
                size={"xs"}
                rounded={"md"}
                colorScheme={"green"}
                onClick={() => navigate("/signup")}
              >
                Create Account
                <Icon size={"xs"} name={"add"} />
              </Button>
            </Flex>

            <Flex direction={"row"} gap={"2"} align={"center"} justify={"center"}>
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
