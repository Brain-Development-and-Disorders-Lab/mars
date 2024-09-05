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
    <Flex direction={"column"} justify={"center"} align={"center"} h={"100%"}>
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
            Error
          </Heading>
        </Flex>

        <Flex w={"md"} gap={"4"} direction={"column"}>
          <Text fontWeight={"semibold"} color={"gray.600"}>
            Metadatify experienced an error while attempting to access the
            requested resource. If this issues persists, please contact your
            system administrator.
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
  );
};

export default Error;
