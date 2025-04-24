import React, { useState } from "react";
import {
  Button,
  Field,
  Fieldset,
  Flex,
  Heading,
  Image,
  Input,
  Tag,
  Text,
  useToast,
} from "@chakra-ui/react";

// Custom components
import { Content } from "@components/Container";
import Icon from "@components/Icon";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// Custom types
import { IResponseMessage, UserModel } from "@types";

// Contexts
import { useAuthentication } from "@hooks/useAuthentication";
import { useWorkspace } from "@hooks/useWorkspace";

const User = () => {
  const toast = useToast();

  const { token } = useAuthentication();
  const { activateWorkspace } = useWorkspace();
  const navigate = useNavigate();

  // User information state
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAffiliation, setUserAffiliation] = useState("");
  const isUserComplete =
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
  const [getUser, { error: userError }] = useLazyQuery<{
    user: UserModel;
  }>(GET_USER);

  /**
   * Handle the "Done" button being clicked after user information is entered
   */
  const handleUserDone = async () => {
    const updateUserResult = await updateUser({
      variables: {
        user: {
          _id: token.orcid,
          firstName: userFirstName,
          lastName: userLastName,
          email: userEmail,
          affiliation: userAffiliation,
        },
      },
    });

    if (
      updateUserResult.data?.updateUser &&
      updateUserResult.data.updateUser.success === true
    ) {
      // Get the updated UserModel
      const userResult = await getUser({
        variables: {
          _id: token.orcid,
        },
      });

      if (userResult.data?.user) {
        // Activate a Workspace and navigate to the Dashboard
        await activateWorkspace("");
        navigate("/");
      }
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
    } else if (userError) {
      toast({
        title: "Error",
        status: "error",
        description: "Failed to get updated User information",
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
        h={"80vh"} // Header is 10vh, so 90vh - 10vh = 80vh
        wrap={"wrap"}
      >
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
            <Tag colorPalette={"green"}>{token.orcid}</Tag>
          </Flex>

          <Fieldset.Root required>
            <Fieldset.Content>
              <Flex direction={"column"} gap={"2"}>
                <Flex direction={"row"} gap={"2"}>
                  <Flex direction={"column"} w={"100%"}>
                    <Field.Root>
                      <Field.Label>
                        First Name
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"userFirstNameInput"}
                        size={"sm"}
                        rounded={"md"}
                        value={userFirstName}
                        onChange={(event) =>
                          setUserFirstName(event.target.value)
                        }
                      />
                    </Field.Root>
                  </Flex>
                  <Flex direction={"column"} w={"100%"}>
                    <Field.Root>
                      <Field.Label>
                        Last Name
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"userLastNameInput"}
                        size={"sm"}
                        rounded={"md"}
                        value={userLastName}
                        onChange={(event) =>
                          setUserLastName(event.target.value)
                        }
                      />
                    </Field.Root>
                  </Flex>
                </Flex>
                <Flex direction={"column"} gap={"2"}>
                  <Flex direction={"column"}>
                    <Field.Root>
                      <Field.Label>
                        Email
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"userEmailInput"}
                        size={"sm"}
                        rounded={"md"}
                        type={"email"}
                        value={userEmail}
                        onChange={(event) => setUserEmail(event.target.value)}
                      />
                    </Field.Root>
                  </Flex>
                  <Flex direction={"column"}>
                    <Field.Root>
                      <Field.Label>
                        Affiliation
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        id={"userAffiliationInput"}
                        size={"sm"}
                        rounded={"md"}
                        value={userAffiliation}
                        onChange={(event) =>
                          setUserAffiliation(event.target.value)
                        }
                      />
                    </Field.Root>
                  </Flex>
                </Flex>
              </Flex>
            </Fieldset.Content>
          </Fieldset.Root>
          <Flex align={"center"} justify={"right"} w={"100%"}>
            <Button
              id={"userDoneButton"}
              colorPalette={"green"}
              size={"sm"}
              onClick={() => handleUserDone()}
              disabled={!isUserComplete}
            >
              Done
              <Icon name={"check"} />
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default User;
