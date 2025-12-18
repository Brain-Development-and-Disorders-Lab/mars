// React
import React, { useState } from "react";

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

const Signup = () => {
  const navigate = useNavigate();

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

  const userComplete =
    userFirstName !== "" &&
    userLastName !== "" &&
    userEmail !== "" &&
    userAffiliation !== "" &&
    isEmailValid &&
    isPasswordValid;

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
   * Handle the "Done" button being clicked after user information is entered
   */
  const onDoneClick = async () => {
    const joinedName = `${userFirstName} ${userLastName}`;
    const { data, error } = await auth.signUp.email(
      {
        email: userEmail,
        name: joinedName,
        password: initialPassword,
        callbackURL: "/login",
      },
      {
        onRequest: (ctx) => {
          setIsAccountCreateLoading(true);
        },
        onSuccess: (ctx) => {
          setIsAccountCreateLoading(false);
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
            description:
              ctx.error.message ||
              "An unknown error occurred. Please try again.",
            duration: 4000,
            closable: true,
          });
        },
      },
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
          border={"1px solid"}
          borderColor={"gray.200"}
          rounded={"lg"}
          shadow={"sm"}
        >
          <Heading size={"xl"} fontWeight={"semibold"}>
            Create your Metadatify account
          </Heading>

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
                        onChange={(event) =>
                          setUserFirstName(event.target.value)
                        }
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
                        onChange={(event) =>
                          setUserLastName(event.target.value)
                        }
                      />
                    </Field.Root>
                  </Flex>
                </Flex>
                <Flex direction={"column"} gap={"4"}>
                  <Flex direction={"column"}>
                    <Field.Root
                      gap={"0.5"}
                      invalid={emailError !== ""}
                      required
                    >
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
                      <Field.ErrorText
                        color={"red.500"}
                        fontSize={"xs"}
                        mt={"1"}
                      >
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
                        onValueChange={(details) =>
                          setUserAffiliation(details.value[0] || "")
                        }
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger data-testid="affiliation-select-trigger">
                            <Select.ValueText
                              placeholder={"Select your affiliation"}
                            />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Select.Positioner>
                          <Select.Content>
                            {affiliationCollection.items.map((affiliation) => (
                              <Select.Item
                                item={affiliation}
                                key={affiliation.value}
                              >
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

              <Flex direction={"column"} gap={"1"} w={"100%"}>
                <Field.Root gap={"0.5"} required>
                  <Field.Label fontSize={"xs"}>
                    Password
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
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
                    type={"password"}
                    rounded={"md"}
                    size={"xs"}
                    value={confirmPassword}
                    placeholder={"Confirm Password"}
                    disabled={isAccountCreateLoading}
                    onChange={(event) => validatePassword(event.target.value)}
                  />
                  <Field.ErrorText fontSize={"xs"}>
                    Passwords do not match
                  </Field.ErrorText>
                </Field.Root>
              </Flex>

              <Flex align={"center"} justify={"right"} w={"100%"}>
                <Button
                  id={"userDoneButton"}
                  colorPalette={"green"}
                  size={"xs"}
                  rounded={"md"}
                  onClick={() => onDoneClick()}
                  disabled={!userComplete}
                  loading={isAccountCreateLoading}
                  loadingText={"Creating Account..."}
                >
                  Create Account
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
