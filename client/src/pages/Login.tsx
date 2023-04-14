// React
import React, { useState } from "react";
import {
  Flex,
  Heading,
  Button,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  useToast,
} from "@chakra-ui/react";

// Utility libraries
import _ from "lodash";

// Custom components
import { ContentContainer } from "@components/ContentContainer";

// Database
import { postData } from "@database/functions";

const Login = (props: { setToken: (token: string) => void }) => {
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);

  // Toast to show errors
  const toast = useToast();

  const performLogin = (credentials: {username: string, password: string}) => {
    postData(`/login`, credentials)
      .then((response) => {
        if (_.isEqual(response.status, "error")) {
          toast({
            title: "Error",
            status: "error",
            description: "Incorrect username or password. Please try again.",
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });
        }
        props.setToken(response.token);
        setIsLoading(false);
      }).catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not perform login right now.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsLoading(false);
      });
  };

  const onLoginClick = () => {
    setIsLoading(true);
    performLogin({username: username, password: password});
  }

  return (
    <ContentContainer vertical>
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
        <Flex direction={"column"} p={"8"} gap={"8"} bg={"white"} rounded={"md"}>
          <Flex align={"center"} gap={"4"}>
            <Image src="/Favicon.png" boxSize={"72px"} />
            <Heading fontWeight={"semibold"}>Login</Heading>
          </Flex>

          <Flex
            direction={"column"}
            justify={"center"}
            align={"center"}
            gap={"4"}
          >
            <Input
              type={"text"}
              placeholder={"Username"}
              onChange={(event) => setUsername(event.target.value)}
              disabled
            />

            <InputGroup>
              <Input
                type={show ? "text" : "password"}
                placeholder={"Password"}
                onChange={(event) => setPassword(event.target.value)}
                onKeyUp={(event) => {
                  if (event.key === "Enter" && password.length > 0) {
                    onLoginClick();
                  }
                }}
              />
              <InputRightElement width="4.5rem">
                <Button h={"1.75rem"} size={"sm"} onClick={handleClick}>
                  {show ? "Hide" : "Show"}
                </Button>
              </InputRightElement>
            </InputGroup>

            <Button
              onClick={onLoginClick}
              loadingText={""}
              isLoading={isLoading}
              colorScheme={"green"}
              disabled={!(password.length > 0) || isLoading}
            >
              Login
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </ContentContainer>
  );
};

export default Login;
