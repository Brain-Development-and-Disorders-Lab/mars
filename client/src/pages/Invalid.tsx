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
        h={"100%"}
        mt={{ base: "10%", lg: "0" }}
        p={"2"}
      >
        <Flex
          gap={"2"}
          p={"2"}
          direction={"column"}
          justify={"center"}
          align={"center"}
          rounded={"md"}
          bg={"orange.500"}
          color={"white"}
          maxW={"md"}
        >
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Icon name={"exclamation"} size={"sm"} />
            <Heading fontWeight={"semibold"} size={"lg"}>
              Not Found
            </Heading>
          </Flex>

          <Flex direction={"column"} gap={"1"} w={"90%"}>
            <Text fontWeight={"semibold"} fontSize={"sm"}>
              Metadatify could not locate the requested resource.
            </Text>
            <Text fontSize={"xs"}>
              The requested resource does not exist or has been deleted, you do
              not have permission to access it, or network connectivity has been
              lost.
            </Text>
          </Flex>

          <Button
            onClick={() => navigate("/")}
            size={"xs"}
            rounded={"md"}
            variant={"subtle"}
            colorPalette={"orange"}
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
