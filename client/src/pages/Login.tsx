// React
import React, { FC, useEffect, useMemo, useState } from "react";

// Existing and custom components
import { Flex, Heading, Button, Image, Text, useToast } from "@chakra-ui/react";
import { Content } from "@components/Container";

// Routing and navigation
import { useLocation, useSearchParams } from "react-router-dom";

// Existing and custom types
import { AuthInfo, LoginProps } from "@types";

// Utility functions and libraries
import { useToken } from "src/authentication/useToken";
import _ from "lodash";
import { request } from "@database/functions";

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

  // Loading state, dependent on "code"
  const [isLoading, setIsLoading] = useState(searchParams.has("code"));

  /**
   * Utility function to perform a Login operation
   * @param code String returned by ORCID API for login
   */
  const getLogin = async (code: string) => {
    // Perform login and data retrieval via server, check if user permitted access
    const response = await request<AuthInfo>("POST", "/login", { code: code });
    if (response.success) {
      removeCode();
      setToken(response.data);
      setAuthenticated(true);
    } else {
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
    setIsLoading(false);
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
    : "https://mars.reusable.bio";
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
          border={"2px"}
          borderColor={"gray.300"}
          align={"center"}
          justify={"center"}
        >
          <Flex align={"center"} gap={"4"} justify={"center"}>
            <Image src="/Favicon.png" boxSize={"72px"} />
            <Heading fontWeight={"semibold"}>Login</Heading>
          </Flex>

          <Flex
            direction={"column"}
            justify={"center"}
            align={"center"}
            gap={"8"}
          >
            <Text align={"center"}>
              Log in or create an account with your ORCID iD.
            </Text>
            <Button
              colorScheme={"gray"}
              gap={"4"}
              onClick={onLoginClick}
              isLoading={isLoading}
              loadingText={"Logging in..."}
            >
              <Image
                src={
                  "https://orcid.org/sites/default/files/images/orcid_16x16.png"
                }
              />
              Connect your ORCID iD
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Login;
