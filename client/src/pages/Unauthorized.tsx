// React
import React from "react";

// Existing and custom components
import { Flex, Heading, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Routing and navigation
const Unauthorized = () => {
  return (
    <Flex direction={"column"} justify={"center"} align={"center"} h={"100%"} mt={{ base: "10%", lg: "0" }} p={"2"}>
      <Flex
        gap={"2"}
        p={"6"}
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
            Unauthorized
          </Heading>
        </Flex>

        <Flex direction={"column"} gap={"1"} w={"90%"}>
          <Text fontWeight={"semibold"} fontSize={"sm"}>
            You do not have permission to access this feature or resource in this Workspace.
          </Text>
          <Text fontSize={"xs"}>
            This is typically due to insufficient permissions within this Workspace, or removal as a Collaborator from
            this Workspace.
          </Text>
          <Text fontSize={"xs"}>
            If you believe this is in error, contact the Workspace owner, or use the Workspace switcher to select a
            different Workspace.
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Unauthorized;
