// React
import React, { FC, useMemo, useState } from "react";

// Existing and custom components
import {
  Flex,
  Heading,
  Button,
  Image,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";

// Routing and navigation
import { useLocation, useSearchParams } from "react-router-dom";

// Existing and custom types
import { LoginProps } from "@types";

// Utility functions and libraries
import { useToken } from "src/authentication/useToken";
import _ from "lodash";
import { postData } from "@database/functions";

const useQuery = () => {
  // Get URL query parameters
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const Login: FC<LoginProps> = ({ setAuthenticated }) => {
  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();

  // Enable authentication modification
  const [token, setToken] = useToken();

  const query = useQuery();

  // Extract query parameters
  const accessCode = query.get("code");

  // Access parameters to remove code after authentication
  const [searchParams, setSearchParams] = useSearchParams();

  const removeCode = () => {
    if (searchParams.has("code")) {
      searchParams.delete("code");
      setSearchParams(searchParams);
    }
  };

  // Check if token exists
  if ((_.isUndefined(token) || _.isEqual(token.id_token, "")) && accessCode) {
    // Now perform login and data retrieval via server, check if user permitted access
    postData(`/login`, { code: accessCode })
      .then((response) => {
        if (_.isEqual(response.status, "error")) {
          toast({
            title: "Error authenticating with ORCiD",
            status: "error",
            description: response.message,
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });
        } else {
          removeCode();
          setToken(response.token);
          setAuthenticated(true);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        toast({
          title: "Error authenticating with ORCiD",
          status: "error",
          description: error.message,
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsLoading(false);
      });
  }

  // Define login parameters
  const clientID = "APP-BBVHCTCNDUJ4CAXV";
  const redirectURI = "https://reusable.bio";
  const requestURI =
    `https://orcid.org/oauth/authorize?client_id=${clientID}&response_type=code&scope=openid&redirect_uri=${redirectURI}`;

  const onLoginClick = () => {
    setIsLoading(true);
    window.location.href = requestURI;
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
            <Text align={"center"}>Log in or create an account with your ORCID iD.</Text>
            <Button colorScheme={"gray"} gap={"4"} onClick={onLoginClick} isLoading={isLoading}>
              <Image src={"https://orcid.org/sites/default/files/images/orcid_16x16.png"} />
              Connect your ORCID iD
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Login;
