// React
import React from "react";

// Existing and custom components
import { Flex, Heading, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Routing and navigation
const Unauthorized = () => {
  return (
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
        bg={"orange.600"}
        color={"white"}
        maxW={"md"}
      >
        <Flex direction={"row"} gap={"1"} align={"center"}>
          <Icon name={"warning"} size={"sm"} />
          <Heading fontWeight={"semibold"} size={"lg"}>
            Access Denied
          </Heading>
        </Flex>

        <Flex direction={"column"} gap={"1"} w={"90%"}>
          <Text fontWeight={"semibold"} fontSize={"sm"}>
            You no longer have access to this Workspace.
          </Text>
          <Text fontSize={"xs"}>
            You may have been removed as a collaborator, or the Workspace may no
            longer exist. Please contact the Workspace owner if you believe this
            is a mistake.
          </Text>
          <Text fontSize={"xs"}>
            Use the Workspace switcher to select a Workspace you currently have
            access to.
          </Text>
        </Flex>

        <Flex direction={"column"} gap={"1"} w={"90%"}>
          <Text fontWeight={"semibold"} fontSize={"sm"}>
            Additional Information:
          </Text>
          <Flex
            maxH={"200px"}
            overflowY={"scroll"}
            bg={"orange.50"}
            rounded={"md"}
            p={"2"}
            pr={"3"}
            className={"error-scroll-container"}
          >
            <Text
              fontSize={"xs"}
              fontFamily={"monospace"}
              whiteSpace={"pre-wrap"}
              color={"orange.900"}
            >
              {"UNAUTHORIZED"}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Unauthorized;
