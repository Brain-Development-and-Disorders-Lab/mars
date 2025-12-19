// React
import React from "react";

// Existing and custom components
import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Routing and navigation
import { useNavigate } from "react-router-dom";

interface ErrorProps {
  error?: Error | null;
}

const Error = ({ error }: ErrorProps) => {
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
            Error
          </Heading>
        </Flex>

        <Flex direction={"column"} gap={"1"} w={"90%"}>
          <Text fontWeight={"semibold"} fontSize={"sm"}>
            Metadatify experienced an error while attempting to access the
            requested resource.
          </Text>
          <Text fontSize={"xs"}>
            This may be caused by a network error, insufficient permissions, or
            the requested resource may have been moved.
          </Text>
        </Flex>

        <Flex direction={"column"} gap={"1"} w={"90%"}>
          <Text fontWeight={"semibold"} fontSize={"sm"}>
            Additional Information:
          </Text>
          <Flex
            maxH={"200px"}
            overflowY={"scroll"}
            bg={"red.50"}
            rounded={"md"}
            p={"2"}
            pr={"3"}
            className={"error-scroll-container"}
          >
            <Text
              fontSize={"xs"}
              fontFamily={"monospace"}
              whiteSpace={"pre-wrap"}
              color={"red.900"}
            >
              {error?.stack || error?.message || "No error details available"}
            </Text>
          </Flex>
        </Flex>

        <Button
          onClick={() => navigate(0)}
          size={"xs"}
          rounded={"md"}
          variant={"subtle"}
          colorPalette={"red"}
        >
          Reload Page
          <Icon name={"reload"} size={"xs"} />
        </Button>
      </Flex>
    </Flex>
  );
};

export default Error;
