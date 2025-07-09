// React
import React, { useEffect } from "react";

// Existing and custom components
import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Posthog
import { usePostHog } from "posthog-js/react";

const Invalid = () => {
  const posthog = usePostHog();
  const navigate = useNavigate();

  useEffect(() => {
    posthog.capture("invalid_shown");
  }, []);

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
          border={"1px solid"}
          borderColor={"gray.300"}
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
              Metadatify could not locate the requested resource.
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
            onClick={() => navigate("/")}
            colorPalette={"orange"}
            size={"sm"}
            rounded={"md"}
          >
            Dashboard
            <Icon name={"a_right"} />
          </Button>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Invalid;
