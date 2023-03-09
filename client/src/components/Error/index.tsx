// React
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Flex,
  Heading,
  Icon,
} from "@chakra-ui/react";
import { BsArrowClockwise, BsExclamationCircle } from "react-icons/bs";

// Utility libraries
import _ from "underscore";

// Custom components

const Error = () => {
  const navigate = useNavigate();

  return (
    <Flex
      direction={"column"}
      justify={"center"}
      align={"center"}
      p={"2"}
      pt={"4"}
      pb={"4"}
      gap={"8"}
    >
      <Icon as={BsExclamationCircle} w={"16"} h={"16"} />
      <Heading fontWeight={"semibold"}>Something's not right.</Heading>

      <Button
        leftIcon={<Icon as={BsArrowClockwise} />}
        onClick={() => navigate(0)}
        colorScheme={"orange"}
      >
        Retry
      </Button>
    </Flex>
  );
};

export default Error;
