// React
import React from "react";

// Existing and custom components
import { Button, Flex, Heading } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";

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
      <Icon name={"exclamation"} size={"xl"} />
      <Heading fontWeight={"semibold"}>Something's not right.</Heading>
      <Button
        leftIcon={<Icon name={"reload"} />}
        onClick={() => navigate(0)}
        colorScheme={"orange"}
      >
        Retry
      </Button>
    </Flex>
  );
};

export default Error;
