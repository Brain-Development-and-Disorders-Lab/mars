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
} from "@chakra-ui/react";

// Utility libraries
import _ from "underscore";

// Custom components
import { ContentContainer } from "@components/ContentContainer";

// Database
import { postData } from "@database/functions";

const Login = (props: { setToken: (token: string) => void }) => {
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  console.log(username);

  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);

  const performLogin = (credentials: {password: string}) => {
    postData(`/login`, credentials)
      .then((response) => {
        props.setToken(response.token);
      });
  };

  const onLoginClick = () => {
    performLogin({password: password});
  }

  return (
    <ContentContainer vertical>
      <Flex
        direction={"column"}
        justify={"center"}
        align={"center"}
        alignSelf={"center"}
        p={"8"}
        gap={"8"}
        w={["lg", "2xl"]}
        h={["sm", "md"]}
        wrap={"wrap"}
      >
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
            pr="4.5rem"
            type={"text"}
            placeholder={"Username"}
            onChange={(event) => setUsername(event.target.value)}
          />

          <InputGroup>
            <Input
              pr="4.5rem"
              type={show ? "text" : "password"}
              placeholder={"Password"}
              onChange={(event) => setPassword(event.target.value)}
            />
            <InputRightElement width="4.5rem">
              <Button h="1.75rem" size="sm" onClick={handleClick}>
                {show ? "Hide" : "Show"}
              </Button>
            </InputRightElement>
          </InputGroup>

          <Button
            onClick={onLoginClick}
            colorScheme={"green"}
          >
            Login
          </Button>
        </Flex>
      </Flex>
    </ContentContainer>
  );
};

export default Login;
