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
        gap={"2"}
        p={"2"}
        direction={"column"}
        justify={"center"}
        align={"center"}
        rounded={"md"}
        bg={"red.600"}
        color={"white"}
        maxW={"md"}
      >
        <Flex direction={"row"} gap={"1"} align={"center"}>
          <Icon name={"exclamation"} size={"sm"} />
          <Heading fontWeight={"semibold"} size={"lg"}>
            System Error
          </Heading>
        </Flex>

        <Flex direction={"column"} gap={"1"} w={"90%"}>
          <Text fontWeight={"semibold"} fontSize={"sm"}>
            Metadatify experienced an error while attempting to access the
            requested resource. If this issues persists, please contact your
            system administrator.
          </Text>
        </Flex>

        <Flex direction={"column"} gap={"1"} w={"90%"}>
          <Text fontWeight={"semibold"} fontSize={"sm"}>
            Possible Causes:
          </Text>
          <Text fontSize={"xs"}>
            The requested resource does not exist or has been deleted
          </Text>
          <Text fontSize={"xs"}>
            You do not have permission to access the requested resource
          </Text>
          <Text fontSize={"xs"}>Network connectivity has been lost</Text>
        </Flex>

        <Button
          onClick={() => navigate(0)}
          size={"xs"}
          rounded={"md"}
          variant={"subtle"}
          colorPalette={"red"}
        >
          Reload
          <Icon name={"reload"} size={"xs"} />
        </Button>
      </Flex>
    </Flex>
  );
};

export default Error;
