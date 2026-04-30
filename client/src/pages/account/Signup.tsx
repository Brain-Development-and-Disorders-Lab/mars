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
  Spacer,
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

// GraphQL mutation to create user profile
const UPDATE_USER = gql`
  mutation UpdateUser($user: UserInput) {
    updateUser(user: $user) {
      success
      message
    }
  }
`;

const Signup = () => {
  const navigate = useNavigate();
  const isDevelopment = process.env.NODE_ENV === "development";

  // GraphQL mutation hook
  const [updateUser, { loading: updateUserLoading }] = useMutation<{
    updateUser: IResponseMessage;
  }>(UPDATE_USER);

  // User information state
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAffiliation, setUserAffiliation] = useState("");

  // Email validation state
  const [emailError, setEmailError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Password validation state
  const [initialPassword, setInitialPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  // Loading state
  const [isAccountCreateLoading, setIsAccountCreateLoading] = useState(false);
  const [isOrcidLoading, setIsOrcidLoading] = useState(false);

  // ORCiD state
  const [orcidId, setOrcidId] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingUserId, setExistingUserId] = useState("");

  // Check if user already has a session (from ORCiD login)
  useEffect(() => {
    auth.getSession().then(({ data: session }) => {
      if (session?.user?.email?.endsWith("@orcid.placeholder")) {
        // User logged in via ORCiD but needs to complete profile
        setIsExistingUser(true);
        setExistingUserId(session.user.id);
        if (session.user.account_orcid) {
          setOrcidId(session.user.account_orcid);
        }
        // Pre-fill name from ORCiD
        if (session.user.name) {
          const spaceIndex = session.user.name.indexOf(" ");
          if (spaceIndex !== -1) {
            setUserFirstName(session.user.name.slice(0, spaceIndex));
            setUserLastName(session.user.name.slice(spaceIndex + 1));
          } else {
            setUserFirstName(session.user.name);
          }
        }
      }
    });
  }, []);

  const userComplete =
    userFirstName !== "" &&
    userLastName !== "" &&
    userEmail !== "" &&
    userAffiliation !== "" &&
    isEmailValid &&
    (isExistingUser || isPasswordValid); // Password only required for new users

  // Affiliation options collection
  const affiliationCollection = createListCollection({
    items: [
      { label: "No Affiliation", value: "No Affiliation" },
      {
        label: "Washington University in St. Louis",
        value: "Washington University in St. Louis",
      },
    ],
  });

  /**
   * Validate email format and update validation state
   * @param {string} email Entered email address
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
   * Validate password and matching
   * @param {string} password Confirmed password string
   */
  const validatePassword = (password: string) => {
    setConfirmPassword(password);
    if (password === "") {
      setIsPasswordValid(false);
    } else if (password !== initialPassword) {
      setIsPasswordValid(false);
    } else {
      setIsPasswordValid(true);
    }
  };

  /**
   * Handle ORCiD signup button click
   */
  const onOrcidSignupClick = async () => {
    setIsOrcidLoading(true);
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
      setIsOrcidLoading(false);
    } else if (data?.url) {
      window.location.href = data.url;
    }
  };

  /**
   * Handle the "Done" button being clicked after user information is entered
   */
  const onDoneClick = async () => {
    setIsAccountCreateLoading(true);
    const joinedName = `${userFirstName} ${userLastName}`;

    if (isExistingUser) {
      // User already has an account from ORCiD login
      try {
        const result = await updateUser({
          variables: {
            user: {
              _id: existingUserId,
              firstName: userFirstName,
              lastName: userLastName,
              name: `${userFirstName} ${userLastName}`,
              affiliation: userAffiliation,
              email: userEmail,
              emailVerified: false,
              image: "",
              createdAt: dayjs(Date.now()).toISOString(),
              updatedAt: dayjs(Date.now()).toISOString(),
              api_keys: JSON.stringify([]),
              account_orcid: orcidId,
            },
          },
        });

        setIsAccountCreateLoading(false);

        if (result.data?.updateUser) {
          posthog.capture("signup_complete", { method: "orcid" });
          toaster.create({
            title: "User Created",
            type: "success",
            description: "Your account has been created successfully!",
            duration: 4000,
            closable: true,
          });
          navigate("/");
        } else {
          toaster.create({
            title: "Failed to Create Account",
            type: "error",
            description: "Failed to create account. Please try again.",
            duration: 4000,
            closable: true,
          });
        }
      } catch {
        setIsAccountCreateLoading(false);
        toaster.create({
          title: "Failed to Create Account",
          type: "error",
          description: "Failed to create account. Please try again.",
          duration: 4000,
          closable: true,
        });
      }
    } else {
      // New user, create account
      await auth.signUp.email(
        {
          email: userEmail,
          name: joinedName,
          password: initialPassword,
          firstName: userFirstName,
          lastName: userLastName,
          affiliation: userAffiliation,
          lastLogin: dayjs(Date.now()).toISOString(),
          api_keys: [],
          account_orcid: orcidId,
          callbackURL: "/login",
          hasSeenWalkthrough: false,
        },
        {
          onRequest: () => {
            setIsAccountCreateLoading(true);
          },
          onSuccess: () => {
            setIsAccountCreateLoading(false);
            posthog.capture("signup_complete", { method: "email" });
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
            setIsAccountCreateLoading(false);
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
              Create your Metadatify account
            </Heading>
          </Flex>

          <Fieldset.Root>
            <Fieldset.Content>
              <Flex direction={"column"} gap={"4"}>
                <Flex direction={"row"} gap={"4"}>
                  <Flex direction={"column"} w={"100%"}>
                    <Field.Root gap={"0.5"} required>
                      <Field.Label fontWeight={"semibold"} fontSize={"xs"}>
                        First Name
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"userFirstNameInput"}
                        size={"xs"}
                        rounded={"md"}
                        borderColor={"gray.300"}
                        _focus={{
                          borderColor: "primary",
                          boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                        }}
                        value={userFirstName}
                        onChange={(event) => setUserFirstName(event.target.value)}
                      />
                    </Field.Root>
                  </Flex>
                  <Flex direction={"column"} w={"100%"}>
                    <Field.Root gap={"0.5"} required>
                      <Field.Label fontWeight={"semibold"} fontSize={"xs"}>
                        Last Name
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"userLastNameInput"}
                        size={"xs"}
                        rounded={"md"}
                        borderColor={"gray.300"}
                        _focus={{
                          borderColor: "primary",
                          boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                        }}
                        value={userLastName}
                        onChange={(event) => setUserLastName(event.target.value)}
                      />
                    </Field.Root>
                  </Flex>
                </Flex>
                <Flex direction={"column"} gap={"4"}>
                  <Flex direction={"column"} gap={"1"}>
                    <Field.Root gap={"0.5"} invalid={emailError !== ""} required>
                      <Field.Label fontWeight={"semibold"} fontSize={"xs"}>
                        Email
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"userEmailInput"}
                        size={"xs"}
                        rounded={"md"}
                        type={"email"}
                        borderColor={emailError ? "red.300" : "gray.300"}
                        _focus={{
                          borderColor: "primary",
                          boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                        }}
                        value={userEmail}
                        onChange={(event) => {
                          setUserEmail(event.target.value);
                          validateEmail(event.target.value);
                        }}
                      />
                      <Field.ErrorText color={"red.500"} fontSize={"xs"} mt={"1"}>
                        {emailError}
                      </Field.ErrorText>
                    </Field.Root>
                  </Flex>

                  <Flex direction={"column"}>
                    <Field.Root gap={"0.5"} required>
                      <Field.Label fontWeight={"semibold"} fontSize={"xs"}>
                        Affiliation
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Select.Root
                        collection={affiliationCollection}
                        size={"xs"}
                        rounded={"md"}
                        value={userAffiliation ? [userAffiliation] : []}
                        onValueChange={(details) => setUserAffiliation(details.value[0] || "")}
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
                            {affiliationCollection.items.map((affiliation) => (
                              <Select.Item item={affiliation} key={affiliation.value}>
                                {affiliation.label}
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Select.Root>
                    </Field.Root>
                  </Flex>
                </Flex>
              </Flex>

              {!isExistingUser && (
                <Flex direction={"column"} gap={"1"} w={"100%"}>
                  <Field.Root gap={"0.5"} required>
                    <Field.Label fontSize={"xs"}>
                      Password
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      id={"userPasswordInputInitial"}
                      type={"password"}
                      rounded={"md"}
                      size={"xs"}
                      value={initialPassword}
                      placeholder={"Password"}
                      disabled={isAccountCreateLoading}
                      onChange={(event) => setInitialPassword(event.target.value)}
                    />
                  </Field.Root>
                  <Field.Root gap={"0.5"} invalid={!isPasswordValid} required>
                    <Field.Label fontSize={"xs"}>
                      Confirm Password
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      id={"userPasswordInputConfirm"}
                      type={"password"}
                      rounded={"md"}
                      size={"xs"}
                      value={confirmPassword}
                      placeholder={"Confirm Password"}
                      disabled={isAccountCreateLoading}
                      onChange={(event) => validatePassword(event.target.value)}
                    />
                    <Field.ErrorText fontSize={"xs"}>Passwords do not match</Field.ErrorText>
                  </Field.Root>
                </Flex>
              )}

              {orcidId && (
                <Flex
                  direction={"row"}
                  align={"center"}
                  gap={"2"}
                  p={"2"}
                  bg={"green.50"}
                  rounded={"md"}
                  border={GLOBAL_STYLES.border.style}
                  borderColor={"green.200"}
                >
                  <Icon name={"check"} size={"xs"} color={"green.600"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"green.700"}>
                    ORCiD {orcidId} will be linked to your account
                  </Text>
                </Flex>
              )}

              {!orcidId && (
                <>
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
                    loading={isOrcidLoading}
                    disabled={isDevelopment || isAccountCreateLoading}
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

              <Flex align={"center"} justify={"space-between"} w={"100%"}>
                {!isExistingUser ? (
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
                ) : (
                  <Spacer />
                )}

                <Button
                  id={"createAccountButton"}
                  colorPalette={"green"}
                  size={"xs"}
                  rounded={"md"}
                  onClick={() => onDoneClick()}
                  disabled={!userComplete}
                  loading={isAccountCreateLoading || updateUserLoading}
                  loadingText={isExistingUser ? "Completing Account..." : "Creating Account..."}
                >
                  {isExistingUser ? "Complete" : "Create"} Account
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
