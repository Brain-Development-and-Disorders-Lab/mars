// React
import React from "react";

// Existing and custom components
import { Button, Flex, Heading, Image, Link, Text } from "@chakra-ui/react";
import { Content } from "@components/Container";

// Utility functions and libraries
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Invalid = () => {
  const navigate = useNavigate();

  return (
    <Content vertical>
      <Flex
        direction={"column"}
        justify={"center"}
        align={"center"}
        alignSelf={"center"}
        gap={"8"}
        w={["xs", "sm", "2xl"]}
        h={["sm", "md"]}
        wrap={"wrap"}
      >
        <Image src="/Favicon.png" boxSize={"120px"} />
        <Flex direction={"column"} align={"center"} gap={"4"}>
          <Heading fontWeight={"semibold"}>Oops!</Heading>
          <Text>We can't find that right now.</Text>
        </Flex>
        <Button as={Link} onClick={() => navigate("/")}>
          Home
        </Button>
      </Flex>
    </Content>
  );
};

export default Invalid;
