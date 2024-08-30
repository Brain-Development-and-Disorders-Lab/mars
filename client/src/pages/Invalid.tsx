// React
import React from "react";

// Existing and custom components
import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Invalid = () => {
  const navigate = useNavigate();

  return (
    <Content>
      <Flex
        direction={"column"}
        justify={"center"}
        align={"center"}
        alignSelf={"center"}
        gap={"8"}
        w={["xs", "sm", "2xl"]}
        h={"100%"}
        wrap={"wrap"}
      >
        <Flex
          gap={"4"}
          p={"4"}
          direction={"column"}
          justify={"center"}
          align={"center"}
          border={"1px"}
          borderColor={"gray.200"}
          rounded={"md"}
        >
          <Flex direction={"row"} gap={"2"} align={"center"}>
            <Icon name={"exclamation"} size={"md"} />
            <Heading fontWeight={"semibold"} size={"md"}>
              Not Found
            </Heading>
          </Flex>

          <Flex w={"md"} gap={"4"} direction={"column"}>
            <Text fontWeight={"semibold"} color={"gray.600"}>
              Storacuity could not locate the requested resource.
            </Text>
          </Flex>

          <Flex w={"md"} gap={"1"} direction={"column"}>
            <Text fontWeight={"semibold"} color={"gray.600"}>
              Possible Causes:
            </Text>
            <Text color={"gray.600"}>
              The requested resource does not exist or has been deleted
            </Text>
            <Text color={"gray.600"}>
              You do not have permission to access the requested resource
            </Text>
            <Text color={"gray.600"}>Network connectivity has been lost</Text>
          </Flex>

          <Button
            rightIcon={<Icon name={"a_right"} />}
            onClick={() => navigate("/")}
            colorScheme={"orange"}
            size={"sm"}
          >
            Dashboard
          </Button>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Invalid;
