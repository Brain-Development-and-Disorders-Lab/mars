// React
import React from "react";

// Existing and custom components
import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Error = () => {
  const navigate = useNavigate();

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
        gap={"4"}
        p={"4"}
        direction={"column"}
        justify={"center"}
        align={"center"}
        rounded={"md"}
        bg={"red.600"}
        color={"white"}
      >
        <Flex direction={"row"} gap={"2"} align={"center"}>
          <Icon name={"exclamation"} size={"md"} />
          <Heading fontWeight={"semibold"} size={"lg"}>
            Error
          </Heading>
        </Flex>

        <Flex maxW={"md"} gap={"4"} direction={"column"}>
          <Text fontWeight={"semibold"}>
            Metadatify experienced an error while attempting to access the
            requested resource. If this issues persists, please contact your
            system administrator.
          </Text>
        </Flex>

        <Flex maxW={"md"} gap={"1"} direction={"column"}>
          <Text fontWeight={"semibold"}>Possible Causes:</Text>
          <Text>The requested resource does not exist or has been deleted</Text>
          <Text>
            You do not have permission to access the requested resource
          </Text>
          <Text>Network connectivity has been lost</Text>
        </Flex>

        <Button
          rightIcon={<Icon name={"reload"} />}
          onClick={() => navigate(0)}
          size={"sm"}
        >
          Reload Page
        </Button>
      </Flex>
    </Flex>
  );
};

export default Error;
