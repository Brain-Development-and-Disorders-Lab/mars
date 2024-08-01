// React
import React, { FC, useEffect, useMemo } from "react";

// Existing and custom components
import { Flex, Heading, Button, Image, Text, useToast } from "@chakra-ui/react";
import { Content } from "@components/Container";

// Routing and navigation
import { useLocation, useSearchParams } from "react-router-dom";

// Utility functions and libraries
import { gql, useLazyQuery } from "@apollo/client";
import { useToken } from "src/authentication/useToken";
import _ from "lodash";

// Existing and custom types
import { LoginProps } from "@types";

const useQuery = () => {
  // Get URL query parameters
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const Login: FC<LoginProps> = ({ setAuthenticated }) => {
  const toast = useToast();

  // Enable authentication modification
  const [token, setToken] = useToken();

  const query = useQuery();

  // Extract query parameters
  const accessCode = query.get("code");

  // Access parameters to remove code after authentication
  const [searchParams, setSearchParams] = useSearchParams();

  // Remove the "code" search parameter upon login
  const removeCode = () => {
    if (searchParams.has("code")) {
      searchParams.delete("code");
      setSearchParams(searchParams);
    }
  };

  // Queries
  const LOGIN_DATA = gql`
    query PerformLogin($code: String) {
      login(code: $code) {
        orcid
        name
        token
      }
    }
  `;

  const [doLogin, { loading, error }] = useLazyQuery(LOGIN_DATA);

  /**
   * Utility function to perform a Login operation
   * @param code String returned by ORCID API for login
   */
  const getLogin = async (code: string) => {
    // Query to retrieve Entity data and associated data for editing
    const response = await doLogin({ variables: { code: code } });

    // Perform login and data retrieval via server, check if user permitted access
    if (response.data?.login) {
      removeCode();
      setToken(response.data.login);
      setAuthenticated(true);
    } else if (error) {
      toast({
        title: "Login Error",
        status: "error",
        description: "Error authenticating with ORCiD",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setAuthenticated(false);
    }
  };

  // Check if token exists
  useEffect(() => {
    if ((_.isUndefined(token) || _.isEqual(token.token, "")) && accessCode) {
      getLogin(accessCode);
    }
  }, []);

  // Define login parameters
  const clientID = "APP-BBVHCTCNDUJ4CAXV";
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const redirectURI = isLocalhost
    ? "http://127.0.0.1:8080"
    : "https://app.storacuity.com";
  const requestURI = `https://orcid.org/oauth/authorize?client_id=${clientID}&response_type=code&scope=openid&redirect_uri=${redirectURI}`;

  /**
   * Wrapper function to handle login flow
   */
  const onLoginClick = async () => {
    if (process.env.NODE_ENV !== "production") {
      // If in a development environment, bypass the ORCiD login
      await getLogin("");
    } else {
      window.location.href = requestURI;
    }
  };

  return (
    <Content>
      <Flex
        direction={"column"}
        justify={"center"}
        align={"center"}
        alignSelf={"center"}
        gap={"8"}
        w={["sm", "md", "lg"]}
        h={"100vh"}
        wrap={"wrap"}
      >
        <Flex
          direction={"column"}
          p={"8"}
          gap={"12"}
          maxW={"sm"}
          h={"md"}
          bg={"white"}
          rounded={"lg"}
          border={"1px"}
          borderColor={"gray.200"}
          align={"center"}
          justify={"center"}
        >
          <Flex
            direction={"column"}
            justify={"center"}
            align={"center"}
            gap={"4"}
          >
            <Heading fontWeight={"semibold"}>Storacuity</Heading>
            <Text align={"center"}>
              Log in or create an account with your ORCID iD.
            </Text>
          </Flex>

          <Button
            colorScheme={"gray"}
            gap={"4"}
            onClick={onLoginClick}
            isLoading={loading}
            loadingText={"Logging in..."}
          >
            <Image
              src={
                "https://orcid.org/sites/default/files/images/orcid_16x16.png"
              }
            />
            Connect ORCID
          </Button>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Login;
