// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  Heading,
  Button,
  Image,
  Text,
  Tag,
  Input,
  Fieldset,
  Field,
  Spinner,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import { isValidEmail } from "src/util";

// Contexts
import { useAuthentication } from "@hooks/useAuthentication";
import { useWorkspace } from "@hooks/useWorkspace";

const Setup = () => {
  const { token, setup, logout } = useAuthentication();
  const { activateWorkspace } = useWorkspace();

  const navigate = useNavigate();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // User information state
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAffiliation, setUserAffiliation] = useState("");

  // Email validation state
  const [emailError, setEmailError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);

  const userComplete =
    userFirstName !== "" &&
    userLastName !== "" &&
    userEmail !== "" &&
    userAffiliation !== "" &&
    isEmailValid;

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
   * Handle the "Done" button being clicked after user information is entered
   */
  const onDoneClick = async () => {
    if (!token.orcid || !token.token) {
      navigate("/login");
      return;
    }

    setIsLoading(true);

    const result = await setup({
      _id: token.orcid,
      firstName: userFirstName,
      lastName: userLastName,
      email: userEmail,
      affiliation: userAffiliation,
    });

    setIsLoading(false);

    if (result.success === true) {
      // Activate a Workspace and navigate to the Dashboard
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

  /**
   * Utility function to examine the setup state, as a composition of state components
   */
  const checkSetupState = async () => {
    if (!token.orcid || !token.token) {
      navigate("/login");
      return;
    }

    if (token.setup === true) {
      // Activate a Workspace and navigate to the dashboard
      const workspaceResult = await activateWorkspace("");
      if (workspaceResult.message === "No Workspaces exist") {
        navigate("/create/workspace");
      } else if (workspaceResult.success) {
        navigate("/");
      } else {
        navigate("/");
      }
      return;
    } else if (
      token.orcid === "" &&
      token.setup === false &&
      token.token === ""
    ) {
      // Attempting to access setup without ORCiD, navigate to login page
      navigate("/login");
      return;
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkSetupState();
  }, []);

  return (
    <Content isLoaded={!isLoading}>
      {!token.orcid || !token.token ? (
        <Flex
          direction={"column"}
          justify={"center"}
          align={"center"}
          h={"100vh"}
          gap={"4"}
        >
          <Spinner size={"md"} color={"primary"} />
          <Text color={"gray.500"} fontWeight={"semibold"} fontSize={"sm"}>
            Redirecting to login...
          </Text>
        </Flex>
      ) : (
        <>
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
                Complete your Metadatify account
              </Heading>

              <Text
                color={"gray.500"}
                fontWeight={"semibold"}
                fontSize={"sm"}
                textAlign={"center"}
              >
                Please provide some additional information about yourself before
                continuing.
              </Text>

              <Flex
                direction={"row"}
                gap={"2"}
                w={"100%"}
                align={"center"}
                justify={"left"}
                pt={"8"}
              >
                <Text fontSize={"sm"} fontWeight={"semibold"}>
                  Your ORCiD:
                </Text>
                <Tag.Root colorPalette={"primary"}>
                  <Tag.Label>{token.orcid}</Tag.Label>
                </Tag.Root>
              </Flex>

              <Fieldset.Root>
                <Fieldset.Content>
                  <Flex direction={"column"} gap={"4"}>
                    <Flex direction={"row"} gap={"4"}>
                      <Flex direction={"column"} w={"100%"}>
                        <Field.Root required>
                          <Field.Label fontWeight={"semibold"} fontSize={"sm"}>
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
                              boxShadow:
                                "0 0 0 1px var(--chakra-colors-primary)",
                            }}
                            value={userFirstName}
                            onChange={(event) =>
                              setUserFirstName(event.target.value)
                            }
                          />
                        </Field.Root>
                      </Flex>
                      <Flex direction={"column"} w={"100%"}>
                        <Field.Root required>
                          <Field.Label fontWeight={"semibold"} fontSize={"sm"}>
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
                              boxShadow:
                                "0 0 0 1px var(--chakra-colors-primary)",
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
                        <Field.Root invalid={emailError !== ""} required>
                          <Field.Label fontWeight={"semibold"} fontSize={"sm"}>
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
                              boxShadow:
                                "0 0 0 1px var(--chakra-colors-primary)",
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
                        <Field.Root required>
                          <Field.Label fontWeight={"semibold"} fontSize={"sm"}>
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
                                {affiliationCollection.items.map(
                                  (affiliation) => (
                                    <Select.Item
                                      item={affiliation}
                                      key={affiliation.value}
                                    >
                                      {affiliation.label}
                                      <Select.ItemIndicator />
                                    </Select.Item>
                                  ),
                                )}
                              </Select.Content>
                            </Select.Positioner>
                          </Select.Root>
                        </Field.Root>
                      </Flex>
                    </Flex>
                  </Flex>

                  <Flex align={"center"} justify={"space-between"} w={"100%"}>
                    <Button
                      id={"userDoneButton"}
                      colorPalette={"orange"}
                      size={"xs"}
                      rounded={"md"}
                      onClick={() => {
                        logout();
                        navigate("/login");
                      }}
                    >
                      Logout
                      <Icon name={"logout"} size={"xs"} />
                    </Button>
                    <Button
                      id={"userDoneButton"}
                      colorPalette={"green"}
                      size={"xs"}
                      rounded={"md"}
                      onClick={() => onDoneClick()}
                      loading={isLoading}
                      disabled={!userComplete}
                    >
                      Complete Setup
                      <Icon name={"check"} size={"xs"} />
                    </Button>
                  </Flex>
                </Fieldset.Content>
              </Fieldset.Root>
            </Flex>
          </Flex>
        </>
      )}
    </Content>
  );
};

export default Setup;
