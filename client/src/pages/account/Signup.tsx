// React
import React, { useState, useEffect } from "react";

// Existing and custom components
import {
  Flex,
  Heading,
  Button,
  Image,
  Input,
  Fieldset,
  Field,
  Select,
  createListCollection,
  Text,
  Separator,
  Box,
  AbsoluteCenter,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Authentication imports
import { auth } from "@lib/auth";

// Navigation and routing
import { useNavigate } from "react-router-dom";

// Utility imports
import { isValidEmail } from "@lib/util";
import dayjs from "dayjs";

// Variables
import { APP_URL, GLOBAL_STYLES } from "@variables";

// Analytics
import posthog from "posthog-js";

// Custom types
import { IResponseMessage } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

// "signup" for new email accounts, "complete" for third-party accounts that need profile info
type SignupPageMode = "loading" | "signup" | "complete";

// GraphQL mutation to update an existing user record during profile completion
const UPDATE_USER = gql`
  mutation UpdateUser($user: UserInput) {
    updateUser(user: $user) {
      success
      message
    }
  }
`;

// Available affiliation options for the selection dropdown
const affiliationCollection = createListCollection({
  items: [
    { label: "No Affiliation", value: "No Affiliation" },
    { label: "Washington University in St. Louis", value: "Washington University in St. Louis" },
  ],
});

const Signup = () => {
  const navigate = useNavigate();

  // GraphQL mutation hook
  const [updateUser, { loading: updateUserLoading }] = useMutation<{
    updateUser: IResponseMessage;
  }>(UPDATE_USER);

  // Page mode resolves from "loading" once the session check completes
  const [mode, setMode] = useState<SignupPageMode>("loading");

  // Session-derived identifiers, only populated in complete profile mode
  const [userId, setUserId] = useState("");
  const [provider, setProvider] = useState("");

  // User information state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");

  // Email validation state
  const [emailError, setEmailError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Password state, signup mode only
  const [initialPassword, setInitialPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Determine the page mode from the current session state
  useEffect(() => {
    auth.getSession().then(({ data }) => {
      if (!data) {
        setMode("signup");
        return;
      }
      if (data.user.completedProfile !== false) {
        navigate("/");
        return;
      }
      setMode("complete");
      setUserId(data.user.id);
      if (data.user.account_orcid) {
        setProvider("orcid");
      }
      // Pre-fill name from the third-party provider if available
      if (data.user.name) {
        const spaceIndex = data.user.name.indexOf(" ");
        if (spaceIndex !== -1) {
          setFirstName(data.user.name.slice(0, spaceIndex));
          setLastName(data.user.name.slice(spaceIndex + 1));
        } else {
          setFirstName(data.user.name);
        }
      }
    });
  }, []);

  /**
   * Validate email format and update validation state
   * @param {string} value Entered email address
   */
  const validateEmail = (value: string) => {
    const isValid = isValidEmail(value);
    setIsEmailValid(isValid);
    setEmailError(value === "" || isValid ? "" : "Please enter a valid email address");
  };

  /**
   * Validate password match and update validation state
   * @param {string} password Confirmed password string
   */
  const validatePassword = (password: string) => {
    setConfirmPassword(password);
    setIsPasswordValid(password !== "" && password === initialPassword);
  };

  // All required fields are populated and valid
  const isFormComplete =
    firstName !== "" &&
    lastName !== "" &&
    email !== "" &&
    isEmailValid &&
    affiliation !== "" &&
    (mode === "complete" || isPasswordValid);

  /**
   * Handle ORCiD signup button click, redirect to ORCiD authentication
   */
  const onOrcidSignupClick = async () => {
    setIsLoading(true);
    const { error, data } = await auth.signIn.social({
      provider: "orcid",
      callbackURL: `${APP_URL}/signup`,
    });
    if (error) {
      toaster.create({
        title: "ORCiD Authentication Error",
        description: error.message || "Unable to authenticate with ORCiD. Please try again.",
        type: "error",
        duration: 4000,
        closable: true,
      });
      setIsLoading(false);
    } else if (data?.url) {
      window.location.href = data.url;
    }
  };

  /**
   * Handle email and password signup form submission
   */
  const onSignupClick = async () => {
    setIsLoading(true);
    await auth.signUp.email(
      {
        email,
        name: `${firstName} ${lastName}`,
        password: initialPassword,
        firstName,
        lastName,
        affiliation,
        lastLogin: dayjs(Date.now()).toISOString(),
        api_keys: JSON.stringify([]),
        account_orcid: "",
        completedProfile: true,
        callbackURL: `${APP_URL}/login`,
        hasSeenWalkthrough: false,
      },
      {
        onSuccess: () => {
          setIsLoading(false);
          posthog.capture("client.auth.signup_complete", { method: "email" });
          toaster.create({
            title: "Create Account",
            type: "success",
            description: "Account created successfully!",
            duration: 4000,
            closable: true,
          });
          navigate("/login");
        },
        onError: (ctx) => {
          setIsLoading(false);
          toaster.create({
            title: "Create Account",
            type: "error",
            description: ctx.error.message || "An unknown error occurred. Please try again.",
            duration: 4000,
            closable: true,
          });
        },
      },
    );
  };

  /**
   * Handle profile completion form submission for third-party signups
   */
  const onCompleteClick = async () => {
    setIsLoading(true);
    try {
      const result = await updateUser({
        variables: {
          user: {
            _id: userId,
            firstName,
            lastName,
            name: `${firstName} ${lastName}`,
            email,
            affiliation,
            completedProfile: true,
            updatedAt: dayjs(Date.now()).toISOString(),
          },
        },
      });
      setIsLoading(false);
      if (result.data?.updateUser.success) {
        await auth.updateUser({ completedProfile: true });
        posthog.capture("client.auth.signup_complete", { method: provider || "third_party" });
        navigate("/");
      } else if (result.data?.updateUser.message === "EMAIL_EXISTS") {
        toaster.create({
          title: "Email Already in Use",
          type: "warning",
          description:
            "An account with this email already exists. Sign in to your existing account and link your ORCiD from Settings.",
          duration: 8000,
          closable: true,
        });
      } else {
        toaster.create({
          title: "Failed to Complete Profile",
          type: "error",
          description: result.data?.updateUser.message || "Failed to complete profile. Please try again.",
          duration: 4000,
          closable: true,
        });
      }
    } catch {
      setIsLoading(false);
      toaster.create({
        title: "Failed to Complete Profile",
        type: "error",
        description: "Failed to complete profile. Please try again.",
        duration: 4000,
        closable: true,
      });
    }
  };

  if (mode === "loading") {
    return null;
  }

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
        w={["sm", "md"]}
        h={"80vh"}
        wrap={"wrap"}
      >
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
            <Heading size={"xl"} fontWeight={"semibold"}>
              {mode === "complete" ? "Complete Profile" : "Create your Metadatify account"}
            </Heading>
            {mode === "complete" && (
              <Text fontSize={"sm"} color={"gray.500"} textAlign={"center"}>
                Provide your name and email address to finish setting up your account.
              </Text>
            )}
          </Flex>

          <Fieldset.Root>
            <Fieldset.Content>
              <Flex direction={"column"} gap={"4"}>
                <Flex direction={"row"} gap={"4"}>
                  <Field.Root gap={"0.5"} required w={"100%"}>
                    <Field.Label fontWeight={"semibold"} fontSize={"xs"} ml={"0.5"} color={"gray.600"}>
                      First Name
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      size={"xs"}
                      rounded={"md"}
                      borderColor={"gray.300"}
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                      }}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root gap={"0.5"} required w={"100%"}>
                    <Field.Label fontWeight={"semibold"} fontSize={"xs"} ml={"0.5"} color={"gray.600"}>
                      Last Name
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      size={"xs"}
                      rounded={"md"}
                      borderColor={"gray.300"}
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                      }}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </Field.Root>
                </Flex>

                <Field.Root gap={"0.5"} invalid={emailError !== ""} required>
                  <Field.Label fontWeight={"semibold"} fontSize={"xs"} ml={"0.5"} color={"gray.600"}>
                    Email
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    size={"xs"}
                    rounded={"md"}
                    type={"email"}
                    borderColor={emailError ? "red.300" : "gray.300"}
                    _focus={{
                      borderColor: "primary",
                      boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                    }}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateEmail(e.target.value);
                    }}
                  />
                  <Field.ErrorText color={"red.500"} fontSize={"xs"} mt={"1"}>
                    {emailError}
                  </Field.ErrorText>
                </Field.Root>

                <Field.Root gap={"0.5"} required>
                  <Field.Label fontWeight={"semibold"} fontSize={"xs"} ml={"0.5"} color={"gray.600"}>
                    Affiliation
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Select.Root
                    collection={affiliationCollection}
                    size={"xs"}
                    rounded={"md"}
                    value={affiliation ? [affiliation] : []}
                    onValueChange={(details) => setAffiliation(details.value[0] || "")}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger data-testid="affiliation-select-trigger" rounded={"md"}>
                        <Select.ValueText placeholder={"Select your affiliation"} />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {affiliationCollection.items.map((item) => (
                          <Select.Item item={item} key={item.value}>
                            {item.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Field.Root>

                {mode === "signup" && (
                  <>
                    <Flex direction={"column"} gap={"1"} w={"100%"}>
                      <Field.Root gap={"0.5"} required>
                        <Field.Label fontSize={"xs"} ml={"0.5"} color={"gray.600"}>
                          Password
                          <Field.RequiredIndicator />
                        </Field.Label>
                        <Input
                          type={"password"}
                          rounded={"md"}
                          size={"xs"}
                          value={initialPassword}
                          placeholder={"Password"}
                          disabled={isLoading}
                          onChange={(e) => setInitialPassword(e.target.value)}
                        />
                      </Field.Root>
                      <Field.Root gap={"0.5"} invalid={confirmPassword !== "" && !isPasswordValid} required>
                        <Field.Label fontSize={"xs"} ml={"0.5"} color={"gray.600"}>
                          Confirm Password
                          <Field.RequiredIndicator />
                        </Field.Label>
                        <Input
                          type={"password"}
                          rounded={"md"}
                          size={"xs"}
                          value={confirmPassword}
                          placeholder={"Confirm Password"}
                          disabled={isLoading}
                          onChange={(e) => validatePassword(e.target.value)}
                        />
                        <Field.ErrorText fontSize={"xs"}>Passwords do not match</Field.ErrorText>
                      </Field.Root>
                    </Flex>

                    <Box position={"relative"} p={"2"}>
                      <Separator />
                      <AbsoluteCenter bg={"white"} color={"gray.500"} px={"4"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Optional
                        </Text>
                      </AbsoluteCenter>
                    </Box>

                    <Button
                      variant={"subtle"}
                      onClick={onOrcidSignupClick}
                      loading={isLoading}
                      loadingText={"Redirecting to ORCiD..."}
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"green"}
                    >
                      <Image src={"https://orcid.org/sites/default/files/images/orcid_16x16.png"} />
                      Sign up with ORCiD
                    </Button>
                  </>
                )}
              </Flex>

              <Flex align={"center"} justify={"space-between"} w={"100%"}>
                {mode === "signup" && (
                  <Button
                    id={"returnLoginButton"}
                    colorPalette={"orange"}
                    size={"xs"}
                    rounded={"md"}
                    onClick={() => navigate("/login")}
                  >
                    Return to Login
                    <Icon name={"logout"} size={"xs"} />
                  </Button>
                )}
                <Button
                  id={"createAccountButton"}
                  colorPalette={"green"}
                  size={"xs"}
                  rounded={"md"}
                  onClick={mode === "complete" ? onCompleteClick : onSignupClick}
                  disabled={!isFormComplete}
                  loading={isLoading || updateUserLoading}
                  loadingText={mode === "complete" ? "Completing Profile..." : "Creating Account..."}
                  ml={mode === "complete" ? "auto" : undefined}
                >
                  {mode === "complete" ? "Complete Profile" : "Create Account"}
                  <Icon name={"check"} size={"xs"} />
                </Button>
              </Flex>
            </Fieldset.Content>
          </Fieldset.Root>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Signup;
