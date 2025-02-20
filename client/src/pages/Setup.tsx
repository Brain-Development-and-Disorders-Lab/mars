// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  Heading,
  Button,
  Image,
  Text,
  FormControl,
  Tag,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Contexts
import { useAuthentication } from "@hooks/useAuthentication";
import { useWorkspace } from "@hooks/useWorkspace";

const Setup = () => {
  const { token, setup } = useAuthentication();
  const { activateWorkspace } = useWorkspace();

  const navigate = useNavigate();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // User information state
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAffiliation, setUserAffiliation] = useState("");
  const userComplete =
    userFirstName !== "" &&
    userLastName !== "" &&
    userEmail !== "" &&
    userAffiliation !== "";

  /**
   * Handle the "Done" button being clicked after user information is entered
   */
  const onDoneClick = async () => {
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
      await activateWorkspace("");
      navigate("/");
    }
  };

  /**
   * Utility function to examine the setup state, as a composition of state components
   */
  const checkSetupState = async () => {
    if (token.setup === true) {
      // Activate a Workspace and navigate to the dashboard
      await activateWorkspace("");
      navigate("/");
    } else if (
      token.orcid === "" &&
      token.setup === false &&
      token.token === ""
    ) {
      // Attempting to access setup without ORCiD, navigate to login page
      navigate("/login");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkSetupState();
  }, []);

  return (
    <Content isLoaded={!isLoading}>
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
            <Tag colorScheme={"green"}>{token.orcid}</Tag>
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
                    onChange={(event) => setUserAffiliation(event.target.value)}
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
              onClick={() => onDoneClick()}
              isLoading={isLoading}
              isDisabled={!userComplete}
            >
              Done
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Setup;
